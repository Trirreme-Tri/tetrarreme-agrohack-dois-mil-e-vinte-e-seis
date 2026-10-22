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

export function comMensagem(a: AlertaSemMensagem): Alerta {
  return { ...a, mensagem: gerarMensagem(a) }
}
