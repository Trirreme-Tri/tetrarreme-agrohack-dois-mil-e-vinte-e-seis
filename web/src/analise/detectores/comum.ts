import type { ConfigAnalise } from '../config.ts'
import type { AnaliseProduto } from '../consumo.ts'
import { arred } from '../formatacao.ts'
import type { AlertaSemMensagem } from '../mensagens.ts'
import { obterUnidade } from '../unidades.ts'

export interface ContextoDeteccao {
  analises: readonly AnaliseProduto[]
  hojeDia: number
  /** Limites por produto ficam em `AnaliseProduto.limites`; aqui só os globais são usados. */
  config: ConfigAnalise
}

export type Detector = (ctx: ContextoDeteccao) => AlertaSemMensagem[]

/** Evidência comum a todo alerta de produto. */
export function evidenciaBase(a: AnaliseProduto): Record<string, string> {
  return { produto: a.produto.nome_canonico, unidade: obterUnidade(a.produto.unidade_base_id).sigla }
}

/** Evidência de consumo, usada nos alertas baseados em cobertura. */
export function evidenciaConsumo(a: AnaliseProduto): Record<string, number | null> {
  return {
    saldo: arred(a.saldo),
    consumoMedioDiario: arred(a.consumoDiario, 3),
    janelaConsumoDias: a.diasJanela,
    coberturaDias: a.confianca === 'insuficiente' || a.cobertura === null ? null : Math.floor(a.cobertura),
    totalSaidas: a.totalSaidas,
    diasHistorico: a.diasHistorico,
  }
}

/** Multiplica por preço, mantendo `null` quando não há preço (R2). */
export function valor(quantidade: number, preco: number | null): number | null {
  return preco === null ? null : arred(quantidade * preco)
}
