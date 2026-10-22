// Apoio aos testes: carrega a base simulada e cria movimentações de exemplo.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { importarCsv } from '../src/analise/importacao.ts'
import type { MapeamentoColunas, ResultadoImportacao } from '../src/analise/importacao.ts'
import type { Movimentacao, Produto } from '@tetrarreme/contrato'

export const PASTA_SIMULADOS = join(dirname(fileURLToPath(import.meta.url)), '../../data/simulados')

/** Data de referência da base simulada. */
export const HOJE_SIMULADO = new Date('2026-10-20T12:00:00Z')

export const MAPEAMENTO_SIMULADO: MapeamentoColunas = {
  produto: 'produto',
  categoria: 'categoria',
  unidade: 'unidade',
  quantidade: 'quantidade',
  estoque_minimo: 'estoque_minimo',
  tipo: 'tipo',
  data: 'data',
  preco_unit: 'preco_unit',
  lote: 'lote',
  validade: 'validade',
  fornecedor: 'fornecedor',
  destino: 'destino',
  responsavel: 'responsavel',
}

/** UUID v4 determinístico a partir de um número (para os testes). */
export function uuidDeTeste(n: number): string {
  return `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
}

/** Gerador de ids determinístico para os testes. */
export function geradorDeIds(): () => string {
  let n = 0
  return () => uuidDeTeste(++n)
}

export function carregarBaseSimulada(): ResultadoImportacao {
  const texto = readFileSync(join(PASTA_SIMULADOS, 'movimentacoes.csv'), 'utf8')
  return importarCsv(texto, {
    mapeamento: MAPEAMENTO_SIMULADO,
    origem: 'simulado',
    arquivo: 'data/simulados/movimentacoes.csv',
    agora: HOJE_SIMULADO,
    delimitador: ';',
    separadorDecimal: ',',
    gerarId: geradorDeIds(),
  })
}

export function produto(parcial: Partial<Produto> & { id: string }): Produto {
  return {
    nome_canonico: parcial.id,
    categoria: 'Fertilizantes',
    unidade_base_id: 'kg',
    estoque_minimo: null,
    ...parcial,
  }
}

let contador = 0
export function mov(parcial: Partial<Movimentacao> & Pick<Movimentacao, 'produto_id' | 'tipo' | 'quantidade' | 'data'>): Movimentacao {
  contador++
  return {
    id: uuidDeTeste(900_000 + contador),
    nome_original: parcial.produto_id,
    unidade_id: 'kg',
    preco_unit: null,
    lote: null,
    validade: null,
    fornecedor: null,
    destino: null,
    responsavel_pseudonimo: 'Funcionário A',
    importacao_id: 'imp-teste',
    criado_em: `${parcial.data}T00:00:00.000Z`,
    dispositivo: 'teste',
    ...parcial,
  }
}

/** Retiradas iguais a cada `intervalo` dias, terminando em `fim`. */
export function retiradasPeriodicas(
  produtoId: string, fim: string, quantas: number, intervalo: number, quantidade: number, unidade_id = 'kg',
): Movimentacao[] {
  const fimMs = Date.parse(`${fim}T00:00:00Z`)
  return Array.from({ length: quantas }, (_, i) =>
    mov({
      produto_id: produtoId,
      tipo: 'saida',
      quantidade,
      unidade_id,
      data: new Date(fimMs - (quantas - 1 - i) * intervalo * 86_400_000).toISOString().slice(0, 10),
    }),
  )
}
