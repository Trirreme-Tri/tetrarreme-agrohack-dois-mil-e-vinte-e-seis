// Dados locais (IndexedDB via Dexie, com fake-indexeddb): carga inicial, deslocamento de datas,
// registros, decisões de duplicidade e preferências.
import 'fake-indexeddb/auto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { DATA_REFERENCIA } from '../../data/simulados/referencia.ts'
import { analisar } from '../src/analise/analisar.ts'
import { aplicarUnificacoes, chavePar } from '../src/analise/produtos.ts'
import { criarBanco } from '../src/dados/banco.ts'
import type { BancoMonitora } from '../src/dados/banco.ts'
import { carregarBaseInicial, deslocarIso, deslocarMovimentacoes, diasDeDeslocamento, recarregarBaseSimulada } from '../src/dados/carga.ts'
import { hojeLocal, isoLocal } from '../src/dados/hoje.ts'
import { decidirDuplicidade, desfazerDuplicidade, gravarPreferencia, lerPreferencia, registrar } from '../src/dados/repositorio.ts'
import { HOJE_SIMULADO, PASTA_SIMULADOS, carregarBaseSimulada, geradorDeIds, mov, produto } from './apoio.ts'

const CSV = readFileSync(join(PASTA_SIMULADOS, 'movimentacoes.csv'), 'utf8')
const HOJE = new Date('2027-03-15T00:00:00Z') // um dia qualquer depois da data de referência
const AGORA = new Date('2027-03-15T13:30:00Z')

describe('Deslocamento de datas da base simulada', () => {
  test('diasDeDeslocamento e deslocarIso', () => {
    expect(diasDeDeslocamento(new Date(`${DATA_REFERENCIA}T00:00:00Z`))).toBe(0)
    expect(diasDeDeslocamento(HOJE)).toBe(146)
    expect(deslocarIso('2026-10-20', 146)).toBe('2027-03-15')
    expect(deslocarIso('2026-02-28', 1)).toBe('2026-03-01')
    expect(deslocarIso('2026-01-10', -10)).toBe('2025-12-31')
  })

  test('desloca data e validade (null continua null) e não mexe no resto', () => {
    const m = mov({ produto_id: 'x', tipo: 'entrada', quantidade: 1, data: '2026-10-01', validade: '2027-01-31', lote: 'L' })
    const [d] = deslocarMovimentacoes([m], 10)
    expect(d).toEqual({ ...m, data: '2026-10-11', validade: '2027-02-10' })
    expect(deslocarMovimentacoes([{ ...m, validade: null }], 10)[0].validade).toBeNull()
    expect(m.data).toBe('2026-10-01') // não altera a original
  })

  test('a base deslocada produz os mesmos alertas da base original', () => {
    const base = carregarBaseSimulada()
    const original = analisar(base.movimentacoes, base.produtosNovos, HOJE_SIMULADO)
    const dias = diasDeDeslocamento(HOJE)
    const deslocada = analisar(deslocarMovimentacoes(base.movimentacoes, dias), base.produtosNovos, HOJE)

    const semDatas = (r: ReturnType<typeof analisar>) =>
      r.alertas.map((a) => ({
        tipo: a.tipo, nivel: a.nivel, produtoId: a.produtoId, confianca: a.confianca, valorEnvolvido: a.valorEnvolvido, regra: a.regra,
        evidencia: Object.fromEntries(Object.entries(a.evidencia).filter(([, v]) => typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v))),
      }))
    expect(semDatas(deslocada)).toEqual(semDatas(original))
    expect(deslocada.alertas.length).toBe(original.alertas.length)
    // As datas foram deslocadas pelo mesmo número de dias.
    const venc = (r: ReturnType<typeof analisar>) => r.alertas.find((a) => a.tipo === 'vencimento' && a.evidencia.vencido === 'sim')!.evidencia.validade as string
    expect(venc(deslocada)).toBe(deslocarIso(venc(original), dias))
    expect(deslocada.resumoFinanceiro).toEqual(original.resumoFinanceiro)
  })
})

