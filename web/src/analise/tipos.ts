// Tipos do modelo de dados (CLAUDE.md, seção 5) e do alerta (seção 6).

export type Dimensao = 'massa' | 'volume' | 'contagem'

export interface Unidade {
  id: string
  sigla: string
  dimensao: Dimensao
  /** Quanto 1 desta unidade vale na unidade base da dimensão (kg, L ou un). */
  fator_para_base: number
}

/** Categorias do Anexo III do edital. */
export const CATEGORIAS = [
  'Fertilizantes',
  'Corretivos',
  'Sementes',
  'Defensivos e biológicos',
  'Combustíveis e lubrificantes',
  'Peças e manutenção',
  'Materiais de irrigação',
  'EPI e diversos',
] as const

export type Categoria = (typeof CATEGORIAS)[number]

export interface Produto {
  id: string
  nome_canonico: string
  categoria: Categoria
  unidade_base_id: string
  /** Na unidade base do produto. `null` = não informado (nunca zero). */
  estoque_minimo: number | null
}

export interface ProdutoAlias {
  nome_original: string
  produto_id: string
  /** Só apelidos confirmados por uma pessoa são usados para identificar o produto (R8). */
  confirmado: boolean
}

export type Origem = 'simulado' | 'oficial'

export interface Importacao {
  id: string
  origem: Origem
  criada_em: string
  arquivo: string | null
}

export type TipoMovimentacao = 'entrada' | 'saida' | 'ajuste'

/**
 * Registro append-only. Correção = nova movimentação do tipo `ajuste`.
 * Não tem campo de confiança: a confiança é calculada na análise (R3).
 */
export interface Movimentacao {
  /** UUID gerado no cliente. */
  id: string
  produto_id: string
  nome_original: string
  tipo: TipoMovimentacao
  /** Entrada e saída: sempre positiva. Ajuste: positivo soma, negativo subtrai. */
  quantidade: number
  unidade_id: string
  /** Data da movimentação, `AAAA-MM-DD`. */
  data: string
  /** Preço por unidade de `unidade_id`. `null` = sem preço (nunca zero, R2). */
  preco_unit: number | null
  lote: string | null
  /** `AAAA-MM-DD`. `null` = sem validade informada (nunca "vencido", R2). */
  validade: string | null
  fornecedor: string | null
  destino: string | null
  responsavel_pseudonimo: string | null
  importacao_id: string
  criado_em: string
  dispositivo: string | null
}

export type TipoAlerta =
  | 'estoque_critico'
  | 'ruptura_prevista'
  | 'vencimento'
  | 'consumo_crescente'
  | 'retirada_atipica'
  | 'excesso'
  | 'item_parado'
  | 'variacao_preco'
  | 'possivel_duplicidade'
  | 'devolucao_embalagem'

export type NivelAlerta = 'critico' | 'atencao' | 'informativo'

export type Confianca = 'alta' | 'media' | 'baixa' | 'insuficiente'

export type Alerta = {
  tipo: TipoAlerta
  nivel: NivelAlerta
  produtoId: string
  /** Números que sustentam o alerta. */
  evidencia: Record<string, number | string | null>
  /** Critério que disparou, em linguagem simples. */
  regra: string
  confianca: Confianca
  /** O que o responsável deve fazer. */
  recomendacao: string
  /** Gerada a partir dos campos acima (ver `mensagens.ts`). */
  mensagem: string
  valorEnvolvido: number | null
}
