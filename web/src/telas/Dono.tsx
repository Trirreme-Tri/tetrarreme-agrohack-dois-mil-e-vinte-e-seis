// Telas do dono: painel de alertas, detalhe do alerta, produtos, detalhe do produto e financeiro.
// Todo número mostrado vem do motor (`resultado`) ou do banco local.
import { useMemo, useState } from 'react'
import { CATEGORIAS } from '@tetrarreme/contrato'
import type { Alerta, Categoria, Produto } from '@tetrarreme/contrato'
import type { AnaliseProduto } from '../analise/consumo.ts'
import { SEM_LOTE } from '../analise/consumo.ts'
import { diaDe } from '../analise/datas.ts'
import { fmtCobertura } from '../analise/formatacao.ts'
import { serieDoProduto } from '../analise/serie.ts'
import { obterUnidade } from '../analise/unidades.ts'
import { useDados } from '../app/contexto.tsx'
import {
  ICONE_CATEGORIA, NIVEIS, ROTULO_NIVEL, ROTULO_TIPO, chaveAlerta, fmtData, fmtNum, fmtQtd, fmtReais, linhasEvidencia, maiuscula,
  textoConfianca, valorAlerta,
} from '../app/formato.ts'
import { useNavegacao } from '../app/navegacao.tsx'
import { Blueprint, CartaoAlerta, SeloConfianca, SeloNivel, Secao } from '../componentes/Comuns.tsx'
import { GraficoConsumo, GraficoSaldo, MapaBlocos } from '../componentes/Graficos.tsx'
import { Icone } from '../componentes/Icone.tsx'
import { decidirDuplicidade, desfazerDuplicidade } from '../dados/repositorio.ts'

function useNomes(): (id: string) => string {
  const { todosProdutos } = useDados()
  const mapa = useMemo(() => new Map(todosProdutos.map((p) => [p.id, p.nome_canonico])), [todosProdutos])
  return (id) => mapa.get(id) ?? id
}

function siglaBase(p: Produto): string {
  return obterUnidade(p.unidade_base_id).id
}

// ---------------------------------------------------------------- painel

export function PainelDono() {
  const { resultado, hoje } = useDados()
  const { ir } = useNavegacao()
  const nome = useNomes()
  const [categoria, setCategoria] = useState<Categoria | 'Todas'>('Todas')
  const produtos = useMemo(() => new Map(resultado.produtos.map((a) => [a.produto.id, a.produto])), [resultado])
  const categoriaDe = (a: Alerta) => produtos.get(a.produtoId)?.categoria
  const filtrados = resultado.alertas.filter((a) => categoria === 'Todas' || categoriaDe(a) === categoria)
  const total = filtrados.reduce((t, a) => t + (a.valorEnvolvido ?? 0), 0)
  const semPreco = filtrados.filter((a) => a.valorEnvolvido === null && a.tipo !== 'devolucao_embalagem').length

  return (
    <div className="tela painel">
      <p className="sobretitulo">Análise de {fmtData(hoje.toISOString())}</p>
      <h1>O que merece atenção</h1>
      {resultado.alertas.length > 0 && (
        <p className="painel-total">
          <strong>{fmtReais(total)}</strong> envolvidos nos alertas
          {semPreco > 0 && <span className="painel-sem-preco"> · <Icone nome="sem_preco" tamanho={16} /> {semPreco} {semPreco === 1 ? 'alerta sem preço' : 'alertas sem preço'}</span>}
        </p>
      )}

      {resultado.avisosDados.length > 0 && (
        <div className="aviso-dados" role="note">
          <Icone nome="dados" tamanho={20} />
          <div>
            <strong>Conferir os registros</strong>
            {resultado.avisosDados.map((a) => (
              <p key={a.produtoId}>{a.produto}: {a.mensagem}.</p>
            ))}
          </div>
        </div>
      )}

      {resultado.alertas.length > 0 && (
        <div className="filtros" role="group" aria-label="Filtrar por categoria">
          {(['Todas', ...CATEGORIAS] as const).map((c) => {
            const n = c === 'Todas' ? resultado.alertas.length : resultado.alertas.filter((a) => categoriaDe(a) === c).length
            return (
              <button key={c} type="button" className={`filtro ${categoria === c ? 'filtro-ativo' : ''}`} aria-pressed={categoria === c}
                disabled={n === 0 && c !== 'Todas'} onClick={() => setCategoria(c)}>
                {c} ({n})
              </button>
            )
          })}
        </div>
      )}

      {resultado.alertas.length === 0 ? (
        <Blueprint className="painel-vazio">
          <Icone nome="check_circle" tamanho={48} />
          <h2>Nenhum alerta. Estoque em dia.</h2>
          <p>Última análise: {fmtData(hoje.toISOString())}.</p>
        </Blueprint>
      ) : filtrados.length === 0 ? (
        <div className="painel-vazio-filtro">
          <p>Nenhum alerta em {categoria}.</p>
          <button type="button" className="btn btn-secondary" onClick={() => setCategoria('Todas')}>Ver todas as categorias</button>
        </div>
      ) : (
        NIVEIS.map((nivel) => {
          const doNivel = filtrados.filter((a) => a.nivel === nivel)
          if (doNivel.length === 0) return null
          const soma = doNivel.reduce((t, a) => t + (a.valorEnvolvido ?? 0), 0)
          return (
            <section key={nivel} className="grupo-nivel" aria-label={`${ROTULO_NIVEL[nivel]}: ${doNivel.length} alertas`}>
              <header className={`grupo-cabecalho grupo-${nivel}`}>
                <SeloNivel nivel={nivel} />
                <span>{doNivel.length} {doNivel.length === 1 ? 'alerta' : 'alertas'}</span>
                <strong>{fmtReais(soma)}</strong>
              </header>
              <div className="lista-cartoes">
                {doNivel.map((a) => (
                  <CartaoAlerta key={chaveAlerta(a)} alerta={a} produto={nome(a.produtoId)} onAbrir={() => ir({ nome: 'dono-alerta', indice: chaveAlerta(a) })} />
                ))}
              </div>
            </section>
          )
        })
      )}
    </div>
  )
}

