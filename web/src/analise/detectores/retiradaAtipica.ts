import { diaDe } from '../datas.ts'
import { arred } from '../formatacao.ts'
import type { AlertaSemMensagem } from '../mensagens.ts'
import type { Detector } from './comum.ts'
import { evidenciaBase, limiteUsado, valor } from './comum.ts'

export function mediana(valores: readonly number[]): number {
  const v = [...valores].sort((a, b) => a - b)
  const m = Math.floor(v.length / 2)
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2
}

/**
 * Retirada recente > mediana + k × MAD das retiradas anteriores do produto.
 * Exige um mínimo de retiradas anteriores.
 */
export const detectarRetiradaAtipica: Detector = ({ analises, hojeDia }) =>
  analises.flatMap((a) => {
    const c = a.limites.retiradaAtipica
    const alertas: AlertaSemMensagem[] = []
    a.saidas.forEach((s, i) => {
      if (hojeDia - diaDe(s.data) >= c.janelaRecenteDias) return
      const anteriores = a.saidas.slice(0, i).map((x) => x.quantidade)
      if (anteriores.length < c.minimoSaidas) return
      const med = mediana(anteriores)
      const mad = Math.max(mediana(anteriores.map((x) => Math.abs(x - med))), c.madMinimoFracaoMediana * med)
      const limite = med + c.multiplicadorMad * mad
      if (s.quantidade <= limite) return
      const usado = limiteUsado(a, 'retiradaAtipica.multiplicadorMad', 'retiradaAtipica.minimoSaidas')
      alertas.push({
        tipo: 'retirada_atipica',
        nivel: 'atencao',
        produtoId: a.produto.id,
        evidencia: {
          ...evidenciaBase(a),
          data: s.data,
          quantidade: arred(s.quantidade),
          mediana: arred(med),
          mad: arred(mad),
          limite: arred(limite),
          retiradasAnteriores: anteriores.length,
          origemLimite: usado.origemLimite,
        },
        regra: usado.regra(`Retirada maior que a mediana + ${c.multiplicadorMad} × o desvio típico (MAD) das ${anteriores.length} retiradas anteriores.`),
        confianca: a.confianca,
        recomendacao: 'Conferir com o responsável pela retirada se a quantidade está correta e qual foi o destino.',
        valorEnvolvido: valor(s.quantidade, a.precoMedio),
      })
    })
    return alertas
  })
