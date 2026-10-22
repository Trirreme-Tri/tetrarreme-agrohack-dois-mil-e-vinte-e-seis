// Limites em três níveis: padrão geral → por categoria → por produto.
import { CATEGORIAS } from '@tetrarreme/contrato'
import { describe, expect, test } from 'vitest'
import { analisar } from '../src/analise/analisar.ts'
import { CONFIG_PADRAO, limitesPara } from '../src/analise/config.ts'
import type { ConfigAnalise } from '../src/analise/config.ts'
import { HOJE_SIMULADO, carregarBaseSimulada } from './apoio.ts'

const fertilizante = { nome_canonico: 'MAP (fosfato monoamônico)', categoria: 'Fertilizantes' as const }
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
    for (const c of CATEGORIAS) expect(limitesPara({ nome_canonico: 'x', categoria: c }).valores).toEqual(CONFIG_PADRAO.padrao)
  })

  test('a categoria sobrepõe o padrão só no que define, mantendo os demais campos do grupo', () => {
    const config = comAjustes({ porCategoria: { Fertilizantes: { rupturaPrevista: { coberturaMaximaDias: 45 } } }, porProduto: {} })
    const limites = limitesPara(fertilizante, config).valores
    expect(limites.rupturaPrevista).toEqual({ coberturaMinimaDias: 7, coberturaMaximaDias: 45 })
    expect(limites.excesso).toEqual(CONFIG_PADRAO.padrao.excesso)
    expect(limitesPara(combustivel, config).valores).toEqual(CONFIG_PADRAO.padrao)
  })

  test('o produto sobrepõe a categoria, que sobrepõe o padrão (o mais específico vence)', () => {
    const config = comAjustes({
      porCategoria: { Fertilizantes: { excesso: { coberturaMinimaDias: 240 }, janelaConsumoDias: 90 } },
      porProduto: { 'map (FOSFATO monoamonico)': { excesso: { coberturaMinimaDias: 365 } } },
    })
    const limites = limitesPara(fertilizante, config).valores
    expect(limites.excesso.coberturaMinimaDias).toBe(365) // produto
    expect(limites.janelaConsumoDias).toBe(90) // categoria
    expect(limites.vencimento).toEqual(CONFIG_PADRAO.padrao.vencimento) // padrão
    expect(limitesPara(outroFertilizante, config).valores.excesso.coberturaMinimaDias).toBe(240)
  })

  test('resolver não altera a configuração', () => {
    const config = comAjustes({ porCategoria: { Fertilizantes: { excesso: { coberturaMinimaDias: 240 } } }, porProduto: {} })
    const copia = structuredClone(config)
    limitesPara(fertilizante, config).valores
    expect(config).toEqual(copia)
  })
})

describe('O motor usa o nível mais específico', () => {
  const base = carregarBaseSimulada()
  const nomeDe = new Map(base.produtosNovos.map((p) => [p.id, p.nome_canonico]))
  const alertasCom = (config: ConfigAnalise) =>
    analisar(base.movimentacoes, base.produtosNovos, HOJE_SIMULADO, { config }).alertas.map((a) => `${nomeDe.get(a.produtoId)} | ${a.tipo}`)

  test('ajuste de categoria muda o alerta de todos os produtos dela', () => {
    expect(alertasCom(CONFIG_PADRAO)).toContain('Óleo hidráulico | excesso')
    const config = comAjustes({ porCategoria: { 'Combustíveis e lubrificantes': { excesso: { coberturaMinimaDias: 600 } } }, porProduto: {} })
    expect(alertasCom(config)).not.toContain('Óleo hidráulico | excesso')
  })

  test('ajuste de produto vale só para ele e aparece na regra do alerta', () => {
    const config = comAjustes({ porCategoria: {}, porProduto: { 'Herbicida glifosato 480': { rupturaPrevista: { coberturaMaximaDias: 15 } } } })
    expect(alertasCom(config)).not.toContain('Herbicida glifosato 480 | ruptura_prevista')
    const comMaisFolga = comAjustes({ porCategoria: {}, porProduto: { 'Herbicida glifosato 480': { estoqueCritico: { coberturaMaximaDias: 21 } } } })
    const r = analisar(base.movimentacoes, base.produtosNovos, HOJE_SIMULADO, { config: comMaisFolga })
    const glifosato = r.alertas.find((a) => nomeDe.get(a.produtoId) === 'Herbicida glifosato 480')!
    expect(glifosato.tipo).toBe('estoque_critico')
    expect(glifosato.regra).toContain('menos de 21 dias')
    // Os demais produtos continuam com o padrão.
    expect(alertasCom(comMaisFolga).filter((a) => a.endsWith('estoque_critico')).sort()).toEqual([
      'Cloreto de potássio (KCl) | estoque_critico', 'Filtro de óleo do trator | estoque_critico', 'Herbicida glifosato 480 | estoque_critico',
    ])
  })

  test('item parado: categoria pode alongar o prazo sem retirada (ex.: insumos de safra)', () => {
    expect(alertasCom(CONFIG_PADRAO)).toContain('Calcário dolomítico | item_parado')
    const config = comAjustes({ porCategoria: { Corretivos: { itemParado: { diasSemSaida: 365 } } }, porProduto: {} })
    expect(alertasCom(config)).not.toContain('Calcário dolomítico | item_parado')
  })
})

