// Gravações do app no banco local. Tudo validado pelo contrato antes de entrar (CLAUDE.md, seção 7).
import { MovimentacaoSchema, descreverErros } from '@tetrarreme/contrato'
import type { Importacao, Movimentacao } from '@tetrarreme/contrato'
import { chavePar, confirmarAlias } from '../analise/produtos.ts'
import { converter } from '../analise/unidades.ts'
import type { BancoMonitora, DecisaoDuplicidade } from './banco.ts'
import { isoLocal } from './hoje.ts'

/** Marca dos registros feitos neste aparelho (o que ainda não foi sincronizado). */
export const DISPOSITIVO_APARELHO = 'aparelho'
export const ID_IMPORTACAO_APARELHO = 'registros-do-aparelho'

/**
 * Importação dos registros feitos no aparelho (R7). Enquanto a propriedade é a simulada
 * (Sítio Bom Futuro), os registros feitos na demonstração também são identificados como simulados.
 */
async function importacaoDoAparelho(db: BancoMonitora, agora: Date): Promise<Importacao> {
  const existente = await db.importacoes.get(ID_IMPORTACAO_APARELHO)
  if (existente) return existente
  const nova: Importacao = { id: ID_IMPORTACAO_APARELHO, origem: 'simulado', criada_em: agora.toISOString(), arquivo: 'registros no aparelho' }
  await db.importacoes.add(nova)
  return nova
}

export interface NovoRegistro {
  tipo: 'entrada' | 'saida'
  produtoId: string
  quantidade: number
  unidadeId: string
  responsavel: string
  destino?: string | null
  lote?: string | null
  validade?: string | null
  /** Preço por unidade de `unidadeId`; `null` = sem preço (nunca zero, R2). */
  precoUnit?: number | null
}

/**
 * Grava uma entrada ou retirada com a data real. Nunca bloqueia por quantidade acima do saldo:
 * o estoque registrado pode estar errado, e o aviso de qualidade dos dados cuida disso.
 */
export async function registrar(db: BancoMonitora, r: NovoRegistro, agora: Date = new Date()): Promise<Movimentacao> {
  const produto = await db.produtos.get(r.produtoId)
  if (!produto) throw new Error('Produto não encontrado.')
  converter(r.quantidade, r.unidadeId, produto.unidade_base_id) // R1: lança erro se a unidade for de outra dimensão
  const importacao = await importacaoDoAparelho(db, agora)
  const validacao = MovimentacaoSchema.safeParse({
    id: crypto.randomUUID(),
    produto_id: produto.id,
    nome_original: produto.nome_canonico,
    tipo: r.tipo,
    quantidade: r.quantidade,
    unidade_id: r.unidadeId,
    data: isoLocal(agora),
    preco_unit: r.precoUnit ?? null,
    lote: r.lote?.trim() || null,
    validade: r.validade || null,
    fornecedor: null,
    destino: r.destino ?? null,
    responsavel_pseudonimo: r.responsavel,
    importacao_id: importacao.id,
    criado_em: agora.toISOString(),
    dispositivo: DISPOSITIVO_APARELHO,
  })
  if (!validacao.success) throw new Error(descreverErros(validacao.error))
  await db.movimentacoes.add(validacao.data)
  return validacao.data
}

/**
 * Resposta a uma possível duplicidade (R8). "mesmo": grava o apelido confirmado (o nome do produto
 * B passa a identificar A; recusado se os números diferirem). "diferente": o alerta daquele par não volta.
 */
export async function decidirDuplicidade(
  db: BancoMonitora,
  produtoAId: string,
  produtoBId: string,
  decisao: DecisaoDuplicidade['decisao'],
  agora: Date = new Date(),
): Promise<void> {
  const [a, b] = await Promise.all([db.produtos.get(produtoAId), db.produtos.get(produtoBId)])
  if (!a || !b) throw new Error('Produto não encontrado.')
  await db.transaction('rw', [db.apelidos, db.decisoes_duplicidade], async () => {
    if (decisao === 'mesmo') await db.apelidos.put(confirmarAlias(b.nome_canonico, a))
    await db.decisoes_duplicidade.put({
      chave: chavePar(a.id, b.id), produtoA: a.id, produtoB: b.id, decisao, decidido_em: agora.toISOString(),
    })
  })
}

/** Desfaz a resposta a uma duplicidade (apaga a decisão e, se houver, o apelido confirmado). */
export async function desfazerDuplicidade(db: BancoMonitora, produtoAId: string, produtoBId: string): Promise<void> {
  const b = await db.produtos.get(produtoBId)
  await db.transaction('rw', [db.apelidos, db.decisoes_duplicidade], async () => {
    await db.decisoes_duplicidade.delete(chavePar(produtoAId, produtoBId))
    if (b) await db.apelidos.delete([b.nome_canonico, produtoAId])
  })
}

export async function lerPreferencia(db: BancoMonitora, chave: string): Promise<string | null> {
  return (await db.preferencias.get(chave))?.valor ?? null
}

export async function gravarPreferencia(db: BancoMonitora, chave: string, valor: string | null): Promise<void> {
  if (valor === null) await db.preferencias.delete(chave)
  else await db.preferencias.put({ chave, valor })
}
