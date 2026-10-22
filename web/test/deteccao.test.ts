// Testes de detecção e falsos positivos sobre a base simulada (data/simulados/gerar.ts),
// analisada na mesma data de referência usada pelo gerador.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CATEGORIAS } from '@tetrarreme/contrato'
import { describe, expect, test } from 'vitest'
import { DATA_REFERENCIA, INICIO, gerarBase } from '../../data/simulados/gerar.ts'
import { analisar } from '../src/analise/analisar.ts'
import { HOJE_SIMULADO, PASTA_SIMULADOS, carregarBaseSimulada } from './apoio.ts'

const gerada = gerarBase()
const { situacoes, normais, secundarios } = gerada

const base = carregarBaseSimulada()
const resultado = analisar(base.movimentacoes, base.produtosNovos, HOJE_SIMULADO, { importacoes: [base.importacao] })
const nomeDe = new Map(base.produtosNovos.map((p) => [p.id, p.nome_canonico]))
const alertas = resultado.alertas.map((a) => ({ ...a, produto: nomeDe.get(a.produtoId)! }))

describe('Base simulada', () => {
  test('o gerador é determinístico e os arquivos versionados estão atualizados', () => {
    expect(gerarBase()).toEqual(gerada)
    expect(readFileSync(join(PASTA_SIMULADOS, 'movimentacoes.csv'), 'utf8')).toBe(gerada.csv)
    expect(readFileSync(join(PASTA_SIMULADOS, 'SITUACOES.md'), 'utf8')).toBe(gerada.situacoesMd)
  })

  test('importa sem erros: pelo menos 40 produtos, nas 8 categorias do Anexo III', () => {
    expect(base.erros).toEqual([])
    expect(base.produtosNovos.length).toBeGreaterThanOrEqual(40)
    expect(new Set(base.produtosNovos.map((p) => p.categoria))).toEqual(new Set(CATEGORIAS))
  })

  test('12 meses de movimentações terminando na data de referência', () => {
    const datas = base.movimentacoes.map((m) => m.data).sort()
    expect(datas[0]).toBe(INICIO)
    expect(datas.at(-1)! <= DATA_REFERENCIA).toBe(true)
    expect(datas.at(-1)! >= '2026-10-19').toBe(true)
    expect(resultado.data).toBe(DATA_REFERENCIA)
  })

  test('a base é identificada como simulada (R7)', () => {
    expect(resultado.origens).toEqual(['simulado'])
  })

  test('todos os tipos de alerta da seção 6 têm uma situação plantada', () => {
    expect(new Set(situacoes.map((s) => s.tipo))).toEqual(
      new Set([
        'estoque_critico', 'ruptura_prevista', 'vencimento', 'consumo_crescente', 'retirada_atipica',
        'excesso', 'item_parado', 'variacao_preco', 'possivel_duplicidade', 'devolucao_embalagem',
      ]),
    )
  })

  test('todo produto da base é plantado ou normal', () => {
    const classificados = new Set([...situacoes.map((s) => s.produto), ...normais.map((n) => n.produto)])
    expect(new Set(nomeDe.values())).toEqual(classificados)
  })
})

describe('Detecção: cada situação plantada dispara o alerta esperado', () => {
  test.each(situacoes)('$numero. $produto → $tipo ($nivel)', ({ produto, tipo, nivel }) => {
    expect([...nomeDe.values()]).toContain(produto)
    const encontrado = alertas.filter((a) => a.produto === produto && a.tipo === tipo)
    expect(encontrado.map((a) => a.nivel)).toEqual([nivel])
  })
})

describe('Falsos positivos', () => {
  test.each(normais.map((n) => n.produto))('%s não gera nenhum alerta', (produto) => {
    expect([...nomeDe.values()]).toContain(produto)
    expect(alertas.filter((a) => a.produto === produto).map((a) => `${a.tipo}: ${a.mensagem}`)).toEqual([])
  })

  test('nenhum alerta além dos plantados e dos secundários documentados', () => {
    const esperados = [...situacoes, ...secundarios].map((s) => `${s.produto} | ${s.tipo} | ${s.nivel}`).sort()
    expect(alertas.map((a) => `${a.produto} | ${a.tipo} | ${a.nivel}`).sort()).toEqual(esperados)
  })
})