describe('Origem do limite (R4)', () => {
  const config = comAjustes({
    porCategoria: { Fertilizantes: { excesso: { coberturaMinimaDias: 365 } } },
    porProduto: { 'Ureia': { excesso: { coberturaMinimaDias: 200 } } },
  })

  test('produto sem configuração própria usa a categoria', () => {
    const l = limitesPara(fertilizante, config)
    expect(l.valores.excesso.coberturaMinimaDias).toBe(365)
    expect(l.origem['excesso.coberturaMinimaDias']).toBe('categoria Fertilizantes')
    expect(l.origem['rupturaPrevista.coberturaMaximaDias']).toBe('padrão geral')
  })

  test('produto com configuração própria sobrescreve a categoria', () => {
    const l = limitesPara(outroFertilizante, config)
    expect(l.valores.excesso.coberturaMinimaDias).toBe(200)
    expect(l.origem['excesso.coberturaMinimaDias']).toBe('produto Ureia')
  })

  test('categoria sem configuração usa o padrão geral', () => {
    const l = limitesPara(combustivel, config)
    expect(l.valores).toEqual(CONFIG_PADRAO.padrao)
    expect(new Set(Object.values(l.origem))).toEqual(new Set(['padrão geral']))
  })

  test('o alerta diz, na evidência e na regra, de qual nível veio o limite', () => {
    const base = carregarBaseSimulada()
    const nomeDe = new Map(base.produtosNovos.map((p) => [p.id, p.nome_canonico]))
    const comCategoria = comAjustes({
      porCategoria: { 'Combustíveis e lubrificantes': { excesso: { coberturaMinimaDias: 200 } } },
      porProduto: { 'Herbicida glifosato 480': { rupturaPrevista: { coberturaMaximaDias: 25 } } },
    })
    const r = analisar(base.movimentacoes, base.produtosNovos, HOJE_SIMULADO, { config: comCategoria })
    const de = (produto: string, tipo: string) => r.alertas.find((a) => nomeDe.get(a.produtoId) === produto && a.tipo === tipo)!

    const excesso = de('Óleo hidráulico', 'excesso')
    expect(excesso.evidencia.origemLimite).toBe('limite da categoria Combustíveis e lubrificantes')
    expect(excesso.regra).toMatch(/mais de 200 dias.*\(limite da categoria Combustíveis e lubrificantes\)\.$/)

    const ruptura = de('Herbicida glifosato 480', 'ruptura_prevista')
    expect(ruptura.evidencia.origemLimite).toBe('limites do padrão geral e do produto Herbicida glifosato 480')

    const critico = de('Cloreto de potássio (KCl)', 'estoque_critico')
    expect(critico.evidencia.origemLimite).toBe('limite do padrão geral')
    expect(critico.regra).toContain('(limite do padrão geral)')
  })

  test('todo alerta da base informa a origem do limite', () => {
    const base = carregarBaseSimulada()
    for (const a of analisar(base.movimentacoes, base.produtosNovos, HOJE_SIMULADO).alertas) {
      expect(a.evidencia.origemLimite, a.tipo).toEqual(expect.stringMatching(/^(limites? d|critério global)/))
      expect(a.regra, a.tipo).toMatch(/\((limites? d.*|critério global)\)\.$/)
    }
  })
})

describe('Chaves órfãs em porProduto', () => {
  const base = carregarBaseSimulada()

  test('sem ajustes por produto, não há aviso', () => {
    expect(analisar(base.movimentacoes, base.produtosNovos, HOJE_SIMULADO).avisosConfiguracao).toEqual([])
  })

  test('chave que não corresponde a nenhum produto gera aviso de configuração, não alerta de estoque', () => {
    const config = comAjustes({
      porCategoria: {},
      porProduto: {
        'herbicida GLIFOSATO 480': { rupturaPrevista: { coberturaMaximaDias: 15 } }, // corresponde (normalizado)
        'Glifosato 480 Atar': { excesso: { coberturaMinimaDias: 90 } }, // não existe
      },
    })
    const padrao = analisar(base.movimentacoes, base.produtosNovos, HOJE_SIMULADO)
    const r = analisar(base.movimentacoes, base.produtosNovos, HOJE_SIMULADO, { config })
    expect(r.avisosConfiguracao).toEqual([
      { tipo: 'produto_nao_encontrado', chave: 'Glifosato 480 Atar', mensagem: expect.stringContaining('"Glifosato 480 Atar" não corresponde a nenhum produto') },
    ])
    // O aviso não entra na lista de alertas de estoque.
    expect(r.alertas.length).toBe(padrao.alertas.length - 1) // só some a ruptura do glifosato (ajuste válido)
    expect(r.alertas.some((a) => a.mensagem.includes('Atar'))).toBe(false)
  })
})
