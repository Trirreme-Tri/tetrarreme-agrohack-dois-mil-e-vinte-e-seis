import { diaDe } from '../datas.ts'
import { arred } from '../formatacao.ts'
import type { Detector } from './comum.ts'
import { evidenciaBase, limiteUsado } from './comum.ts'

/** Valor em estoque entre os maiores (padrão: top 20%) e sem saída há mais de N dias. */
export const detectarItemParado: Detector = ({ analises, hojeDia, globais }) => {
  const fracaoTopValor = globais.itemParadoFracaoTopValor
  const comValor = analises
    .filter((a) => a.saldo > 0 && a.valorEstoque !== null && a.valorEstoque > 0)
    .sort((x, y) => y.valorEstoque! - x.valorEstoque!)
  const topo = comValor.slice(0, Math.max(1, Math.ceil(comValor.length * fracaoTopValor)))
  return topo.flatMap((a) => {
    const referencia = a.ultimaSaida ?? a.primeiraEntrada ?? a.primeiraMovimentacao
    if (referencia === null) return []
    const dias = hojeDia - diaDe(referencia)
    const { diasSemSaida } = a.limites.itemParado
    if (dias <= diasSemSaida) return []
    const usado = limiteUsado(a, 'itemParado.diasSemSaida')
    return [
      {
        tipo: 'item_parado',
        nivel: 'informativo',
        produtoId: a.produto.id,
        evidencia: {
          ...evidenciaBase(a),
          saldo: arred(a.saldo),
          valorEstoque: arred(a.valorEstoque!),
          posicaoNoValor: comValor.indexOf(a) + 1,
          produtosComValor: comValor.length,
          ultimaSaida: a.ultimaSaida,
          diasSemSaida: dias,
          origemLimite: usado.origemLimite,
        },
        regra: usado.regra(`Entre os ${Math.round(fracaoTopValor * 100)}% itens de maior valor em estoque e sem retirada há mais de ${diasSemSaida} dias.`),
        confianca: 'alta',
        recomendacao: 'Avaliar se o item ainda será usado nesta safra; se não, evitar novas compras ou negociar devolução.',
        valorEnvolvido: arred(a.valorEstoque!),
      },
    ]
  })
}
