// Testes unitários dos módulos do motor e dos limites de cada detector (casos sintéticos).
import { describe, expect, test } from 'vitest'
import { analisar } from '../src/analise/analisar.ts'
import { limitesPara } from '../src/analise/config.ts'
import { analisarProduto } from '../src/analise/consumo.ts'
import { diaDe } from '../src/analise/datas.ts'
import { fmtCobertura } from '../src/analise/formatacao.ts'
import { importarCsv, lerCsv } from '../src/analise/importacao.ts'
import type { Movimentacao, Produto, TipoAlerta } from '@tetrarreme/contrato'
import { geradorDeIds, mov, produto, retiradasPeriodicas } from './apoio.ts'

const HOJE = new Date('2026-10-20T00:00:00Z')
const HOJE_DIA = diaDe('2026-10-20')
const tipos = (movs: Movimentacao[], produtos: Produto[]): TipoAlerta[] => analisar(movs, produtos, HOJE).alertas.map((a) => a.tipo)

describe('Importação', () => {
  test('lê CSV com aspas, delimitador dentro de aspas e quebra de linha CRLF', () => {
    expect(lerCsv('a;b\r\n"x;y";"diz ""oi"""\r\n\r\n', ';')).toEqual([['a', 'b'], ['x;y', 'diz "oi"']])
  })

  test('mapeamento de colunas configurável aceita outros nomes de coluna e formatos', () => {
    const csv = 'Insumo,Grupo,Un,Qtd,Movimento,Dt,Valor\n"Glifosato 480",Defensivos e biológicos,litros,20,Compra,2026-09-01,28.5\n'
    const r = importarCsv(csv, {
      mapeamento: { produto: 'Insumo', categoria: 'Grupo', unidade: 'Un', quantidade: 'Qtd', tipo: 'Movimento', data: 'Dt', preco_unit: 'Valor' },
      origem: 'oficial',
      agora: HOJE,
      separadorDecimal: '.',
      gerarId: geradorDeIds(),
    })
    expect(r.erros).toEqual([])
    expect(r.movimentacoes[0]).toMatchObject({ tipo: 'entrada', unidade_id: 'L', quantidade: 20, data: '2026-09-01', preco_unit: 28.5 })
    expect(r.produtosNovos[0]).toMatchObject({ nome_canonico: 'Glifosato 480', unidade_base_id: 'L' })
  })

  test('aponta colunas obrigatórias ausentes no mapeamento', () => {
    const r = importarCsv('produto\nUreia\n', { mapeamento: { produto: 'produto' }, origem: 'simulado', agora: HOJE })
    expect(r.erros[0].mensagem).toMatch(/unidade, quantidade, tipo, data/)
  })

  test('linha com categoria fora do Anexo III ou unidade desconhecida vira erro, sem interromper as demais', () => {
    const csv = 'produto;categoria;unidade;quantidade;tipo;data\nRação;Pecuária;kg;10;entrada;01/09/2026\nUreia;Fertilizantes;balde;1;entrada;01/09/2026\nUreia;Fertilizantes;kg;1;entrada;01/09/2026\n'
    const map = { produto: 'produto', categoria: 'categoria', unidade: 'unidade', quantidade: 'quantidade', tipo: 'tipo', data: 'data' }
    const r = importarCsv(csv, { mapeamento: map, origem: 'simulado', agora: HOJE, delimitador: ';', gerarId: geradorDeIds() })
    expect(r.erros.map((e) => e.linha)).toEqual([2, 3])
    expect(r.movimentacoes).toHaveLength(1)
  })
})

