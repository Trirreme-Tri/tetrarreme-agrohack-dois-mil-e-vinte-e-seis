// Navegação simples por pilha de telas (sem roteador): o app é uma PWA de poucas telas.
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type Tela =
  | { nome: 'perfil' }
  | { nome: 'func-quem' }
  | { nome: 'func-inicio' }
  | { nome: 'func-produto'; modo: 'saida' | 'entrada' }
  | { nome: 'func-quantidade'; modo: 'saida' | 'entrada'; produtoId: string }
  | { nome: 'func-destino'; produtoId: string; quantidade: number; unidadeId: string }
  | { nome: 'func-entrada'; produtoId: string; quantidade: number; unidadeId: string }
  | { nome: 'func-ok'; modo: 'saida' | 'entrada'; movimentacaoId: string }
  | { nome: 'dono-alertas' }
  | { nome: 'dono-alerta'; indice: string }
  | { nome: 'dono-produtos' }
  | { nome: 'dono-produto'; produtoId: string }
  | { nome: 'dono-financeiro' }

interface Navegacao {
  tela: Tela
  ir: (t: Tela) => void
  voltar: () => void
  /** Troca a tela de base (aba), limpando a pilha. */
  aba: (t: Tela) => void
  podeVoltar: boolean
}

const Ctx = createContext<Navegacao | null>(null)

export function useNavegacao(): Navegacao {
  const n = useContext(Ctx)
  if (!n) throw new Error('useNavegacao fora do ProvedorNavegacao')
  return n
}

export function ProvedorNavegacao({ inicial, children }: { inicial: Tela; children: ReactNode }) {
  const [pilha, setPilha] = useState<Tela[]>([inicial])
  const ir = useCallback((t: Tela) => setPilha((p) => [...p, t]), [])
  const voltar = useCallback(() => setPilha((p) => (p.length > 1 ? p.slice(0, -1) : p)), [])
  const aba = useCallback((t: Tela) => setPilha([t]), [])
  const valor = useMemo(() => ({ tela: pilha[pilha.length - 1], ir, voltar, aba, podeVoltar: pilha.length > 1 }), [pilha, ir, voltar, aba])
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>
}
