import type { Detector } from './comum.ts'
import { detectarConsumoCrescente } from './consumoCrescente.ts'
import { detectarDevolucaoEmbalagem } from './devolucaoEmbalagem.ts'
import { detectarEstoqueCritico } from './estoqueCritico.ts'
import { detectarExcesso } from './excesso.ts'
import { detectarItemParado } from './itemParado.ts'
import { detectarPossivelDuplicidade } from './possivelDuplicidade.ts'
import { detectarRetiradaAtipica } from './retiradaAtipica.ts'
import { detectarRupturaPrevista } from './rupturaPrevista.ts'
import { detectarVariacaoPreco } from './variacaoPreco.ts'
import { detectarVencimento } from './vencimento.ts'

export type { ContextoDeteccao, Detector } from './comum.ts'

export const DETECTORES: readonly Detector[] = [
  detectarEstoqueCritico,
  detectarRupturaPrevista,
  detectarVencimento,
  detectarConsumoCrescente,
  detectarRetiradaAtipica,
  detectarExcesso,
  detectarItemParado,
  detectarVariacaoPreco,
  detectarPossivelDuplicidade,
  detectarDevolucaoEmbalagem,
]