describe('Banco local', () => {
  let db: BancoMonitora
  let n = 0
  beforeEach(() => {
    db = criarBanco(`teste-dados-${++n}`)
  })
  afterEach(async () => {
    await db.delete()
  })

  test('carga inicial: base simulada com origem "simulado", datas deslocadas e cadastro da propriedade', async () => {
    expect(await carregarBaseInicial(db, { hoje: HOJE, agora: AGORA, textoCsv: CSV, gerarId: geradorDeIds() })).toBe(true)
    const [importacoes, movs, produtos, cadastro, unidades] = await Promise.all([
      db.importacoes.toArray(), db.movimentacoes.toArray(), db.produtos.toArray(), db.cadastro.toArray(), db.unidades.toArray(),
    ])
    expect(importacoes).toHaveLength(1)
    expect(importacoes[0].origem).toBe('simulado')
    expect(produtos).toHaveLength(54)
    expect(movs).toHaveLength(2240)
    expect(movs.every((m) => m.importacao_id === importacoes[0].id)).toBe(true)
    expect(movs.map((m) => m.data).sort().at(-1)! <= '2027-03-15').toBe(true)
    expect(movs.map((m) => m.data).sort().at(-1)! >= '2027-03-14').toBe(true)
    expect(cadastro.filter((c) => c.tipo === 'funcionario').map((c) => c.nome)).toEqual(['Funcionário A', 'Funcionário B', 'Funcionário C', 'Funcionário D'])
    expect(cadastro.filter((c) => c.tipo === 'destino').map((c) => c.nome)).toEqual(['Talhão 1', 'Talhão 2', 'Talhão 3', 'Horta', 'Pomar', 'Oficina', 'Galpão', 'Irrigação'])
    expect(unidades.map((u) => u.id)).toContain('mL')
    // Segunda abertura não importa de novo.
    expect(await carregarBaseInicial(db, { hoje: HOJE, agora: AGORA, textoCsv: CSV })).toBe(false)
    expect(await db.movimentacoes.count()).toBe(2240)
  })

  test('registrar retirada: data real, contrato validado, origem identificada, nunca bloqueia por saldo', async () => {
    await carregarBaseInicial(db, { hoje: HOJE, agora: AGORA, textoCsv: CSV })
    const kcl = (await db.produtos.where('nome_canonico').equals('Cloreto de potássio (KCl)').first())!
    const m = await registrar(db, { tipo: 'saida', produtoId: kcl.id, quantidade: 5, unidadeId: 't', destino: 'Talhão 1', responsavel: 'Funcionário B' }, AGORA)
    expect(m).toMatchObject({ data: isoLocal(AGORA), tipo: 'saida', quantidade: 5, unidade_id: 't', dispositivo: 'aparelho', preco_unit: null })
    expect((await db.importacoes.get(m.importacao_id))!.origem).toBe('simulado')
    // 5 t é muito mais que o saldo (250 kg): grava mesmo assim e o motor avisa nos dados.
    const r = analisar(await db.movimentacoes.toArray(), await db.produtos.toArray(), hojeLocal(AGORA))
    expect(r.avisosDados.map((a) => a.produto)).toEqual(['Cloreto de potássio (KCl)'])
  })

  test('registrar recusa unidade de outra dimensão (R1) e dados fora do contrato', async () => {
    await carregarBaseInicial(db, { hoje: HOJE, agora: AGORA, textoCsv: CSV })
    const kcl = (await db.produtos.where('nome_canonico').equals('Cloreto de potássio (KCl)').first())!
    await expect(registrar(db, { tipo: 'saida', produtoId: kcl.id, quantidade: 5, unidadeId: 'L', responsavel: 'Funcionário A' }, AGORA)).rejects.toThrow(/converter/)
    await expect(registrar(db, { tipo: 'entrada', produtoId: kcl.id, quantidade: 5, unidadeId: 'kg', responsavel: 'Funcionário A', precoUnit: -1 }, AGORA)).rejects.toThrow(/preco_unit/)
  })

  test('"Não, são diferentes": a decisão persiste e o alerta daquele par não volta', async () => {
    await carregarBaseInicial(db, { hoje: HOJE, agora: AGORA, textoCsv: CSV })
    const ureia = (await db.produtos.where('nome_canonico').equals('Ureia').first())!
    const ureia45 = (await db.produtos.where('nome_canonico').equals('UREIA 45%').first())!
    await decidirDuplicidade(db, ureia.id, ureia45.id, 'diferente', AGORA)

    const reaberto = criarBanco(db.name) // simula recarregar o app
    const decisoes = await reaberto.decisoes_duplicidade.toArray()
    expect(decisoes).toEqual([expect.objectContaining({ chave: chavePar(ureia.id, ureia45.id), decisao: 'diferente' })])
    const r = analisar(await reaberto.movimentacoes.toArray(), await reaberto.produtos.toArray(), HOJE, {
      paresDiferentes: decisoes.filter((d) => d.decisao === 'diferente').map((d) => [d.produtoA, d.produtoB] as const),
    })
    expect(r.alertas.filter((a) => a.tipo === 'possivel_duplicidade').map((a) => a.evidencia.outroProduto)).toEqual(['Herbicida glifosato 480'])
    reaberto.close()
  })

  test('"Sim, é o mesmo": grava o apelido confirmado; desfazer apaga', async () => {
    await carregarBaseInicial(db, { hoje: HOJE, agora: AGORA, textoCsv: CSV })
    const ureia = (await db.produtos.where('nome_canonico').equals('Ureia').first())!
    const ureia45 = (await db.produtos.where('nome_canonico').equals('UREIA 45%').first())!
    await decidirDuplicidade(db, ureia.id, ureia45.id, 'mesmo', AGORA)
    expect(await db.apelidos.toArray()).toEqual([{ nome_original: 'UREIA 45%', produto_id: ureia.id, confirmado: true }])
    await desfazerDuplicidade(db, ureia.id, ureia45.id)
    expect(await db.apelidos.count()).toBe(0)
    expect(await db.decisoes_duplicidade.count()).toBe(0)
  })

  test('preferências do aparelho (perfil e funcionário atual)', async () => {
    expect(await lerPreferencia(db, 'perfil')).toBeNull()
    await gravarPreferencia(db, 'perfil', 'funcionario')
    await gravarPreferencia(db, 'funcionario', 'Funcionário C')
    expect(await lerPreferencia(db, 'perfil')).toBe('funcionario')
    expect(await lerPreferencia(db, 'funcionario')).toBe('Funcionário C')
    await gravarPreferencia(db, 'perfil', null)
    expect(await lerPreferencia(db, 'perfil')).toBeNull()
  })

  test('recarregar a base apaga os registros do aparelho e mantém as preferências', async () => {
    await carregarBaseInicial(db, { hoje: HOJE, agora: AGORA, textoCsv: CSV })
    const p = (await db.produtos.toArray())[0]
    await registrar(db, { tipo: 'entrada', produtoId: p.id, quantidade: 1, unidadeId: p.unidade_base_id, responsavel: 'Funcionário A' }, AGORA)
    await gravarPreferencia(db, 'perfil', 'dono')
    await recarregarBaseSimulada(db, { hoje: HOJE, agora: AGORA, textoCsv: CSV })
    expect(await db.movimentacoes.count()).toBe(2240)
    expect(await lerPreferencia(db, 'perfil')).toBe('dono')
  })
})

