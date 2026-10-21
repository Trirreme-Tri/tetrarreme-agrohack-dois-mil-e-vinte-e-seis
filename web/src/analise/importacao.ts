// Importação de CSV com mapeamento de colunas configurável.
// R2: valores ausentes viram `null`, nunca 0. R7: toda linha pertence a uma importação com origem.
import { CONFIG_PADRAO } from './config.ts'
import { normalizarNome, resolverProduto, sugerirProdutos } from './produtos.ts'
import { CATEGORIAS } from './tipos.ts'
import type {
  Categoria,
  Importacao,
  Movimentacao,
  Origem,
  Produto,
  ProdutoAlias,
  TipoMovimentacao,
} from './tipos.ts'
import { UNIDADE_BASE_POR_DIMENSAO, converter, identificarUnidade, obterUnidade } from './unidades.ts'

/** Campos internos que podem ser lidos do arquivo. */
export type CampoImportacao =
  | 'produto'
  | 'categoria'
  | 'unidade'
  | 'quantidade'
  | 'estoque_minimo'
  | 'tipo'
  | 'data'
  | 'preco_unit'
  | 'lote'
  | 'validade'
  | 'fornecedor'
  | 'destino'
  | 'responsavel'

/** Campo interno → nome da coluna no arquivo. */
export type MapeamentoColunas = Partial<Record<CampoImportacao, string>>

const CAMPOS_OBRIGATORIOS: CampoImportacao[] = ['produto', 'unidade', 'quantidade', 'tipo', 'data']

/** Textos que significam "sem informação". Viram `null`, nunca 0 (R2). */
export const VALORES_AUSENTES = ['', '-', '--', 'n/d', 'nd', 'na', 'n/a', 'null', 'sem preco', 'sem validade']

export interface OpcoesImportacao {
  mapeamento: MapeamentoColunas
  origem: Origem
  arquivo?: string | null
  /** Momento da importação (o motor nunca lê o relógio sozinho). */
  agora: Date
  produtos?: readonly Produto[]
  aliases?: readonly ProdutoAlias[]
  delimitador?: string
  separadorDecimal?: ',' | '.'
  /** Substitui nomes de responsáveis por "Funcionário A", "Funcionário B"... (padrão: sim). */
  pseudonimizar?: boolean
  gerarId?: () => string
  similaridadeMinima?: number
}

export interface ErroImportacao {
  /** Linha no arquivo (1 = cabeçalho). */
  linha: number
  mensagem: string
}

export interface SugestaoUnificacao {
  nomeNovo: string
  produtoNovoId: string
  candidatos: { produtoId: string; nome: string }[]
}

export interface ResultadoImportacao {
  importacao: Importacao
  movimentacoes: Movimentacao[]
  /** Produtos criados para nomes que não correspondem a nenhum produto ou apelido confirmado. */
  produtosNovos: Produto[]
  /** Nomes novos parecidos com produtos existentes: aguardam confirmação humana (R8). */
  sugestoesUnificacao: SugestaoUnificacao[]
  erros: ErroImportacao[]
}

/** Lê CSV (aspas, delimitador configurável, quebras de linha dentro de aspas). */
export function lerCsv(texto: string, delimitador = ','): string[][] {
  const linhas: string[][] = []
  let campo = ''
  let linha: string[] = []
  let aspas = false
  const t = texto.replace(/^﻿/, '')
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (aspas) {
      if (c === '"' && t[i + 1] === '"') {
        campo += '"'
        i++
      } else if (c === '"') aspas = false
      else campo += c
    } else if (c === '"') aspas = true
    else if (c === delimitador) {
      linha.push(campo)
      campo = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++
      linha.push(campo)
      linhas.push(linha)
      linha = []
      campo = ''
    } else campo += c
  }
  if (campo !== '' || linha.length > 0) {
    linha.push(campo)
    linhas.push(linha)
  }
  return linhas.filter((l) => l.some((c) => c.trim() !== ''))
}

