// Sessão 4, parte 1: avisos de dados, excesso sem consumo, valor estimado, consumo ao longo do
// tempo, confiança "fato", reposição e frase curta dos cartões.
import { ConfiancaEstimativaSchema } from '@tetrarreme/contrato'
import { describe, expect, test } from 'vitest'
import { MENSAGEM_SALDO_NEGATIVO, analisar } from '../src/analise/analisar.ts'
import { gerarResumo } from '../src/analise/mensagens.ts'
import { serieDoProduto } from '../src/analise/serie.ts'
import { HOJE_SIMULADO, carregarBaseSimulada, mov, produto, retiradasPeriodicas } from './apoio.ts'

const HOJE = new Date('2026-10-20T00:00:00Z')
const base = carregarBaseSimulada()
const resultadoBase = analisar(base.movimentacoes, base.produtosNovos, HOJE_SIMULADO)
const nomeDe = new Map(base.produtosNovos.map((p) => [p.id, p.nome_canonico]))

describe('1.1 Saldo negativo vira aviso de qualidade dos dados', () => {
  test('saídas maiores que as entradas no total', () => {
    const p = produto({ id: 'x', nome_canonico: 'Correia do alternador', unidade_base_id: 'un' })
    const movs = [
      mov({ produto_id: 'x', tipo: 'entrada', quantidade: 2, unidade_id: 'un', data: '2026-09-01' }),
      mov({ produto_id: 'x', tipo: 'saida', quantidade: 3, unidade_id: 'un', data: '2026-09-10' }),
    ]
    const r = analisar(movs, [p], HOJE)
    expect(r.avisosDados).toEqual([
      { tipo: 'saldo_negativo', produtoId: 'x', produto: 'Correia do alternador', saldo: -1, lotesNegativos: ['sem lote'], mensagem: MENSAGEM_SALDO_NEGATIVO },
    ])
    expect(r.avisosDados[0].mensagem).toBe('Saídas maiores que as entradas registradas — verificar se falta registrar alguma entrada')
    // Não é alerta de estoque.
    expect(r.alertas.some((a) => a.mensagem.includes('Saídas maiores'))).toBe(false)
  })

  test('saídas maiores que as entradas em um lote, mesmo com saldo total positivo', () => {
    const p = produto({ id: 'd', unidade_base_id: 'L', categoria: 'Defensivos e biológicos' })
    const movs = [
      mov({ produto_id: 'd', tipo: 'entrada', quantidade: 10, unidade_id: 'L', data: '2026-09-01', lote: 'A' }),
      mov({ produto_id: 'd', tipo: 'entrada', quantidade: 10, unidade_id: 'L', data: '2026-09-02', lote: 'B' }),
      mov({ produto_id: 'd', tipo: 'saida', quantidade: 12, unidade_id: 'L', data: '2026-09-10', lote: 'A' }),
    ]
    const r = analisar(movs, [p], HOJE)
    expect(r.produtos[0].saldo).toBe(8)
    expect(r.avisosDados).toHaveLength(1)
    expect(r.avisosDados[0].lotesNegativos).toEqual(['A'])
  })

  test('a base simulada não tem saldo negativo', () => {
    expect(resultadoBase.avisosDados).toEqual([])
  })
})

describe('1.2 Excesso sem consumo (cobertura nula e saldo > 10 × estoque mínimo)', () => {
  const p = produto({ id: 'l', nome_canonico: 'Lâmina', unidade_base_id: 'un', estoque_minimo: 3 })
  const comSaldo = (saldo: number) => [
    mov({ produto_id: 'l', tipo: 'entrada', quantidade: saldo + 5, unidade_id: 'un', data: '2026-01-10', preco_unit: 25 }),
    ...retiradasPeriodicas('l', '2026-03-12', 5, 10, 1, 'un'),
  ]

  test('dispara acima de 10 × o mínimo, com regra explicando o critério', () => {
    const a = analisar(comSaldo(50), [p], HOJE).alertas.find((x) => x.tipo === 'excesso')!
    expect(a.evidencia).toMatchObject({ criterio: 'estoque_minimo', saldo: 50, estoqueMinimo: 3, multiploEstoqueMinimo: 10 })
    expect(a.evidencia).not.toHaveProperty('coberturaDias')
    expect(a.regra).toMatch(/^Sem retiradas nos últimos 60 dias e saldo maior que 10 vezes o estoque mínimo \(limite do padrão geral\)\.$/)
    expect(a.confianca).toBe('fato')
    expect(a.valorEnvolvido).toBe(20 * 25)
    expect(a.mensagem).toContain('vezes o estoque mínimo')
    expect(a.mensagem).not.toMatch(/Infinity|NaN|\?/)
  })

  test('não dispara até 10 × o mínimo, nem sem estoque mínimo cadastrado', () => {
    expect(analisar(comSaldo(30), [p], HOJE).alertas.map((a) => a.tipo)).not.toContain('excesso')
    expect(analisar(comSaldo(50), [{ ...p, estoque_minimo: null }], HOJE).alertas.map((a) => a.tipo)).not.toContain('excesso')
  })

  test('na base simulada, dispara só na situação plantada', () => {
    const semConsumo = resultadoBase.alertas.filter((a) => a.tipo === 'excesso' && a.evidencia.criterio === 'estoque_minimo')
    expect(semConsumo.map((a) => nomeDe.get(a.produtoId))).toEqual(['Lâmina de roçadeira'])
  })
})

