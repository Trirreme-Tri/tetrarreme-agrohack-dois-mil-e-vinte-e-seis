// Limites da análise. TODOS SÃO PROVISÓRIOS, aguardando calibração com o Victor.
// Este é o único lugar onde ficam (CLAUDE.md, seção 6).
//
// Três níveis, do mais geral ao mais específico:
//   padrao  →  porCategoria  →  porProduto
// Para cada produto, o motor usa o valor do nível mais específico que o define
// (ver `limitesPara`). Um ajuste só precisa trazer o que muda; o resto vem do nível acima.
//
// `globais` reúne o que compara produtos entre si (ou vale para a análise toda) e,
// por isso, não pode variar por produto.
import type { Categoria, Produto } from '@tetrarreme/contrato'
import { normalizarNome } from './produtos.ts'

/** Limites que podem ser ajustados por categoria e por produto. */
export interface Limites {
  /** Janela para o consumo médio diário recente, usado na cobertura. */
  janelaConsumoDias: number
  confianca: {
    /** Menos saídas que isto: `insuficiente`. */
    saidasInsuficiente: number
    /** Menos saídas que isto (ou histórico curto): `baixa`. */
    saidasBaixa: number
    /** Histórico mais curto que isto: no máximo `baixa`. */
    historicoMinimoDias: number
    /** Menos saídas que isto: `media`. Senão: `alta`. */
    saidasMedia: number
  }
  estoqueCritico: { coberturaMaximaDias: number }
  rupturaPrevista: { coberturaMinimaDias: number; coberturaMaximaDias: number }
  vencimento: {
    /** Só avalia lotes que vencem dentro deste horizonte. */
    horizonteDias: number
    /** Lote vencido ou que vence em até estes dias: `critico`. */
    diasParaCritico: number
  }
  consumoCrescente: { janelaDias: number; fatorAumento: number }
  retiradaAtipica: {
    minimoSaidas: number
    multiplicadorMad: number
    /** Só avalia retiradas feitas nestes últimos dias. */
    janelaRecenteDias: number
    /** Piso do MAD, como fração da mediana (evita alerta quando todas as doses são iguais). */
    madMinimoFracaoMediana: number
  }
  excesso: { coberturaMinimaDias: number }
  itemParado: { diasSemSaida: number }
  variacaoPreco: {
    variacaoMinima: number
    minimoComprasAnteriores: number
    /** Só avalia a última compra se ela tiver sido feita nestes últimos dias. */
    janelaDias: number
  }
  devolucaoEmbalagem: {
    /** Prazo para devolver a embalagem vazia, contado da compra do lote. */
    prazoDias: number
    /** Faltando até estes dias para o prazo: `atencao`. */
    diasAtencao: number
    /** Faltando até estes dias para o prazo: `critico`. */
    diasCritico: number
  }
  /** Dias de consumo usados para estimar o valor de reposição (estoque crítico e ruptura). */
  diasReposicao: number
}

/** Ajuste de um nível: só os limites que mudam (inclusive campos soltos dentro de um grupo). */
export type AjusteLimites = {
  [K in keyof Limites]?: Limites[K] extends object ? Partial<Limites[K]> : Limites[K]
}

/** Limites que comparam produtos entre si ou valem para a análise toda: não variam por produto. */
export interface LimitesGlobais {
  /** Item parado: só entre os produtos nesta fração de maior valor em estoque. */
  itemParadoFracaoTopValor: number
  duplicidade: {
    /** Fração mínima de palavras em comum entre os nomes (Jaccard). */
    similaridadeMinima: number
    /** Duas palavras contam como iguais a partir desta semelhança (tolera erro de digitação). */
    similaridadePalavra: number
  }
  /** Categorias cujas embalagens vazias devem ser devolvidas. */
  categoriasDevolucaoEmbalagem: Categoria[]
}

export interface ConfigAnalise {
  /** Padrão geral: vale para todo produto sem ajuste mais específico. */
  padrao: Limites
  /** Ajustes por categoria do Anexo III. */
  porCategoria: Partial<Record<Categoria, AjusteLimites>>
  /** Ajustes por produto, pelo nome canônico (sem diferenciar maiúsculas, acentos e pontuação). */
  porProduto: Record<string, AjusteLimites>
  globais: LimitesGlobais
}

