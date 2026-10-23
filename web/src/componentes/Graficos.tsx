// Gráficos do detalhe do produto (SVG puro). Os números vêm de `serieDoProduto` (motor).
import type { ConsumoPeriodo, PontoSaldo } from '../analise/serie.ts'
import { fmtData, fmtQtd } from '../app/formato.ts'

const W = 420
const H = 200
const M = { t: 16, r: 10, b: 26, l: 58 }

function escala(max: number) {
  const topo = max > 0 ? max * 1.1 : 1
  return (v: number) => M.t + (H - M.t - M.b) * (1 - v / topo)
}

/** Consumo por período (mês ou semana), em barras. */
export function GraficoConsumo({ periodos, unidade }: { periodos: ConsumoPeriodo[]; unidade: string }) {
  const max = Math.max(0, ...periodos.map((p) => p.quantidade))
  const y = escala(max)
  const largura = (W - M.l - M.r) / Math.max(periodos.length, 1)
  const passoRotulo = Math.ceil(periodos.length / 6)
  const total = periodos.reduce((t, p) => t + p.quantidade, 0)
  return (
    <figure className="grafico">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Consumo por período: total de ${fmtQtd(total, unidade)}`}>
        {[0, max / 2, max].map((v, i) => (
          <g key={i}>
            <line x1={M.l} x2={W - M.r} y1={y(v)} y2={y(v)} className="grafico-grade" />
            <text x={M.l - 6} y={y(v) + 4} textAnchor="end" className="grafico-rotulo">{fmtQtd(Math.round(v * 10) / 10, unidade)}</text>
          </g>
        ))}
        {periodos.map((p, i) => (
          <g key={p.inicio}>
            <rect x={M.l + i * largura + largura * 0.15} y={y(p.quantidade)} width={largura * 0.7} height={Math.max(0, H - M.b - y(p.quantidade))} className="grafico-barra">
              <title>{`${p.rotulo}: ${fmtQtd(p.quantidade, unidade)} em ${p.retiradas} retirada(s)`}</title>
            </rect>
            {i % passoRotulo === 0 && (
              <text x={M.l + i * largura + largura / 2} y={H - 8} textAnchor="middle" className="grafico-rotulo">{p.rotulo}</text>
            )}
          </g>
        ))}
      </svg>
    </figure>
  )
}

/** Linha do saldo com as entradas marcadas e o estoque mínimo tracejado (só se cadastrado). */
export function GraficoSaldo({ pontos, unidade, minimo }: { pontos: PontoSaldo[]; unidade: string; minimo: number | null }) {
  const max = Math.max(0, minimo ?? 0, ...pontos.map((p) => p.saldo))
  const y = escala(max)
  const x = (i: number) => M.l + ((W - M.l - M.r) * i) / Math.max(pontos.length - 1, 1)
  const linha = pontos.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(Math.max(p.saldo, 0)).toFixed(1)}`).join(' ')
  const ultimo = pontos[pontos.length - 1]
  return (
    <figure className="grafico">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Saldo ao longo do tempo; hoje ${fmtQtd(ultimo?.saldo ?? 0, unidade)}`}>
        {[0, max / 2, max].map((v, i) => (
          <g key={i}>
            <line x1={M.l} x2={W - M.r} y1={y(v)} y2={y(v)} className="grafico-grade" />
            <text x={M.l - 6} y={y(v) + 4} textAnchor="end" className="grafico-rotulo">{fmtQtd(Math.round(v * 10) / 10, unidade)}</text>
          </g>
        ))}
        {minimo !== null && <line x1={M.l} x2={W - M.r} y1={y(minimo)} y2={y(minimo)} className="grafico-minimo" />}
        <path d={linha} className="grafico-linha" />
        {pontos.map((p, i) => p.entrada !== null && (
          <circle key={p.data} cx={x(i)} cy={y(Math.max(p.saldo, 0))} r={5} className="grafico-entrada">
            <title>{`${fmtData(p.data)}: entrada de ${fmtQtd(p.entrada, unidade)}`}</title>
          </circle>
        ))}
        {pontos.length > 0 && (
          <text x={M.l} y={H - 8} className="grafico-rotulo">{fmtData(pontos[0].data)}</text>
        )}
        {ultimo && (
          <text x={W - M.r} y={H - 8} textAnchor="end" className="grafico-rotulo">Hoje: {fmtQtd(ultimo.saldo, unidade)}</text>
        )}
      </svg>
      <figcaption className="grafico-legenda">
        <span><i className="leg-linha" />Saldo</span>
        <span><i className="leg-entrada" />Entrada (compra)</span>
        {minimo !== null && <span><i className="leg-minimo" />Estoque mínimo</span>}
      </figcaption>
    </figure>
  )
}

/** Mapa de blocos (fatias horizontais e verticais alternadas) do valor por categoria. */
export function MapaBlocos({ itens }: { itens: { rotulo: string; valor: number; detalhe: string }[] }) {
  const total = itens.reduce((t, i) => t + i.valor, 0)
  if (total <= 0) return null
  type Bloco = { rotulo: string; valor: number; detalhe: string; x: number; y: number; w: number; h: number; nivel: number }
  const blocos: Bloco[] = []
  let x = 0
  let y = 0
  let w = 100
  let h = 100
  let resto = total
  itens.forEach((it, i) => {
    const f = resto > 0 ? it.valor / resto : 0
    if (i % 2 === 0) {
      blocos.push({ ...it, x, y, w: i === itens.length - 1 ? w : w * f, h, nivel: i })
      x += w * f
      w -= w * f
    } else {
      blocos.push({ ...it, x, y, w, h: i === itens.length - 1 ? h : h * f, nivel: i })
      y += h * f
      h -= h * f
    }
    resto -= it.valor
  })
  return (
    <div className="mapa-blocos" role="img" aria-label="Valor em estoque por categoria">
      {blocos.map((b) => (
        <div key={b.rotulo} className={`bloco bloco-${Math.min(b.nivel, 4)}`} style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }} title={`${b.rotulo}: ${b.detalhe}`}>
          {b.w > 14 && b.h > 14 && (<><strong>{b.rotulo}</strong><span>{b.detalhe}</span></>)}
        </div>
      ))}
    </div>
  )
}