describe('Saldo por lote e consumo', () => {
  const p = produto({ id: 'def', unidade_base_id: 'L', categoria: 'Defensivos e biológicos' })

  test('retirada sem lote consome primeiro o lote que vence antes', () => {
    const movs = [
      mov({ produto_id: 'def', tipo: 'entrada', quantidade: 10, unidade_id: 'L', data: '2026-01-01', lote: 'B', validade: '2028-01-01' }),
      mov({ produto_id: 'def', tipo: 'entrada', quantidade: 10, unidade_id: 'L', data: '2026-02-01', lote: 'A', validade: '2027-01-01' }),
      mov({ produto_id: 'def', tipo: 'saida', quantidade: 12, unidade_id: 'L', data: '2026-03-01' }),
    ]
    const lotes = analisarProduto(p, movs, HOJE_DIA, limitesPara(p)).lotes
    expect(lotes.find((l) => l.lote === 'A')).toMatchObject({ saldo: 0, zeradoEm: '2026-03-01' })
    expect(lotes.find((l) => l.lote === 'B')!.saldo).toBe(8)
  })

  test('ajuste corrige o saldo sem contar como consumo', () => {
    const movs = [
      mov({ produto_id: 'def', tipo: 'entrada', quantidade: 10, unidade_id: 'L', data: '2026-10-01' }),
      mov({ produto_id: 'def', tipo: 'ajuste', quantidade: -3, unidade_id: 'L', data: '2026-10-10' }),
    ]
    const a = analisarProduto(p, movs, HOJE_DIA, limitesPara(p))
    expect(a.saldo).toBe(7)
    expect(a.consumoDiario).toBe(0)
    expect(a.totalSaidas).toBe(0)
  })

  test('consumo médio usa a janela de 60 dias, ou o histórico se for mais curto', () => {
    const k = produto({ id: 'k' })
    const longo = [mov({ produto_id: 'k', tipo: 'entrada', quantidade: 9000, data: '2026-01-01' }), ...retiradasPeriodicas('k', '2026-10-19', 30, 5, 10)]
    expect(analisarProduto(k, longo, HOJE_DIA, limitesPara(k)).consumoDiario).toBeCloseTo(120 / 60)
    const curto = [mov({ produto_id: 'k', tipo: 'entrada', quantidade: 100, data: '2026-10-10' }), mov({ produto_id: 'k', tipo: 'saida', quantidade: 20, data: '2026-10-15' })]
    expect(analisarProduto(k, curto, HOJE_DIA, limitesPara(k))).toMatchObject({ diasJanela: 10, consumoDiario: 2 })
  })
})

