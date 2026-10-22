import { diaDe } from '../datas.ts'
import { arred } from '../formatacao.ts'
import type { Confianca } from '@tetrarreme/contrato'
import type { Detector } from './comum.ts'
import { evidenciaBase } from './comum.ts'

/** Última compra com preço difere mais que o limite da média das compras anteriores. */
export const detectarVariacaoPreco: Detector = ({ analises, hojeDia, config }) =>
  analises.flatMap((a) => {
    const c = config.variacaoPreco
    const ultima = a.compras.at(-1)
    const anteriores = a.compras.slice(0, -1)
    if (!ultima || anteriores.length < c.minimoComprasAnteriores) return []
    if (hojeDia - diaDe(ultima.data) > c.janelaDias) return []
    const media = anteriores.reduce((t, x) => t + x.precoUnitBase, 0) / anteriores.length
    const variacao = (ultima.precoUnitBase - media) / media
    if (Math.abs(variacao) <= c.variacaoMinima) return []
    const confianca: Confianca = anteriores.length >= 5 ? 'alta' : anteriores.length >= 3 ? 'media' : 'baixa'
    return [
      {
        tipo: 'variacao_preco',
        nivel: 'informativo',
        produtoId: a.produto.id,
        evidencia: {
          ...evidenciaBase(a),
          dataCompra: ultima.data,
          precoCompra: arred(ultima.precoUnitBase),
          precoMedioAnterior: arred(media),
          variacaoPercentual: arred(variacao * 100, 1),
          comprasAnteriores: anteriores.length,
          quantidadeComprada: arred(ultima.quantidade),
        },
        regra: `Preço da última compra difere mais de ${Math.round(c.variacaoMinima * 100)}% da média das compras anteriores.`,
        confianca,
        recomendacao: 'Conferir a nota fiscal e cotar com outros fornecedores antes da próxima compra.',
        valorEnvolvido: arred(Math.abs(ultima.precoUnitBase - media) * ultima.quantidade),
      },
    ]
  })
