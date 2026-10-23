import { arred } from '../formatacao.ts'
import type { AlertaSemMensagem } from '../mensagens.ts'
import type { Detector } from './comum.ts'
import { evidenciaBase, evidenciaConsumo, limiteUsado, valor } from './comum.ts'

/**
 * Excesso por dois critérios:
 * - com consumo recente: cobertura acima do limite (padrão: 180 dias);
 * - sem consumo na janela (cobertura nula): saldo maior que N × o estoque mínimo (padrão: 10 ×),
 *   quando o produto tem estoque mínimo. É fato registrado, não estimativa.
 */
export const detectarExcesso: Detector = ({ analises }) =>
  analises.flatMap((a): AlertaSemMensagem[] => {
    const { coberturaMinimaDias: limite, multiploEstoqueMinimoSemConsumo: multiplo } = a.limites.excesso
    const minimo = a.produto.estoque_minimo

    if (a.cobertura === null) {
      if (minimo === null || minimo <= 0 || a.saldo <= multiplo * minimo) return []
      const usado = limiteUsado(a, 'excesso.multiploEstoqueMinimoSemConsumo')
      const excedente = a.saldo - multiplo * minimo
      return [
        {
          tipo: 'excesso',
          nivel: 'informativo',
          produtoId: a.produto.id,
          evidencia: {
            ...evidenciaBase(a),
            criterio: 'estoque_minimo',
            saldo: arred(a.saldo),
            estoqueMinimo: arred(minimo),
            multiploEstoqueMinimo: multiplo,
            vezesEstoqueMinimo: arred(a.saldo / minimo, 1),
            janelaConsumoDias: a.diasJanela,
            ultimaSaida: a.ultimaSaida,
            quantidadeExcedente: arred(excedente),
            origemLimite: usado.origemLimite,
          },
          regra: usado.regra(
            `Sem retiradas nos últimos ${a.diasJanela} dias e saldo maior que ${multiplo} vezes o estoque mínimo.`,
          ),
          confianca: 'fato',
          recomendacao: 'Suspender novas compras deste item e verificar se ele ainda será usado; se não, avaliar devolução ou remanejamento.',
          valorEnvolvido: valor(excedente, a.precoMedio),
        },
      ]
    }

    if (a.confianca === 'insuficiente' || a.cobertura <= limite) return []
    const excedente = a.saldo - a.consumoDiario * limite
    const usado = limiteUsado(a, 'excesso.coberturaMinimaDias')
    return [
      {
        tipo: 'excesso',
        nivel: 'informativo',
        produtoId: a.produto.id,
        evidencia: { ...evidenciaBase(a), criterio: 'cobertura', ...evidenciaConsumo(a), quantidadeExcedente: arred(excedente), origemLimite: usado.origemLimite },
        regra: usado.regra(`Saldo para mais de ${limite} dias, pelo consumo médio dos últimos ${a.diasJanela} dias.`),
        confianca: a.confianca,
        recomendacao: 'Suspender novas compras deste item até o saldo baixar e verificar a validade dos lotes.',
        valorEnvolvido: valor(excedente, a.precoMedio),
      },
    ]
  })