export const CONFIG_PADRAO: ConfigAnalise = {
  padrao: {
    janelaConsumoDias: 60,
    confianca: {
      saidasInsuficiente: 3,
      saidasBaixa: 5,
      historicoMinimoDias: 30,
      saidasMedia: 10,
    },
    estoqueCritico: { coberturaMaximaDias: 7 },
    rupturaPrevista: { coberturaMinimaDias: 7, coberturaMaximaDias: 30 },
    vencimento: { horizonteDias: 180, diasParaCritico: 30 },
    consumoCrescente: { janelaDias: 30, fatorAumento: 1.5 },
    retiradaAtipica: {
      minimoSaidas: 5,
      multiplicadorMad: 3,
      janelaRecenteDias: 30,
      madMinimoFracaoMediana: 0.1,
    },
    excesso: { coberturaMinimaDias: 180 },
    itemParado: { diasSemSaida: 60 },
    variacaoPreco: { variacaoMinima: 0.2, minimoComprasAnteriores: 2, janelaDias: 60 },
    // PROVISÓRIO — calibrar com o Victor. Prazo usual: até 1 ano da compra.
    // Nível: informativo; atenção a ≤ 60 dias do prazo; crítico a ≤ 15 dias.
    devolucaoEmbalagem: { prazoDias: 365, diasAtencao: 60, diasCritico: 15 },
    diasReposicao: 30,
  },

  // A preencher com o Victor. Exemplo (adubo usado uma vez por safra não é "item parado" em 60 dias):
  //   Fertilizantes: { itemParado: { diasSemSaida: 240 } },
  porCategoria: {
    'Fertilizantes': {},
    'Corretivos': {},
    'Sementes': {},
    'Defensivos e biológicos': {},
    'Combustíveis e lubrificantes': {},
    'Peças e manutenção': {},
    'Materiais de irrigação': {},
    'EPI e diversos': {},
  },

  // Exemplo: 'Óleo diesel S10': { estoqueCritico: { coberturaMaximaDias: 15 } },
  porProduto: {},

  globais: {
    itemParadoFracaoTopValor: 0.2,
    duplicidade: { similaridadeMinima: 0.6, similaridadePalavra: 0.8 },
    categoriasDevolucaoEmbalagem: ['Defensivos e biológicos'],
  },
}

/** Caminho de um limite ajustável ("excesso.coberturaMinimaDias", "janelaConsumoDias"...). */
export type CampoLimite = {
  [K in keyof Limites]: Limites[K] extends object ? `${K}.${keyof Limites[K] & string}` : K
}[keyof Limites]

/** De onde veio um limite: "padrão geral", "categoria Fertilizantes" ou "produto Óleo diesel S10". */
export type OrigemLimite = string

/** Limites efetivos de um produto e o nível de onde veio cada um. */
export interface LimitesDoProduto {
  valores: Limites
  origem: Record<CampoLimite, OrigemLimite>
}

function campos(limites: Limites | AjusteLimites): CampoLimite[] {
  return Object.entries(limites).flatMap(([chave, valor]) =>
    valor !== null && typeof valor === 'object'
      ? Object.keys(valor).filter((k) => (valor as Record<string, unknown>)[k] !== undefined).map((k) => `${chave}.${k}`)
      : valor === undefined ? [] : [chave],
  ) as CampoLimite[]
}

function aplicar(base: Limites, ajuste: AjusteLimites | undefined): Limites {
  if (!ajuste) return base
  const resultado: Record<string, unknown> = { ...base }
  for (const [chave, valor] of Object.entries(ajuste)) {
    if (valor === undefined) continue
    const atual = resultado[chave]
    resultado[chave] = typeof valor === 'object' && typeof atual === 'object' ? { ...atual, ...valor } : valor
  }
  return resultado as unknown as Limites
}

/** Chave de `porProduto` que corresponde ao produto (nome canônico normalizado). */
export function chaveDoProduto(nome: string, porProduto: ConfigAnalise['porProduto']): string | undefined {
  const alvo = normalizarNome(nome)
  return Object.keys(porProduto).find((k) => normalizarNome(k) === alvo)
}

/**
 * Única função que resolve limites: padrão geral ← categoria ← produto (o mais específico vence,
 * campo a campo). Devolve também a origem de cada limite, para a justificativa do alerta (R4).
 */
export function limitesPara(
  produto: Pick<Produto, 'nome_canonico' | 'categoria'>,
  config: ConfigAnalise = CONFIG_PADRAO,
): LimitesDoProduto {
  const origem = Object.fromEntries(campos(config.padrao).map((c) => [c, 'padrão geral'])) as Record<CampoLimite, OrigemLimite>
  const daCategoria = config.porCategoria[produto.categoria]
  const chave = chaveDoProduto(produto.nome_canonico, config.porProduto)
  const doProduto = chave === undefined ? undefined : config.porProduto[chave]
  for (const c of daCategoria ? campos(daCategoria) : []) origem[c] = `categoria ${produto.categoria}`
  for (const c of doProduto ? campos(doProduto) : []) origem[c] = `produto ${produto.nome_canonico}`
  return { valores: aplicar(aplicar(config.padrao, daCategoria), doProduto), origem }
}

/** "limite da categoria Fertilizantes"; com origens diferentes: "limites do padrão geral e do produto X". */
export function descreverOrigem(origens: readonly OrigemLimite[]): string {
  const distintas = [...new Set(origens)].map((o) => (o.startsWith('categoria ') ? `da ${o}` : `do ${o}`))
  return `${distintas.length > 1 ? 'limites' : 'limite'} ${distintas.join(' e ')}`
}
