// Resumo financeiro (pergunta 6). R2: todo total informa quantos itens ficaram sem preço.
import type { AnaliseProduto } from './consumo.ts'
import { arred } from './formatacao.ts'
import type { Categoria } from './tipos.ts'

export interface ValorProduto {
  produtoId: string
  nome: string
  categoria: Categoria
  /** `null` = sem preço conhecido. */
  valor: number | null
  /** Fração do valor total; `null` se sem preço. */
  participacao: number | null
}

export interface ValorCategoria {
  categoria: Categoria
  valor: number
  itensComEstoque: number
  itensSemPreco: number
}

export interface ResumoFinanceiro {
  /** Soma dos itens com preço conhecido. */
  valorTotal: number
  itensComEstoque: number
  /** Itens com saldo mas sem nenhum preço: ficam fora do total. */
  itensSemPreco: number
  porCategoria: ValorCategoria[]
  /** Do maior para o menor valor; itens sem preço no fim. */
  porProduto: ValorProduto[]
}

export function resumirFinanceiro(analises: readonly AnaliseProduto[]): ResumoFinanceiro {
  const comEstoque = analises.filter((a) => a.saldo > 0)
  const valorTotal = comEstoque.reduce((t, a) => t + (a.valorEstoque ?? 0), 0)
  const categorias = new Map<Categoria, ValorCategoria>()
  for (const a of comEstoque) {
    const c = categorias.get(a.produto.categoria) ?? { categoria: a.produto.categoria, valor: 0, itensComEstoque: 0, itensSemPreco: 0 }
    c.itensComEstoque++
    if (a.valorEstoque === null) c.itensSemPreco++
    else c.valor += a.valorEstoque
    categorias.set(a.produto.categoria, c)
  }
  return {
    valorTotal: arred(valorTotal),
    itensComEstoque: comEstoque.length,
    itensSemPreco: comEstoque.filter((a) => a.valorEstoque === null).length,
    porCategoria: [...categorias.values()].map((c) => ({ ...c, valor: arred(c.valor) })).sort((a, b) => b.valor - a.valor),
    porProduto: comEstoque
      .map((a) => ({
        produtoId: a.produto.id,
        nome: a.produto.nome_canonico,
        categoria: a.produto.categoria,
        valor: a.valorEstoque === null ? null : arred(a.valorEstoque),
        participacao: a.valorEstoque === null || valorTotal === 0 ? null : arred(a.valorEstoque / valorTotal, 4),
      }))
      .sort((a, b) => (b.valor ?? -1) - (a.valor ?? -1)),
  }
}
