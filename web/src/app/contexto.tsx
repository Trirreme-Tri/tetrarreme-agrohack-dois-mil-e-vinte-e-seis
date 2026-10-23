// Estado do app: banco local, "hoje" e a análise recalculada a cada mudança nos dados (R6).
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { Importacao, Movimentacao, Produto } from '@tetrarreme/contrato'
import { analisar } from '../analise/analisar.ts'
import type { ResultadoAnalise } from '../analise/analisar.ts'
import { aplicarUnificacoes } from '../analise/produtos.ts'
import type { BancoMonitora, DecisaoDuplicidade, ItemCadastro } from '../dados/banco.ts'
import { CSV_BASE_SIMULADA } from '../dados/baseSimulada.ts'
import { carregarBaseInicial } from '../dados/carga.ts'
import { hojeLocal } from '../dados/hoje.ts'
import { DISPOSITIVO_APARELHO } from '../dados/repositorio.ts'

export interface Dados {
  db: BancoMonitora
  /** Data local de hoje (meia-noite UTC), a mesma passada ao motor. */
  hoje: Date
  agora: () => Date
  /** Produtos depois das unificações confirmadas (R8). */
  produtos: Produto[]
  /** Todos os produtos cadastrados, inclusive os unificados (para mostrar nomes). */
  todosProdutos: Produto[]
  movimentacoes: Movimentacao[]
  importacoes: Importacao[]
  decisoes: DecisaoDuplicidade[]
  cadastro: ItemCadastro[]
  resultado: ResultadoAnalise
  /** Registros feitos neste aparelho e ainda não enviados (nesta versão, todos os registrados localmente). */
  pendentes: number
}

const Contexto = createContext<Dados | null>(null)

export function useDados(): Dados {
  const d = useContext(Contexto)
  if (!d) throw new Error('useDados fora do ProvedorDados')
  return d
}

export function ProvedorDados({ db, agora = () => new Date(), children, carregando }: {
  db: BancoMonitora
  agora?: () => Date
  children: ReactNode
  carregando: ReactNode
}) {
  const [erroCarga, setErroCarga] = useState<string | null>(null)
  const [carregado, setCarregado] = useState(false)
  const hoje = hojeLocal(agora())
  const chaveHoje = hoje.toISOString()

  useEffect(() => {
    let ativo = true
    carregarBaseInicial(db, { hoje: new Date(chaveHoje), agora: agora(), textoCsv: CSV_BASE_SIMULADA })
      .then(() => ativo && setCarregado(true))
      .catch((e: Error) => ativo && setErroCarga(e.message))
    return () => {
      ativo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, chaveHoje])

  const tabelas = useLiveQuery(
    async () => {
      const [produtos, movimentacoes, importacoes, apelidos, decisoes, cadastro] = await Promise.all([
        db.produtos.toArray(), db.movimentacoes.toArray(), db.importacoes.toArray(),
        db.apelidos.toArray(), db.decisoes_duplicidade.toArray(), db.cadastro.toArray(),
      ])
      return { produtos, movimentacoes, importacoes, apelidos, decisoes, cadastro }
    },
    [db],
  )

  const dados = useMemo<Dados | null>(() => {
    if (!carregado || !tabelas || tabelas.importacoes.length === 0) return null
    const unificado = aplicarUnificacoes(tabelas.produtos, tabelas.movimentacoes, tabelas.apelidos)
    const resultado = analisar(unificado.movimentacoes, unificado.produtos, new Date(chaveHoje), {
      importacoes: tabelas.importacoes,
      paresDiferentes: tabelas.decisoes.filter((d) => d.decisao === 'diferente').map((d) => [d.produtoA, d.produtoB] as const),
    })
    return {
      db,
      hoje: new Date(chaveHoje),
      agora,
      produtos: unificado.produtos,
      todosProdutos: tabelas.produtos,
      movimentacoes: unificado.movimentacoes,
      importacoes: tabelas.importacoes,
      decisoes: tabelas.decisoes,
      cadastro: tabelas.cadastro,
      resultado,
      pendentes: tabelas.movimentacoes.filter((m) => m.dispositivo === DISPOSITIVO_APARELHO).length,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregado, tabelas, chaveHoje, db])

  if (erroCarga) return <div role="alert" className="erro-carga">Não foi possível carregar os dados: {erroCarga}</div>
  if (!dados) return <>{carregando}</>
  return <Contexto.Provider value={dados}>{children}</Contexto.Provider>
}
