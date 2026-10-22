// Motor de análise de insumos: TypeScript puro, sem UI, rede ou banco.
// Os tipos do modelo de dados vêm de @tetrarreme/contrato.
export { CONFIG_PADRAO, descreverOrigem, limitesPara } from './config.ts'
export type { AjusteLimites, CampoLimite, ConfigAnalise, Limites, LimitesDoProduto, LimitesGlobais } from './config.ts'
export * from './unidades.ts'
export * from './produtos.ts'
export * from './importacao.ts'
export type { AnaliseProduto, SaldoLote } from './consumo.ts'
export { calcularConfianca } from './consumo.ts'
export type { ResumoFinanceiro } from './financeiro.ts'
export { gerarMensagem } from './mensagens.ts'
export { analisar, ordenarAlertas } from './analisar.ts'
export type { OpcoesAnalise, ResultadoAnalise } from './analisar.ts'