describe('1.3 Valor estimado — uma definição só', () => {
  const com = produto({ id: 'c', unidade_base_id: 'un' })
  const parcial = produto({ id: 'p', unidade_base_id: 'un' })
  const sem = produto({ id: 's', unidade_base_id: 'un' })
  const movs = [
    mov({ produto_id: 'c', tipo: 'entrada', quantidade: 10, unidade_id: 'un', data: '2026-10-01', preco_unit: 2 }),
    mov({ produto_id: 'p', tipo: 'entrada', quantidade: 10, unidade_id: 'un', data: '2026-09-01', preco_unit: 5, lote: 'L1' }),
    mov({ produto_id: 'p', tipo: 'entrada', quantidade: 10, unidade_id: 'un', data: '2026-10-01', preco_unit: null, lote: 'L2' }),
    mov({ produto_id: 's', tipo: 'entrada', quantidade: 10, unidade_id: 'un', data: '2026-10-01', preco_unit: null }),
  ]

  test('produto sem preço fica fora da soma; lote sem preço é valorado pelo preço médio', () => {
    const f = analisar(movs, [com, parcial, sem], HOJE).resumoFinanceiro
    expect(f.valorConhecido).toBe(20 + 100) // c: 10 × 2; p: L1 10 × 5 + L2 10 × 5 (preço médio)
    expect(f.itensSemPreco).toBe(1)
    expect(f.lotesComPrecoMedio).toBe(1)
    expect(f.estimado).toBe(true)
    expect(f.porProduto.find((x) => x.produtoId === 'p')).toMatchObject({ valor: 100, estimado: true, lotesComPrecoMedio: 1 })
    expect(f.porProduto.find((x) => x.produtoId === 's')).toMatchObject({ valor: null, estimado: false })
  })

  test('com todos os preços conhecidos, o valor não é estimado', () => {
    const f = analisar(movs.slice(0, 2), [com, parcial], HOJE).resumoFinanceiro
    expect(f).toMatchObject({ itensSemPreco: 0, lotesComPrecoMedio: 0, estimado: false })
  })

  test('na base simulada: conector sem preço (fora da soma) e luva com compras sem preço (preço médio)', () => {
    const f = resultadoBase.resumoFinanceiro
    expect(f.porProduto.filter((x) => x.valor === null).map((x) => x.nome)).toEqual(['Conector de linha 16 mm'])
    expect(f.porProduto.filter((x) => x.estimado).map((x) => x.nome)).toContain('Luva nitrílica')
    expect(f.estimado).toBe(true)
  })
})

describe('1.4 Consumo ao longo do tempo', () => {
  const p = produto({ id: 'i', unidade_base_id: 'L', categoria: 'Defensivos e biológicos' })
  const movs = [
    mov({ produto_id: 'i', tipo: 'entrada', quantidade: 10, unidade_id: 'L', data: '2026-07-20' }),
    mov({ produto_id: 'i', tipo: 'saida', quantidade: 500, unidade_id: 'mL', data: '2026-08-31' }),
    mov({ produto_id: 'i', tipo: 'saida', quantidade: 250, unidade_id: 'mL', data: '2026-09-01' }),
    mov({ produto_id: 'i', tipo: 'saida', quantidade: 1, unidade_id: 'L', data: '2026-09-02' }),
    mov({ produto_id: 'i', tipo: 'entrada', quantidade: 5, unidade_id: 'L', data: '2026-10-05' }),
    mov({ produto_id: 'i', tipo: 'ajuste', quantidade: -0.25, unidade_id: 'L', data: '2026-10-10' }),
    mov({ produto_id: 'i', tipo: 'saida', quantidade: 1, unidade_id: 'L', data: '2026-10-25' }), // depois de hoje
  ]
  const s = serieDoProduto(p, movs, HOJE, 90)

  test('consumo por mês, na unidade base (mL convertido para L)', () => {
    expect(s.inicio).toBe('2026-07-23')
    expect(s.fim).toBe('2026-10-20')
    expect(s.porMes.map((m) => [m.rotulo, m.quantidade, m.retiradas])).toEqual([
      ['jul/2026', 0, 0], ['ago/2026', 0.5, 1], ['set/2026', 1.25, 2], ['out/2026', 0, 0],
    ])
  })

  test('consumo por semana (a partir da segunda-feira)', () => {
    const semana = s.porSemana.find((x) => x.rotulo === '31/08')!
    expect(semana).toMatchObject({ inicio: '2026-08-31', fim: '2026-09-06', quantidade: 1.75, retiradas: 3 })
    expect(s.porSemana.reduce((t, x) => t + x.quantidade, 0)).toBeCloseTo(1.75)
  })

  test('série do saldo com as entradas marcadas; ajustes e saldo anterior incluídos; futuro ignorado', () => {
    expect(s.saldo).toHaveLength(90)
    expect(s.saldo[0]).toEqual({ data: '2026-07-23', saldo: 10, entrada: null }) // entrada de 20/07 está no saldo inicial
    expect(s.saldo.find((x) => x.data === '2026-09-02')!.saldo).toBe(8.25)
    expect(s.saldo.filter((x) => x.entrada !== null)).toEqual([{ data: '2026-10-05', saldo: 13.25, entrada: 5 }])
    expect(s.saldo.at(-1)).toEqual({ data: '2026-10-20', saldo: 13, entrada: null })
  })

  test('12 meses de série para um produto da base', () => {
    const lambda = base.produtosNovos.find((x) => x.nome_canonico === 'Inseticida lambda-cialotrina')!
    const serie = serieDoProduto(lambda, base.movimentacoes, HOJE_SIMULADO)
    expect(serie.saldo).toHaveLength(365)
    expect(serie.porMes).toHaveLength(13)
    const analise = resultadoBase.produtos.find((x) => x.produto.id === lambda.id)!
    expect(serie.saldo.at(-1)!.saldo).toBeCloseTo(analise.saldo)
    expect(serie.porMes.find((m) => m.rotulo === 'out/2026')!.quantidade).toBeGreaterThan(2.5)
  })
})

