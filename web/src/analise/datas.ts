// Datas como número de dias (UTC), para cálculos determinísticos.

const MS_DIA = 86_400_000

/** `AAAA-MM-DD` (ou ISO completo) → dias desde 1970-01-01. */
export function diaDe(iso: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  if (!m) throw new Error(`Data inválida: "${iso}"`)
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / MS_DIA
}

export function diaDeDate(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / MS_DIA
}

export function isoDeDia(dia: number): string {
  return new Date(dia * MS_DIA).toISOString().slice(0, 10)
}

/** `AAAA-MM-DD` → `DD/MM/AAAA`. */
export function dataBr(iso: string): string {
  const [a, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${a}`
}
