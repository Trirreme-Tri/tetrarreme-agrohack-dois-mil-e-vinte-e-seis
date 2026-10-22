// Testes de conformidade: pelo menos um por regra inviolável R1–R8 (CLAUDE.md, seção 4).
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'vitest'
import { analisar, ordenarAlertas } from '../src/analise/analisar.ts'
import { CONFIG_PADRAO } from '../src/analise/config.ts'
import { analisarProduto, calcularConfianca } from '../src/analise/consumo.ts'
import { diaDe } from '../src/analise/datas.ts'
import { fmtReais } from '../src/analise/formatacao.ts'
import { importarCsv, numeroOuNulo, textoOuNulo } from '../src/analise/importacao.ts'
import { gerarMensagem } from '../src/analise/mensagens.ts'
import {
  ErroUnificacao,
  confirmarAlias,
  numerosCompativeis,
  resolverProduto,
  sugerirDuplicidades,
  sugerirProdutos,
} from '../src/analise/produtos.ts'
import { AlertaSchema, MovimentacaoSchema, ProdutoSchema, descreverErros } from '@tetrarreme/contrato'
import type { Alerta, Movimentacao } from '@tetrarreme/contrato'
import { ErroDimensao, converter, somar } from '../src/analise/unidades.ts'
import {
  HOJE_SIMULADO,
  MAPEAMENTO_SIMULADO,
  PASTA_SIMULADOS,
  carregarBaseSimulada,
  geradorDeIds,
  mov,
  produto,
  retiradasPeriodicas,
} from './apoio.ts'

const HOJE = new Date('2026-10-20T00:00:00Z')
const base = carregarBaseSimulada()
const resultadoBase = analisar(base.movimentacoes, base.produtosNovos, HOJE_SIMULADO, { importacoes: [base.importacao] })
const nomeDe = (id: string) => base.produtosNovos.find((p) => p.id === id)!.nome_canonico

function congelar<T>(obj: T): T {
  if (obj && typeof obj === 'object') {
    Object.values(obj).forEach(congelar)
    Object.freeze(obj)
  }
  return obj
}

describe('R1 — unidades diferentes nunca são somadas sem conversão', () => {
  test('R1: converte para a unidade base dentro da mesma dimensão', () => {
    expect(converter(250, 'mL', 'L')).toBeCloseTo(0.25)
    expect(converter(2, 't', 'kg')).toBe(2000)
    expect(converter(3, 'sc50', 'kg')).toBe(150)
    expect(somar([{ quantidade: 1, unidade_id: 'L' }, { quantidade: 500, unidade_id: 'mL' }], 'L')).toBeCloseTo(1.5)
  })

  test('R1: somar dimensões diferentes lança erro', () => {
    expect(() => converter(1, 'kg', 'L')).toThrow(ErroDimensao)
    expect(() => somar([{ quantidade: 1, unidade_id: 'kg' }, { quantidade: 1, unidade_id: 'L' }], 'kg')).toThrow(ErroDimensao)
    expect(() => converter(1, 'un', 'kg')).toThrow(ErroDimensao)
  })

  test('R1: saldo soma entrada em L e retiradas em mL convertendo para a unidade base', () => {
    const p = produto({ id: 'inseticida', unidade_base_id: 'L', categoria: 'Defensivos e biológicos' })
    const movs = [
      mov({ produto_id: 'inseticida', tipo: 'entrada', quantidade: 2, unidade_id: 'L', data: '2026-09-01' }),
      mov({ produto_id: 'inseticida', tipo: 'saida', quantidade: 250, unidade_id: 'mL', data: '2026-09-10' }),
      mov({ produto_id: 'inseticida', tipo: 'saida', quantidade: 0.5, unidade_id: 'L', data: '2026-09-20' }),
    ]
    expect(analisarProduto(p, movs, diaDe('2026-10-20'), CONFIG_PADRAO.padrao).saldo).toBeCloseTo(1.25)
  })

  test('R1: movimentação em dimensão diferente da do produto interrompe a análise', () => {
    const p = produto({ id: 'ureia', unidade_base_id: 'kg' })
    const movs = [
      mov({ produto_id: 'ureia', tipo: 'entrada', quantidade: 100, unidade_id: 'kg', data: '2026-09-01' }),
      mov({ produto_id: 'ureia', tipo: 'saida', quantidade: 10, unidade_id: 'L', data: '2026-09-10' }),
    ]
    expect(() => analisar(movs, [p], HOJE)).toThrow(ErroDimensao)
  })

  test('R1: importação rejeita a linha com unidade de outra dimensão, sem somar', () => {
    const csv = 'produto;categoria;unidade;quantidade;tipo;data\nUreia;Fertilizantes;kg;100;entrada;01/09/2026\nUreia;Fertilizantes;L;10;saída;02/09/2026\n'
    const r = importarCsv(csv, { mapeamento: MAPEAMENTO_SIMULADO, origem: 'simulado', agora: HOJE, delimitador: ';', gerarId: geradorDeIds() })
    expect(r.movimentacoes).toHaveLength(1)
    expect(r.erros).toEqual([{ linha: 3, mensagem: expect.stringContaining('Não é possível converter') }])
  })
})

