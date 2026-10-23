// Carga inicial: na primeira abertura, importa a base simulada (origem "simulado", R7).
//
// Deslocamento de datas (decisão crítica, ver DECISOES.md): a base termina na data de referência
// (20/10/2026) e o motor ignora movimentações posteriores a "hoje". Para a demonstração funcionar
// em qualquer dia e a reanálise ao vivo funcionar, a carga desloca TODAS as datas da base
// (movimentação e validade) em (hoje − data de referência) dias, para a base terminar hoje.
// Registros novos usam a data real; o motor recebe a data real como "hoje".
import { DATA_REFERENCIA } from '../../../data/simulados/referencia.ts'
import { diaDe, diaDeDate, isoDeDia } from '../analise/datas.ts'
import { importarCsv } from '../analise/importacao.ts'
import type { MapeamentoColunas } from '../analise/importacao.ts'
import { UNIDADES } from '../analise/unidades.ts'
import type { Movimentacao } from '@tetrarreme/contrato'
import type { BancoMonitora, ItemCadastro } from './banco.ts'

export const FUNCIONARIOS = ['Funcionário A', 'Funcionário B', 'Funcionário C', 'Funcionário D']
export const DESTINOS = ['Talhão 1', 'Talhão 2', 'Talhão 3', 'Horta', 'Pomar', 'Oficina', 'Galpão', 'Irrigação']

export const MAPEAMENTO_BASE_SIMULADA: MapeamentoColunas = {
  produto: 'produto', categoria: 'categoria', unidade: 'unidade', quantidade: 'quantidade',
  estoque_minimo: 'estoque_minimo', tipo: 'tipo', data: 'data', preco_unit: 'preco_unit', lote: 'lote',
  validade: 'validade', fornecedor: 'fornecedor', destino: 'destino', responsavel: 'responsavel',
}

/** Quantos dias somar às datas da base para ela terminar em `hoje`. */
export function diasDeDeslocamento(hoje: Date, referencia: string = DATA_REFERENCIA): number {
  return diaDeDate(hoje) - diaDe(referencia)
}

/** Soma `dias` a uma data `AAAA-MM-DD`. */
export function deslocarIso(iso: string, dias: number): string {
  return isoDeDia(diaDe(iso) + dias)
}

/** Desloca a data e a validade de cada movimentação; não altera nenhum outro campo. */
export function deslocarMovimentacoes(movs: readonly Movimentacao[], dias: number): Movimentacao[] {
  if (dias === 0) return [...movs]
  return movs.map((m) => ({
    ...m,
    data: deslocarIso(m.data, dias),
    validade: m.validade === null ? null : deslocarIso(m.validade, dias),
  }))
}

export interface OpcoesCarga {
  /** Data local de hoje (meia-noite UTC), a mesma passada ao motor. */
  hoje: Date
  /** Momento da carga (para `criado_em`). */
  agora: Date
  textoCsv: string
  gerarId?: () => string
}

/** Importa a base simulada se o banco estiver vazio. Devolve `true` se carregou agora. */
export async function carregarBaseInicial(db: BancoMonitora, opcoes: OpcoesCarga): Promise<boolean> {
  if ((await db.importacoes.count()) > 0) return false
  const r = importarCsv(opcoes.textoCsv, {
    mapeamento: MAPEAMENTO_BASE_SIMULADA,
    origem: 'simulado',
    arquivo: 'data/simulados/movimentacoes.csv',
    agora: opcoes.agora,
    delimitador: ';',
    separadorDecimal: ',',
    gerarId: opcoes.gerarId,
  })
  if (r.erros.length > 0) {
    throw new Error(`A base simulada tem ${r.erros.length} linha(s) inválida(s): ${r.erros[0].mensagem} (linha ${r.erros[0].linha})`)
  }
  const movimentacoes = deslocarMovimentacoes(r.movimentacoes, diasDeDeslocamento(opcoes.hoje))
  const cadastro: ItemCadastro[] = [
    ...FUNCIONARIOS.map((nome) => ({ tipo: 'funcionario' as const, nome })),
    ...DESTINOS.map((nome) => ({ tipo: 'destino' as const, nome })),
  ]
  await db.transaction('rw', [db.unidades, db.produtos, db.importacoes, db.movimentacoes, db.cadastro], async () => {
    await db.unidades.bulkPut([...UNIDADES])
    await db.produtos.bulkAdd(r.produtosNovos)
    await db.importacoes.add(r.importacao)
    await db.movimentacoes.bulkAdd(movimentacoes)
    await db.cadastro.bulkAdd(cadastro)
  })
  return true
}

/** Apaga tudo e carrega a base simulada de novo (para preparar uma demonstração). */
export async function recarregarBaseSimulada(db: BancoMonitora, opcoes: OpcoesCarga): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.filter((t) => t.name !== 'preferencias').map((t) => t.clear()))
  })
  await carregarBaseInicial(db, opcoes)
}
