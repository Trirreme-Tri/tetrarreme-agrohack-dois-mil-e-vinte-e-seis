// Contrato de dados único do projeto (CLAUDE.md, seções 5 e 6).
// Schemas Zod + tipos inferidos, compartilhados por interface, motor de análise e API.
// Nenhum outro pacote declara estes tipos: todos importam daqui.
import { z } from 'zod'

// Mensagens de validação em português.
z.config(z.locales.pt())

const texto = z.string().trim().min(1)
/** Texto opcional: ausente é `null`, nunca string vazia (R2). */
const textoOuNulo = texto.nullable()
/** Data `AAAA-MM-DD`, validando dia e mês. */
const data = z.iso.date()
/** Data e hora ISO 8601 (UTC, com `Z`). */
const momento = z.iso.datetime()

// ------------------------------------------------------------------ enumerações

export const DimensaoSchema = z.enum(['massa', 'volume', 'contagem'])
export type Dimensao = z.infer<typeof DimensaoSchema>

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
export const CategoriaSchema = z.enum(CATEGORIAS)
export type Categoria = z.infer<typeof CategoriaSchema>

export const OrigemSchema = z.enum(['simulado', 'oficial'])
export type Origem = z.infer<typeof OrigemSchema>

export const TipoMovimentacaoSchema = z.enum(['entrada', 'saida', 'ajuste'])
export type TipoMovimentacao = z.infer<typeof TipoMovimentacaoSchema>

export const TipoAlertaSchema = z.enum([
  'estoque_critico',
  'ruptura_prevista',
  'vencimento',
  'consumo_crescente',
  'retirada_atipica',
  'excesso',
  'item_parado',
  'variacao_preco',
  'possivel_duplicidade',
  'devolucao_embalagem',
])
export type TipoAlerta = z.infer<typeof TipoAlertaSchema>

export const NivelAlertaSchema = z.enum(['critico', 'atencao', 'informativo'])
export type NivelAlerta = z.infer<typeof NivelAlertaSchema>

/** R3: confiança de uma estimativa, calculada na análise e nunca armazenada em registro. */
export const ConfiancaEstimativaSchema = z.enum(['alta', 'media', 'baixa', 'insuficiente'])
export type ConfiancaEstimativa = z.infer<typeof ConfiancaEstimativaSchema>

/**
 * Confiança de um alerta: a de uma estimativa ou `fato` — fato registrado, sem estimativa
 * (lote vencido, possível duplicidade, devolução de embalagem, variação de preço).
 */
export const ConfiancaSchema = z.enum([...ConfiancaEstimativaSchema.options, 'fato'])
export type Confianca = z.infer<typeof ConfiancaSchema>

// ------------------------------------------------------------------ tabelas

export const UnidadeSchema = z.object({
  id: texto,
  sigla: texto,
  dimensao: DimensaoSchema,
  /** Quanto 1 desta unidade vale na unidade base da dimensão (kg, L ou un). */
  fator_para_base: z.number().positive(),
})
export type Unidade = z.infer<typeof UnidadeSchema>

export const ProdutoSchema = z.object({
  id: texto,
  nome_canonico: texto,
  categoria: CategoriaSchema,
  unidade_base_id: texto,
  /** Na unidade base do produto. `null` = não informado (nunca zero, R2). */
  estoque_minimo: z.number().nonnegative().nullable(),
})
export type Produto = z.infer<typeof ProdutoSchema>

export const ProdutoAliasSchema = z.object({
  nome_original: texto,
  produto_id: texto,
  /** Só apelidos confirmados por uma pessoa identificam o produto (R8). */
  confirmado: z.boolean(),
})
export type ProdutoAlias = z.infer<typeof ProdutoAliasSchema>

export const ImportacaoSchema = z.object({
  id: texto,
  /** R7: toda importação declara se os dados são simulados ou oficiais. */
  origem: OrigemSchema,
  criada_em: momento,
  arquivo: textoOuNulo,
})
export type Importacao = z.infer<typeof ImportacaoSchema>

/**
 * Registro append-only. Correção = nova movimentação do tipo `ajuste`.
 * Não tem campo de confiança: a confiança é calculada na análise (R3).
 */
export const MovimentacaoSchema = z
  .object({
    /** UUID gerado no cliente (sincronização idempotente). */
    id: z.uuid(),
    produto_id: texto,
    nome_original: texto,
    tipo: TipoMovimentacaoSchema,
    /** Entrada e saída: positiva. Ajuste: positivo soma, negativo subtrai. */
    quantidade: z.number(),
    unidade_id: texto,
    data,
    /** Preço por unidade de `unidade_id`. `null` = sem preço (nunca zero, R2). */
    preco_unit: z.number().nonnegative().nullable(),
    lote: textoOuNulo,
    /** `null` = sem validade informada (nunca "vencido", R2). */
    validade: data.nullable(),
    fornecedor: textoOuNulo,
    destino: textoOuNulo,
    /** Sempre pseudonimizado ("Funcionário A"), nunca o nome real. */
    responsavel_pseudonimo: textoOuNulo,
    importacao_id: texto,
    criado_em: momento,
    dispositivo: textoOuNulo,
  })
  .superRefine((m, ctx) => {
    if (m.tipo !== 'ajuste' && !(m.quantidade > 0)) {
      ctx.addIssue({ code: 'custom', path: ['quantidade'], message: 'Entrada e saída devem ter quantidade maior que zero' })
    }
    if (m.tipo === 'ajuste' && m.quantidade === 0) {
      ctx.addIssue({ code: 'custom', path: ['quantidade'], message: 'Ajuste não pode ter quantidade zero' })
    }
  })
export type Movimentacao = z.infer<typeof MovimentacaoSchema>

/** R4: alerta estruturado; nenhum campo obrigatório vazio. */
export const AlertaSchema = z.object({
  tipo: TipoAlertaSchema,
  nivel: NivelAlertaSchema,
  produtoId: texto,
  /** Números que sustentam o alerta. */
  evidencia: z
    .record(z.string(), z.union([z.number(), z.string(), z.null()]))
    .refine((e) => Object.keys(e).length > 0, 'A evidência não pode estar vazia'),
  /** Critério que disparou, em linguagem simples. */
  regra: texto,
  confianca: ConfiancaSchema,
  /** O que o responsável deve fazer. */
  recomendacao: texto,
  /** Gerada a partir dos campos acima. */
  mensagem: texto,
  valorEnvolvido: z.number().nullable(),
})
export type Alerta = z.infer<typeof AlertaSchema>

/** Motivos de uma validação que falhou, em linguagem simples ("campo: motivo"). */
export function descreverErros(erro: z.ZodError): string {
  return erro.issues.map((i) => (i.path.length ? `${i.path.join('.')}: ${i.message}` : i.message)).join('; ')
}