describe('R2 — ausência de validade ou preço não é zero', () => {
  test('R2: "", "-", "N/D" e "NA" viram null, nunca 0', () => {
    for (const v of ['', '-', 'N/D', 'NA', '  ', 'n/d']) {
      expect(textoOuNulo(v)).toBeNull()
      expect(numeroOuNulo(v)).toBeNull()
    }
    expect(numeroOuNulo('0')).toBe(0)
    expect(numeroOuNulo('1.234,50')).toBe(1234.5)
  })

  test('R2: na importação, preço e validade ausentes ficam null', () => {
    const csv = [
      'produto;categoria;unidade;quantidade;tipo;data;preco_unit;validade',
      'Luva nitrílica;EPI e diversos;un;100;entrada;01/09/2026;N/D;-',
      'Luva nitrílica;EPI e diversos;un;100;entrada;02/09/2026;;NA',
      'Luva nitrílica;EPI e diversos;un;100;entrada;03/09/2026;1,20;31/12/2027',
    ].join('\n')
    const r = importarCsv(csv, { mapeamento: MAPEAMENTO_SIMULADO, origem: 'simulado', agora: HOJE, delimitador: ';', gerarId: geradorDeIds() })
    expect(r.erros).toEqual([])
    expect(r.movimentacoes.map((m) => m.preco_unit)).toEqual([null, null, 1.2])
    expect(r.movimentacoes.map((m) => m.validade)).toEqual([null, null, '2027-12-31'])
  })

  test('R2: quantidade ausente é erro, não zero', () => {
    const csv = 'produto;categoria;unidade;quantidade;tipo;data\nUreia;Fertilizantes;kg;N/D;entrada;01/09/2026\n'
    const r = importarCsv(csv, { mapeamento: MAPEAMENTO_SIMULADO, origem: 'simulado', agora: HOJE, delimitador: ';', gerarId: geradorDeIds() })
    expect(r.movimentacoes).toHaveLength(0)
    expect(r.erros[0].mensagem).toContain('quantidade não informada')
  })

  test('R2: lote sem validade nunca é tratado como vencido', () => {
    const p = produto({ id: 'npk' })
    const movs = [mov({ produto_id: 'npk', tipo: 'entrada', quantidade: 1000, data: '2025-01-01', validade: null })]
    const r = analisar(movs, [p], HOJE)
    expect(r.alertas.filter((a) => a.tipo === 'vencimento')).toEqual([])
  })

  test('R2: produto sem preço fica fora do total, é contado como "sem preço" e não vira R$ 0,00', () => {
    const p = produto({ id: 'conector', unidade_base_id: 'un', categoria: 'Materiais de irrigação' })
    const q = produto({ id: 'luva', unidade_base_id: 'un', categoria: 'EPI e diversos' })
    const movs = [
      mov({ produto_id: 'conector', tipo: 'entrada', quantidade: 10, unidade_id: 'un', data: '2026-10-01', preco_unit: null }),
      mov({ produto_id: 'luva', tipo: 'entrada', quantidade: 10, unidade_id: 'un', data: '2026-10-01', preco_unit: 2 }),
    ]
    const r = analisar(movs, [p, q], HOJE)
    expect(r.resumoFinanceiro.valorTotal).toBe(20)
    expect(r.resumoFinanceiro.itensSemPreco).toBe(1)
    expect(r.produtos.find((a) => a.produto.id === 'conector')!.valorEstoque).toBeNull()
    expect(r.resumoFinanceiro.porProduto.find((x) => x.produtoId === 'conector')!.valor).toBeNull()
    expect(fmtReais(null)).toBe('sem preço')
  })

  test('R2: o resumo financeiro da base simulada informa os itens sem preço', () => {
    expect(resultadoBase.resumoFinanceiro.itensSemPreco).toBe(1)
    const semPreco = resultadoBase.resumoFinanceiro.porProduto.filter((p) => p.valor === null).map((p) => p.nome)
    expect(semPreco).toEqual(['Conector de linha 16 mm'])
    const categoria = resultadoBase.resumoFinanceiro.porCategoria.find((c) => c.categoria === 'Materiais de irrigação')!
    expect(categoria.itensSemPreco).toBe(1)
  })
})

