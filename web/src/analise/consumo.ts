// Saldo por lote, consumo médio, cobertura e confiança (R3: calculada aqui, nunca armazenada).
import type { CampoLimite, Limites, LimitesDoProduto, OrigemLimite } from './config.ts'
import { diaDe } from './datas.ts'
import type { Confianca, Movimentacao, Produto } from '@tetrarreme/contrato'
import { converter } from './unidades.ts'

const EPSILON = 1e-9
export const SEM_LOTE = '(sem lote)'

export interface SaldoLote {
  lote: string
  /** Na unidade base do produto. */
  saldo: number
  validade: string | null
  /** Preço médio por unidade base das entradas deste lote; `null` se nenhuma tinha preço. */
  precoUnitBase: number | null
  primeiraEntrada: string | null
  /** Data em que o saldo do lote chegou a zero (e continua zero). */
  zeradoEm: string | null
}

export interface RetiradaBase {
  data: string
  quantidade: number
  movimentacaoId: string
}

export interface CompraBase {
  data: string
  quantidade: number
  precoUnitBase: number
  movimentacaoId: string
}

export interface AnaliseProduto {
  produto: Produto
  /** Limites efetivos deste produto (padrão geral ← categoria ← produto). */
  limites: Limites
  /** Nível de onde veio cada limite (justificativa dos alertas, R4). */
  origemLimites: Record<CampoLimite, OrigemLimite>
  /** Saldo total na unidade base. */
  saldo: number
  lotes: SaldoLote[]
  /** Média diária das saídas na janela de consumo. */
  consumoDiario: number
  /** Dias efetivamente usados na média (menor entre a janela e o histórico). */
  diasJanela: number
  /** Dias que o saldo deve durar; `null` quando não há consumo recente. */
  cobertura: number | null
  confianca: Confianca
  totalSaidas: number
  /** Saídas dentro da janela usada no consumo médio: é o que a confiança conta (R3). */
  saidasNaJanela: number
  diasHistorico: number
  primeiraMovimentacao: string | null
  primeiraEntrada: string | null
  ultimaSaida: string | null
  saidas: RetiradaBase[]
  compras: CompraBase[]
  /** Preço médio ponderado das compras com preço; `null` se nenhuma tinha preço (R2). */
  precoMedio: number | null
  /** Valor do saldo; `null` se o produto não tem nenhum preço conhecido (R2). */
  valorEstoque: number | null
}

export function quantidadeBase(m: Movimentacao, produto: Produto): number {
  return converter(m.quantidade, m.unidade_id, produto.unidade_base_id)
}

/** Preço por unidade base do produto (o preço vem por unidade da movimentação). */
export function precoBase(m: Movimentacao, produto: Produto): number | null {
  if (m.preco_unit === null) return null
  return m.preco_unit / converter(1, m.unidade_id, produto.unidade_base_id)
}

export function calcularConfianca(
  /** Saídas dentro da janela de consumo (não o histórico inteiro). */
  saidasNaJanela: number,
  diasHistorico: number,
  c: Limites['confianca'],
): Confianca {
  if (saidasNaJanela < c.saidasInsuficiente) return 'insuficiente'
  if (saidasNaJanela < c.saidasBaixa || diasHistorico < c.historicoMinimoDias) return 'baixa'
  if (saidasNaJanela < c.saidasMedia) return 'media'
  return 'alta'
}

/** Ordem de consumo: primeiro o que vence primeiro (sem validade por último), depois o mais antigo. */
function ordemFefo(a: SaldoLote, b: SaldoLote): number {
  if (a.validade !== b.validade) {
    if (a.validade === null) return 1
    if (b.validade === null) return -1
    return a.validade < b.validade ? -1 : 1
  }
  return (a.primeiraEntrada ?? '9999') < (b.primeiraEntrada ?? '9999') ? -1 : 1
}

/** Movimentações do produto até `hojeDia`, em ordem cronológica. */
export function ordenarMovimentacoes(movs: readonly Movimentacao[], hojeDia: number): Movimentacao[] {
  return movs
    .filter((m) => diaDe(m.data) <= hojeDia)
    .sort((a, b) => (a.data === b.data ? a.criado_em.localeCompare(b.criado_em) : a.data < b.data ? -1 : 1))
}

