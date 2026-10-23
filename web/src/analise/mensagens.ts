// R4: a mensagem do alerta é gerada a partir dos campos estruturados.
import { dataBr } from './datas.ts'
import { fmtNum, fmtReais } from './formatacao.ts'
import type { Alerta } from '@tetrarreme/contrato'

export type AlertaSemMensagem = Omit<Alerta, 'mensagem'>

export function gerarMensagem(a: AlertaSemMensagem): string {
  const e = a.evidencia
  const p = e.produto
  const u = e.unidade
  const q = (v: number | string | null) => `${fmtNum(v)} ${u}`
  const data = (v: number | string | null) => (typeof v === 'string' ? dataBr(v) : '?')
  const semHistorico = a.confianca === 'insuficiente'

  switch (a.tipo) {
    case 'estoque_critico': {
      const inicio =
        e.estoqueMinimo !== null && typeof e.saldo === 'number' && typeof e.estoqueMinimo === 'number' && e.saldo <= e.estoqueMinimo
          ? `Estoque crítico: ${p} está com ${q(e.saldo)}, no limite ou abaixo do estoque mínimo de ${q(e.estoqueMinimo)}.`
          : `Estoque crítico: ${p} está com ${q(e.saldo)}.`
      if (semHistorico || e.coberturaDias === null) {
        return `${inicio} Não há histórico suficiente para estimar por quantos dias o saldo vai durar.`
      }
      return `${inicio} Mantendo o consumo médio recente, o saldo atual poderá ser suficiente por aproximadamente ${fmtNum(e.coberturaDias)} dias.`
    }
    case 'ruptura_prevista':
      return `Ruptura prevista: mantendo o consumo médio recente, o saldo de ${p} (${q(e.saldo)}) poderá acabar em aproximadamente ${fmtNum(e.coberturaDias)} dias.`
    case 'vencimento':
      if (e.vencido === 'sim') {
        return `Lote vencido: o lote ${e.lote} de ${p} venceu em ${data(e.validade)} e ainda tem ${q(e.saldoLote)} em estoque.`
      }
      if (semHistorico) {
        return `Risco de vencimento: o lote ${e.lote} de ${p} (${q(e.saldoLote)}) vence em ${data(e.validade)} e não há histórico suficiente para saber se será usado a tempo.`
      }
      return `Risco de vencimento: mantendo o consumo médio recente, cerca de ${q(e.quantidadeEmRisco)} do lote ${e.lote} de ${p} podem vencer antes do uso (validade ${data(e.validade)}).`
    case 'consumo_crescente':
      return `Consumo em alta: ${p} teve ${q(e.consumoRecente)} retirados nos últimos ${e.janelaDias} dias, ${fmtNum(e.razao)} vezes o consumo dos ${e.janelaDias} dias anteriores (${q(e.consumoAnterior)}).`
    case 'retirada_atipica':
      return `Retirada fora do padrão: em ${data(e.data)}, foram retirados ${q(e.quantidade)} de ${p}. O normal para este produto é perto de ${q(e.mediana)} por retirada.`
    case 'excesso':
      if (e.criterio === 'estoque_minimo') {
        return `Estoque em excesso: ${p} tem ${q(e.saldo)}, ${fmtNum(e.vezesEstoqueMinimo)} vezes o estoque mínimo de ${q(e.estoqueMinimo)}, e nenhuma retirada nos últimos ${e.janelaConsumoDias} dias.`
      }
      return `Estoque em excesso: mantendo o consumo médio recente, o saldo de ${p} (${q(e.saldo)}) daria para aproximadamente ${fmtNum(e.coberturaDias)} dias.`
    case 'item_parado':
      return e.ultimaSaida === null
        ? `Item parado: ${p} tem ${fmtReais(e.valorEstoque)} em estoque e nenhuma retirada desde a entrada, há ${fmtNum(e.diasSemSaida)} dias.`
        : `Item parado: ${p} tem ${fmtReais(e.valorEstoque)} em estoque e nenhuma retirada há ${fmtNum(e.diasSemSaida)} dias.`
    case 'variacao_preco': {
      const v = typeof e.variacaoPercentual === 'number' ? e.variacaoPercentual : 0
      return `Variação de preço: a compra de ${p} em ${data(e.dataCompra)} custou ${fmtReais(e.precoCompra)}/${u}, ${fmtNum(Math.abs(v))}% ${v >= 0 ? 'acima' : 'abaixo'} da média das compras anteriores (${fmtReais(e.precoMedioAnterior)}/${u}).`
    }
    case 'possivel_duplicidade':
      return `Possível duplicidade: "${e.produto}" e "${e.outroProduto}" parecem ser o mesmo produto. Confirme antes de unificar.`
    case 'devolucao_embalagem':
      return `Devolução de embalagem: o lote ${e.lote} de ${p} acabou em ${data(e.zeradoEm)}. Devolva as embalagens vazias até ${data(e.prazoDevolucao)} (faltam ${fmtNum(e.diasAtePrazo)} dias).`
  }
}

