// @vitest-environment jsdom
// Integração da interface com o banco local (fake-indexeddb) e o motor (Testing Library).
import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test } from 'vitest'
import { analisar } from '../src/analise/analisar.ts'
import { App } from '../src/app/App.tsx'
import { criarBanco } from '../src/dados/banco.ts'
import { HOJE_SIMULADO, carregarBaseSimulada } from './apoio.ts'

// O app recebe a data local; ao meio-dia de 20/10/2026 a base não é deslocada (deslocamento 0).
const AGORA = () => new Date(2026, 9, 20, 12, 0, 0)
let n = 0
const nomeBanco = () => `teste-interface-${++n}`

afterEach(() => cleanup())

async function abrirComoDono(nome: string) {
  const usuario = userEvent.setup()
  render(<App db={criarBanco(nome)} agora={AGORA} />)
  await usuario.click(await screen.findByRole('button', { name: /Sou o dono/ }, { timeout: 20000 }))
  await screen.findByText('O que merece atenção')
  return usuario
}

function cartoes(): string[] {
  return screen.getAllByTestId('cartao-alerta').map((c) => `${c.dataset.produto} | ${c.dataset.tipo}`)
}

describe('Interface', () => {
  test('carga inicial: o painel mostra exatamente os alertas que analisar() devolve', async () => {
    await abrirComoDono(nomeBanco())
    const base = carregarBaseSimulada()
    const nomes = new Map(base.produtosNovos.map((p) => [p.id, p.nome_canonico]))
    const esperado = analisar(base.movimentacoes, base.produtosNovos, HOJE_SIMULADO).alertas.map((a) => `${nomes.get(a.produtoId)} | ${a.tipo}`)
    expect(cartoes()).toEqual(esperado) // mesma lista e mesma ordem (R5)
    expect(screen.getByRole('button', { name: `Todas (${esperado.length})` })).toBeInTheDocument()
    expect(screen.getByText(/Dados simulados · análise de 20\/10\/2026/)).toBeInTheDocument()
  }, 60000)

  test('reanálise: uma retirada grande do glifosato muda o alerta de ruptura_prevista para estoque_critico', async () => {
    const nome = nomeBanco()
    const usuario = await abrirComoDono(nome)
    expect(cartoes()).toContain('Herbicida glifosato 480 | ruptura_prevista')

    // Funcionário registra a retirada pelo fluxo do app.
    await usuario.click(screen.getByRole('button', { name: /Trocar perfil/ }))
    await usuario.click(await screen.findByRole('button', { name: /Sou funcionário/ }))
    await usuario.click(await screen.findByRole('button', { name: /Funcionário A/ }))
    await usuario.click(await screen.findByRole('button', { name: /Registrar retirada/ }))
    await usuario.type(await screen.findByRole('searchbox', { name: /Buscar produto/ }), 'glifosato')
    await usuario.click(screen.getByRole('button', { name: /Herbicida glifosato 480/ }))
    for (const k of ['4', '5']) await usuario.click(await screen.findByRole('button', { name: k }))
    expect(screen.getByTestId('visor')).toHaveTextContent('45 L')
    await usuario.click(screen.getByRole('button', { name: /Continuar/ }))
    await usuario.click(await screen.findByRole('button', { name: /Talhão 1/ }))
    await usuario.click(screen.getByRole('button', { name: /Confirmar retirada/ }))
    await screen.findByText('Registrado!')
    expect(screen.getByText(/1 registro aguardando envio/)).toBeInTheDocument()

    // O painel do dono já mostra a nova análise (R6).
    await usuario.click(screen.getByRole('button', { name: /Voltar ao início/ }))
    await usuario.click(screen.getByRole('button', { name: /Trocar perfil/ }))
    await usuario.click(await screen.findByRole('button', { name: /Sou o dono/ }))
    await screen.findByText('O que merece atenção')
    await waitFor(() => expect(cartoes()).toContain('Herbicida glifosato 480 | estoque_critico'))
    expect(cartoes()).not.toContain('Herbicida glifosato 480 | ruptura_prevista')
  }, 60000)

  test('"Não, são diferentes" faz o alerta de duplicidade sumir e não voltar depois de recarregar', async () => {
    const nome = nomeBanco()
    const usuario = await abrirComoDono(nome)
    const cartao = screen.getAllByTestId('cartao-alerta').find((c) => c.dataset.produto === 'UREIA 45%' && c.dataset.tipo === 'possivel_duplicidade')!
    await usuario.click(within(cartao).getByRole('button'))
    await usuario.click(await screen.findByRole('button', { name: /Não, são diferentes/ }))
    await screen.findByText('Resposta registrada')
    await usuario.click(screen.getByRole('button', { name: /Voltar/ }))
    await screen.findByText('O que merece atenção')
    await waitFor(() => expect(cartoes()).not.toContain('UREIA 45% | possivel_duplicidade'))
    expect(cartoes()).toContain('Herbicida glifozato 480 | possivel_duplicidade') // o outro par continua

    // Recarregar: novo app sobre o mesmo banco. O perfil ficou guardado e o alerta não volta.
    cleanup()
    render(<App db={criarBanco(nome)} agora={AGORA} />)
    await screen.findByText('O que merece atenção', undefined, { timeout: 20000 })
    expect(cartoes()).not.toContain('UREIA 45% | possivel_duplicidade')
  }, 60000)
})