/** `null` para valores ausentes (R2); senão o texto sem espaços nas pontas. */
export function textoOuNulo(valor: string | undefined): string | null {
  if (valor === undefined) return null
  const v = valor.trim()
  const n = v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  return VALORES_AUSENTES.includes(n) ? null : v
}

/** Número ou `null` se ausente (R2). Lança erro se houver texto que não é número. */
export function numeroOuNulo(valor: string | undefined, separadorDecimal: ',' | '.' = ','): number | null {
  const v = textoOuNulo(valor)
  if (v === null) return null
  let s = v.replace(/^r\$\s*/i, '').replace(/\s/g, '')
  s = separadorDecimal === ',' ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '')
  const n = Number(s)
  if (!Number.isFinite(n) || s === '') throw new Error(`"${valor}" não é um número`)
  return n
}

/** `AAAA-MM-DD` ou `DD/MM/AAAA` → `AAAA-MM-DD`; `null` se ausente. */
export function dataOuNula(valor: string | undefined): string | null {
  const v = textoOuNulo(valor)
  if (v === null) return null
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(v)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  throw new Error(`"${valor}" não é uma data (use DD/MM/AAAA ou AAAA-MM-DD)`)
}

export function tipoMovimentacao(valor: string | undefined): TipoMovimentacao {
  const v = normalizarNome(textoOuNulo(valor) ?? '')
  if (['entrada', 'compra', 'recebimento'].includes(v)) return 'entrada'
  if (['saida', 'retirada', 'baixa', 'consumo', 'uso'].includes(v)) return 'saida'
  if (['ajuste', 'correcao', 'inventario'].includes(v)) return 'ajuste'
  throw new Error(`tipo "${valor}" desconhecido (use entrada, saída ou ajuste)`)
}

export function categoriaOuErro(valor: string | undefined): Categoria {
  const v = normalizarNome(textoOuNulo(valor) ?? '')
  const c = CATEGORIAS.find((x) => normalizarNome(x) === v)
  if (!c) throw new Error(`categoria "${valor}" não está no Anexo III`)
  return c
}

/** Pseudônimos estáveis por ordem de aparição: "Funcionário A", "Funcionário B"... */
export function criarPseudonimizador(): (nome: string | null) => string | null {
  const mapa = new Map<string, string>()
  return (nome) => {
    if (nome === null) return null
    if (/^funcion[aá]rio [A-Z]{1,2}$/i.test(nome.trim())) return nome.trim()
    const chave = normalizarNome(nome)
    let p = mapa.get(chave)
    if (!p) {
      const i = mapa.size
      const letra =
        i < 26 ? String.fromCharCode(65 + i) : String.fromCharCode(64 + Math.floor(i / 26)) + String.fromCharCode(65 + (i % 26))
      p = `Funcionário ${letra}`
      mapa.set(chave, p)
    }
    return p
  }
}