/**
 * Frase curta do cartão de alerta, gerada dos mesmos campos da mensagem (R4).
 * Com confiança insuficiente, nunca mostra número de dias.
 */
export function gerarResumo(a: AlertaSemMensagem): string {
  const e = a.evidencia
  const u = e.unidade
  const q = (v: number | string | null) => `${fmtNum(v)} ${u}`
  const data = (v: number | string | null) => (typeof v === 'string' ? dataBr(v) : '?')
  const comDias = a.confianca !== 'insuficiente' && typeof e.coberturaDias === 'number'

  switch (a.tipo) {
    case 'estoque_critico': {
      const abaixo = typeof e.estoqueMinimo === 'number' && typeof e.saldo === 'number' && e.saldo <= e.estoqueMinimo
      const saldo = abaixo ? `Saldo de ${q(e.saldo)}, abaixo do mínimo de ${q(e.estoqueMinimo)}` : `Saldo de ${q(e.saldo)}`
      return comDias
        ? `${saldo}; cerca de ${fmtNum(e.coberturaDias)} dias de consumo.`
        : `${saldo}. Histórico insuficiente para estimar dias.`
    }
    case 'ruptura_prevista':
      return `${q(e.saldo)}, suficientes para cerca de ${fmtNum(e.coberturaDias)} dias.`
    case 'vencimento':
      if (e.vencido === 'sim') return `Lote vencido em ${data(e.validade)} ainda com ${q(e.saldoLote)}.`
      if (a.confianca === 'insuficiente') return `Lote vence em ${data(e.validade)}; sem histórico para saber se será usado.`
      return `Lote vence em ${data(e.validade)}; cerca de ${q(e.quantidadeEmRisco)} podem vencer antes do uso.`
    case 'consumo_crescente':
      return `Consumo do último mês ${fmtNum(e.razao)} × maior que o anterior.`
    case 'retirada_atipica':
      return `Retirada de ${q(e.quantidade)} em ${data(e.data)}; o normal é perto de ${q(e.mediana)}.`
    case 'excesso':
      return e.criterio === 'estoque_minimo'
        ? `${fmtNum(e.vezesEstoqueMinimo)} vezes o estoque mínimo, sem retiradas em ${e.janelaConsumoDias} dias.`
        : `${q(e.saldo)}: saldo para cerca de ${fmtNum(e.coberturaDias)} dias de consumo.`
    case 'item_parado':
      return `${fmtReais(e.valorEstoque)} em estoque sem retirada há ${fmtNum(e.diasSemSaida)} dias.`
    case 'variacao_preco': {
      const v = typeof e.variacaoPercentual === 'number' ? e.variacaoPercentual : 0
      return `Compra a ${fmtReais(e.precoCompra)}/${u}, ${fmtNum(Math.abs(v))}% ${v >= 0 ? 'acima' : 'abaixo'} da média (${fmtReais(e.precoMedioAnterior)}/${u}).`
    }
    case 'possivel_duplicidade':
      return `Pode ser o mesmo produto que "${e.outroProduto}" — confirmar.`
    case 'devolucao_embalagem':
      return `Lote ${e.lote} esgotado; devolver a embalagem até ${data(e.prazoDevolucao)}.`
  }
}

export function comMensagem(a: AlertaSemMensagem): Alerta {
  return { ...a, mensagem: gerarMensagem(a) }
}