describe('R3 — pouco histórico comunica incerteza', () => {
  test('R3: níveis de confiança seguem os limites da configuração', () => {
    const c = CONFIG_PADRAO.padrao.confianca
    expect(calcularConfianca(2, 365, c)).toBe('insuficiente')
    expect(calcularConfianca(4, 365, c)).toBe('baixa')
    expect(calcularConfianca(20, 20, c)).toBe('baixa')
    expect(calcularConfianca(9, 365, c)).toBe('media')
    expect(calcularConfianca(10, 365, c)).toBe('alta')
  })

  test('R3: a confiança não é armazenada nas movimentações', () => {
    for (const m of base.movimentacoes) expect(Object.keys(m)).not.toContain('confianca')
  })

  test('R3: a confiança é recalculada na análise conforme o histórico cresce', () => {
    const p = produto({ id: 'diesel', unidade_base_id: 'L' })
    const entrada = mov({ produto_id: 'diesel', tipo: 'entrada', quantidade: 5000, unidade_id: 'L', data: '2026-06-01' })
    const saidas = retiradasPeriodicas('diesel', '2026-10-19', 12, 7, 100, 'L')
    const confianca = (n: number) => analisar([entrada, ...saidas.slice(0, n)], [p], HOJE).produtos[0].confianca
    expect(confianca(2)).toBe('insuficiente')
    expect(confianca(4)).toBe('baixa')
    expect(confianca(8)).toBe('media')
    expect(confianca(12)).toBe('alta')
  })

  test('R3: com confiança insuficiente, o alerta não mostra número de dias', () => {
    const filtro = resultadoBase.alertas.find((a) => nomeDe(a.produtoId) === 'Filtro de óleo do trator')!
    expect(filtro.confianca).toBe('insuficiente')
    expect(filtro.evidencia.coberturaDias).toBeNull()
    expect(filtro.mensagem).toContain('Não há histórico suficiente')
    expect(filtro.mensagem).not.toMatch(/\d+ dias/)
  })
})