/** Resumo financeiro fixo à direita no computador. */
export function ResumoLateral() {
  const { resultado } = useDados()
  const { aba } = useNavegacao()
  const f = resultado.resumoFinanceiro
  const parados = resultado.alertas.filter((a) => a.tipo === 'item_parado')
  return (
    <aside className="resumo-lateral" aria-label="Resumo financeiro">
      <p className="sobretitulo">Resumo financeiro</p>
      <p className="rotulo-suave">Valor em estoque</p>
      <p className="valor-grande">{fmtReais(f.valorConhecido)}</p>
      {f.estimado && <span className="selo-estimado"><Icone nome="informativo" tamanho={14} />valor estimado</span>}
      <MapaBlocos itens={f.porCategoria.filter((c) => c.valor > 0).map((c) => ({ rotulo: c.categoria, valor: c.valor, detalhe: `${fmtNum(Math.round((c.valor / f.valorConhecido) * 100))}%` }))} />
      <dl className="lista-resumo">
        <div><dt><Icone nome="parado" tamanho={18} />Itens parados</dt><dd>{parados.length} · {fmtReais(parados.reduce((t, a) => t + (a.valorEnvolvido ?? 0), 0))}</dd></div>
        <div><dt><Icone nome="sem_preco" tamanho={18} />Itens sem preço</dt><dd>{f.itensSemPreco}</dd></div>
      </dl>
      <button type="button" className="btn btn-secondary btn-block" onClick={() => aba({ nome: 'dono-financeiro' })}>
        <Icone nome="financeiro" tamanho={18} /> Abrir resumo financeiro
      </button>
    </aside>
  )
}

// ---------------------------------------------------------------- detalhe do alerta

