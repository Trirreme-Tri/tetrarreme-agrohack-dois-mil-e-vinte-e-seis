// Função principal do motor. Pura e determinística: recebe `hoje`, não lê o relógio,
// não persiste nada. Chamar de novo com novas movimentações recalcula tudo (R6).
import { CONFIG_PADRAO, limitesPara } from './config.ts'
import type { ConfigAnalise } from './config.ts'
import { analisarProduto } from './consumo.ts'
import type { AnaliseProduto } from './consumo.ts'
import { diaDeDate, isoDeDia } from './datas.ts'
import { DETECTORES } from './detectores/index.ts'
import { resumirFinanceiro } from './financeiro.ts'
import type { ResumoFinanceiro } from './financeiro.ts'
import { comMensagem } from './mensagens.ts'
import type { Alerta, Importacao, Movimentacao, NivelAlerta, Origem, Produto } from '@tetrarreme/contrato'

export interface OpcoesAnalise {
  config?: ConfigAnalise
  /** Se informadas, o resultado diz de que origem vieram os dados (R7). */
  importacoes?: readonly Importacao[]
}

export interface ResultadoAnalise {
  /** Data de referência da análise, `AAAA-MM-DD`. */
  data: string
  /** Ordenados por nível e, dentro do nível, por valor envolvido (R5). */
  alertas: Alerta[]
  resumoFinanceiro: ResumoFinanceiro
  produtos: AnaliseProduto[]
  /** Origens das importações usadas; vazio se `importacoes` não foi informado. */
  origens: Origem[]
}

const ORDEM_NIVEL: Record<NivelAlerta, number> = { critico: 0, atencao: 1, informativo: 2 }

/** R5: nível; dentro do nível, maior valor envolvido primeiro (sem valor por último). */
export function ordenarAlertas(alertas: readonly Alerta[]): Alerta[] {
  return [...alertas].sort(
    (a, b) =>
      ORDEM_NIVEL[a.nivel] - ORDEM_NIVEL[b.nivel] ||
      (b.valorEnvolvido ?? -Infinity) - (a.valorEnvolvido ?? -Infinity) ||
      a.tipo.localeCompare(b.tipo) ||
      a.produtoId.localeCompare(b.produtoId),
  )
}

export function analisar(
  movimentacoes: readonly Movimentacao[],
  produtos: readonly Produto[],
  hoje: Date,
  opcoes: OpcoesAnalise = {},
): ResultadoAnalise {
  const config = opcoes.config ?? CONFIG_PADRAO
  const hojeDia = diaDeDate(hoje)

  const porProduto = new Map<string, Movimentacao[]>(produtos.map((p) => [p.id, []]))
  for (const m of movimentacoes) {
    if (!m.importacao_id) throw new Error(`Movimentação ${m.id} sem importação de origem (R7).`)
    const lista = porProduto.get(m.produto_id)
    if (!lista) throw new Error(`Movimentação ${m.id} aponta para produto desconhecido: ${m.produto_id}.`)
    lista.push(m)
  }

  const analises = produtos.map((p) => analisarProduto(p, porProduto.get(p.id)!, hojeDia, limitesPara(p, config)))
  // Os detectores não leem a configuração: recebem os limites já resolvidos por produto e os globais.
  const ctx = { analises, hojeDia, globais: config.globais }
  const alertas = DETECTORES.flatMap((detectar) => detectar(ctx)).map(comMensagem)

  let origens: Origem[] = []
  if (opcoes.importacoes) {
    const usadas = new Set(movimentacoes.map((m) => m.importacao_id))
    origens = [...new Set(opcoes.importacoes.filter((i) => usadas.has(i.id)).map((i) => i.origem))].sort()
  }

  return {
    data: isoDeDia(hojeDia),
    alertas: ordenarAlertas(alertas),
    resumoFinanceiro: resumirFinanceiro(analises),
    produtos: analises,
    origens,
  }
}