describe('Limites dos detectores', () => {
  const k = produto({ id: 'k' })
  /** Saldo para `dias` dias: 12 retiradas de 10 kg nos últimos 60 dias = 2 kg/dia. */
  const comCob = (dias: number) => [
    mov({ produto_id: 'k', tipo: 'entrada', quantidade: 120 + dias * 2, data: '2026-08-01', preco_unit: 2 }),
    ...retiradasPeriodicas('k', '2026-10-19', 12, 5, 10),
  ]

  test('cobertura < 7 dias: estoque crítico; 7 a 30: ruptura prevista; 31 a 180: nada; > 180: excesso', () => {
    expect(tipos(comCob(5), [k])).toEqual(['estoque_critico'])
    expect(tipos(comCob(20), [k])).toEqual(['ruptura_prevista'])
    expect(tipos(comCob(90), [k])).toEqual([])
    expect(tipos(comCob(250), [k])).toEqual(['excesso'])
  })

  test('saldo no estoque mínimo dispara estoque crítico mesmo com cobertura longa', () => {
    expect(tipos(comCob(90), [{ ...k, estoque_minimo: 500 }])).toEqual(['estoque_critico'])
  })

  test('sem histórico suficiente, não há alerta de cobertura', () => {
    const movs = [mov({ produto_id: 'k', tipo: 'entrada', quantidade: 5, data: '2026-10-01' }), mov({ produto_id: 'k', tipo: 'saida', quantidade: 4, data: '2026-10-18' })]
    expect(tipos(movs, [k])).toEqual([])
  })

  test('retirada atípica exige 5 retiradas anteriores', () => {
    const entrada = mov({ produto_id: 'k', tipo: 'entrada', quantidade: 5000, data: '2026-06-01' })
    const pico = mov({ produto_id: 'k', tipo: 'saida', quantidade: 100, data: '2026-10-19' })
    const comQuatro = [entrada, ...retiradasPeriodicas('k', '2026-08-20', 4, 7, 10), pico]
    const comCinco = [entrada, ...retiradasPeriodicas('k', '2026-08-20', 5, 7, 10), pico]
    expect(tipos(comQuatro, [k])).not.toContain('retirada_atipica')
    expect(tipos(comCinco, [k])).toContain('retirada_atipica')
  })

  test('consumo crescente compara os últimos 30 dias com os 30 anteriores', () => {
    const entrada = mov({ produto_id: 'k', tipo: 'entrada', quantidade: 5000, data: '2026-06-01' })
    const anterior = retiradasPeriodicas('k', '2026-09-19', 6, 5, 10)
    expect(tipos([entrada, ...anterior, ...retiradasPeriodicas('k', '2026-10-19', 6, 5, 10)], [k])).not.toContain('consumo_crescente')
    expect(tipos([entrada, ...anterior, ...retiradasPeriodicas('k', '2026-10-19', 6, 5, 16)], [k])).toContain('consumo_crescente')
  })

  test('vencimento por lote considera o consumo previsto até a validade', () => {
    const lote = (quantidade: number) => [
      mov({ produto_id: 'k', tipo: 'entrada', quantidade, data: '2026-06-01', lote: 'L1', validade: '2026-12-19' }),
      ...retiradasPeriodicas('k', '2026-10-19', 12, 5, 10),
    ]
    // 2 kg/dia × 60 dias até a validade = 120 kg previstos.
    expect(tipos(lote(120 + 100), [k])).not.toContain('vencimento')
    const r = analisar(lote(120 + 300), [k], HOJE).alertas.find((a) => a.tipo === 'vencimento')!
    expect(r.evidencia.quantidadeEmRisco).toBe(180)
    expect(r.nivel).toBe('atencao')
  })

  test('item parado só vale para os 20% de maior valor', () => {
    const produtos = Array.from({ length: 5 }, (_, i) => produto({ id: `p${i}` }))
    const movs = produtos.map((p, i) => mov({ produto_id: p.id, tipo: 'entrada', quantidade: 100 * (i + 1), data: '2026-05-01', preco_unit: 1 }))
    const r = analisar(movs, produtos, HOJE).alertas.filter((a) => a.tipo === 'item_parado')
    expect(r.map((a) => a.produtoId)).toEqual(['p4'])
  })

  test('variação de preço exige 2 compras anteriores e diferença acima de 20%', () => {
    const compra = (data: string, preco: number) => mov({ produto_id: 'k', tipo: 'entrada', quantidade: 100, data, preco_unit: preco })
    expect(tipos([compra('2026-03-01', 10), compra('2026-10-01', 13)], [k])).not.toContain('variacao_preco')
    expect(tipos([compra('2026-01-01', 10), compra('2026-03-01', 10), compra('2026-10-01', 11.9)], [k])).not.toContain('variacao_preco')
    expect(tipos([compra('2026-01-01', 10), compra('2026-03-01', 10), compra('2026-10-01', 12.5)], [k])).toContain('variacao_preco')
  })

  test('devolução de embalagem vale só para defensivos com lote esgotado', () => {
    const def = produto({ id: 'd', unidade_base_id: 'L', categoria: 'Defensivos e biológicos' })
    const fert = produto({ id: 'f', unidade_base_id: 'L' })
    const movs = (id: string) => [
      mov({ produto_id: id, tipo: 'entrada', quantidade: 5, unidade_id: 'L', data: '2026-06-01', lote: 'X' }),
      mov({ produto_id: id, tipo: 'saida', quantidade: 5, unidade_id: 'L', data: '2026-07-01' }),
    ]
    expect(tipos(movs('d'), [def])).toEqual(['devolucao_embalagem'])
    expect(tipos(movs('f'), [fert])).toEqual([])
  })
})

