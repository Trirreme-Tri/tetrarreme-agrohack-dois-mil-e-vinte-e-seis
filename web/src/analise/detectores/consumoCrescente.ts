import { diaDe } from '../datas.ts'
import { arred } from '../formatacao.ts'
import type { Detector } from './comum.ts'
import { evidenciaBase, valor } from './comum.ts'

/** Consumo dos últimos N dias > fator × os N dias anteriores. */
export const detectarConsumoCrescente: Detector = ({ analises, hojeDia, config }) =>
  analises.flatMap((a) => {
    const { janelaDias: n, fatorAumento } = config.consumoCrescente
    if (a.confianca === 'insuficiente') return []
    let recente = 0
    let anterior = 0
    for (const s of a.saidas) {
      const idade = hojeDia - diaDe(s.data)
      if (idade < n) recente += s.quantidade
      else if (idade < 2 * n) anterior += s.quantidade
    }
    if (anterior <= 0 || recente <= fatorAumento * anterior) return []
    return [
      {
        tipo: 'consumo_crescente',
        nivel: 'atencao',
        produtoId: a.produto.id,
        evidencia: {
          ...evidenciaBase(a),
          consumoRecente: arred(recente),
          consumoAnterior: arred(anterior),
          razao: arred(recente / anterior, 1),
          janelaDias: n,
        },
        regra: `Consumo dos últimos ${n} dias maior que ${String(fatorAumento).replace('.', ',')} vezes o dos ${n} dias anteriores.`,
        confianca: a.confianca,
        recomendacao: 'Confirmar se o aumento é esperado (época de plantio, nova área) e revisar a previsão de compra.',
        valorEnvolvido: valor(recente - anterior, a.precoMedio),
      },
    ]
  })
