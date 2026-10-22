import { arred } from '../formatacao.ts'
import type { Detector } from './comum.ts'
import { evidenciaBase, evidenciaConsumo, valor } from './comum.ts'

/** Cobertura acima do limite (padrão: 180 dias). */
export const detectarExcesso: Detector = ({ analises }) =>
  analises.flatMap((a) => {
    const limite = a.limites.excesso.coberturaMinimaDias
    if (a.confianca === 'insuficiente' || a.cobertura === null || a.cobertura <= limite) return []
    const excedente = a.saldo - a.consumoDiario * limite
    return [
      {
        tipo: 'excesso',
        nivel: 'informativo',
        produtoId: a.produto.id,
        evidencia: { ...evidenciaBase(a), ...evidenciaConsumo(a), quantidadeExcedente: arred(excedente) },
        regra: `Saldo para mais de ${limite} dias, pelo consumo médio dos últimos ${a.diasJanela} dias.`,
        confianca: a.confianca,
        recomendacao: 'Suspender novas compras deste item até o saldo baixar e verificar a validade dos lotes.',
        valorEnvolvido: valor(excedente, a.precoMedio),
      },
    ]
  })
