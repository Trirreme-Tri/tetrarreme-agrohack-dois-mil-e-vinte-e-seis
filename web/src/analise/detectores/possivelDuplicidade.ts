import { arred } from '../formatacao.ts'
import { chavePar, sugerirDuplicidades } from '../produtos.ts'
import type { AnaliseProduto } from '../consumo.ts'
import type { Detector } from './comum.ts'
import { evidenciaBase } from './comum.ts'

function cadastradoAntes(x: AnaliseProduto, y: AnaliseProduto): boolean {
  const dx = x.primeiraMovimentacao ?? '9999-99-99'
  const dy = y.primeiraMovimentacao ?? '9999-99-99'
  return dx !== dy ? dx < dy : x.produto.nome_canonico.localeCompare(y.produto.nome_canonico) <= 0
}

/** Nomes normalizados semelhantes e mesmos números (R8). Só sugere: quem unifica é uma pessoa. */
export const detectarPossivelDuplicidade: Detector = ({ analises, globais, paresDiferentes }) => {
  const porId = new Map(analises.map((a) => [a.produto.id, a]))
  return sugerirDuplicidades(
    analises.map((a) => a.produto),
    globais.duplicidade,
  )
    // Par que uma pessoa já disse serem produtos diferentes: o alerta não volta.
    .filter(({ produtoA, produtoB }) => !paresDiferentes.has(chavePar(produtoA.id, produtoB.id)))
    .map(({ produtoA: p1, produtoB: p2, similaridade }) => {
    // O alerta fica no produto que apareceu por último (o provável apelido): primeira movimentação
    // mais recente; empate pelo nome. Não depende da ordem da lista de produtos.
    const [produtoA, produtoB] = cadastradoAntes(porId.get(p1.id)!, porId.get(p2.id)!) ? [p1, p2] : [p2, p1]
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
        origemLimite: 'critério global',
      },
      regra: 'Nomes parecidos e sem números diferentes de dosagem ou formulação (critério global).',
      confianca: 'fato' as const,
      recomendacao: 'Verificar se é o mesmo produto. Se for, confirmar a unificação; enquanto isso, os saldos ficam separados.',
      valorEnvolvido: valores.length ? arred(valores.reduce((t, v) => t + v, 0)) : null,
    }
  })
}