describe('R4 — todo alerta tem justificativa compreensível', () => {
  test('R4: nenhum campo obrigatório vazio em nenhum alerta da base simulada', () => {
    expect(resultadoBase.alertas.length).toBeGreaterThan(0)
    for (const a of resultadoBase.alertas) {
      for (const campo of ['tipo', 'nivel', 'produtoId', 'regra', 'confianca', 'recomendacao', 'mensagem'] as const) {
        expect(a[campo], `${a.tipo}.${campo}`).toEqual(expect.any(String))
        expect(a[campo].trim(), `${a.tipo}.${campo}`).not.toBe('')
      }
      expect(Object.values(a.evidencia).some((v) => typeof v === 'number'), `${a.tipo} sem número na evidência`).toBe(true)
      expect('valorEnvolvido' in a).toBe(true)
      expect(a.mensagem).not.toMatch(/undefined|NaN|\?/)
    }
  })

  test('R4: a mensagem é gerada a partir dos campos estruturados', () => {
    for (const a of resultadoBase.alertas) {
      const { mensagem, ...campos } = a
      expect(gerarMensagem(campos)).toBe(mensagem)
    }
    const critico = resultadoBase.alertas.find((a) => a.tipo === 'estoque_critico' && a.confianca !== 'insuficiente')!
    const { mensagem: _m, ...campos } = critico
    const alterada = gerarMensagem({ ...campos, evidencia: { ...campos.evidencia, coberturaDias: 3 } })
    expect(alterada).toContain('aproximadamente 3 dias')
  })

  test('R4: mensagem no estilo do exemplo do edital', () => {
    const kcl = resultadoBase.alertas.find((a) => nomeDe(a.produtoId) === 'Cloreto de potássio (KCl)')!
    expect(kcl.mensagem).toMatch(
      /^Estoque crítico: .*Mantendo o consumo médio recente, o saldo atual poderá ser suficiente por aproximadamente \d+ dias\.$/,
    )
  })
})

describe('R5 — alertas priorizados', () => {
  const alerta = (nivel: Alerta['nivel'], valorEnvolvido: number | null, produtoId: string): Alerta => ({
    tipo: 'estoque_critico', nivel, produtoId, evidencia: { x: 1 }, regra: 'r', confianca: 'alta',
    recomendacao: 'r', mensagem: 'm', valorEnvolvido,
  })

  test('R5: ordena por nível e, dentro do nível, por maior valor envolvido (sem valor por último)', () => {
    const ordenados = ordenarAlertas([
      alerta('informativo', 9000, 'a'),
      alerta('critico', 100, 'b'),
      alerta('atencao', null, 'c'),
      alerta('critico', 5000, 'd'),
      alerta('atencao', 300, 'e'),
      alerta('critico', null, 'f'),
    ])
    expect(ordenados.map((a) => a.produtoId)).toEqual(['d', 'b', 'f', 'e', 'c', 'a'])
  })

  test('R5: os alertas da base simulada saem ordenados', () => {
    const ordem = { critico: 0, atencao: 1, informativo: 2 }
    const a = resultadoBase.alertas
    for (let i = 1; i < a.length; i++) {
      const anterior = a[i - 1]
      const atual = a[i]
      expect(ordem[anterior.nivel]).toBeLessThanOrEqual(ordem[atual.nivel])
      if (anterior.nivel === atual.nivel) {
        expect(anterior.valorEnvolvido ?? -Infinity).toBeGreaterThanOrEqual(atual.valorEnvolvido ?? -Infinity)
      }
    }
    expect(new Set(a.map((x) => x.nivel))).toEqual(new Set(['critico', 'atencao', 'informativo']))
  })
})

describe('R6 — atualização gera reanálise', () => {
  test('R6: nova movimentação muda o resultado, e nada fica guardado entre análises', () => {
    const movs = congelar([...base.movimentacoes])
    const produtos = congelar([...base.produtosNovos])
    const kcl = produtos.find((p) => p.nome_canonico === 'Cloreto de potássio (KCl)')!
    const temCritico = (r: ReturnType<typeof analisar>) => r.alertas.some((a) => a.tipo === 'estoque_critico' && a.produtoId === kcl.id)

    const antes = analisar(movs, produtos, HOJE_SIMULADO)
    expect(temCritico(antes)).toBe(true)

    const compra: Movimentacao = mov({ produto_id: kcl.id, tipo: 'entrada', quantidade: 4, unidade_id: 't', data: '2026-10-20', preco_unit: 3200 })
    const depois = analisar([...movs, compra], produtos, HOJE_SIMULADO)
    expect(temCritico(depois)).toBe(false)
    expect(depois.produtos.find((p) => p.produto.id === kcl.id)!.saldo).toBeCloseTo(4250)

    // Sem a compra, o resultado volta a ser o de antes: alertas não são persistidos.
    expect(analisar(movs, produtos, HOJE_SIMULADO)).toEqual(antes)
  })

  test('R6: a análise é determinística e não altera as entradas', () => {
    const movs = congelar(structuredClone(base.movimentacoes))
    const produtos = congelar(structuredClone(base.produtosNovos))
    expect(() => analisar(movs, produtos, HOJE_SIMULADO)).not.toThrow()
    expect(analisar(movs, produtos, HOJE_SIMULADO)).toEqual(analisar(movs, produtos, HOJE_SIMULADO))
  })

  test('R6: a data de referência é parâmetro; movimentações futuras são ignoradas', () => {
    const p = produto({ id: 'x' })
    const movs = [
      mov({ produto_id: 'x', tipo: 'entrada', quantidade: 100, data: '2026-10-01' }),
      mov({ produto_id: 'x', tipo: 'saida', quantidade: 40, data: '2026-10-25' }),
    ]
    expect(analisar(movs, [p], new Date('2026-10-20')).produtos[0].saldo).toBe(100)
    expect(analisar(movs, [p], new Date('2026-10-26')).produtos[0].saldo).toBe(60)
  })
})