export function DetalheAlerta({ indice }: { indice: string }) {
  const { resultado, db, agora } = useDados()
  const { ir } = useNavegacao()
  const nome = useNomes()
  const [resposta, setResposta] = useState<{ decisao: 'mesmo' | 'diferente'; a: string; b: string; outro: string; produto: string } | null>(null)
  const alerta = resultado.alertas.find((a) => chaveAlerta(a) === indice)

  if (resposta) {
    return (
      <div className="tela detalhe-alerta">
        <Blueprint className="resposta-duplicidade" role="status">
          <Icone nome="check_circle" tamanho={40} />
          <h2>Resposta registrada</h2>
          <p>
            {resposta.decisao === 'mesmo'
              ? `"${resposta.produto}" passa a ser tratado como "${resposta.outro}": os saldos agora são somados.`
              : `"${resposta.produto}" e "${resposta.outro}" são produtos diferentes. Este alerta não volta.`}
          </p>
          <button type="button" className="btn btn-secondary" onClick={async () => {
            await desfazerDuplicidade(db, resposta.a, resposta.b)
            setResposta(null)
          }}>Desfazer</button>
        </Blueprint>
      </div>
    )
  }

  if (!alerta) {
    return (
      <div className="tela detalhe-alerta">
        <Blueprint className="painel-vazio">
          <Icone nome="check_circle" tamanho={40} />
          <h2>Este alerta não aparece mais</h2>
          <p>A análise foi refeita com os registros mais recentes e a situação mudou.</p>
        </Blueprint>
      </div>
    )
  }

  const produto = nome(alerta.produtoId)
  const outroId = alerta.evidencia.outroProdutoId
  const responder = async (decisao: 'mesmo' | 'diferente') => {
    if (typeof outroId !== 'string') return
    await decidirDuplicidade(db, outroId, alerta.produtoId, decisao, agora())
    setResposta({ decisao, a: outroId, b: alerta.produtoId, outro: String(alerta.evidencia.outroProduto), produto })
  }

  return (
    <div className="tela detalhe-alerta">
      <div className="cartao-topo">
        <SeloNivel nivel={alerta.nivel} />
        <span className={`tipo-alerta tipo-${alerta.nivel}`}><Icone nome={alerta.tipo} tamanho={20} />{ROTULO_TIPO[alerta.tipo]}</span>
      </div>
      <h1>{produto}</h1>
      <p className="mensagem-alerta">{alerta.mensagem}</p>
      <p className="valor-envolvido">
        <span>Valor envolvido</span>
        <strong className={alerta.valorEnvolvido === null ? 'valor-desconhecido' : ''}>{valorAlerta(alerta)}</strong>
      </p>

      {alerta.tipo === 'possivel_duplicidade' && (
        <Blueprint className="pergunta-duplicidade">
          <p><strong>"{produto}" e "{String(alerta.evidencia.outroProduto)}" são o mesmo produto?</strong></p>
          <div className="botoes-duplicidade">
            <button type="button" className="btn btn-primary" onClick={() => responder('mesmo')}>
              <Icone nome="check" tamanho={18} /> Sim, é o mesmo
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => responder('diferente')}>
              Não, são diferentes
            </button>
          </div>
        </Blueprint>
      )}

      <Secao icone="evidencia" titulo="Evidência em números">
        <dl className="tabela-evidencia">
          {linhasEvidencia(alerta).map((l) => (
            <div key={l.rotulo}><dt>{l.rotulo}</dt><dd>{l.valor}</dd></div>
          ))}
        </dl>
      </Secao>
      <Secao icone="regra" titulo="Regra usada">
        <p>{alerta.regra}</p>
        {typeof alerta.evidencia.origemLimite === 'string' && (
          <p className="origem-limite"><strong>Origem do limite:</strong> {maiuscula(alerta.evidencia.origemLimite)}</p>
        )}
      </Secao>
      <Secao icone="confianca" titulo="Confiança da estimativa">
        <SeloConfianca confianca={alerta.confianca} />
        <p>{textoConfianca(alerta)}</p>
      </Secao>
      <Secao icone="recomendacao" titulo="Recomendação">
        <p>{alerta.recomendacao}</p>
      </Secao>
      <button type="button" className="btn btn-secondary btn-block botao-alto" onClick={() => ir({ nome: 'dono-produto', produtoId: alerta.produtoId })}>
        <Icone nome="lista" tamanho={18} /> Ver produto
      </button>
    </div>
  )
}

// ---------------------------------------------------------------- produtos

const ORDEM_NIVEL = { critico: 0, atencao: 1, informativo: 2 } as const

function textoCobertura(a: AnaliseProduto): string {
  if (a.cobertura === null) return fmtCobertura(null)
  if (a.confianca === 'insuficiente') return 'Histórico insuficiente'
  return `≈ ${fmtCobertura(a.cobertura)}`
}