describe('Unificação confirmada (R8)', () => {
  const a = produto({ id: 'a', nome_canonico: 'Ureia' })
  const b = produto({ id: 'b', nome_canonico: 'UREIA 45%' })
  const movs = [
    mov({ produto_id: 'a', tipo: 'entrada', quantidade: 100, data: '2026-10-01' }),
    mov({ produto_id: 'b', tipo: 'entrada', quantidade: 50, data: '2026-10-02' }),
  ]

  test('apelido confirmado junta as movimentações no produto canônico, sem alterar os registros', () => {
    const u = aplicarUnificacoes([a, b], movs, [{ nome_original: 'UREIA 45%', produto_id: 'a', confirmado: true }])
    expect(u.produtos.map((p) => p.id)).toEqual(['a'])
    expect(u.movimentacoes.map((m) => m.produto_id)).toEqual(['a', 'a'])
    expect(u.movimentacoes[1].nome_original).toBe(movs[1].nome_original)
    expect(movs[1].produto_id).toBe('b')
    expect(analisar(u.movimentacoes, u.produtos, HOJE_SIMULADO).produtos[0].saldo).toBe(150)
  })

  test('apelido não confirmado, de outra dimensão ou com números diferentes não junta nada', () => {
    expect(aplicarUnificacoes([a, b], movs, [{ nome_original: 'UREIA 45%', produto_id: 'a', confirmado: false }]).produtos).toHaveLength(2)
    const litros = { ...b, unidade_base_id: 'L' }
    expect(aplicarUnificacoes([a, litros], movs, [{ nome_original: 'UREIA 45%', produto_id: 'a', confirmado: true }]).produtos).toHaveLength(2)
    const npk1 = produto({ id: 'n1', nome_canonico: 'NPK 04-14-08' })
    const npk2 = produto({ id: 'n2', nome_canonico: 'NPK 04-30-16' })
    expect(aplicarUnificacoes([npk1, npk2], [], [{ nome_original: 'NPK 04-30-16', produto_id: 'n1', confirmado: true }]).produtos).toHaveLength(2)
  })
})
