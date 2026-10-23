// Casca do Monitora: perfil (dono ou funcionário) guardado no aparelho, cabeçalho com conexão,
// navegação e o selo permanente de dados simulados (R7).
import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import type { BancoMonitora } from '../dados/banco.ts'
import { gravarPreferencia } from '../dados/repositorio.ts'
import { IndicadorConexao, SeloSimulado, BotaoVoltar } from '../componentes/Comuns.tsx'
import { Icone } from '../componentes/Icone.tsx'
import type { NomeIcone } from '../componentes/Icone.tsx'
import { DetalheAlerta, DetalheProduto, Financeiro, ListaProdutos, PainelDono, ResumoLateral } from '../telas/Dono.tsx'
import {
  EscolherDestino, EscolherPerfil, EscolherProduto, InformarQuantidade, InicioFuncionario, QuemRegistra, Registrado, RegistrarEntrada,
} from '../telas/Funcionario.tsx'
import { ProvedorDados, useDados } from './contexto.tsx'
import { ProvedorNavegacao, useNavegacao } from './navegacao.tsx'
import type { Tela } from './navegacao.tsx'

type Tema = 'light' | 'dark'

export function App({ db, agora }: { db: BancoMonitora; agora?: () => Date }) {
  const prefs = useLiveQuery(async () => Object.fromEntries((await db.preferencias.toArray()).map((p) => [p.chave, p.valor])), [db])
  const temaSistema: Tema = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  const tema = (prefs?.tema as Tema | undefined) ?? temaSistema
  useEffect(() => {
    document.documentElement.lang = 'pt-BR'
  }, [])

  return (
    <div className="monitora app" data-theme={tema}>
      {prefs === undefined ? <Carregando /> : (
        <ProvedorDados db={db} agora={agora} carregando={<Carregando />}>
          <Conteudo perfil={prefs.perfil as 'dono' | 'funcionario' | undefined} funcionario={prefs.funcionario} tema={tema} />
        </ProvedorDados>
      )}
    </div>
  )
}

function Carregando() {
  return <div className="carregando" role="status">Carregando os dados do Sítio Bom Futuro…</div>
}

function Conteudo({ perfil, funcionario, tema }: { perfil?: 'dono' | 'funcionario'; funcionario?: string; tema: Tema }) {
  const inicial: Tela = perfil === 'dono' ? { nome: 'dono-alertas' } : perfil === 'funcionario' ? (funcionario ? { nome: 'func-inicio' } : { nome: 'func-quem' }) : { nome: 'perfil' }
  // A chave reinicia a navegação quando o perfil ou o funcionário muda.
  return (
    <ProvedorNavegacao key={`${perfil}|${funcionario ?? ''}`} inicial={inicial}>
      <Casca perfil={perfil} funcionario={funcionario} tema={tema} />
    </ProvedorNavegacao>
  )
}

const ABAS_DONO: { tela: Tela; rotulo: string; icone: NomeIcone }[] = [
  { tela: { nome: 'dono-alertas' }, rotulo: 'Alertas', icone: 'atencao' },
  { tela: { nome: 'dono-produtos' }, rotulo: 'Produtos', icone: 'lista' },
  { tela: { nome: 'dono-financeiro' }, rotulo: 'Financeiro', icone: 'financeiro' },
]

function abaAtiva(t: Tela): string {
  if (t.nome === 'dono-alerta') return 'dono-alertas'
  if (t.nome === 'dono-produto') return 'dono-produtos'
  return t.nome
}