export function calcularLotes(produto: Produto, movs: readonly Movimentacao[]): SaldoLote[] {
  const lotes = new Map<string, SaldoLote & { qtdComPreco: number; somaPreco: number }>()
  const obter = (nome: string) => {
    let l = lotes.get(nome)
    if (!l) {
      l = { lote: nome, saldo: 0, validade: null, precoUnitBase: null, primeiraEntrada: null, zeradoEm: null, qtdComPreco: 0, somaPreco: 0 }
      lotes.set(nome, l)
    }
    return l
  }
  const aplicar = (l: SaldoLote, delta: number, data: string) => {
    const antes = l.saldo
    l.saldo += delta
    if (Math.abs(l.saldo) < EPSILON) l.saldo = 0
    if (antes > 0 && l.saldo <= 0) l.zeradoEm = data
    else if (l.saldo > 0) l.zeradoEm = null
  }
  const retirarFefo = (qtd: number, data: string) => {
    let resta = qtd
    for (const l of [...lotes.values()].filter((x) => x.saldo > 0).sort(ordemFefo)) {
      if (resta <= EPSILON) break
      const tirar = Math.min(resta, l.saldo)
      aplicar(l, -tirar, data)
      resta -= tirar
    }
    if (resta > EPSILON) aplicar(obter(SEM_LOTE), -resta, data)
  }

  for (const m of movs) {
    const q = quantidadeBase(m, produto)
    if (m.tipo === 'entrada' || (m.tipo === 'ajuste' && q > 0)) {
      const l = obter(m.lote ?? SEM_LOTE)
      if (l.primeiraEntrada === null) l.primeiraEntrada = m.data
      if (l.validade === null && m.validade !== null) l.validade = m.validade
      const p = precoBase(m, produto)
      if (m.tipo === 'entrada' && p !== null) {
        l.qtdComPreco += q
        l.somaPreco += p * q
        l.precoUnitBase = l.somaPreco / l.qtdComPreco
      }
      aplicar(l, q, m.data)
    } else {
      const qtd = Math.abs(q)
      if (m.lote !== null) aplicar(obter(m.lote), -qtd, m.data)
      else retirarFefo(qtd, m.data)
    }
  }
  return [...lotes.values()].map(({ qtdComPreco: _q, somaPreco: _s, ...l }) => l)
}

export function analisarProduto(
  produto: Produto,
  movsDoProduto: readonly Movimentacao[],
  hojeDia: number,
  { valores: limites, origem: origemLimites }: LimitesDoProduto,
): AnaliseProduto {
  const movs = ordenarMovimentacoes(movsDoProduto, hojeDia)
  const lotes = calcularLotes(produto, movs)
  const saldo = lotes.reduce((t, l) => t + l.saldo, 0)

  const saidas: RetiradaBase[] = movs
    .filter((m) => m.tipo === 'saida')
    .map((m) => ({ data: m.data, quantidade: quantidadeBase(m, produto), movimentacaoId: m.id }))
  const compras: CompraBase[] = []
  for (const m of movs) {
    const p = m.tipo === 'entrada' ? precoBase(m, produto) : null
    if (p !== null) compras.push({ data: m.data, quantidade: quantidadeBase(m, produto), precoUnitBase: p, movimentacaoId: m.id })
  }

  const primeiraMovimentacao = movs[0]?.data ?? null
  const diasHistorico = primeiraMovimentacao === null ? 0 : hojeDia - diaDe(primeiraMovimentacao)
  const diasJanela = Math.max(1, Math.min(limites.janelaConsumoDias, diasHistorico))
  const saidasJanela = saidas.filter((s) => hojeDia - diaDe(s.data) < diasJanela)
  const consumoJanela = saidasJanela.reduce((t, s) => t + s.quantidade, 0)
  const consumoDiario = consumoJanela / diasJanela
  const cobertura = consumoDiario > 0 ? Math.max(saldo, 0) / consumoDiario : null

  const qtdComprada = compras.reduce((t, c) => t + c.quantidade, 0)
  const precoMedio = qtdComprada > 0 ? compras.reduce((t, c) => t + c.precoUnitBase * c.quantidade, 0) / qtdComprada : null
  const valorEstoque =
    precoMedio === null
      ? null
      : lotes.filter((l) => l.saldo > 0).reduce((t, l) => t + l.saldo * (l.precoUnitBase ?? precoMedio), 0)

  return {
    produto,
    limites,
    origemLimites,
    saldo,
    lotes,
    consumoDiario,
    diasJanela,
    cobertura,
    confianca: calcularConfianca(saidasJanela.length, diasHistorico, limites.confianca),
    totalSaidas: saidas.length,
    saidasNaJanela: saidasJanela.length,
    diasHistorico,
    primeiraMovimentacao,
    primeiraEntrada: movs.find((m) => m.tipo === 'entrada')?.data ?? null,
    ultimaSaida: saidas.at(-1)?.data ?? null,
    saidas,
    compras,
    precoMedio,
    valorEstoque,
  }
}