export function ListaProdutos() {
  const { resultado } = useDados()
  const { ir } = useNavegacao()
  const [busca, setBusca] = useState('')
  const alertasPor = useMemo(() => {
    const m = new Map<string, Alerta[]>()
    for (const a of resultado.alertas) m.set(a.produtoId, [...(m.get(a.produtoId) ?? []), a])
    return m
  }, [resultado])
  const termo = busca.trim().toLowerCase()
  const lista = resultado.produtos
    .filter((a) => !termo || a.produto.nome_canonico.toLowerCase().includes(termo))
    .sort((x, y) => x.produto.nome_canonico.localeCompare(y.produto.nome_canonico, 'pt-BR'))
  const comAlerta = lista
    .filter((a) => alertasPor.has(a.produto.id))
    .sort((x, y) => ORDEM_NIVEL[alertasPor.get(x.produto.id)![0].nivel] - ORDEM_NIVEL[alertasPor.get(y.produto.id)![0].nivel])
  const demais = lista.filter((a) => !alertasPor.has(a.produto.id))

  const linha = (a: AnaliseProduto, alertas?: Alerta[]) => (
    <li key={a.produto.id}>
      <button type="button" className="linha-produto" onClick={() => ir({ nome: 'dono-produto', produtoId: a.produto.id })} data-testid="linha-produto">
        <Icone nome={ICONE_CATEGORIA[a.produto.categoria]} tamanho={28} />
        <span className="linha-produto-nome">
          <strong>{a.produto.nome_canonico}</strong>
          <small>{alertas ? alertas.map((x) => ROTULO_TIPO[x.tipo]).join(' · ') : a.produto.categoria}</small>
        </span>
        <span className="linha-produto-numeros">
          {alertas && <SeloNivel nivel={alertas[0].nivel} pequeno />}
          <strong>{fmtQtd(Math.round(a.saldo * 100) / 100, siglaBase(a.produto))}</strong>
          <small>{textoCobertura(a)}</small>
        </span>
      </button>
    </li>
  )

  return (
    <div className="tela produtos">
      <h1>Produtos</h1>
      <p className="rotulo-suave">{resultado.produtos.length} produtos · {alertasPor.size} com alerta</p>
      <label className="busca">
        <Icone nome="search" tamanho={20} />
        <input className="input" type="search" placeholder="Buscar pelo nome" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar produto pelo nome" />
      </label>
      {comAlerta.length > 0 && (<><h2 className="subtitulo">Com alerta</h2><ul className="lista-produtos">{comAlerta.map((a) => linha(a, alertasPor.get(a.produto.id)))}</ul></>)}
      {demais.length > 0 && (<><h2 className="subtitulo">Demais produtos</h2><ul className="lista-produtos">{demais.map((a) => linha(a))}</ul></>)}
    </div>
  )
}

