// R8: produto canônico + apelidos. A unificação é sugerida, nunca automática,
// e nunca acontece quando os números do nome diferem (NPK 04-14-08 ≠ NPK 04-30-16).
import type { Produto, ProdutoAlias } from '@tetrarreme/contrato'

const PALAVRAS_IGNORADAS = new Set(['de', 'da', 'do', 'das', 'dos', 'para', 'com', 'e', 'em'])

/** Minúsculas, sem acentos, sem pontuação, espaços simples. */
export function normalizarNome(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Números do nome, na ordem em que aparecem ("NPK 04-14-08" → [4, 14, 8]). */
export function extrairNumeros(nome: string): number[] {
  return (nome.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => Number(n.replace(',', '.')))
}

/** Palavras do nome, sem números nem palavras curtas ou irrelevantes. */
export function palavrasDoNome(nome: string): Set<string> {
  return new Set(
    normalizarNome(nome)
      .split(' ')
      .map((p) => p.replace(/\d+/g, ''))
      .filter((p) => p.length >= 2 && !PALAVRAS_IGNORADAS.has(p)),
  )
}

/**
 * Números compatíveis: iguais e na mesma ordem, ou ausentes em um dos nomes
 * ("Ureia" × "UREIA 45%"). Números diferentes nunca são o mesmo produto.
 */
export function numerosCompativeis(a: string, b: string): boolean {
  const na = extrairNumeros(a)
  const nb = extrairNumeros(b)
  if (na.length === 0 || nb.length === 0) return true
  return na.length === nb.length && na.every((n, i) => n === nb[i])
}

function levenshtein(a: string, b: string): number {
  const linha = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    let anterior = linha[0]
    linha[0] = i
    for (let j = 1; j <= b.length; j++) {
      const atual = linha[j]
      linha[j] = Math.min(linha[j] + 1, linha[j - 1] + 1, anterior + (a[i - 1] === b[j - 1] ? 0 : 1))
      anterior = atual
    }
  }
  return linha[b.length]
}

/** Semelhança entre 0 e 1 das palavras dos nomes (ignora números). */
export function similaridadeNomes(a: string, b: string): number {
  const pa = palavrasDoNome(a)
  const pb = palavrasDoNome(b)
  if (pa.size === 0 || pb.size === 0) return 0
  const comuns = [...pa].filter((p) => pb.has(p)).length
  const jaccard = comuns / (pa.size + pb.size - comuns)
  // Tolera erros de digitação ("Glifozato" × "Glifosato").
  const ta = [...pa].sort().join(' ')
  const tb = [...pb].sort().join(' ')
  const edicao = 1 - levenshtein(ta, tb) / Math.max(ta.length, tb.length)
  return Math.max(jaccard, edicao)
}

export function parecemMesmoProduto(a: string, b: string, similaridadeMinima: number): boolean {
  return numerosCompativeis(a, b) && similaridadeNomes(a, b) >= similaridadeMinima
}

export interface SugestaoDuplicidade {
  produtoA: Produto
  produtoB: Produto
  similaridade: number
}

/** Pares de produtos cadastrados que parecem ser o mesmo. Apenas sugere. */
export function sugerirDuplicidades(
  produtos: readonly Produto[],
  similaridadeMinima: number,
): SugestaoDuplicidade[] {
  const sugestoes: SugestaoDuplicidade[] = []
  for (let i = 0; i < produtos.length; i++) {
    for (let j = i + 1; j < produtos.length; j++) {
      const a = produtos[i]
      const b = produtos[j]
      if (parecemMesmoProduto(a.nome_canonico, b.nome_canonico, similaridadeMinima)) {
        sugestoes.push({
          produtoA: a,
          produtoB: b,
          similaridade: similaridadeNomes(a.nome_canonico, b.nome_canonico),
        })
      }
    }
  }
  return sugestoes
}

/**
 * Identifica o produto de um nome: nome canônico igual (ignorando maiúsculas, acentos
 * e pontuação) ou apelido **confirmado**. Apelido não confirmado não identifica nada.
 */
export function resolverProduto(
  nome: string,
  produtos: readonly Produto[],
  aliases: readonly ProdutoAlias[],
): Produto | null {
  const n = normalizarNome(nome)
  const direto = produtos.find((p) => normalizarNome(p.nome_canonico) === n)
  if (direto) return direto
  const alias = aliases.find((a) => a.confirmado && normalizarNome(a.nome_original) === n)
  return alias ? (produtos.find((p) => p.id === alias.produto_id) ?? null) : null
}

/** Produtos cadastrados que podem corresponder a um nome novo. Apenas sugere. */
export function sugerirProdutos(
  nome: string,
  produtos: readonly Produto[],
  similaridadeMinima: number,
): Produto[] {
  return produtos
    .filter((p) => parecemMesmoProduto(nome, p.nome_canonico, similaridadeMinima))
    .sort((a, b) => similaridadeNomes(nome, b.nome_canonico) - similaridadeNomes(nome, a.nome_canonico))
}

export class ErroUnificacao extends Error {
  constructor(mensagem: string) {
    super(mensagem)
    this.name = 'ErroUnificacao'
  }
}

/**
 * Registra a confirmação humana de que `nomeOriginal` é o produto `produto`.
 * Recusa quando os números diferem, mesmo com confirmação.
 */
export function confirmarAlias(nomeOriginal: string, produto: Produto): ProdutoAlias {
  if (!numerosCompativeis(nomeOriginal, produto.nome_canonico)) {
    throw new ErroUnificacao(
      `"${nomeOriginal}" e "${produto.nome_canonico}" têm números diferentes e não podem ser o mesmo produto.`,
    )
  }
  return { nome_original: nomeOriginal, produto_id: produto.id, confirmado: true }
}
