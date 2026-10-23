// Fluxo do funcionário: perfil → quem → início → produto → quantidade → destino (ou lote e
// validade) → registrado. Texto de 20 px e alvos de toque grandes. O registro grava no IndexedDB
// e a análise roda de novo sozinha (R6).
import { useMemo, useState } from 'react'
import { CATEGORIAS } from '@tetrarreme/contrato'
import type { Categoria } from '@tetrarreme/contrato'
import { converter, obterUnidade } from '../analise/unidades.ts'
import { useDados } from '../app/contexto.tsx'
import { ICONE_CATEGORIA, NOME_UNIDADE, fmtNum, fmtQtd, lerDataBr, mascaraData } from '../app/formato.ts'
import { useNavegacao } from '../app/navegacao.tsx'
import { Blueprint, BotaoGrande } from '../componentes/Comuns.tsx'
import { Icone } from '../componentes/Icone.tsx'
import { recarregarBaseSimulada } from '../dados/carga.ts'
import { CSV_BASE_SIMULADA } from '../dados/baseSimulada.ts'
import { gravarPreferencia, registrar } from '../dados/repositorio.ts'

/** Unidades oferecidas no teclado, pela dimensão do produto. */
const UNIDADES_POR_BASE: Record<string, string[]> = { kg: ['g', 'kg', 't'], L: ['mL', 'L'], un: ['un'] }

function saldoDe(produtoId: string) {
  return (r: ReturnType<typeof useDados>['resultado']) => r.produtos.find((p) => p.produto.id === produtoId)
}

// ---------------------------------------------------------------- perfil

export function EscolherPerfil({ onPerfil }: { onPerfil: (p: 'funcionario' | 'dono') => void }) {
  const { db, hoje, agora } = useDados()
  const [recarregando, setRecarregando] = useState(false)
  return (
    <div className="tela perfil">
      <p className="sobretitulo">Bem-vindo</p>
      <h1>Quem vai usar o Monitora agora?</h1>
      <p className="rotulo-suave">Dá para trocar depois, no topo da tela.</p>
      <div className="botoes-perfil">
        <BotaoGrande icone="users" titulo="Sou funcionário" apoio="Registrar retiradas e entradas no galpão" onClick={() => onPerfil('funcionario')} />
        <BotaoGrande icone="painel" titulo="Sou o dono" apoio="Ver alertas, produtos e valores" onClick={() => onPerfil('dono')} secundario />
      </div>
      <button type="button" className="link-discreto" disabled={recarregando} onClick={async () => {
        if (!window.confirm('Recarregar os dados simulados? Os registros feitos neste aparelho serão apagados.')) return
        setRecarregando(true)
        await recarregarBaseSimulada(db, { hoje, agora: agora(), textoCsv: CSV_BASE_SIMULADA })
        setRecarregando(false)
      }}>
        <Icone nome="recarregar" tamanho={16} /> {recarregando ? 'Recarregando…' : 'Recarregar dados simulados (para uma nova demonstração)'}
      </button>
    </div>
  )
}

export function QuemRegistra({ onEscolher }: { onEscolher: (nome: string) => void }) {
  const { cadastro } = useDados()
  return (
    <div className="tela modo-funcionario">
      <h1>Quem está registrando?</h1>
      <div className="grade-escolha">
        {cadastro.filter((c) => c.tipo === 'funcionario').map((f) => (
          <button key={f.nome} type="button" className="botao-escolha" onClick={() => onEscolher(f.nome)}>
            <Icone nome="user" tamanho={32} />{f.nome}
          </button>
        ))}
      </div>
    </div>
  )
}