export function DetalheProduto({ produtoId }: { produtoId: string }) {
  const { resultado, movimentacoes, hoje } = useDados()
  const { ir } = useNavegacao()
  const [periodo, setPeriodo] = useState<90 | 365>(365)
  const a = resultado.produtos.find((x) => x.produto.id === produtoId)
  const movsProduto = useMemo(() => movimentacoes.filter((m) => m.produto_id === produtoId), [movimentacoes, produtoId])
  const serie = useMemo(() => (a ? serieDoProduto(a.produto, movsProduto, hoje, periodo) : null), [a, movsProduto, hoje, periodo])
  if (!a || !serie) return <div className="tela"><p>Produto não encontrado.</p></div>

  const un = siglaBase(a.produto)
  const alertas = resultado.alertas.filter((x) => x.produtoId === produtoId)
  const atipicas = new Map(
    alertas.filter((x) => x.tipo === 'retirada_atipica').map((x) => [String(x.evidencia.movimentacaoId), x]),
  )
  const hojeDia = diaDe(hoje.toISOString())
  const lotes = a.lotes.filter((l) => l.saldo > 0).sort((x, y) => (x.validade ?? '9999').localeCompare(y.validade ?? '9999'))
  const historico = [...movsProduto]
    .filter((m) => m.data <= hoje.toISOString().slice(0, 10))
    .sort((x, y) => y.data.localeCompare(x.data) || y.criado_em.localeCompare(x.criado_em))
    .slice(0, 40)

  return (
    <div className="tela detalhe-produto">
      <div className="produto-cabecalho">
        <Blueprint className="produto-icone"><Icone nome={ICONE_CATEGORIA[a.produto.categoria]} tamanho={40} /></Blueprint>
        <div>
          <p className="sobretitulo">{a.produto.categoria}</p>
          <h1>{a.produto.nome_canonico}</h1>
        </div>
      </div>

      <div className="numeros-produto">
        <Blueprint className="numero">
          <span>Saldo atual</span>
          <strong>{fmtQtd(Math.round(a.saldo * 100) / 100, un)}</strong>
          <small>Última retirada: {a.ultimaSaida ? fmtData(a.ultimaSaida) : 'nenhuma'}</small>
        </Blueprint>
        <Blueprint className="numero">
          <span>Estoque mínimo</span>
          <strong>{a.produto.estoque_minimo === null ? 'Não cadastrado' : fmtQtd(a.produto.estoque_minimo, un)}</strong>
        </Blueprint>
        <Blueprint className="numero">
          <span>Cobertura estimada</span>
          <strong>{textoCobertura(a)}</strong>
          <SeloConfianca confianca={a.confianca} />
        </Blueprint>
      </div>

      {alertas.length > 0 && (
        <section className="alertas-produto">
          <h2 className="subtitulo">Alertas deste produto</h2>
          <ul>
            {alertas.map((x) => (
              <li key={chaveAlerta(x)}>
                <button type="button" onClick={() => ir({ nome: 'dono-alerta', indice: chaveAlerta(x) })}>
                  <SeloNivel nivel={x.nivel} pequeno />
                  <span><strong>{ROTULO_TIPO[x.tipo]}:</strong> {x.mensagem}</span>
                  <Icone nome="chevron" tamanho={18} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Secao icone="barras" titulo={periodo === 365 ? 'Consumo por mês' : 'Consumo por semana'}>
        <div className="seg" role="group" aria-label="Período">
          {([[90, '90 dias'], [365, '12 meses']] as const).map(([v, r]) => (
            <button key={v} type="button" className={`seg-botao ${periodo === v ? 'seg-ativo' : ''}`} aria-pressed={periodo === v} onClick={() => setPeriodo(v)}>{r}</button>
          ))}
        </div>
        <GraficoConsumo periodos={periodo === 365 ? serie.porMes : serie.porSemana} unidade={un} />
      </Secao>
      <Secao icone="grafico" titulo="Saldo ao longo do tempo">
        <GraficoSaldo pontos={serie.saldo} unidade={un} minimo={a.produto.estoque_minimo} />
      </Secao>

      <Secao icone="lote" titulo="Saldo por lote">
        {lotes.length === 0 ? <p className="rotulo-suave">Nenhum lote com saldo.</p> : (
          <ul className="lista-lotes">
            {lotes.map((l) => {
              const dias = l.validade === null ? null : diaDe(l.validade) - hojeDia
              const st = dias === null ? { r: 'Sem validade', c: 'st-neutro' }
                : dias < 0 ? { r: 'Vencido', c: 'st-critico' }
                : dias <= 120 ? { r: `Vence em ${dias} dias`, c: 'st-atencao' }
                : { r: 'Dentro da validade', c: 'st-ok' }
              return (
                <li key={l.lote}>
                  <div className="lote-topo">
                    <strong>{l.lote === SEM_LOTE ? 'Sem identificação de lote' : `Lote ${l.lote}`}</strong>
                    <span>{fmtQtd(Math.round(l.saldo * 100) / 100, un)}</span>
                  </div>
                  <span className={`status-lote ${st.c}`}>{st.r}</span>
                  <small>Validade: {l.validade ? fmtData(l.validade) : '—'} · Entrada em {fmtData(l.primeiraEntrada)} · Preço: {l.precoUnitBase === null ? (a.precoMedio === null ? 'Sem preço' : `preço médio ${fmtReais(a.precoMedio)}/${un}`) : `${fmtReais(l.precoUnitBase)}/${un}`}</small>
                </li>
              )
            })}
          </ul>
        )}
      </Secao>

      <Secao icone="historico" titulo="Movimentações">
        <ul className="lista-movimentacoes">
          {historico.map((m) => {
            const atipica = atipicas.get(m.id)
            const rotulo = m.tipo === 'saida' ? 'Saída' : m.tipo === 'entrada' ? 'Entrada' : 'Ajuste'
            return (
              <li key={m.id} className={atipica ? 'mov-atipica' : ''} data-testid={atipica ? 'mov-atipica' : undefined}>
                <Icone nome={m.tipo === 'entrada' ? 'entrada' : 'retirada'} tamanho={22} />
                <div>
                  <strong>{rotulo} · {fmtQtd(m.quantidade, m.unidade_id)}</strong>
                  <small>{fmtData(m.data)} · {m.responsavel_pseudonimo ?? '—'}{m.destino ? ` · ${m.destino}` : ''}{m.fornecedor ? ` · ${m.fornecedor}` : ''}</small>
                  {atipica && <small className="texto-atipica"><Icone nome="atencao" tamanho={14} /> Retirada atípica · o normal é perto de {fmtQtd(atipica.evidencia.mediana, un)}</small>}
                </div>
              </li>
            )
          })}
        </ul>
      </Secao>
    </div>
  )
}

// ---------------------------------------------------------------- financeiro

export function Financeiro() {
  const { resultado } = useDados()
  const { ir } = useNavegacao()
  const f = resultado.resumoFinanceiro
  const comPreco = f.itensComEstoque - f.itensSemPreco
  const parados = resultado.alertas.filter((a) => a.tipo === 'item_parado')
  const nome = useNomes()
  const semPreco = f.porProduto.filter((p) => p.valor === null || p.estimado)
  const pct = (v: number) => `${fmtNum(f.valorConhecido > 0 ? Math.round((v / f.valorConhecido) * 1000) / 10 : 0)}%`

  return (
    <div className="tela financeiro">
      <p className="sobretitulo">Valor em estoque</p>
      <p className="valor-grande">
        {fmtReais(f.valorConhecido)}{' '}
        {f.estimado && <span className="selo-estimado"><Icone nome="informativo" tamanho={14} />valor estimado</span>}
      </p>
      <p className="nota-financeiro">
        Soma dos {comPreco} {comPreco === 1 ? 'item' : 'itens'} com preço.
        {f.itensSemPreco > 0 && ` ${f.itensSemPreco} ${f.itensSemPreco === 1 ? 'item sem nenhum preço fica' : 'itens sem nenhum preço ficam'} fora da conta.`}
        {f.lotesComPrecoMedio > 0 && ` ${f.lotesComPrecoMedio} ${f.lotesComPrecoMedio === 1 ? 'lote com compras sem preço foi valorado' : 'lotes com compras sem preço foram valorados'} pelo preço médio.`}
        {f.estimado && ' Por isso o valor é estimado.'}
      </p>

      <h2 className="subtitulo">Onde está o valor</h2>
      <MapaBlocos itens={f.porCategoria.filter((c) => c.valor > 0).map((c) => ({ rotulo: c.categoria, valor: c.valor, detalhe: `${fmtReais(c.valor)} · ${pct(c.valor)}` }))} />
      <ul className="lista-categorias">
        {f.porCategoria.map((c, i) => (
          <li key={c.categoria}>
            <i className={`bloco-amostra bloco-${Math.min(i, 4)}`} />
            <span>
              <strong>{c.categoria}</strong>
              <small>{c.itensComEstoque} {c.itensComEstoque === 1 ? 'item' : 'itens'}{c.itensSemPreco > 0 ? ` · ${c.itensSemPreco} sem preço` : ''}{c.lotesComPrecoMedio > 0 ? ` · ${c.lotesComPrecoMedio} com preço médio` : ''}</small>
            </span>
            <span className="valor-categoria"><strong>{fmtReais(c.valor)}</strong><small>{pct(c.valor)}</small></span>
          </li>
        ))}
      </ul>

      <Secao icone="parado" titulo="Itens parados">
        {parados.length === 0 ? <p className="rotulo-suave">Nenhum item parado entre os de maior valor.</p> : (
          <ul className="lista-simples">
            {parados.map((a) => (
              <li key={chaveAlerta(a)}>
                <button type="button" onClick={() => ir({ nome: 'dono-produto', produtoId: a.produtoId })}>
                  <span><strong>{nome(a.produtoId)}</strong><small>Sem retirada há {fmtNum(a.evidencia.diasSemSaida)} dias</small></span>
                  <strong>{fmtReais(a.valorEnvolvido)}</strong>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Secao>

      <Secao icone="sem_preco" titulo={`Itens sem preço (${f.itensSemPreco}) e com valor estimado (${f.porProduto.filter((p) => p.estimado).length})`}>
        <p className="rotulo-suave">Sem preço não é R$ 0,00: o valor é desconhecido e fica fora da soma.</p>
        <ul className="lista-simples">
          {semPreco.map((p) => (
            <li key={p.produtoId}>
              <button type="button" onClick={() => ir({ nome: 'dono-produto', produtoId: p.produtoId })}>
                <span>
                  <strong>{p.nome}</strong>
                  <small>{p.valor === null ? 'Nenhuma compra com preço' : `${p.lotesComPrecoMedio} ${p.lotesComPrecoMedio === 1 ? 'lote' : 'lotes'} com compras sem preço (preço médio)`}</small>
                </span>
                <strong className={p.valor === null ? 'valor-desconhecido' : ''}>{p.valor === null ? 'Sem preço' : `${fmtReais(p.valor)} (estimado)`}</strong>
              </button>
            </li>
          ))}
        </ul>
      </Secao>
    </div>
  )
}
