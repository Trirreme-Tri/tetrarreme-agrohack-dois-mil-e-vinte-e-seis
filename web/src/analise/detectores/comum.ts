import { descreverOrigem } from '../config.ts'
import type { CampoLimite, LimitesGlobais } from '../config.ts'
import type { AnaliseProduto } from '../consumo.ts'
import { arred } from '../formatacao.ts'
import type { AlertaSemMensagem } from '../mensagens.ts'
import { obterUnidade } from '../unidades.ts'

export interface ContextoDeteccao {
  analises: readonly AnaliseProduto[]
  hojeDia: number
  /** Limites que não variam por produto. Os demais vêm resolvidos em `AnaliseProduto.limites`. */
  globais: LimitesGlobais
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
    saidasNaJanela: a.saidasNaJanela,
    diasHistorico: a.diasHistorico,
  }
}

/** Multiplica por preço, mantendo `null` quando não há preço (R2). */
export function valor(quantidade: number, preco: number | null): number | null {
  return preco === null ? null : arred(quantidade * preco)
}

/**
 * De qual nível vieram os limites usados (padrão geral, categoria ou produto): vai para a
 * evidência e para o fim da regra, como parte da justificativa (R4).
 */
export function limiteUsado(a: AnaliseProduto, ...campos: CampoLimite[]): { origemLimite: string; regra: (texto: string) => string } {
  const origemLimite = descreverOrigem(campos.map((c) => a.origemLimites[c]))
  return { origemLimite, regra: (texto) => `${texto.replace(/\.$/, '')} (${origemLimite}).` }
}

/**
 * Reposição para `diasReposicao` dias de consumo (sem consumo: o que falta para o estoque mínimo).
 * Mostrada na evidência de estoque crítico e ruptura; o valor é `null` sem preço (R2).
 */
export function evidenciaReposicao(a: AnaliseProduto): { diasReposicao: number; quantidadeReposicao: number; valorReposicao: number | null } {
  const dias = a.limites.diasReposicao
  const quantidade =
    a.consumoDiario > 0 ? a.consumoDiario * dias : Math.max((a.produto.estoque_minimo ?? 0) - a.saldo, 0)
  return { diasReposicao: dias, quantidadeReposicao: arred(quantidade), valorReposicao: valor(quantidade, a.precoMedio) }
}