describe('R7 — dados simulados identificados', () => {
  test('R7: toda movimentação importada pertence à importação, que tem origem', () => {
    expect(base.importacao.origem).toBe('simulado')
    expect(base.movimentacoes.length).toBeGreaterThan(0)
    for (const m of base.movimentacoes) expect(m.importacao_id).toBe(base.importacao.id)
    expect(resultadoBase.origens).toEqual(['simulado'])
  })

  test('R7: importação sem origem válida é recusada', () => {
    const csv = 'produto;categoria;unidade;quantidade;tipo;data\nUreia;Fertilizantes;kg;1;entrada;01/09/2026\n'
    const opcoes = { mapeamento: MAPEAMENTO_SIMULADO, agora: HOJE, delimitador: ';' }
    // @ts-expect-error origem inválida de propósito
    expect(() => importarCsv(csv, { ...opcoes, origem: 'desconhecida' })).toThrow(/origem/)
  })

  test('R7: movimentação sem importação de origem é recusada pela análise', () => {
    const p = produto({ id: 'x' })
    const m = mov({ produto_id: 'x', tipo: 'entrada', quantidade: 1, data: '2026-10-01', importacao_id: '' })
    expect(() => analisar([m], [p], HOJE)).toThrow(/R7/)
  })

  test('R7: o arquivo da base simulada marca todas as linhas como SIMULADO', () => {
    const linhas = readFileSync(join(PASTA_SIMULADOS, 'movimentacoes.csv'), 'utf8').trim().split('\n')
    expect(linhas[0].split(';')[0]).toBe('origem_dados')
    for (const l of linhas.slice(1)) expect(l.startsWith('SIMULADO;')).toBe(true)
  })

  test('Conduta: responsáveis são pseudonimizados na importação', () => {
    const csv = [
      'produto;categoria;unidade;quantidade;tipo;data;responsavel',
      'Ureia;Fertilizantes;kg;10;entrada;01/09/2026;João da Silva',
      'Ureia;Fertilizantes;kg;1;saída;02/09/2026;Maria Souza',
      'Ureia;Fertilizantes;kg;1;saída;03/09/2026;joão da silva',
    ].join('\n')
    const r = importarCsv(csv, { mapeamento: MAPEAMENTO_SIMULADO, origem: 'oficial', agora: HOJE, delimitador: ';', gerarId: geradorDeIds() })
    expect(r.movimentacoes.map((m) => m.responsavel_pseudonimo)).toEqual(['Funcionário A', 'Funcionário B', 'Funcionário A'])
    expect(JSON.stringify(r)).not.toMatch(/João|Maria/)
  })
})

