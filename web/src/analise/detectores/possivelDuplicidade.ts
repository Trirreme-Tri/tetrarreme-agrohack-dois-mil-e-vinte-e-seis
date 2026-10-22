import { arred } from '../formatacao.ts'
import { sugerirDuplicidades } from '../produtos.ts'
import type { Detector } from './comum.ts'
import { evidenciaBase } from './comum.ts'

/** Nomes normalizados semelhantes e mesmos números (R8). Só sugere: quem unifica é uma pessoa. */
export const detectarPossivelDuplicidade: Detector = ({ analises, config }) => {
  const porId = new Map(analises.map((a) => [a.produto.id, a]))
  return sugerirDuplicidades(
    analises.map((a) => a.produto),
    config.duplicidade,
  ).map(({ produtoA, produtoB, similaridade }) => {
    // O alerta fica no produto cadastrado por último (o provável apelido).
    const a = porId.get(produtoB.id)!
    const outro = porId.get(produtoA.id)!
    const valores = [a.valorEstoque, outro.valorEstoque].filter((v) => v !== null)
    return {
      tipo: 'possivel_duplicidade' as const,
      nivel: 'atencao' as const,
      produtoId: produtoB.id,
      evidencia: {
        ...evidenciaBase(a),
        outroProduto: produtoA.nome_canonico,
        outroProdutoId: produtoA.id,
        similaridade: arred(similaridade),
        saldo: arred(a.saldo),
        saldoOutroProduto: arred(outro.saldo),
      },
      regra: 'Nomes parecidos e sem números diferentes (dosagem, formulação).',
      confianca: 'media' as const,
      recomendacao: 'Verificar se é o mesmo produto. Se for, confirmar a unificação; enquanto isso, os saldos ficam separados.',
      valorEnvolvido: valores.length ? arred(valores.reduce((t, v) => t + v, 0)) : null,
    }
  })
}
