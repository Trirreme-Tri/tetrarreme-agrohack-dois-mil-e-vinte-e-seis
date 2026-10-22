import { SEM_LOTE } from '../consumo.ts'
import { diaDe, isoDeDia } from '../datas.ts'
import type { Detector } from './comum.ts'
import { evidenciaBase, limiteUsado } from './comum.ts'

/** Extra (Victor): lote de defensivo zerado → devolver as embalagens vazias dentro do prazo. */
export const detectarDevolucaoEmbalagem: Detector = ({ analises, hojeDia, globais }) =>
  analises.flatMap((a) => {
    if (!globais.categoriasDevolucaoEmbalagem.includes(a.produto.categoria)) return []
    const usado = limiteUsado(a, 'devolucaoEmbalagem.prazoDias')
    const { prazoDias } = a.limites.devolucaoEmbalagem
    return a.lotes
      .filter((l) => l.zeradoEm !== null && l.primeiraEntrada !== null)
      .filter((l) => hojeDia <= diaDe(l.primeiraEntrada!) + prazoDias)
      .map((l) => ({
        tipo: 'devolucao_embalagem' as const,
        nivel: 'informativo' as const,
        produtoId: a.produto.id,
        evidencia: {
          ...evidenciaBase(a),
          lote: l.lote === SEM_LOTE ? 'sem identificação' : l.lote,
          dataCompra: l.primeiraEntrada,
          zeradoEm: l.zeradoEm,
          prazoDevolucao: isoDeDia(diaDe(l.primeiraEntrada!) + prazoDias),
          diasAtePrazo: diaDe(l.primeiraEntrada!) + prazoDias - hojeDia,
          saldoLote: 0,
          origemLimite: usado.origemLimite,
        },
        regra: usado.regra(`Lote de defensivo esgotado; a embalagem vazia deve ser devolvida em até ${prazoDias} dias da compra (prazo provisório).`),
        confianca: 'alta' as const,
        recomendacao: 'Fazer a tríplice lavagem e devolver as embalagens no posto de recebimento indicado na nota fiscal, se ainda não devolveu.',
        valorEnvolvido: null,
      }))
  })