describe('R8 — produtos com nomes diferentes', () => {
  test('R8: números diferentes nunca são o mesmo produto (NPK 04-14-08 ≠ NPK 04-30-16)', () => {
    expect(numerosCompativeis('NPK 04-14-08', 'NPK 04-30-16')).toBe(false)
    const npk1 = produto({ id: 'a', nome_canonico: 'NPK 04-14-08' })
    const npk2 = produto({ id: 'b', nome_canonico: 'NPK 04-30-16' })
    const qualquerNome = { similaridadeMinima: 0, similaridadePalavra: 0 }
    expect(sugerirDuplicidades([npk1, npk2], qualquerNome)).toEqual([])
    expect(sugerirProdutos('npk 4-30-16', [npk1], qualquerNome)).toEqual([])
    expect(() => confirmarAlias('NPK 04-30-16', npk1)).toThrow(ErroUnificacao)
  })

  test('R8: a unificação é sugerida, não automática', () => {
    const ureia = base.produtosNovos.find((p) => p.nome_canonico === 'Ureia')!
    const ureia45 = base.produtosNovos.find((p) => p.nome_canonico === 'UREIA 45%')!
    expect(ureia45.id).not.toBe(ureia.id)
    const glifosato = base.produtosNovos.find((p) => p.nome_canonico === 'Herbicida glifosato 480')!
    const glifozato = base.produtosNovos.find((p) => p.nome_canonico === 'Herbicida glifozato 480')!
    expect(glifozato.id).not.toBe(glifosato.id)
    expect(base.sugestoesUnificacao).toEqual([
      { nomeNovo: 'UREIA 45%', produtoNovoId: ureia45.id, candidatos: [{ produtoId: ureia.id, nome: 'Ureia' }] },
      { nomeNovo: 'Herbicida glifozato 480', produtoNovoId: glifozato.id, candidatos: [{ produtoId: glifosato.id, nome: 'Herbicida glifosato 480' }] },
    ])
  })

  test('R8: só apelido confirmado por uma pessoa identifica o produto', () => {
    const glifosato = produto({ id: 'gli', nome_canonico: 'Glifosato 480' })
    expect(resolverProduto('glifosato 480', [glifosato], [])).toBe(glifosato)
    expect(resolverProduto('Glifosato Atar 480', [glifosato], [])).toBeNull()
    expect(sugerirProdutos('Glifozato 480', [glifosato], CONFIG_PADRAO.globais.duplicidade)).toEqual([glifosato])

    const naoConfirmado = { nome_original: 'Glifosato Atar 480', produto_id: 'gli', confirmado: false }
    expect(resolverProduto('Glifosato Atar 480', [glifosato], [naoConfirmado])).toBeNull()
    const confirmado = confirmarAlias('Glifosato Atar 480', glifosato)
    expect(confirmado.confirmado).toBe(true)
    expect(resolverProduto('GLIFOSATO ATAR 480', [glifosato], [confirmado])).toBe(glifosato)
  })

  test('R8: possível duplicidade gera alerta; pares parecidos de produtos diferentes não geram', () => {
    const duplicidades = resultadoBase.alertas.filter((a) => a.tipo === 'possivel_duplicidade')
    const pares = duplicidades.map((a) => `${nomeDe(a.produtoId)} ~ ${a.evidencia.outroProduto}`).sort()
    expect(pares).toEqual(['Herbicida glifozato 480 ~ Herbicida glifosato 480', 'UREIA 45% ~ Ureia'])
  })

  test('R8: os três "filtros" do Anexo III são produtos distintos e nunca são sugeridos para unificação', () => {
    const nomes = ['Filtro de óleo do trator', 'Filtro de disco para irrigação', 'Filtro para respirador']
    const filtros = nomes.map((n) => base.produtosNovos.find((p) => p.nome_canonico === n)!)
    expect(new Set(filtros.map((f) => f.id)).size).toBe(3)
    expect(new Set(filtros.map((f) => f.categoria))).toEqual(new Set(['Peças e manutenção', 'Materiais de irrigação', 'EPI e diversos']))
    expect(sugerirDuplicidades(filtros, CONFIG_PADRAO.globais.duplicidade)).toEqual([])
    for (const n of nomes) expect(sugerirProdutos(n, filtros.filter((f) => f.nome_canonico !== n), CONFIG_PADRAO.globais.duplicidade)).toEqual([])
    const alertasDeFiltro = resultadoBase.alertas.filter((a) => a.tipo === 'possivel_duplicidade' && nomes.includes(nomeDe(a.produtoId)))
    expect(alertasDeFiltro).toEqual([])
  })

  test('R8: palavras diferentes não viram duplicidade, mesmo com nomes parecidos', () => {
    const criterio = CONFIG_PADRAO.globais.duplicidade
    const calcitico = produto({ id: 'a', nome_canonico: 'Calcário calcítico', categoria: 'Corretivos' })
    const dolomitico = produto({ id: 'b', nome_canonico: 'Calcário dolomítico', categoria: 'Corretivos' })
    expect(sugerirDuplicidades([calcitico, dolomitico], criterio)).toEqual([])
    const soja = produto({ id: 'c', nome_canonico: 'Semente de soja', categoria: 'Sementes' })
    const feijao = produto({ id: 'd', nome_canonico: 'Semente de feijão', categoria: 'Sementes' })
    expect(sugerirDuplicidades([soja, feijao], criterio)).toEqual([])
  })
})

