import { describe, expect, test } from 'vitest'
import {
  AlertaSchema,
  ImportacaoSchema,
  MovimentacaoSchema,
  ProdutoAliasSchema,
  ProdutoSchema,
  UnidadeSchema,
  descreverErros,
} from '../src/index.ts'
import type { Alerta, Movimentacao } from '../src/index.ts'

const movimentacao: Movimentacao = {
  id: '3f2b8c1e-9d4a-4e6b-8f1a-2c3d4e5f6a7b',
  produto_id: 'p1',
  nome_original: 'Glifosato 480',
  tipo: 'saida',
  quantidade: 250,
  unidade_id: 'mL',
  data: '2026-10-12',
  preco_unit: null,
  lote: 'GLI-2607',
  validade: null,
  fornecedor: null,
  destino: 'Pulverizador',
  responsavel_pseudonimo: 'Funcionário A',
  importacao_id: 'imp-1',
  criado_em: '2026-10-12T10:00:00.000Z',
  dispositivo: 'celular-galpao',
}

const alerta: Alerta = {
  tipo: 'estoque_critico',
  nivel: 'critico',
  produtoId: 'p1',
  evidencia: { saldo: 250, coberturaDias: 5 },
  regra: 'Saldo abaixo do mínimo',
  confianca: 'alta',
  recomendacao: 'Comprar',
  mensagem: 'Estoque crítico: ...',
  valorEnvolvido: null,
}

const motivo = (r: { success: boolean; error?: Parameters<typeof descreverErros>[0] }) =>
  r.success ? '' : descreverErros(r.error!)

describe('Movimentação', () => {
  test('aceita uma movimentação válida com preço e validade ausentes (null, R2)', () => {
    expect(MovimentacaoSchema.parse(movimentacao)).toEqual(movimentacao)
  })

  test.each([
    ['id que não é UUID', { id: 'abc' }, 'id'],
    ['data impossível', { data: '2026-02-31' }, 'data'],
    ['data em outro formato', { data: '12/10/2026' }, 'data'],
    ['validade impossível', { validade: '2026-13-01' }, 'validade'],
    ['preço negativo', { preco_unit: -5 }, 'preco_unit'],
    ['saída com quantidade zero', { quantidade: 0 }, 'quantidade'],
    ['entrada com quantidade negativa', { tipo: 'entrada', quantidade: -3 }, 'quantidade'],
    ['ajuste zerado', { tipo: 'ajuste', quantidade: 0 }, 'quantidade'],
    ['tipo desconhecido', { tipo: 'compra' }, 'tipo'],
    ['texto vazio no lugar de null', { lote: '  ' }, 'lote'],
    ['sem importação (R7)', { importacao_id: '' }, 'importacao_id'],
    ['preço como texto', { preco_unit: '12,50' }, 'preco_unit'],
  ])('recusa %s', (_, alteracao, campo) => {
    const r = MovimentacaoSchema.safeParse({ ...movimentacao, ...alteracao })
    expect(r.success).toBe(false)
    expect(motivo(r)).toContain(`${campo}:`)
  })

  test('aceita ajuste negativo (correção de inventário)', () => {
    expect(MovimentacaoSchema.safeParse({ ...movimentacao, tipo: 'ajuste', quantidade: -20 }).success).toBe(true)
  })

  test('não tem campo de confiança (R3): campos extras são descartados', () => {
    const r = MovimentacaoSchema.parse({ ...movimentacao, confianca: 'alta' })
    expect(r).not.toHaveProperty('confianca')
  })
})

describe('Demais tabelas', () => {
  test('produto: categoria do Anexo III e estoque mínimo nulo ou não negativo', () => {
    const p = { id: 'p1', nome_canonico: 'Ureia', categoria: 'Fertilizantes', unidade_base_id: 'kg', estoque_minimo: null }
    expect(ProdutoSchema.safeParse(p).success).toBe(true)
    expect(ProdutoSchema.safeParse({ ...p, categoria: 'Ração' }).success).toBe(false)
    expect(ProdutoSchema.safeParse({ ...p, estoque_minimo: -1 }).success).toBe(false)
  })

  test('unidade: dimensão conhecida e fator positivo', () => {
    expect(UnidadeSchema.safeParse({ id: 'mL', sigla: 'mL', dimensao: 'volume', fator_para_base: 0.001 }).success).toBe(true)
    expect(UnidadeSchema.safeParse({ id: 'm', sigla: 'm', dimensao: 'comprimento', fator_para_base: 1 }).success).toBe(false)
    expect(UnidadeSchema.safeParse({ id: 'x', sigla: 'x', dimensao: 'massa', fator_para_base: 0 }).success).toBe(false)
  })

  test('importação: origem "simulado" ou "oficial" (R7)', () => {
    const i = { id: 'imp-1', origem: 'simulado', criada_em: '2026-10-20T12:00:00.000Z', arquivo: null }
    expect(ImportacaoSchema.safeParse(i).success).toBe(true)
    expect(ImportacaoSchema.safeParse({ ...i, origem: 'teste' }).success).toBe(false)
  })

  test('apelido: confirmação explícita (R8)', () => {
    expect(ProdutoAliasSchema.safeParse({ nome_original: 'UREIA 45%', produto_id: 'p1', confirmado: false }).success).toBe(true)
    expect(ProdutoAliasSchema.safeParse({ nome_original: 'UREIA 45%', produto_id: 'p1' }).success).toBe(false)
  })
})

describe('Alerta (R4)', () => {
  test('aceita um alerta completo', () => {
    expect(AlertaSchema.parse(alerta)).toEqual(alerta)
  })

  test.each([
    ['regra vazia', { regra: '' }, 'regra'],
    ['recomendação vazia', { recomendacao: ' ' }, 'recomendacao'],
    ['mensagem vazia', { mensagem: '' }, 'mensagem'],
    ['evidência vazia', { evidencia: {} }, 'evidencia'],
    ['nível fora dos três', { nivel: 'urgente' }, 'nivel'],
    ['confiança fora dos quatro', { confianca: 'certa' }, 'confianca'],
  ])('recusa %s', (_, alteracao, campo) => {
    const r = AlertaSchema.safeParse({ ...alerta, ...alteracao })
    expect(r.success).toBe(false)
    expect(motivo(r)).toContain(`${campo}:`)
  })

  test('valor envolvido ausente é null, não zero', () => {
    const { valorEnvolvido: _, ...semValor } = alerta
    expect(AlertaSchema.safeParse(semValor).success).toBe(false)
  })
})