export function importarCsv(texto: string, opcoes: OpcoesImportacao): ResultadoImportacao {
  const {
    mapeamento,
    origem,
    agora,
    delimitador = ',',
    separadorDecimal = ',',
    pseudonimizar = true,
    gerarId = () => crypto.randomUUID(),
    similaridadeMinima = CONFIG_PADRAO.duplicidade.similaridadeMinima,
  } = opcoes
  if (origem !== 'simulado' && origem !== 'oficial') {
    throw new Error('Toda importação precisa de origem "simulado" ou "oficial" (R7).')
  }

  const importacao: Importacao = {
    id: gerarId(),
    origem,
    criada_em: agora.toISOString(),
    arquivo: opcoes.arquivo ?? null,
  }
  const resultado: ResultadoImportacao = {
    importacao,
    movimentacoes: [],
    produtosNovos: [],
    sugestoesUnificacao: [],
    erros: [],
  }

  const [cabecalho, ...linhas] = lerCsv(texto, delimitador)
  if (!cabecalho) return resultado
  const indice = new Map(cabecalho.map((c, i) => [c.trim(), i]))
  const faltando = CAMPOS_OBRIGATORIOS.filter((c) => !mapeamento[c] || !indice.has(mapeamento[c]))
  if (faltando.length > 0) {
    resultado.erros.push({
      linha: 1,
      mensagem: `Colunas obrigatórias não encontradas no mapeamento: ${faltando.join(', ')}`,
    })
    return resultado
  }

  const existentes = [...(opcoes.produtos ?? [])]
  const aliases = opcoes.aliases ?? []
  const pseudonimo = criarPseudonimizador()
  const ler = (linha: string[], campo: CampoImportacao): string | undefined => {
    const col = mapeamento[campo]
    if (!col) return undefined
    const i = indice.get(col)
    return i === undefined ? undefined : linha[i]
  }

  linhas.forEach((linha, i) => {
    const numeroLinha = i + 2
    try {
      const nome = textoOuNulo(ler(linha, 'produto'))
      if (nome === null) throw new Error('produto não informado')
      const textoUnidade = textoOuNulo(ler(linha, 'unidade'))
      const unidadeId = textoUnidade === null ? null : identificarUnidade(textoUnidade)
      if (unidadeId === null) throw new Error(`unidade "${ler(linha, 'unidade') ?? ''}" não reconhecida`)
      const quantidade = numeroOuNulo(ler(linha, 'quantidade'), separadorDecimal)
      if (quantidade === null) throw new Error('quantidade não informada')
      const tipo = tipoMovimentacao(ler(linha, 'tipo'))
      if (tipo !== 'ajuste' && quantidade <= 0) throw new Error('quantidade deve ser maior que zero')
      const data = dataOuNula(ler(linha, 'data'))
      if (data === null) throw new Error('data não informada')
      const estoqueMinimo = numeroOuNulo(ler(linha, 'estoque_minimo'), separadorDecimal)

      let produto = resolverProduto(nome, existentes, aliases)
      if (!produto) {
        produto = {
          id: gerarId(),
          nome_canonico: nome,
          categoria: categoriaOuErro(ler(linha, 'categoria')),
          unidade_base_id: UNIDADE_BASE_POR_DIMENSAO[obterUnidade(unidadeId).dimensao],
          estoque_minimo: null,
        }
        const candidatos = sugerirProdutos(nome, existentes, similaridadeMinima)
        if (candidatos.length > 0) {
          resultado.sugestoesUnificacao.push({
            nomeNovo: nome,
            produtoNovoId: produto.id,
            candidatos: candidatos.map((c) => ({ produtoId: c.id, nome: c.nome_canonico })),
          })
        }
        existentes.push(produto)
        resultado.produtosNovos.push(produto)
      }
      // R1: lança erro se a unidade da linha for de outra dimensão que a do produto.
      converter(quantidade, unidadeId, produto.unidade_base_id)
      // Produtos já cadastrados não são alterados pela importação.
      if (estoqueMinimo !== null && resultado.produtosNovos.includes(produto)) {
        produto.estoque_minimo = converter(estoqueMinimo, unidadeId, produto.unidade_base_id)
      }

      const responsavel = textoOuNulo(ler(linha, 'responsavel'))
      resultado.movimentacoes.push({
        id: gerarId(),
        produto_id: produto.id,
        nome_original: nome,
        tipo,
        quantidade,
        unidade_id: unidadeId,
        data,
        preco_unit: numeroOuNulo(ler(linha, 'preco_unit'), separadorDecimal),
        lote: textoOuNulo(ler(linha, 'lote')),
        validade: dataOuNula(ler(linha, 'validade')),
        fornecedor: textoOuNulo(ler(linha, 'fornecedor')),
        destino: textoOuNulo(ler(linha, 'destino')),
        responsavel_pseudonimo: pseudonimizar ? pseudonimo(responsavel) : responsavel,
        importacao_id: importacao.id,
        criado_em: agora.toISOString(),
        dispositivo: 'importacao',
      })
    } catch (e) {
      resultado.erros.push({ linha: numeroLinha, mensagem: (e as Error).message })
    }
  })
  return resultado
}
