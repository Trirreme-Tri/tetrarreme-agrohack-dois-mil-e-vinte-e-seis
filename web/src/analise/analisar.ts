// Função principal do motor. Pura e determinística: recebe `hoje`, não lê o relógio,
// não persiste nada. Chamar de novo com novas movimentações recalcula tudo (R6).
import { CONFIG_PADRAO, chaveDoProduto, limitesPara } from './config.ts'
import type { ConfigAnalise } from './config.ts'
import { SEM_LOTE, analisarProduto } from './consumo.ts'
import type { AnaliseProduto } from './consumo.ts'
import { diaDeDate, isoDeDia } from './datas.ts'
import { DETECTORES } from './detectores/index.ts'
import { resumirFinanceiro } from './financeiro.ts'
import type { ResumoFinanceiro } from './financeiro.ts'
import { comMensagem } from './mensagens.ts'
import { chavePar } from './produtos.ts'
import type { Alerta, Importacao, Movimentacao, NivelAlerta, Origem, Produto } from '@tetrarreme/contrato'

export interface OpcoesAnalise {
  config?: ConfigAnalise
  /** Se informadas, o resultado diz de que origem vieram os dados (R7). */
  importacoes?: readonly Importacao[]
  /** Pares de produtos que uma pessoa já disse serem diferentes: não geram mais possível duplicidade (R8). */
  paresDiferentes?: readonly (readonly [string, string])[]
}

/** Problema na configuração de limites. Não é alerta de estoque: é para quem mantém a config. */
export interface AvisoConfiguracao {
  tipo: 'produto_nao_encontrado'
  /** Chave de `porProduto` sem produto correspondente. */
  chave: string
  mensagem: string
}

/** Problema na qualidade dos registros. Não é alerta de estoque: pede conferência dos dados. */
export interface AvisoDados {
  tipo: 'saldo_negativo'
  produtoId: string
  produto: string
  /** Saldo total na unidade base (pode ser negativo). */
  saldo: number
  /** Lotes com saldo negativo ("sem lote" para retiradas sem lote que superaram os lotes). */
  lotesNegativos: string[]
  mensagem: string
}

export const MENSAGEM_SALDO_NEGATIVO =
  'Saídas maiores que as entradas registradas — verificar se falta registrar alguma entrada'

/** Produtos com saldo negativo (no total ou em algum lote): as saídas superam as entradas registradas. */
export function verificarDados(analises: readonly AnaliseProduto[]): AvisoDados[] {
  return analises.flatMap((a) => {
    const lotesNegativos = a.lotes.filter((l) => l.saldo < 0).map((l) => (l.lote === SEM_LOTE ? 'sem lote' : l.lote))
    if (a.saldo >= 0 && lotesNegativos.length === 0) return []
    return [{
      tipo: 'saldo_negativo' as const,
      produtoId: a.produto.id,
      produto: a.produto.nome_canonico,
      saldo: Math.round(a.saldo * 1000) / 1000,
      lotesNegativos,
      mensagem: MENSAGEM_SALDO_NEGATIVO,
    }]
  })
}

export interface ResultadoAnalise {
  /** Data de referência da análise, `AAAA-MM-DD`. */
  data: string
  /** Ordenados por nível e, dentro do nível, por valor envolvido (R5). */
  alertas: Alerta[]
  resumoFinanceiro: ResumoFinanceiro
  produtos: AnaliseProduto[]
  /** Origens das importações usadas; vazio se `importacoes` não foi informado. */
  origens: Origem[]
  /** Ajustes da configuração que não estão sendo aplicados (ex.: nome de produto digitado errado). */
  avisosConfiguracao: AvisoConfiguracao[]
  /** Problemas de qualidade dos registros (ex.: saldo negativo), separados dos alertas de estoque. */
  avisosDados: AvisoDados[]
}

/** Chaves de `porProduto` que não correspondem a nenhum produto: o ajuste seria ignorado em silêncio. */
export function verificarConfiguracao(produtos: readonly Produto[], config: ConfigAnalise): AvisoConfiguracao[] {
  const usadas = new Set(produtos.map((p) => chaveDoProduto(p.nome_canonico, config.porProduto)))
  return Object.keys(config.porProduto)
    .filter((chave) => !usadas.has(chave))
    .map((chave) => ({
      tipo: 'produto_nao_encontrado' as const,
      chave,
      mensagem: `O ajuste de limites para "${chave}" não corresponde a nenhum produto cadastrado e não está sendo aplicado. Confira o nome.`,
    }))
}

const ORDEM_NIVEL: Record<NivelAlerta, number> = { critico: 0, atencao: 1, informativo: 2 }

/** R5: nível; dentro do nível, maior valor envolvido primeiro (sem valor por último). */
export function ordenarAlertas(alertas: readonly Alerta[]): Alerta[] {
  return [...alertas].sort(
    (a, b) =>
      ORDEM_NIVEL[a.nivel] - ORDEM_NIVEL[b.nivel] ||
      (b.valorEnvolvido ?? -Infinity) - (a.valorEnvolvido ?? -Infinity) ||
      a.tipo.localeCompare(b.tipo) ||
      a.produtoId.localeCompare(b.produtoId),
  )
}

export function analisar(
  movimentacoes: readonly Movimentacao[],
  produtos: readonly Produto[],
  hoje: Date,
  opcoes: OpcoesAnalise = {},
): ResultadoAnalise {
  const config = opcoes.config ?? CONFIG_PADRAO
  const hojeDia = diaDeDate(hoje)

  const porProduto = new Map<string, Movimentacao[]>(produtos.map((p) => [p.id, []]))
  for (const m of movimentacoes) {
    if (!m.importacao_id) throw new Error(`Movimentação ${m.id} sem importação de origem (R7).`)
    const lista = porProduto.get(m.produto_id)
    if (!lista) throw new Error(`Movimentação ${m.id} aponta para produto desconhecido: ${m.produto_id}.`)
    lista.push(m)
  }

  const analises = produtos.map((p) => analisarProduto(p, porProduto.get(p.id)!, hojeDia, limitesPara(p, config)))
  // Os detectores não leem a configuração: recebem os limites já resolvidos por produto e os globais.
  const paresDiferentes = new Set((opcoes.paresDiferentes ?? []).map(([a, b]) => chavePar(a, b)))
  const ctx = { analises, hojeDia, globais: config.globais, paresDiferentes }
  const alertas = DETECTORES.flatMap((detectar) => detectar(ctx)).map(comMensagem)

  let origens: Origem[] = []
  if (opcoes.importacoes) {
    const usadas = new Set(movimentacoes.map((m) => m.importacao_id))
    origens = [...new Set(opcoes.importacoes.filter((i) => usadas.has(i.id)).map((i) => i.origem))].sort()
  }

  return {
    data: isoDeDia(hojeDia),
    alertas: ordenarAlertas(alertas),
    resumoFinanceiro: resumirFinanceiro(analises),
    produtos: analises,
    origens,
    avisosConfiguracao: verificarConfiguracao(produtos, config),
    avisosDados: verificarDados(analises),
  }
}
