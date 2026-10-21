import { SEM_LOTE } from '../consumo.ts'
import { diaDe } from '../datas.ts'
import { arred } from '../formatacao.ts'
import type { AlertaSemMensagem } from '../mensagens.ts'
import type { Detector } from './comum.ts'
import { evidenciaBase, valor } from './comum.ts'

/**
 * Por lote: quantidade do lote > consumo projetado até a validade.
 * Os lotes são consumidos na ordem de validade (o que vence primeiro sai primeiro).
 * Lote sem validade nunca é considerado vencido (R2).
 */
export const detectarVencimento: Detector = ({ analises, hojeDia, config }) =>
  analises.flatMap((a) => {
    const { horizonteDias, diasParaCritico } = config.vencimento
    const lotes = a.lotes.filter((l) => l.saldo > 0 && l.validade !== null).sort((x, y) => (x.validade! < y.validade! ? -1 : 1))
    const alertas: AlertaSemMensagem[] = []
    let consumidoAntes = 0
    for (const l of lotes) {
      const dias = diaDe(l.validade!) - hojeDia
      const projetado = Math.max(0, a.consumoDiario * Math.max(dias, 0) - consumidoAntes)
      const usado = Math.min(projetado, l.saldo)
      consumidoAntes += usado
      const emRisco = dias < 0 ? l.saldo : l.saldo - usado
      if (dias > horizonteDias || emRisco <= 1e-9) continue
      const vencido = dias < 0
      alertas.push({
        tipo: 'vencimento',
        nivel: vencido || dias <= diasParaCritico ? 'critico' : 'atencao',
        produtoId: a.produto.id,
        evidencia: {
          ...evidenciaBase(a),
          lote: l.lote === SEM_LOTE ? 'sem identificação' : l.lote,
          validade: l.validade,
          vencido: vencido ? 'sim' : 'não',
          saldoLote: arred(l.saldo),
          consumoProjetadoAteValidade: vencido ? 0 : arred(projetado),
          quantidadeEmRisco: arred(emRisco),
          consumoMedioDiario: arred(a.consumoDiario, 3),
        },
        regra: vencido
          ? 'Lote com validade vencida e ainda com saldo.'
          : 'Quantidade do lote maior que o consumo previsto até a validade, pelo consumo médio recente.',
        confianca: vencido ? 'alta' : a.confianca,
        recomendacao: vencido
          ? 'Separar o lote vencido, não aplicar e verificar a destinação correta com o fornecedor.'
          : 'Usar este lote primeiro, avaliar remanejar para outra área ou negociar troca com o fornecedor.',
        valorEnvolvido: valor(emRisco, l.precoUnitBase ?? a.precoMedio),
      })
    }
    return alertas
  })
