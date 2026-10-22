import type { Detector } from './comum.ts'
import { evidenciaBase, evidenciaConsumo, limiteUsado, valor } from './comum.ts'

/** Cobertura entre os limites (padrão: 7 a 30 dias). */
export const detectarRupturaPrevista: Detector = ({ analises }) =>
  analises.flatMap((a) => {
    const { coberturaMinimaDias: min, coberturaMaximaDias: max } = a.limites.rupturaPrevista
    const minimo = a.produto.estoque_minimo
    if (minimo !== null && a.saldo <= minimo) return [] // já é estoque crítico
    if (a.confianca === 'insuficiente' || a.cobertura === null) return []
    if (a.cobertura < min || a.cobertura > max) return []
    const usado = limiteUsado(a, 'rupturaPrevista.coberturaMinimaDias', 'rupturaPrevista.coberturaMaximaDias')
    return [
      {
        tipo: 'ruptura_prevista',
        nivel: 'atencao',
        produtoId: a.produto.id,
        evidencia: { ...evidenciaBase(a), ...evidenciaConsumo(a), origemLimite: usado.origemLimite },
        regra: usado.regra(`Saldo para ${min} a ${max} dias, pelo consumo médio dos últimos ${a.diasJanela} dias.`),
        confianca: a.confianca,
        recomendacao: 'Planejar a compra considerando o prazo de entrega do fornecedor.',
        valorEnvolvido: valor(a.consumoDiario * a.limites.diasReposicao, a.precoMedio),
      },
    ]
  })
