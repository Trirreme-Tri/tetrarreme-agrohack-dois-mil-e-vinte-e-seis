// Limites da análise. TODOS SÃO PROVISÓRIOS, aguardando calibração com o Victor.
// Este é o único lugar onde ficam (CLAUDE.md, seção 6).

export interface ConfigAnalise {
  /** Janela para o consumo médio diário recente, usado na cobertura. */
  janelaConsumoDias: number
  confianca: {
    /** Menos saídas que isto: `insuficiente`. */
    saidasInsuficiente: number
    /** Menos saídas que isto (ou histórico curto): `baixa`. */
    saidasBaixa: number
    /** Histórico mais curto que isto: no máximo `baixa`. */
    historicoMinimoDias: number
    /** Menos saídas que isto: `media`. Senão: `alta`. */
    saidasMedia: number
  }
  estoqueCritico: { coberturaMaximaDias: number }
  rupturaPrevista: { coberturaMinimaDias: number; coberturaMaximaDias: number }
  vencimento: {
    /** Só avalia lotes que vencem dentro deste horizonte. */
    horizonteDias: number
    /** Lote vencido ou que vence em até estes dias: `critico`. */
    diasParaCritico: number
  }
  consumoCrescente: { janelaDias: number; fatorAumento: number }
  retiradaAtipica: {
    minimoSaidas: number
    multiplicadorMad: number
    /** Só avalia retiradas feitas nestes últimos dias. */
    janelaRecenteDias: number
    /** Piso do MAD, como fração da mediana (evita alerta quando todas as doses são iguais). */
    madMinimoFracaoMediana: number
  }
  excesso: { coberturaMinimaDias: number }
  itemParado: { fracaoTopValor: number; diasSemSaida: number }
  variacaoPreco: {
    variacaoMinima: number
    minimoComprasAnteriores: number
    /** Só avalia a última compra se ela tiver sido feita nestes últimos dias. */
    janelaDias: number
  }
  duplicidade: { similaridadeMinima: number }
  devolucaoEmbalagem: { categoria: string; prazoDias: number }
  /** Dias de consumo usados para estimar o valor de reposição (estoque crítico e ruptura). */
  diasReposicao: number
}

export const CONFIG_PADRAO: ConfigAnalise = {
  janelaConsumoDias: 60,
  confianca: {
    saidasInsuficiente: 3,
    saidasBaixa: 5,
    historicoMinimoDias: 30,
    saidasMedia: 10,
  },
  estoqueCritico: { coberturaMaximaDias: 7 },
  rupturaPrevista: { coberturaMinimaDias: 7, coberturaMaximaDias: 30 },
  vencimento: { horizonteDias: 180, diasParaCritico: 30 },
  consumoCrescente: { janelaDias: 30, fatorAumento: 1.5 },
  retiradaAtipica: {
    minimoSaidas: 5,
    multiplicadorMad: 3,
    janelaRecenteDias: 30,
    madMinimoFracaoMediana: 0.1,
  },
  excesso: { coberturaMinimaDias: 180 },
  itemParado: { fracaoTopValor: 0.2, diasSemSaida: 60 },
  variacaoPreco: { variacaoMinima: 0.2, minimoComprasAnteriores: 2, janelaDias: 60 },
  duplicidade: { similaridadeMinima: 0.6 },
  // Prazo legal usual: até 1 ano da compra. A confirmar com o Victor.
  devolucaoEmbalagem: { categoria: 'Defensivos e biológicos', prazoDias: 365 },
  diasReposicao: 30,
}