describe('Consumo zero na janela (ex.: fertilizante fora da safra)', () => {
  const p = produto({ id: 'map', categoria: 'Fertilizantes' })
  // Comprado e usado em março; nenhuma retirada nos últimos 60 dias.
  const movs = [
    mov({ produto_id: 'map', tipo: 'entrada', quantidade: 3000, data: '2026-03-01', preco_unit: 4 }),
    ...retiradasPeriodicas('map', '2026-03-30', 10, 3, 100),
  ]

  /** Todos os números do objeto são finitos (nada de Infinity nem NaN). */
  function numerosFinitos(valor: unknown): boolean {
    if (typeof valor === 'number') return Number.isFinite(valor)
    if (valor && typeof valor === 'object') return Object.values(valor).every(numerosFinitos)
    return true
  }

  test('cobertura é null (nunca infinita) e aparece como "sem consumo recente"', () => {
    const r = analisar(movs, [p], HOJE)
    const a = r.produtos[0]
    expect(a.saldo).toBe(2000)
    expect(a.consumoDiario).toBe(0)
    expect(a.cobertura).toBeNull()
    expect(a.confianca).toBe('insuficiente')
    expect(fmtCobertura(a.cobertura)).toBe('sem consumo recente')
    expect(fmtCobertura(Infinity)).toBe('sem consumo recente')
    expect(fmtCobertura(12.7)).toBe('12 dias')
    expect(numerosFinitos(r)).toBe(true)
    expect(JSON.stringify(r)).not.toMatch(/Infinity|NaN/)
  })

  test('não dispara ruptura nem excesso', () => {
    const tiposDoProduto = analisar(movs, [p], HOJE).alertas.map((a) => a.tipo)
    expect(tiposDoProduto).not.toContain('ruptura_prevista')
    expect(tiposDoProduto).not.toContain('excesso')
    expect(tiposDoProduto).not.toContain('estoque_critico')
  })

  test('com saldo no mínimo, estoque crítico dispara sem número de dias', () => {
    const alertas = analisar(movs, [{ ...p, estoque_minimo: 2500 }], HOJE).alertas
    const critico = alertas.filter((a) => a.tipo === 'estoque_critico')
    expect(critico).toHaveLength(1)
    expect(alertas.map((a) => a.tipo)).not.toContain('ruptura_prevista')
    expect(critico[0].evidencia.coberturaDias).toBeNull()
    expect(critico[0].mensagem).toContain('Não há histórico suficiente')
    expect(critico[0].mensagem).not.toMatch(/\d+ dias/)
  })

  test('saldo zero e consumo zero: nenhum alerta e nenhuma cobertura', () => {
    const zerado = [...movs, mov({ produto_id: 'map', tipo: 'saida', quantidade: 2000, data: '2026-04-15' })]
    const r = analisar(zerado, [p], HOJE)
    expect(r.produtos[0]).toMatchObject({ saldo: 0, cobertura: null })
    expect(r.alertas).toEqual([])
  })
})

describe('Devolução de embalagem: nível progressivo conforme o prazo', () => {
  const def = produto({ id: 'd', unidade_base_id: 'L', categoria: 'Defensivos e biológicos' })
  // Lote comprado em 01/01/2026 e esgotado em 01/02/2026: prazo (365 dias) em 01/01/2027.
  const movs = [
    mov({ produto_id: 'd', tipo: 'entrada', quantidade: 5, unidade_id: 'L', data: '2026-01-01', lote: 'X' }),
    mov({ produto_id: 'd', tipo: 'saida', quantidade: 5, unidade_id: 'L', data: '2026-02-01' }),
  ]
  const alertaEm = (data: string) => analisar(movs, [def], new Date(`${data}T00:00:00Z`)).alertas.find((a) => a.tipo === 'devolucao_embalagem')

  test.each([
    ['2026-10-20', 'informativo', 73],
    ['2026-11-02', 'atencao', 60],
    ['2026-12-16', 'atencao', 16],
    ['2026-12-17', 'critico', 15],
    ['2027-01-01', 'critico', 0],
  ] as const)('em %s: %s (faltam %i dias)', (data, nivel, faltam) => {
    const a = alertaEm(data)!
    expect(a.nivel).toBe(nivel)
    expect(a.evidencia.diasAtePrazo).toBe(faltam)
    expect(a.mensagem).toContain(`faltam ${faltam} dias`)
  })

  test('depois do prazo, o alerta sai da lista', () => {
    expect(alertaEm('2027-01-02')).toBeUndefined()
  })
})
