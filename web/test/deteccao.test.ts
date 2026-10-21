// Testes de detecção e falsos positivos, guiados por data/simulados/SITUACOES.md.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { analisar } from '../src/analise/analisar.ts'
import { HOJE_SIMULADO, PASTA_SIMULADOS, carregarBaseSimulada } from './apoio.ts'

/** Linhas de dados da tabela markdown que vem logo depois do título `titulo`. */
function tabela(markdown: string, titulo: string): string[][] {
  const resto = markdown.split(titulo)[1]
  if (!resto) throw new Error(`Seção "${titulo}" não encontrada em SITUACOES.md`)
  const linhas = resto.split('\n').filter((l) => l.startsWith('|'))
  const fim = resto.split('\n').findIndex((l, i, arr) => i > 0 && arr[i - 1].startsWith('|') && !l.startsWith('|'))
  const bloco = fim === -1 ? linhas : resto.split('\n').slice(0, fim).filter((l) => l.startsWith('|'))
  return bloco.slice(2).map((l) => l.split('|').slice(1, -1).map((c) => c.trim()))
}

const md = readFileSync(join(PASTA_SIMULADOS, 'SITUACOES.md'), 'utf8')
const situacoes = tabela(md, '## Situações plantadas').map(([n, situacao, produto, tipo, nivel]) => ({ n, situacao, produto, tipo, nivel }))
const normais = tabela(md, '## Produtos normais').map(([produto]) => produto)
const SECUNDARIOS = [{ produto: 'Inseticida lambda-cialotrina', tipo: 'consumo_crescente', nivel: 'atencao' }]

const base = carregarBaseSimulada()
const resultado = analisar(base.movimentacoes, base.produtosNovos, HOJE_SIMULADO)
const nomeDe = new Map(base.produtosNovos.map((p) => [p.id, p.nome_canonico]))
const alertas = resultado.alertas.map((a) => ({ ...a, produto: nomeDe.get(a.produtoId)! }))

describe('Base simulada', () => {
  test('importa sem erros e cobre as 8 categorias do Anexo III', () => {
    expect(base.erros).toEqual([])
    expect(new Set(base.produtosNovos.map((p) => p.categoria)).size).toBe(8)
    expect(situacoes.length).toBeGreaterThanOrEqual(10)
    expect(normais.length).toBeGreaterThanOrEqual(5)
  })

  test('todos os tipos de alerta da seção 6 têm uma situação plantada', () => {
    expect(new Set(situacoes.map((s) => s.tipo))).toEqual(
      new Set([
        'estoque_critico', 'ruptura_prevista', 'vencimento', 'consumo_crescente', 'retirada_atipica',
        'excesso', 'item_parado', 'variacao_preco', 'possivel_duplicidade', 'devolucao_embalagem',
      ]),
    )
  })
})

describe('Detecção: cada situação plantada dispara o alerta esperado', () => {
  test.each(situacoes)('$n. $produto → $tipo ($nivel)', ({ produto, tipo, nivel }) => {
    expect(nomeDe.size, 'produto inexistente na base').toBeGreaterThan(0)
    expect([...nomeDe.values()]).toContain(produto)
    const encontrado = alertas.filter((a) => a.produto === produto && a.tipo === tipo)
    expect(encontrado.map((a) => a.nivel)).toEqual([nivel])
  })
})

describe('Falsos positivos', () => {
  test.each(normais)('%s não gera nenhum alerta', (produto) => {
    expect([...nomeDe.values()]).toContain(produto)
    expect(alertas.filter((a) => a.produto === produto).map((a) => `${a.tipo}: ${a.mensagem}`)).toEqual([])
  })

  test('nenhum alerta além dos plantados e dos secundários documentados', () => {
    const esperados = [...situacoes, ...SECUNDARIOS].map((s) => `${s.produto} | ${s.tipo} | ${s.nivel}`).sort()
    expect(alertas.map((a) => `${a.produto} | ${a.tipo} | ${a.nivel}`).sort()).toEqual(esperados)
  })
})