export function InicioFuncionario({ funcionario }: { funcionario: string }) {
  const { db } = useDados()
  const { ir } = useNavegacao()
  return (
    <div className="tela modo-funcionario">
      <p className="sobretitulo"><Icone nome="user" tamanho={16} /> {funcionario}</p>
      <h1>O que vai fazer agora?</h1>
      <div className="botoes-perfil">
        <BotaoGrande icone="retirada" titulo="Registrar retirada" apoio="Tirei produto do galpão" onClick={() => ir({ nome: 'func-produto', modo: 'saida' })} />
        <BotaoGrande icone="entrada" titulo="Registrar entrada" apoio="Chegou produto novo" onClick={() => ir({ nome: 'func-produto', modo: 'entrada' })} secundario />
      </div>
      <button type="button" className="link-discreto" onClick={() => gravarPreferencia(db, 'funcionario', null)}>
        <Icone nome="users" tamanho={16} /> Não sou {funcionario}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------- produto

export function EscolherProduto({ modo }: { modo: 'saida' | 'entrada' }) {
  const { resultado, movimentacoes } = useDados()
  const { ir } = useNavegacao()
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState<Categoria | 'Todos'>('Todos')
  const termo = busca.trim().toLowerCase()
  const produtos = resultado.produtos
    .filter((a) => categoria === 'Todos' || a.produto.categoria === categoria)
    .filter((a) => !termo || a.produto.nome_canonico.toLowerCase().includes(termo))
    .sort((x, y) => x.produto.nome_canonico.localeCompare(y.produto.nome_canonico, 'pt-BR'))
  const recentes = useMemo(() => {
    const ids: string[] = []
    for (const m of [...movimentacoes].filter((m) => m.tipo === modo).sort((a, b) => b.data.localeCompare(a.data) || b.criado_em.localeCompare(a.criado_em))) {
      if (!ids.includes(m.produto_id)) ids.push(m.produto_id)
      if (ids.length === 4) break
    }
    return ids.map((id) => resultado.produtos.find((p) => p.produto.id === id)).filter((p) => p !== undefined)
  }, [movimentacoes, modo, resultado])

  const cartao = (a: (typeof produtos)[number]) => (
    <Blueprint as="li" key={a.produto.id}>
      <button type="button" className="cartao-produto" onClick={() => ir({ nome: 'func-quantidade', modo, produtoId: a.produto.id })}>
        <Icone nome={ICONE_CATEGORIA[a.produto.categoria]} tamanho={40} />
        <strong>{a.produto.nome_canonico}</strong>
        <small>Saldo <b>{fmtQtd(Math.round(a.saldo * 100) / 100, a.produto.unidade_base_id)}</b></small>
      </button>
    </Blueprint>
  )

  return (
    <div className="tela modo-funcionario">
      <p className="sobretitulo">{modo === 'saida' ? 'Retirada' : 'Entrada'} · passo 1 de 3</p>
      <h1>Qual produto?</h1>
      <label className="busca">
        <Icone nome="search" tamanho={22} />
        <input className="input" type="search" placeholder="Buscar pelo nome" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar produto pelo nome" />
      </label>
      <div className="filtros" role="group" aria-label="Categoria">
        {(['Todos', ...CATEGORIAS] as const).map((c) => (
          <button key={c} type="button" className={`filtro ${categoria === c ? 'filtro-ativo' : ''}`} aria-pressed={categoria === c} onClick={() => setCategoria(c)}>{c}</button>
        ))}
      </div>
      {!termo && categoria === 'Todos' && recentes.length > 0 && (
        <>
          <h2 className="subtitulo"><Icone nome="historico" tamanho={20} /> Usados recentemente</h2>
          <ul className="grade-produtos">{recentes.map(cartao)}</ul>
        </>
      )}
      <h2 className="subtitulo">{categoria === 'Todos' ? 'Todos os produtos' : categoria} ({produtos.length})</h2>
      {produtos.length === 0 ? <p>Nenhum produto com esse nome. Confira a escrita ou escolha outra categoria.</p> : <ul className="grade-produtos">{produtos.map(cartao)}</ul>}
    </div>
  )
}

// ---------------------------------------------------------------- quantidade

export function InformarQuantidade({ modo, produtoId }: { modo: 'saida' | 'entrada'; produtoId: string }) {
  const { resultado, movimentacoes } = useDados()
  const { ir } = useNavegacao()
  const a = saldoDe(produtoId)(resultado)
  const base = a?.produto.unidade_base_id
  const opcoes = base ? (UNIDADES_POR_BASE[base] ?? [base]) : []
  // Unidade habitual: a da última movimentação do mesmo tipo (ex.: retiradas em mL).
  const ultima = movimentacoes.filter((m) => m.produto_id === produtoId && m.tipo === modo).sort((x, y) => y.data.localeCompare(x.data))[0]
  const unidadeHabitual = ultima && opcoes.includes(ultima.unidade_id) ? ultima.unidade_id : base
  const [unidade, setUnidade] = useState<string | undefined>(undefined)
  const [texto, setTexto] = useState('')
  if (!a) return null
  const un = unidade ?? unidadeHabitual ?? a.produto.unidade_base_id
  const valor = texto === '' ? 0 : Number(texto.replace(',', '.'))
  const emBase = converter(valor, un, a.produto.unidade_base_id)
  const acimaDoSaldo = modo === 'saida' && valor > 0 && emBase > a.saldo + 1e-9

  const tecla = (k: string) => {
    if (k === 'del') return setTexto((t) => t.slice(0, -1))
    if (k === ',') return setTexto((t) => (t.includes(',') ? t : (t === '' ? '0' : t) + ','))
    setTexto((t) => (t === '0' ? k : (t + k).slice(0, 9)))
  }

  return (
    <div className="tela modo-funcionario quantidade">
      <div className="produto-escolhido">
        <Blueprint className="produto-icone"><Icone nome={ICONE_CATEGORIA[a.produto.categoria]} tamanho={32} /></Blueprint>
        <div>
          <p className="sobretitulo">{modo === 'saida' ? 'Retirada' : 'Entrada'} · passo 2 de 3</p>
          <strong>{a.produto.nome_canonico}</strong>
          <small>Saldo atual: <b>{fmtQtd(Math.round(a.saldo * 100) / 100, a.produto.unidade_base_id)}</b></small>
        </div>
      </div>
      <p className="pergunta">{modo === 'saida' ? 'Quanto vai retirar?' : 'Quanto chegou?'}</p>
      <p className="visor" aria-live="polite" data-testid="visor"><strong>{texto || '0'}</strong> {obterUnidade(un).sigla}</p>
      {acimaDoSaldo ? (
        <p className="aviso-saldo" role="alert"><Icone nome="atencao" tamanho={18} /> Mais que o saldo ({fmtQtd(Math.round(a.saldo * 100) / 100, a.produto.unidade_base_id)}). Confira o número.</p>
      ) : <p className="rotulo-suave dica-visor">Toque nos números abaixo</p>}
      {opcoes.length > 1 && (
        <div className="seg seg-unidade" role="group" aria-label="Unidade">
          {opcoes.map((u) => (
            <button key={u} type="button" className={`seg-botao ${u === un ? 'seg-ativo' : ''}`} aria-pressed={u === un} onClick={() => setUnidade(u)}>
              <strong>{obterUnidade(u).sigla}</strong><small>{NOME_UNIDADE[u]}</small>
            </button>
          ))}
        </div>
      )}
      <div className="teclado">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'del'].map((k) => (
          <button key={k} type="button" className="tecla" onClick={() => tecla(k)} aria-label={k === 'del' ? 'Apagar último número' : k === ',' ? 'Vírgula' : k}>
            {k === 'del' ? <><Icone nome="backspace" tamanho={24} /><small>Apagar</small></> : k}
          </button>
        ))}
      </div>
      <button type="button" className="btn btn-primary btn-block botao-alto" disabled={!(valor > 0)}
        onClick={() => ir(modo === 'saida'
          ? { nome: 'func-destino', produtoId, quantidade: valor, unidadeId: un }
          : { nome: 'func-entrada', produtoId, quantidade: valor, unidadeId: un })}>
        Continuar <Icone nome="chevron" tamanho={20} />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------- destino e entrada

function ResumoQuantidade({ produtoId, quantidade, unidadeId, passo }: { produtoId: string; quantidade: number; unidadeId: string; passo: string }) {
  const { resultado } = useDados()
  const a = saldoDe(produtoId)(resultado)
  return (
    <div className="produto-escolhido">
      {a && <Blueprint className="produto-icone"><Icone nome={ICONE_CATEGORIA[a.produto.categoria]} tamanho={32} /></Blueprint>}
      <div>
        <p className="sobretitulo">{passo}</p>
        <strong>{fmtQtd(quantidade, unidadeId)} de {a?.produto.nome_canonico}</strong>
      </div>
    </div>
  )
}

export function EscolherDestino({ produtoId, quantidade, unidadeId, funcionario }: { produtoId: string; quantidade: number; unidadeId: string; funcionario: string }) {
  const { cadastro, db, agora } = useDados()
  const { ir, aba } = useNavegacao()
  const [destino, setDestino] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  return (
    <div className="tela modo-funcionario">
      <ResumoQuantidade produtoId={produtoId} quantidade={quantidade} unidadeId={unidadeId} passo="Retirada · passo 3 de 3" />
      <h1>Para onde vai?</h1>
      <div className="grade-escolha">
        {cadastro.filter((c) => c.tipo === 'destino').map((d) => (
          <button key={d.nome} type="button" className={`botao-escolha ${destino === d.nome ? 'escolha-ativa' : ''}`} aria-pressed={destino === d.nome} onClick={() => setDestino(d.nome)}>
            <Icone nome="destino" tamanho={28} />{d.nome}
          </button>
        ))}
      </div>
      {erro && <p className="aviso-saldo" role="alert">{erro}</p>}
      <button type="button" className="btn btn-primary btn-block botao-alto" disabled={!destino} onClick={async () => {
        try {
          const m = await registrar(db, { tipo: 'saida', produtoId, quantidade, unidadeId, destino, responsavel: funcionario }, agora())
          // Depois de registrar, "Voltar" leva ao início (não deixa confirmar de novo e duplicar).
          aba({ nome: 'func-inicio' })
          ir({ nome: 'func-ok', modo: 'saida', movimentacaoId: m.id })
        } catch (e) {
          setErro(`Não foi possível registrar: ${(e as Error).message}`)
        }
      }}>
        <Icone nome="check" tamanho={22} /> Confirmar retirada
      </button>
    </div>
  )
}

export function RegistrarEntrada({ produtoId, quantidade, unidadeId, funcionario }: { produtoId: string; quantidade: number; unidadeId: string; funcionario: string }) {
  const { db, agora } = useDados()
  const { ir, aba } = useNavegacao()
  const [lote, setLote] = useState('')
  const [validade, setValidade] = useState('')
  const [semValidade, setSemValidade] = useState(false)
  const [preco, setPreco] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const validadeIso = semValidade ? null : lerDataBr(validade)
  const precoNumero = preco.trim() === '' ? null : Number(preco.replace(/\./g, '').replace(',', '.'))
  const precoValido = precoNumero === null || (Number.isFinite(precoNumero) && precoNumero >= 0)
  const pronto = (semValidade || validadeIso !== null) && precoValido

  return (
    <div className="tela modo-funcionario">
      <ResumoQuantidade produtoId={produtoId} quantidade={quantidade} unidadeId={unidadeId} passo="Entrada · passo 3 de 3" />
      <h1>Lote e validade</h1>
      <form className="formulario" onSubmit={async (e) => {
        e.preventDefault()
        if (!pronto) return
        try {
          const m = await registrar(db, {
            tipo: 'entrada', produtoId, quantidade, unidadeId, responsavel: funcionario,
            lote: lote || null, validade: validadeIso, precoUnit: precoNumero,
          }, agora())
          aba({ nome: 'func-inicio' })
          ir({ nome: 'func-ok', modo: 'entrada', movimentacaoId: m.id })
        } catch (err) {
          setErro(`Não foi possível registrar: ${(err as Error).message}`)
        }
      }}>
        <label className="field">
          <span>Número do lote</span>
          <input className="input" value={lote} onChange={(e) => setLote(e.target.value)} placeholder="Ex.: L-2610" autoComplete="off" />
        </label>
        <label className="field">
          <span>Validade (DD/MM/AAAA)</span>
          <input className="input" inputMode="numeric" placeholder="DD/MM/AAAA" value={validade} disabled={semValidade}
            onChange={(e) => setValidade(mascaraData(e.target.value))} aria-invalid={!semValidade && validade.length === 10 && validadeIso === null} />
        </label>
        {!semValidade && validade.length === 10 && validadeIso === null && <p className="aviso-saldo" role="alert">Data inválida. Use dia/mês/ano, por exemplo 31/01/2027.</p>}
        <label className="caixa">
          <input type="checkbox" checked={semValidade} onChange={(e) => setSemValidade(e.target.checked)} />
          Este produto não tem validade
        </label>
        <label className="field">
          <span>Preço por {obterUnidade(unidadeId).sigla} (opcional)</span>
          <input className="input" inputMode="decimal" placeholder="Ex.: 28,50" value={preco} onChange={(e) => setPreco(e.target.value.replace(/[^\d,.]/g, ''))} aria-invalid={!precoValido} />
          <small className="rotulo-suave">Sem preço, o item aparece como "sem preço" no resumo financeiro (nunca R$ 0,00).</small>
        </label>
        {erro && <p className="aviso-saldo" role="alert">{erro}</p>}
        <button type="submit" className="btn btn-primary btn-block botao-alto" disabled={!pronto}>
          <Icone nome="check" tamanho={22} /> Registrar entrada
        </button>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------- registrado

export function Registrado({ modo, movimentacaoId }: { modo: 'saida' | 'entrada'; movimentacaoId: string }) {
  const { movimentacoes, todosProdutos } = useDados()
  const { ir, aba } = useNavegacao()
  const m = movimentacoes.find((x) => x.id === movimentacaoId)
  const produto = todosProdutos.find((p) => p.id === m?.produto_id)
  return (
    <div className="tela modo-funcionario registrado">
      <Icone nome="check_circle" tamanho={72} className="icone-ok" />
      <h1>Registrado!</h1>
      {m && (
        <Blueprint className="resumo-registro">
          <p className="sobretitulo">{modo === 'saida' ? 'Retirada' : 'Entrada'}</p>
          <strong className="registro-qtd">{fmtQtd(m.quantidade, m.unidade_id)}</strong>
          <strong>{produto?.nome_canonico}</strong>
          <span>{modo === 'saida' ? `Destino: ${m.destino}` : `Lote ${m.lote ?? 'sem identificação'}${m.preco_unit === null ? ' · sem preço' : ` · ${fmtNum(m.preco_unit)} por ${m.unidade_id}`}`}</span>
          <span>{m.responsavel_pseudonimo}</span>
        </Blueprint>
      )}
      <p>Fica guardado neste celular até a internet voltar.</p>
      <BotaoGrande icone={modo === 'saida' ? 'retirada' : 'entrada'} titulo={modo === 'saida' ? 'Nova retirada' : 'Nova entrada'} onClick={() => { aba({ nome: 'func-inicio' }); ir({ nome: 'func-produto', modo }) }} />
      <button type="button" className="btn btn-secondary btn-block botao-alto" onClick={() => aba({ nome: 'func-inicio' })}>Voltar ao início</button>
    </div>
  )
}
