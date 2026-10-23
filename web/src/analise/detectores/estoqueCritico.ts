import { arred } from '../formatacao.ts'
import type { Detector } from './comum.ts'
import { evidenciaBase, evidenciaConsumo, evidenciaReposicao, limiteUsado } from './comum.ts'

/** Saldo ≤ estoque mínimo, ou cobertura < limite (só com histórico suficiente). */
export const detectarEstoqueCritico: Detector = ({ analises }) =>
  analises.flatMap((a) => {
    const limite = a.limites.estoqueCritico.coberturaMaximaDias
    const minimo = a.produto.estoque_minimo
    const abaixoMinimo = minimo !== null && a.saldo <= minimo
    const coberturaCurta = a.confianca !== 'insuficiente' && a.cobertura !== null && a.cobertura < limite
    if (!abaixoMinimo && !coberturaCurta) return []
    const usado = limiteUsado(a, 'estoqueCritico.coberturaMaximaDias')
    const reposicao = evidenciaReposicao(a)
    return [
      {
        tipo: 'estoque_critico',
        nivel: 'critico',
        produtoId: a.produto.id,
        evidencia: { ...evidenciaBase(a), ...evidenciaConsumo(a), estoqueMinimo: minimo === null ? null : arred(minimo), ...reposicao, origemLimite: usado.origemLimite },
        regra: usado.regra(`Saldo igual ou abaixo do estoque mínimo, ou saldo para menos de ${limite} dias de consumo.`),
        confianca: a.confianca,
        recomendacao: 'Providenciar a compra agora e conferir o saldo físico no galpão.',
        valorEnvolvido: reposicao.valorReposicao,
      },
    ]
  })
