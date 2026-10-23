// Resumo financeiro (pergunta 6). R2: todo total informa quantos itens ficaram sem preço.
//
// Uma definição só de "valor estimado":
// - `valorConhecido` soma o saldo dos produtos que têm algum preço conhecido;
// - `itensSemPreco`: produtos com saldo e nenhum preço — ficam FORA da soma (valor desconhecido);
// - `lotesComPrecoMedio`: lotes com saldo em que alguma entrada chegou sem preço; o saldo é valorado
//   pelo preço médio (das compras com preço do lote ou, se nenhuma, do produto) e entra na soma;
// - `estimado` é verdadeiro se qualquer um dos dois casos acima acontece.
import type { AnaliseProduto } from './consumo.ts'
import { arred } from './formatacao.ts'
import type { Categoria } from '@tetrarreme/contrato'

export interface ValorProduto {
  produtoId: string
  nome: string
  categoria: Categoria
  /** `null` = sem preço conhecido (fora da soma). */
  valor: number | null
  /** Fração do valor conhecido; `null` se sem preço. */
  participacao: number | null
  /** Lotes deste produto valorados pelo preço médio (sem preço próprio). */
  lotesComPrecoMedio: number
  /** O valor deste produto usa preço médio em algum lote. */
  estimado: boolean
}

export interface ValorCategoria {
  categoria: Categoria
  valor: number
  itensComEstoque: number
  itensSemPreco: number
  lotesComPrecoMedio: number
}

export interface ResumoFinanceiro {
  /** Soma do valor dos produtos com algum preço conhecido. */
  valorConhecido: number
  itensComEstoque: number
  /** Produtos com saldo e nenhum preço: ficam fora da soma. */
  itensSemPreco: number
  /** Lotes com entradas sem preço, valorados pelo preço médio (entram na soma). */
  lotesComPrecoMedio: number
  /** Verdadeiro se há itens sem preço ou lotes valorados pelo preço médio. */
  estimado: boolean
  porCategoria: ValorCategoria[]
  /** Do maior para o menor valor; itens sem preço no fim. */
  porProduto: ValorProduto[]
}

/** Lotes com saldo e alguma entrada sem preço, num produto que tem preço médio (valor estimado). */
export function lotesComPrecoMedio(a: AnaliseProduto): number {
  if (a.precoMedio === null) return 0
  return a.lotes.filter((l) => l.saldo > 0 && l.entradasSemPreco > 0).length
}

export function resumirFinanceiro(analises: readonly AnaliseProduto[]): ResumoFinanceiro {
  const comEstoque = analises.filter((a) => a.saldo > 0)
  const valorConhecido = comEstoque.reduce((t, a) => t + (a.valorEstoque ?? 0), 0)
  const categorias = new Map<Categoria, ValorCategoria>()
  for (const a of comEstoque) {
    const c = categorias.get(a.produto.categoria) ?? {
      categoria: a.produto.categoria, valor: 0, itensComEstoque: 0, itensSemPreco: 0, lotesComPrecoMedio: 0,
    }
    c.itensComEstoque++
    c.lotesComPrecoMedio += lotesComPrecoMedio(a)
    if (a.valorEstoque === null) c.itensSemPreco++
    else c.valor += a.valorEstoque
    categorias.set(a.produto.categoria, c)
  }
  const itensSemPreco = comEstoque.filter((a) => a.valorEstoque === null).length
  const lotes = comEstoque.reduce((t, a) => t + lotesComPrecoMedio(a), 0)
  return {
    valorConhecido: arred(valorConhecido),
    itensComEstoque: comEstoque.length,
    itensSemPreco,
    lotesComPrecoMedio: lotes,
    estimado: itensSemPreco > 0 || lotes > 0,
    porCategoria: [...categorias.values()].map((c) => ({ ...c, valor: arred(c.valor) })).sort((a, b) => b.valor - a.valor),
    porProduto: comEstoque
      .map((a) => ({
        produtoId: a.produto.id,
        nome: a.produto.nome_canonico,
        categoria: a.produto.categoria,
        valor: a.valorEstoque === null ? null : arred(a.valorEstoque),
        participacao: a.valorEstoque === null || valorConhecido === 0 ? null : arred(a.valorEstoque / valorConhecido, 4),
        lotesComPrecoMedio: lotesComPrecoMedio(a),
        estimado: lotesComPrecoMedio(a) > 0,
      }))
      .sort((a, b) => (b.valor ?? -1) - (a.valor ?? -1)),
  }
}
