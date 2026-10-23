// "Hoje" do aparelho: a data LOCAL (não UTC). À noite em Rondônia (UTC−4) o relógio UTC já está
// no dia seguinte; o motor trabalha com dias, então recebe a meia-noite UTC da data local.

/** Data local de `agora` como `Date` à meia-noite UTC (o formato que o motor espera). */
export function hojeLocal(agora: Date = new Date()): Date {
  return new Date(Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate()))
}

/** Data local de `agora` em `AAAA-MM-DD`. */
export function isoLocal(agora: Date = new Date()): string {
  return hojeLocal(agora).toISOString().slice(0, 10)
}
