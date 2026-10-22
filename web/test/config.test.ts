// Limites em três níveis: padrão geral → por categoria → por produto.
import { CATEGORIAS } from '@tetrarreme/contrato'
import { describe, expect, test } from 'vitest'
import { analisar } from '../src/analise/analisar.ts'
import { CONFIG_PADRAO, resolverLimites } from '../src/analise/config.ts'
import type { ConfigAnalise } from '../src/analise/config.ts'
import { HOJE_SIMULADO, carregarBaseSimulada } from './apoio.ts'

const fertilizante = { nome_canonico: 'Superfosfato simples', categoria: 'Fertilizantes' as const }
const outroFertilizante = { nome_canonico: 'Ureia', categoria: 'Fertilizantes' as const }
const combustivel = { nome_canonico: 'Óleo diesel S10', categoria: 'Combustíveis e lubrificantes' as const }

function comAjustes(ajustes: Pick<ConfigAnalise, 'porCategoria' | 'porProduto'>): ConfigAnalise {
  return { ...CONFIG_PADRAO, ...ajustes }
}

describe('Configuração em três níveis', () => {
  test('começa só com o padrão geral: as 8 categorias estão prontas e vazias, sem ajuste por produto', () => {
    expect(Object.keys(CONFIG_PADRAO.porCategoria).sort()).toEqual([...CATEGORIAS].sort())
    for (const ajuste of Object.values(CONFIG_PADRAO.porCategoria)) expect(ajuste).toEqual({})
    expect(CONFIG_PADRAO.porProduto).toEqual({})
    for (const c of CATEGORIAS) expect(resolverLimites({ nome_canonico: 'x', categoria: c })).toEqual(CONFIG_PADRAO.padrao)
  })

  test('a categoria sobrepõe o padrão só no que define, mantendo os demais campos do grupo', () => {
    const config = comAjustes({ porCategoria: { Fertilizantes: { rupturaPrevista: { coberturaMaximaDias: 45 } } }, porProduto: {} })
    const limites = resolverLimites(fertilizante, config)
    expect(limites.rupturaPrevista).toEqual({ coberturaMinimaDias: 7, coberturaMaximaDias: 45 })
    expect(limites.excesso).toEqual(CONFIG_PADRAO.padrao.excesso)
    expect(resolverLimites(combustivel, config)).toEqual(CONFIG_PADRAO.padrao)
  })

  test('o produto sobrepõe a categoria, que sobrepõe o padrão (o mais específico vence)', () => {
    const config = comAjustes({
      porCategoria: { Fertilizantes: { excesso: { coberturaMinimaDias: 240 }, janelaConsumoDias: 90 } },
      porProduto: { 'superfosfato SIMPLES': { excesso: { coberturaMinimaDias: 365 } } },
    })
    const limites = resolverLimites(fertilizante, config)
    expect(limites.excesso.coberturaMinimaDias).toBe(365) // produto
    expect(limites.janelaConsumoDias).toBe(90) // categoria
    expect(limites.vencimento).toEqual(CONFIG_PADRAO.padrao.vencimento) // padrão
    expect(resolverLimites(outroFertilizante, config).excesso.coberturaMinimaDias).toBe(240)
  })

  test('resolver não altera a configuração', () => {
    const config = comAjustes({ porCategoria: { Fertilizantes: { excesso: { coberturaMinimaDias: 240 } } }, porProduto: {} })
    const copia = structuredClone(config)
    resolverLimites(fertilizante, config)
    expect(config).toEqual(copia)
  })
})

describe('O motor usa o nível mais específico', () => {
  const base = carregarBaseSimulada()
  const nomeDe = new Map(base.produtosNovos.map((p) => [p.id, p.nome_canonico]))
  const alertasCom = (config: ConfigAnalise) =>
    analisar(base.movimentacoes, base.produtosNovos, HOJE_SIMULADO, { config }).alertas.map((a) => `${nomeDe.get(a.produtoId)} | ${a.tipo}`)

  test('ajuste de categoria muda o alerta de todos os produtos dela', () => {
    expect(alertasCom(CONFIG_PADRAO)).toContain('Superfosfato simples | excesso')
    const config = comAjustes({ porCategoria: { Fertilizantes: { excesso: { coberturaMinimaDias: 400 } } }, porProduto: {} })
    expect(alertasCom(config)).not.toContain('Superfosfato simples | excesso')
  })

  test('ajuste de produto vale só para ele e aparece na regra do alerta', () => {
    const config = comAjustes({ porCategoria: {}, porProduto: { 'Glifosato 480': { rupturaPrevista: { coberturaMaximaDias: 15 } } } })
    expect(alertasCom(config)).not.toContain('Glifosato 480 | ruptura_prevista')
    const comMaisFolga = comAjustes({ porCategoria: {}, porProduto: { 'Glifosato 480': { estoqueCritico: { coberturaMaximaDias: 21 } } } })
    const r = analisar(base.movimentacoes, base.produtosNovos, HOJE_SIMULADO, { config: comMaisFolga })
    const glifosato = r.alertas.find((a) => nomeDe.get(a.produtoId) === 'Glifosato 480')!
    expect(glifosato.tipo).toBe('estoque_critico')
    expect(glifosato.regra).toContain('menos de 21 dias')
    // Os demais produtos continuam com o padrão.
    expect(alertasCom(comMaisFolga).filter((a) => a.endsWith('estoque_critico')).sort()).toEqual([
      'Cloreto de potássio | estoque_critico', 'Filtro de óleo do motor | estoque_critico', 'Glifosato 480 | estoque_critico',
    ])
  })

  test('item parado: categoria pode alongar o prazo sem retirada (ex.: insumos de safra)', () => {
    expect(alertasCom(CONFIG_PADRAO)).toContain('Calcário dolomítico | item_parado')
    const config = comAjustes({ porCategoria: { Corretivos: { itemParado: { diasSemSaida: 240 } } }, porProduto: {} })
    expect(alertasCom(config)).not.toContain('Calcário dolomítico | item_parado')
  })
})
