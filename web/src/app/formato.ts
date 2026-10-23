// Rótulos e formatação da interface (pt-BR). Os números vêm sempre do motor ou do banco local.
import type { Alerta, Categoria, Confianca, NivelAlerta, TipoAlerta } from '@tetrarreme/contrato'
import { dataBr } from '../analise/datas.ts'
import { fmtNum, fmtReais } from '../analise/formatacao.ts'
import type { NomeIcone } from '../componentes/Icone.tsx'

export { dataBr, fmtNum, fmtReais }

export const ROTULO_NIVEL: Record<NivelAlerta, string> = { critico: 'Crítico', atencao: 'Atenção', informativo: 'Informativo' }
export const NIVEIS: NivelAlerta[] = ['critico', 'atencao', 'informativo']

export const ROTULO_TIPO: Record<TipoAlerta, string> = {
  estoque_critico: 'Estoque crítico', ruptura_prevista: 'Acaba em breve', vencimento: 'Vencimento',
  consumo_crescente: 'Consumo crescente', retirada_atipica: 'Retirada atípica', excesso: 'Excesso',
  item_parado: 'Item parado', variacao_preco: 'Variação de preço', possivel_duplicidade: 'Possível duplicidade',
  devolucao_embalagem: 'Devolução de embalagem',
}

export const ROTULO_CONFIANCA: Record<Confianca, string> = {
  alta: 'Confiança alta', media: 'Confiança média', baixa: 'Confiança baixa', insuficiente: 'Histórico insuficiente', fato: 'Fato registrado',
}

export const ICONE_CATEGORIA: Record<Categoria, NomeIcone> = {
  'Fertilizantes': 'saco', 'Corretivos': 'saco', 'Sementes': 'semente', 'Defensivos e biológicos': 'frasco',
  'Combustíveis e lubrificantes': 'galao', 'Peças e manutenção': 'engrenagem', 'Materiais de irrigação': 'gota', 'EPI e diversos': 'luva',
}

const UNIDADE_SIGLA: Record<string, string> = { un: 'un', kg: 'kg', L: 'L', g: 'g', t: 't', mL: 'mL', sc50: 'sc 50 kg' }
export const NOME_UNIDADE: Record<string, string> = { mL: 'mililitros', L: 'litros', g: 'gramas', kg: 'quilos', t: 'toneladas', un: 'unidades', sc50: 'sacos de 50 kg' }

export function fmtQtd(n: number | string | null, unidade: string): string {
  return `${fmtNum(n)} ${UNIDADE_SIGLA[unidade] ?? unidade}`
}

/** `AAAA-MM-DD` ou ISO completo → `DD/MM/AAAA`. */
export function fmtData(iso: string | null): string {
  return iso ? dataBr(iso) : '—'
}

/** Texto da confiança no detalhe do alerta, a partir dos campos do alerta. */
export function textoConfianca(a: Alerta): string {
  const n = a.evidencia.saidasNaJanela
  const janela = a.evidencia.janelaConsumoDias
  const retiradas = typeof n === 'number' ? `${n} ${n === 1 ? 'retirada' : 'retiradas'} nos últimos ${janela ?? 60} dias` : null
  switch (a.confianca) {
    case 'fato': return 'Fato registrado: não é estimativa.'
    case 'insuficiente': return 'Histórico insuficiente: menos de 3 retiradas na janela. Nenhum número de dias é mostrado.'
    case 'alta': return retiradas ? `Estimativa com histórico amplo: ${retiradas}.` : 'Estimativa com histórico amplo.'
    case 'media': return retiradas ? `Estimativa com histórico moderado: ${retiradas}.` : 'Estimativa com histórico moderado.'
    case 'baixa': return retiradas ? `Estimativa com pouco histórico: ${retiradas}.` : 'Estimativa com pouco histórico.'
  }
}

type Fmt = (v: number | string | null, a: Alerta) => string
const qtd: Fmt = (v, a) => (v === null ? '—' : fmtQtd(v, String(a.evidencia.unidade)))
const dias: Fmt = (v) => (v === null ? 'Não estimada' : `${fmtNum(v)} dias`)
const data: Fmt = (v) => (typeof v === 'string' ? fmtData(v) : 'Nenhuma')
const reais: Fmt = (v) => fmtReais(v)
const num: Fmt = (v) => fmtNum(v)

