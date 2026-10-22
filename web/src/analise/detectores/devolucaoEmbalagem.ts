import { SEM_LOTE } from '../consumo.ts'
import { diaDe, isoDeDia } from '../datas.ts'
import type { Detector } from './comum.ts'
import { evidenciaBase, limiteUsado } from './comum.ts'

/**
 * Extra (Victor): lote de defensivo zerado → devolver as embalagens vazias dentro do prazo.
 * Nível progressivo conforme o prazo se aproxima: informativo → atenção → crítico.
 */
export const detectarDevolucaoEmbalagem: Detector = ({ analises, hojeDia, globais }) =>
  analises.flatMap((a) => {
    if (!globais.categoriasDevolucaoEmbalagem.includes(a.produto.categoria)) return []
    const usado = limiteUsado(a, 'devolucaoEmbalagem.prazoDias', 'devolucaoEmbalagem.diasAtencao', 'devolucaoEmbalagem.diasCritico')
    const { prazoDias, diasAtencao, diasCritico } = a.limites.devolucaoEmbalagem
    const nivelPara = (faltam: number) => (faltam <= diasCritico ? 'critico' : faltam <= diasAtencao ? 'atencao' : 'informativo')
    return a.lotes
      .filter((l) => l.zeradoEm !== null && l.primeiraEntrada !== null)
      .filter((l) => hojeDia <= diaDe(l.primeiraEntrada!) + prazoDias)
      .map((l) => ({
        tipo: 'devolucao_embalagem' as const,
        nivel: nivelPara(diaDe(l.primeiraEntrada!) + prazoDias - hojeDia),
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
        regra: usado.regra(
          `Lote de defensivo esgotado; a embalagem vazia deve ser devolvida em até ${prazoDias} dias da compra. Atenção a partir de ${diasAtencao} dias do prazo; crítico a partir de ${diasCritico} dias.`,
        ),
        confianca: 'alta' as const,
        recomendacao: 'Fazer a tríplice lavagem e devolver as embalagens no posto de recebimento indicado na nota fiscal, se ainda não devolveu.',
        valorEnvolvido: null,
      }))
  })
