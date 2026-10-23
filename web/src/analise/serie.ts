// Consumo ao longo do tempo (pergunta 3 do edital): consumo por mês e por semana e série do
// saldo com as entradas marcadas. Função pura: recebe `hoje`, não lê o relógio.
import type { Movimentacao, Produto } from '@tetrarreme/contrato'
import { ordenarMovimentacoes, quantidadeBase } from './consumo.ts'
import { diaDe, diaDeDate, isoDeDia } from './datas.ts'
import { arred } from './formatacao.ts'

export interface ConsumoPeriodo {
  /** Primeiro dia do período dentro da série, `AAAA-MM-DD`. */
  inicio: string
  /** Último dia do período dentro da série, `AAAA-MM-DD`. */
  fim: string
  /** "out/2026" (mês) ou "13/10" (semana, pela segunda-feira). */
  rotulo: string
  /** Soma das retiradas no período, na unidade base do produto. */
  quantidade: number
  retiradas: number
}

export interface PontoSaldo {
  data: string
  /** Saldo no fim do dia, na unidade base (inclui ajustes). */
  saldo: number
  /** Quantidade que entrou no dia (compras e ajustes positivos); `null` se nada entrou. */
  entrada: number | null
}

export interface SerieProduto {
  inicio: string
  fim: string
  porMes: ConsumoPeriodo[]
  porSemana: ConsumoPeriodo[]
  saldo: PontoSaldo[]
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** Dia da semana (0 = segunda) de um dia contado desde 1970-01-01 (que foi quinta-feira). */
const diaDaSemana = (dia: number) => (((dia + 3) % 7) + 7) % 7

/**
 * Série dos últimos `dias` dias até `hoje` (inclusive). Movimentações anteriores entram no saldo
 * inicial; movimentações depois de `hoje` são ignoradas.
 */
export function serieDoProduto(produto: Produto, movimentacoes: readonly Movimentacao[], hoje: Date, dias = 365): SerieProduto {
  const fimDia = diaDeDate(hoje)
  const inicioDia = fimDia - dias + 1
  const movs = ordenarMovimentacoes(movimentacoes.filter((m) => m.produto_id === produto.id), fimDia)

  const variacao = new Map<number, { delta: number; entrada: number; saida: number; retiradas: number }>()
  let saldoInicial = 0
  for (const m of movs) {
    const q = quantidadeBase(m, produto)
    const delta = m.tipo === 'entrada' ? q : m.tipo === 'saida' ? -q : q
    const dia = diaDe(m.data)
    if (dia < inicioDia) {
      saldoInicial += delta
      continue
    }
    const v = variacao.get(dia) ?? { delta: 0, entrada: 0, saida: 0, retiradas: 0 }
    v.delta += delta
    if (delta > 0) v.entrada += delta
    if (m.tipo === 'saida') {
      v.saida += q
      v.retiradas++
    }
    variacao.set(dia, v)
  }

  const saldo: PontoSaldo[] = []
  const porMes = new Map<string, ConsumoPeriodo>()
  const porSemana = new Map<number, ConsumoPeriodo>()
  let atual = saldoInicial
  for (let dia = inicioDia; dia <= fimDia; dia++) {
    const v = variacao.get(dia)
    atual += v?.delta ?? 0
    const iso = isoDeDia(dia)
    saldo.push({ data: iso, saldo: arred(atual, 3), entrada: v && v.entrada > 0 ? arred(v.entrada, 3) : null })

    const chaveMes = iso.slice(0, 7)
    const mes = porMes.get(chaveMes) ?? {
      inicio: iso, fim: iso, rotulo: `${MESES[Number(iso.slice(5, 7)) - 1]}/${iso.slice(0, 4)}`, quantidade: 0, retiradas: 0,
    }
    const segunda = dia - diaDaSemana(dia)
    const semana = porSemana.get(segunda) ?? {
      inicio: iso, fim: iso, rotulo: `${isoDeDia(segunda).slice(8, 10)}/${isoDeDia(segunda).slice(5, 7)}`, quantidade: 0, retiradas: 0,
    }
    for (const p of [mes, semana]) {
      p.fim = iso
      p.quantidade += v?.saida ?? 0
      p.retiradas += v?.retiradas ?? 0
    }
    porMes.set(chaveMes, mes)
    porSemana.set(segunda, semana)
  }

  const fechar = (p: ConsumoPeriodo) => ({ ...p, quantidade: arred(p.quantidade, 3) })
  return {
    inicio: isoDeDia(inicioDia),
    fim: isoDeDia(fimDia),
    porMes: [...porMes.values()].map(fechar),
    porSemana: [...porSemana.values()].map(fechar),
    saldo,
  }
}