/** Rótulo e formato de cada campo da evidência. Campos sem rótulo não aparecem (ex.: ids). */
const CAMPOS: Record<string, [string | ((a: Alerta) => string), Fmt]> = {
  saldo: ['Saldo atual', qtd],
  estoqueMinimo: ['Estoque mínimo', qtd],
  consumoMedioDiario: [(a) => `Consumo médio (${a.evidencia.janelaConsumoDias ?? 60} dias)`, (v, a) => `${qtd(v, a)}/dia`],
  coberturaDias: ['Cobertura estimada', dias],
  saidasNaJanela: ['Saídas na janela', num],
  totalSaidas: ['Retiradas no histórico', num],
  quantidadeReposicao: [(a) => `Reposição (${a.evidencia.diasReposicao ?? 30} dias)`, qtd],
  valorReposicao: [(a) => `Valor da reposição (${a.evidencia.diasReposicao ?? 30} dias)`, reais],
  lote: ['Lote', (v) => String(v)],
  validade: ['Validade', data],
  saldoLote: ['Saldo do lote', qtd],
  consumoProjetadoAteValidade: ['Consumo previsto até a validade', qtd],
  quantidadeEmRisco: ['Quantidade em risco', qtd],
  consumoRecente: [(a) => `Consumo últimos ${a.evidencia.janelaDias ?? 30} dias`, qtd],
  consumoAnterior: [(a) => `Consumo ${a.evidencia.janelaDias ?? 30} dias anteriores`, qtd],
  razao: ['Razão', (v) => `${fmtNum(v)} ×`],
  data: ['Data', data],
  quantidade: ['Quantidade retirada', qtd],
  mediana: ['Mediana das retiradas', qtd],
  limite: ['Limite (mediana + 3 × MAD)', qtd],
  retiradasAnteriores: ['Retiradas anteriores', num],
  quantidadeExcedente: ['Quantidade em excesso', qtd],
  vezesEstoqueMinimo: ['Saldo ÷ estoque mínimo', (v) => `${fmtNum(v)} ×`],
  multiploEstoqueMinimo: ['Limite (× estoque mínimo)', (v) => `${fmtNum(v)} ×`],
  ultimaSaida: ['Última retirada', data],
  valorEstoque: ['Valor em estoque', reais],
  diasSemSaida: ['Dias sem retirada', num],
  posicaoNoValor: ['Posição no valor em estoque', (v, a) => `${fmtNum(v)}º de ${fmtNum(a.evidencia.produtosComValor)}`],
  dataCompra: ['Data da compra', data],
  precoCompra: ['Preço da compra', (v, a) => `${fmtReais(v)}/${a.evidencia.unidade}`],
  precoMedioAnterior: ['Média das compras anteriores', (v, a) => `${fmtReais(v)}/${a.evidencia.unidade}`],
  variacaoPercentual: ['Variação', (v) => (typeof v === 'number' ? `${v > 0 ? '+' : ''}${fmtNum(v)}%` : '—')],
  comprasAnteriores: ['Compras anteriores', num],
  quantidadeComprada: ['Quantidade comprada', qtd],
  outroProduto: ['Outro produto', (v) => String(v)],
  similaridade: ['Semelhança dos nomes', (v) => (typeof v === 'number' ? `${fmtNum(Math.round(v * 100))}% das palavras` : '—')],
  saldoOutroProduto: ['Saldo do outro produto', qtd],
  zeradoEm: ['Esgotado em', data],
  prazoDevolucao: ['Prazo de devolução', data],
  diasAtePrazo: ['Dias até o prazo', num],
  diasHistorico: ['Dias de histórico', num],
}

/** Linhas da "Evidência em números", na ordem em que o motor as produziu. */
export function linhasEvidencia(a: Alerta): { rotulo: string; valor: string }[] {
  return Object.entries(a.evidencia).flatMap(([chave, v]) => {
    const c = CAMPOS[chave]
    if (!c) return []
    const [rotulo, fmt] = c
    return [{ rotulo: typeof rotulo === 'function' ? rotulo(a) : rotulo, valor: fmt(v, a) }]
  })
}

/** "limite da categoria X" → "Limite da categoria X". */
export function maiuscula(t: string): string {
  return t.charAt(0).toUpperCase() + t.slice(1)
}

/** Identificador estável de um alerta entre reanálises (o alerta não é persistido, R6). */
export function chaveAlerta(a: Alerta): string {
  const detalhe = a.evidencia.lote ?? a.evidencia.movimentacaoId ?? a.evidencia.outroProdutoId ?? ''
  return `${a.tipo}|${a.produtoId}|${detalhe}`
}

/** Texto do valor envolvido: "Sem preço" quando desconhecido, nunca R$ 0,00 (R2). */
export function valorAlerta(a: Alerta): string {
  if (a.valorEnvolvido !== null) return fmtReais(a.valorEnvolvido)
  return a.tipo === 'devolucao_embalagem' ? 'Não se aplica' : 'Sem preço'
}

/** "DD/MM/AAAA" digitado → "AAAA-MM-DD", ou null se a data não existir. */
export function lerDataBr(texto: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto.trim())
  if (!m) return null
  const iso = `${m[3]}-${m[2]}-${m[1]}`
  const d = new Date(`${iso}T00:00:00Z`)
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== iso ? null : iso
}

/** Máscara DD/MM/AAAA enquanto digita (só números). */
export function mascaraData(texto: string): string {
  const n = texto.replace(/\D/g, '').slice(0, 8)
  return [n.slice(0, 2), n.slice(2, 4), n.slice(4, 8)].filter(Boolean).join('/')
}
