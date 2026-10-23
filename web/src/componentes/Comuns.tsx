// Componentes reutilizados (design: seção 6 — Componentes).
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Alerta, Confianca, NivelAlerta } from '@tetrarreme/contrato'
import { gerarResumo } from '../analise/mensagens.ts'
import { ROTULO_CONFIANCA, ROTULO_NIVEL, ROTULO_TIPO, fmtData, valorAlerta } from '../app/formato.ts'
import { Icone } from './Icone.tsx'
import type { NomeIcone } from './Icone.tsx'

/** Moldura "blueprint" do design system Industry: borda fina e marcas "+" nos cantos. */
export function Blueprint({ children, className = '', as: Tag = 'div', ...resto }: {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'article' | 'li'
} & Record<string, unknown>) {
  return (
    <Tag className={`blueprint ${className}`} {...resto}>
      <i className="corner tl" /><i className="corner tr" /><i className="corner bl" /><i className="corner br" />
      {children}
    </Tag>
  )
}

/** Selo de nível: cor + ícone próprio + rótulo (a cor nunca aparece sozinha). */
export function SeloNivel({ nivel, pequeno = false }: { nivel: NivelAlerta; pequeno?: boolean }) {
  return (
    <span className={`selo-nivel selo-${nivel} ${pequeno ? 'selo-pequeno' : ''}`}>
      <Icone nome={nivel} tamanho={pequeno ? 14 : 18} />
      {ROTULO_NIVEL[nivel]}
    </span>
  )
}

/** Selo de confiança: barras (alta 3, média 2, baixa 1), tracejado para insuficiente, ✓ para fato. */
export function SeloConfianca({ confianca }: { confianca: Confianca }) {
  const barras = { alta: 3, media: 2, baixa: 1, insuficiente: 0, fato: 0 }[confianca]
  return (
    <span className="selo-confianca" title={ROTULO_CONFIANCA[confianca]}>
      {confianca === 'fato' ? (
        <Icone nome="check" tamanho={14} />
      ) : (
        <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <rect key={i} x={i * 5.5} y={8 - i * 3} width="4" height={4 + i * 3}
              className={confianca === 'insuficiente' ? 'barra-tracejada' : i < barras ? 'barra-cheia' : 'barra-vazia'} />
          ))}
        </svg>
      )}
      {ROTULO_CONFIANCA[confianca]}
    </span>
  )
}

/** Online/offline e registros aguardando envio (nesta versão, todos os registrados no aparelho). */
export function IndicadorConexao({ pendentes }: { pendentes: number }) {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  const aguardando = pendentes === 1 ? '1 registro aguardando envio' : `${pendentes} registros aguardando envio`
  return online ? (
    <span className="conexao conexao-online" role="status">
      <Icone nome="wifi" tamanho={18} />
      Online{pendentes > 0 ? ` — ${aguardando}` : ''}
    </span>
  ) : (
    <span className="conexao conexao-offline" role="status">
      <Icone nome="wifi_off" tamanho={18} />
      Sem internet{pendentes > 0 ? ` — ${aguardando}` : ''}
    </span>
  )
}

/** Selo permanente de dados simulados (R7). */
export function SeloSimulado({ hoje }: { hoje: Date }) {
  return (
    <footer className="selo-simulado">
      <Icone nome="flask" tamanho={14} />
      Dados simulados · análise de {fmtData(hoje.toISOString())}
    </footer>
  )
}

export function BotaoGrande({ icone, titulo, apoio, onClick, secundario = false, desabilitado = false }: {
  icone: NomeIcone
  titulo: string
  apoio?: string
  onClick: () => void
  secundario?: boolean
  desabilitado?: boolean
}) {
  return (
    <button type="button" className={`botao-grande ${secundario ? 'botao-grande-secundario' : ''}`} onClick={onClick} disabled={desabilitado}>
      <Icone nome={icone} tamanho={44} />
      <span>
        <strong>{titulo}</strong>
        {apoio && <small>{apoio}</small>}
      </span>
    </button>
  )
}

export function CartaoAlerta({ alerta, produto, onAbrir }: { alerta: Alerta; produto: string; onAbrir: () => void }) {
  return (
    <Blueprint as="article" className={`cartao-alerta cartao-${alerta.nivel}`} data-testid="cartao-alerta" data-tipo={alerta.tipo} data-produto={produto}>
      <button type="button" className="cartao-alerta-botao" onClick={onAbrir}>
        <span className="cartao-topo">
          <SeloNivel nivel={alerta.nivel} pequeno />
          <span className={`tipo-alerta tipo-${alerta.nivel}`}>
            <Icone nome={alerta.tipo} tamanho={16} />
            {ROTULO_TIPO[alerta.tipo]}
          </span>
        </span>
        <span className="cartao-alerta-produto">{produto}</span>
        <span className="cartao-curta">{gerarResumo(alerta)}</span>
        <span className="cartao-rodape">
          <SeloConfianca confianca={alerta.confianca} />
          <span className={`cartao-valor ${alerta.valorEnvolvido === null ? 'valor-desconhecido' : ''}`}>{valorAlerta(alerta)}</span>
          <Icone nome="chevron" tamanho={18} />
        </span>
      </button>
    </Blueprint>
  )
}

export function BotaoVoltar({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="botao-voltar" onClick={onClick}>
      <Icone nome="back" tamanho={22} />
      Voltar
    </button>
  )
}

export function Secao({ icone, titulo, children, className = '' }: { icone: NomeIcone; titulo: string; children: ReactNode; className?: string }) {
  return (
    <Blueprint as="section" className={`secao ${className}`}>
      <h3 className="secao-titulo"><Icone nome={icone} tamanho={20} />{titulo}</h3>
      {children}
    </Blueprint>
  )
}