function Casca({ perfil, funcionario, tema }: { perfil?: 'dono' | 'funcionario'; funcionario?: string; tema: Tema }) {
  const { db, hoje, pendentes, resultado } = useDados()
  const { tela, voltar, podeVoltar, aba } = useNavegacao()
  const [larga, setLarga] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(min-width: 1000px)').matches)
  useEffect(() => {
    const mq = window.matchMedia?.('(min-width: 1000px)')
    if (!mq) return
    const f = () => setLarga(mq.matches)
    mq.addEventListener('change', f)
    return () => mq.removeEventListener('change', f)
  }, [])

  const trocarPerfil = async () => {
    await gravarPreferencia(db, 'perfil', null)
  }
  const alternarTema = () => gravarPreferencia(db, 'tema', tema === 'dark' ? 'light' : 'dark')
  const dono = perfil === 'dono'
  const ativa = abaAtiva(tela)

  const conteudo = (() => {
    switch (tela.nome) {
      case 'perfil': return <EscolherPerfil onPerfil={(p) => gravarPreferencia(db, 'perfil', p)} />
      case 'func-quem': return <QuemRegistra onEscolher={(n) => gravarPreferencia(db, 'funcionario', n)} />
      case 'func-inicio': return <InicioFuncionario funcionario={funcionario ?? ''} />
      case 'func-produto': return <EscolherProduto modo={tela.modo} />
      case 'func-quantidade': return <InformarQuantidade key={tela.produtoId} modo={tela.modo} produtoId={tela.produtoId} />
      case 'func-destino': return <EscolherDestino {...tela} funcionario={funcionario ?? ''} />
      case 'func-entrada': return <RegistrarEntrada {...tela} funcionario={funcionario ?? ''} />
      case 'func-ok': return <Registrado modo={tela.modo} movimentacaoId={tela.movimentacaoId} />
      case 'dono-alertas': return <PainelDono />
      case 'dono-alerta': return <DetalheAlerta key={tela.indice} indice={tela.indice} />
      case 'dono-produtos': return <ListaProdutos />
      case 'dono-produto': return <DetalheProduto key={tela.produtoId} produtoId={tela.produtoId} />
      case 'dono-financeiro': return <Financeiro />
    }
  })()

  return (
    <div className={`casca ${dono ? 'casca-dono' : 'casca-funcionario'} ${dono && larga ? 'casca-larga' : ''}`}>
      {dono && larga && (
        <nav className="menu-lateral" aria-label="Menu">
          <div className="marca"><strong>Monitora</strong><small>Sítio Bom Futuro · Ariquemes/RO</small></div>
          {ABAS_DONO.map((a) => (
            <button key={a.rotulo} type="button" className={`item-menu ${ativa === a.tela.nome ? 'item-ativo' : ''}`} aria-current={ativa === a.tela.nome ? 'page' : undefined} onClick={() => aba(a.tela)}>
              <Icone nome={a.icone} tamanho={22} />{a.rotulo}
              {a.rotulo === 'Alertas' && resultado.alertas.length > 0 && <span className="contador">{resultado.alertas.length}</span>}
            </button>
          ))}
          <button type="button" className="btn btn-secondary item-sair" onClick={trocarPerfil}><Icone nome="sair" tamanho={20} /> Trocar perfil</button>
        </nav>
      )}
      <div className="coluna-principal">
        <header className="cabecalho">
          {podeVoltar ? <BotaoVoltar onClick={voltar} /> : (!(dono && larga) && (
            <div className="marca"><strong>Monitora</strong><small>Sítio Bom Futuro · Ariquemes/RO</small></div>
          ))}
          <div className="cabecalho-acoes">
            <IndicadorConexao pendentes={pendentes} />
            <button type="button" className="btn btn-secondary botao-icone" onClick={alternarTema} aria-label={tema === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'} title={tema === 'dark' ? 'Tema claro' : 'Tema escuro'}>
              <Icone nome={tema === 'dark' ? 'sun' : 'moon'} tamanho={20} />
            </button>
            {perfil && !(dono && larga) && !podeVoltar && (
              <button type="button" className="btn btn-secondary" onClick={trocarPerfil}><Icone nome="sair" tamanho={18} /> Trocar perfil</button>
            )}
          </div>
        </header>
        <div className="area-rolagem">
          <main className={`principal ${dono && larga && ativa === 'dono-alertas' ? 'com-lateral' : ''}`}>
            {conteudo}
            {dono && larga && ativa === 'dono-alertas' && <ResumoLateral />}
          </main>
        </div>
        {dono && !larga && (
          <nav className="menu-inferior" aria-label="Menu">
            {ABAS_DONO.map((a) => (
              <button key={a.rotulo} type="button" className={`item-menu ${ativa === a.tela.nome ? 'item-ativo' : ''}`} aria-current={ativa === a.tela.nome ? 'page' : undefined} onClick={() => aba(a.tela)}>
                <Icone nome={a.icone} tamanho={22} />{a.rotulo}
              </button>
            ))}
          </nav>
        )}
        <SeloSimulado hoje={hoje} />
      </div>
    </div>
  )
}