describe('Contrato de dados (@tetrarreme/contrato)', () => {
  test('R4: todo alerta da base simulada é válido no schema de Alerta', () => {
    for (const a of resultadoBase.alertas) {
      const r = AlertaSchema.safeParse(a)
      expect(r.success, r.success ? '' : `${a.tipo}: ${descreverErros(r.error)}`).toBe(true)
    }
  })

  test('toda movimentação e todo produto importados da base simulada são válidos no contrato', () => {
    for (const m of base.movimentacoes) expect(MovimentacaoSchema.safeParse(m).success).toBe(true)
    for (const p of base.produtosNovos) expect(ProdutoSchema.safeParse(p).success).toBe(true)
  })

  test('R2: linhas inválidas são reportadas com linha e motivo, nunca descartadas em silêncio nem zeradas', () => {
    const csv = [
      'produto;categoria;unidade;quantidade;tipo;data;preco_unit;validade',
      'Glifosato 480;Defensivos e biológicos;L;20;entrada;01/09/2026;28,00;30/06/2028',
      'Glifosato 480;Defensivos e biológicos;L;20;entrada;02/09/2026;-28,00;30/06/2028',
      'Glifosato 480;Defensivos e biológicos;L;20;entrada;03/09/2026;28,00;31/02/2028',
      'Glifosato 480;Defensivos e biológicos;L;0;saída;04/09/2026;;',
      'Glifosato 480;Defensivos e biológicos;L;abc;saída;05/09/2026;;',
      'Glifosato 480;Defensivos e biológicos;L;2;saída;06/09/2026;;',
    ].join('\n')
    const r = importarCsv(csv, { mapeamento: MAPEAMENTO_SIMULADO, origem: 'simulado', agora: HOJE, delimitador: ';', gerarId: geradorDeIds() })
    expect(r.movimentacoes.map((m) => m.data)).toEqual(['2026-09-01', '2026-09-06'])
    expect(r.erros.map((e) => e.linha)).toEqual([3, 4, 5, 6])
    expect(r.erros[0].mensagem).toMatch(/^preco_unit: /)
    expect(r.erros[1].mensagem).toMatch(/^validade: /)
    expect(r.erros[2].mensagem).toMatch(/^quantidade: /)
    expect(r.erros[3].mensagem).toContain('"abc" não é um número')
    // Toda linha de dados termina como movimentação ou como erro.
    expect(r.movimentacoes.length + r.erros.length).toBe(6)
    expect(r.movimentacoes.some((m) => m.quantidade === 0 || m.preco_unit === 0)).toBe(false)
  })

  test('id fora do contrato (não UUID) é reportado, e o produto da linha recusada não é criado', () => {
    const csv = 'produto;categoria;unidade;quantidade;tipo;data\nUreia;Fertilizantes;kg;10;entrada;01/09/2026\n'
    const r = importarCsv(csv, { mapeamento: MAPEAMENTO_SIMULADO, origem: 'simulado', agora: HOJE, delimitador: ';', gerarId: () => 'sem-uuid' })
    expect(r.movimentacoes).toEqual([])
    expect(r.produtosNovos).toEqual([])
    expect(r.erros).toEqual([{ linha: 2, mensagem: expect.stringMatching(/^id: /) }])
  })
})