describe('1.5 Confiança "fato registrado"', () => {
  test('fato não é confiança de estimativa: o cálculo por histórico nunca devolve fato', () => {
    expect(ConfiancaEstimativaSchema.options).not.toContain('fato')
    for (const a of resultadoBase.produtos) expect(a.confianca).not.toBe('fato')
  })

  test('nenhum alerta com estimativa de dias usa fato', () => {
    const comDias = resultadoBase.alertas.filter((a) => typeof a.evidencia.coberturaDias === 'number' || a.mensagem.match(/aproximadamente \d+ dias/))
    expect(comDias.length).toBeGreaterThan(0)
    for (const a of comDias) expect(a.confianca, `${a.tipo} ${nomeDe.get(a.produtoId)}`).not.toBe('fato')
  })

  test('lote vencido, possível duplicidade, devolução de embalagem e variação de preço usam fato', () => {
    const fatos = resultadoBase.alertas.filter((a) => a.confianca === 'fato')
    const tipos = new Set(fatos.map((a) => (a.tipo === 'vencimento' ? `vencimento:${a.evidencia.vencido}` : a.tipo)))
    expect(tipos).toEqual(new Set(['vencimento:sim', 'possivel_duplicidade', 'devolucao_embalagem', 'variacao_preco', 'excesso']))
    const vencendo = resultadoBase.alertas.find((a) => a.tipo === 'vencimento' && a.evidencia.vencido === 'não')!
    expect(vencendo.confianca).not.toBe('fato')
  })
})

describe('Reposição e frase curta', () => {
  test('estoque crítico e ruptura mostram a reposição de 30 dias (quantidade e valor)', () => {
    const kcl = resultadoBase.alertas.find((a) => nomeDe.get(a.produtoId) === 'Cloreto de potássio (KCl)')!
    expect(kcl.evidencia.diasReposicao).toBe(30)
    expect(kcl.evidencia.quantidadeReposicao).toBeCloseTo(Number(kcl.evidencia.consumoMedioDiario) * 30, -1)
    expect(kcl.evidencia.valorReposicao).toBe(kcl.valorEnvolvido)
    // Filtro: 1 retirada de 2 un na janela de 60 dias → 2/60 × 30 = 1 un.
    const filtro = resultadoBase.alertas.find((a) => nomeDe.get(a.produtoId) === 'Filtro de óleo do trator')!
    expect(filtro.evidencia.quantidadeReposicao).toBe(1)

    // Sem consumo na janela, a reposição é o que falta para o estoque mínimo.
    const p = produto({ id: 'f', unidade_base_id: 'un', estoque_minimo: 4 })
    const movs = [
      mov({ produto_id: 'f', tipo: 'entrada', quantidade: 3, unidade_id: 'un', data: '2026-01-10', preco_unit: 85 }),
      mov({ produto_id: 'f', tipo: 'saida', quantidade: 2, unidade_id: 'un', data: '2026-03-10' }),
    ]
    const critico = analisar(movs, [p], HOJE).alertas.find((a) => a.tipo === 'estoque_critico')!
    expect(critico.evidencia).toMatchObject({ quantidadeReposicao: 3, valorReposicao: 255 })
  })

  test('todo alerta da base tem frase curta, sem lacunas e sem dias quando a confiança é insuficiente', () => {
    for (const a of resultadoBase.alertas) {
      const curta = gerarResumo(a)
      expect(curta.length, a.tipo).toBeGreaterThan(10)
      expect(curta).not.toMatch(/undefined|NaN|\?|null/)
      if (a.confianca === 'insuficiente') expect(curta).not.toMatch(/\d+ dias/)
    }
  })
})
