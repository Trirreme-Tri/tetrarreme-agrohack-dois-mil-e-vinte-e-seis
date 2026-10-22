// Formatação de números para as mensagens (pt-BR).

const num = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const numFino = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })
const reais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function fmtNum(n: number | string | null): string {
  if (typeof n !== 'number') return String(n ?? '?')
  return Math.abs(n) < 10 ? numFino.format(n) : num.format(n)
}

/** Valor ausente aparece como "sem preço", nunca "R$ 0,00" (R2). */
export function fmtReais(n: number | string | null): string {
  return typeof n === 'number' ? reais.format(n) : 'sem preço'
}

export function arred(n: number, casas = 2): number {
  const f = 10 ** casas
  return Math.round(n * f) / f
}

/**
 * Cobertura para exibição. Sem consumo na janela, a cobertura é `null` e aparece como
 * "sem consumo recente" — nunca "infinito" nem um número de dias inventado.
 */
export function fmtCobertura(dias: number | null): string {
  if (dias === null || !Number.isFinite(dias)) return 'sem consumo recente'
  return `${num.format(Math.floor(dias))} dias`
}
