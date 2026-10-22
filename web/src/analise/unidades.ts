// R1: unidades diferentes nunca são somadas sem conversão.
import type { Dimensao, Unidade } from '@tetrarreme/contrato'

export const UNIDADES: readonly Unidade[] = [
  { id: 'g', sigla: 'g', dimensao: 'massa', fator_para_base: 0.001 },
  { id: 'kg', sigla: 'kg', dimensao: 'massa', fator_para_base: 1 },
  { id: 't', sigla: 't', dimensao: 'massa', fator_para_base: 1000 },
  { id: 'sc50', sigla: 'sc 50 kg', dimensao: 'massa', fator_para_base: 50 },
  { id: 'mL', sigla: 'mL', dimensao: 'volume', fator_para_base: 0.001 },
  { id: 'L', sigla: 'L', dimensao: 'volume', fator_para_base: 1 },
  { id: 'un', sigla: 'un', dimensao: 'contagem', fator_para_base: 1 },
]

export const UNIDADE_BASE_POR_DIMENSAO: Record<Dimensao, string> = {
  massa: 'kg',
  volume: 'L',
  contagem: 'un',
}

const SINONIMOS: Record<string, string> = {
  g: 'g', grama: 'g', gramas: 'g',
  kg: 'kg', quilo: 'kg', quilos: 'kg', quilograma: 'kg', quilogramas: 'kg',
  t: 't', ton: 't', tonelada: 't', toneladas: 't',
  sc50: 'sc50', 'sc 50 kg': 'sc50', 'sc 50kg': 'sc50', 'saco 50 kg': 'sc50', 'saca 50 kg': 'sc50',
  ml: 'mL', mililitro: 'mL', mililitros: 'mL',
  l: 'L', lt: 'L', litro: 'L', litros: 'L',
  un: 'un', und: 'un', unid: 'un', unidade: 'un', unidades: 'un', pc: 'un', peca: 'un', pecas: 'un',
}

export class ErroDimensao extends Error {
  constructor(mensagem: string) {
    super(mensagem)
    this.name = 'ErroDimensao'
  }
}

export function obterUnidade(id: string): Unidade {
  const u = UNIDADES.find((x) => x.id === id)
  if (!u) throw new Error(`Unidade desconhecida: "${id}"`)
  return u
}

/** Texto livre ("Litros", "KG", "sc 50 kg") → id da unidade, ou `null` se não reconhecida. */
export function identificarUnidade(texto: string): string | null {
  const t = texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
  return SINONIMOS[t] ?? null
}

/** Converte `quantidade` de uma unidade para outra. Lança `ErroDimensao` se as dimensões diferirem. */
export function converter(quantidade: number, deId: string, paraId: string): number {
  const de = obterUnidade(deId)
  const para = obterUnidade(paraId)
  if (de.dimensao !== para.dimensao) {
    throw new ErroDimensao(
      `Não é possível converter ${de.sigla} (${de.dimensao}) em ${para.sigla} (${para.dimensao}).`,
    )
  }
  return (quantidade * de.fator_para_base) / para.fator_para_base
}

/** Soma quantidades em unidades possivelmente diferentes, convertendo cada uma para `paraId`. */
export function somar(
  parcelas: readonly { quantidade: number; unidade_id: string }[],
  paraId: string,
): number {
  return parcelas.reduce((total, p) => total + converter(p.quantidade, p.unidade_id, paraId), 0)
}
