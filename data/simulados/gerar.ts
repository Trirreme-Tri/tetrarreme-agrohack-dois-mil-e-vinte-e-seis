// Gerador da base simulada — DADOS SIMULADOS, criados pela equipe Tetrarreme.
//
// A organização não fornecerá base oficial: esta é a base da demonstração (R7),
// sempre identificada como SIMULADA (coluna `origem_dados` em toda linha).
//
// - Determinístico: cada produto tem seu próprio gerador pseudoaleatório com semente fixa,
//   então o resultado é idêntico a cada execução (e mexer em um produto não altera os outros).
// - 12 meses de movimentações, de INICIO até DATA_REFERENCIA.
// - Gera `movimentacoes.csv` e `SITUACOES.md` nesta pasta.
//
// Uso (na raiz do repositório): npm run gerar:simulados
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Data de referência da análise: a base termina aqui e os testes analisam nesta data. */
export const DATA_REFERENCIA = '2026-10-20'
/** Primeiro dia da base (12 meses antes da data de referência). */
export const INICIO = '2025-10-21'
const SEMENTE = 20261029

export type NivelAlerta = 'critico' | 'atencao' | 'informativo'

/** Exemplos do Anexo III (CLAUDE.md, seção 5) e o produto que representa cada um na base. */
export const ANEXO_III: { categoria: string; exemplo: string; produto: string }[] = [
  ...([
    ['Ureia', 'Ureia'], ['KCl', 'Cloreto de potássio (KCl)'], ['MAP', 'MAP (fosfato monoamônico)'],
    ['NPK 04-14-08', 'NPK 04-14-08'], ['NPK 10-10-10', 'NPK 10-10-10'], ['NPK 04-30-16', 'NPK 04-30-16'],
    ['Sulfato de amônio', 'Sulfato de amônio'], ['FTE BR-12', 'FTE BR-12'],
  ] as const).map(([exemplo, produto]) => ({ categoria: 'Fertilizantes', exemplo, produto })),
  ...([['Calcário dolomítico', 'Calcário dolomítico'], ['Gesso agrícola', 'Gesso agrícola']] as const)
    .map(([exemplo, produto]) => ({ categoria: 'Corretivos', exemplo, produto })),
  ...([
    ['Milho', 'Semente de milho híbrido'], ['Soja', 'Semente de soja'], ['Feijão', 'Semente de feijão'],
    ['Braquiária', 'Semente de braquiária'],
  ] as const).map(([exemplo, produto]) => ({ categoria: 'Sementes', exemplo, produto })),
  ...([
    ['Herbicidas', 'Herbicida glifosato 480'], ['Herbicidas', 'Herbicida 2,4-D'],
    ['Fungicidas', 'Fungicida azoxistrobina'], ['Fungicidas', 'Fungicida mancozebe'],
    ['Inseticidas', 'Inseticida lambda-cialotrina'], ['Inseticidas', 'Inseticida biológico Bacillus thuringiensis'],
    ['Adjuvante', 'Adjuvante óleo mineral'], ['Trichoderma', 'Trichoderma harzianum'],
    ['Azospirillum', 'Azospirillum brasilense'], ['Inoculante', 'Inoculante para soja'],
  ] as const).map(([exemplo, produto]) => ({ categoria: 'Defensivos e biológicos', exemplo, produto })),
  ...([
    ['Óleo diesel S10', 'Óleo diesel S10'], ['Óleo de motor', 'Óleo de motor 15W40'],
    ['Óleo hidráulico', 'Óleo hidráulico'], ['Graxa', 'Graxa para rolamentos'],
  ] as const).map(([exemplo, produto]) => ({ categoria: 'Combustíveis e lubrificantes', exemplo, produto })),
  ...([
    ['Filtros', 'Filtro de óleo do trator'], ['Correias', 'Correia do alternador'], ['Rolamentos', 'Rolamento 6205'],
    ['Bicos de pulverização', 'Bico de pulverização leque 110-02'], ['Mangueiras', 'Mangueira hidráulica 1/2 pol'],
    ['Parafusos', 'Parafuso sextavado M12'], ['Discos de corte', 'Disco de corte para esmerilhadeira'],
    ['Eletrodos', 'Eletrodo de solda 2,5 mm'],
  ] as const).map(([exemplo, produto]) => ({ categoria: 'Peças e manutenção', exemplo, produto })),
  ...([
    ['Tubos PVC', 'Tubo PVC 50 mm'], ['Mangueira de gotejamento', 'Mangueira de gotejamento 16 mm'],
    ['Conectores', 'Conector de linha 16 mm'], ['Filtros', 'Filtro de disco para irrigação'],
    ['Registros', 'Registro de esfera 32 mm'],
  ] as const).map(([exemplo, produto]) => ({ categoria: 'Materiais de irrigação', exemplo, produto })),
  ...([
    ['Luvas', 'Luva nitrílica'], ['Respiradores', 'Respirador PFF2'], ['Filtros', 'Filtro para respirador'],
    ['Óculos', 'Óculos de proteção'], ['Aventais', 'Avental impermeável'], ['Botas', 'Bota de borracha'],
    ['Sacos', 'Saco de ráfia 60 kg'], ['Etiquetas', 'Etiqueta de identificação'], ['Fitas', 'Fita de sinalização'],
    ['Estacas', 'Estaca de madeira'],
  ] as const).map(([exemplo, produto]) => ({ categoria: 'EPI e diversos', exemplo, produto })),
]

export interface Situacao {
  numero: number
  produto: string
  tipo: string
  nivel: NivelAlerta
  descricao: string
}

export interface ProdutoNormal {
  produto: string
  motivo: string
}

export interface AlertaSecundario {
  produto: string
  tipo: string
  nivel: NivelAlerta
  motivo: string
}

export interface BaseSimulada {
  csv: string
  situacoesMd: string
  situacoes: Situacao[]
  normais: ProdutoNormal[]
  secundarios: AlertaSecundario[]
  /** Produtos fora do Anexo III, existentes só para manter situações plantadas. */
  extras: string[]
  totalProdutos: number
  totalMovimentacoes: number
  categorias: string[]
}

interface Linha {
  produto: string
  categoria: string
  unidade: string
  quantidade: number
  estoque_minimo: number | null
  tipo: 'entrada' | 'saida' | 'ajuste'
  data: string
  preco_unit: string
  lote: string
  validade: string
  fornecedor: string
  destino: string
  responsavel: string
}

/** Quanto 1 unidade vale na unidade base (kg, L, un). */
const FATOR: Record<string, number> = { t: 1000, kg: 1, 'sc 50 kg': 50, L: 1, mL: 0.001, un: 1 }
const RESPONSAVEIS = ['Funcionário A', 'Funcionário B', 'Funcionário C', 'Funcionário D']

export function somarDias(iso: string, dias: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

const dataBr = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`
const fmt = (n: number) => String(n).replace('.', ',')
const reais = (n: number) => n.toFixed(2).replace('.', ',')

/** Gerador pseudoaleatório (LCG) com semente derivada da semente fixa e do nome do produto. */
function criarAleatorio(nome: string): () => number {
  let s = SEMENTE
  for (const c of nome) s = (s * 31 + c.charCodeAt(0)) % 2147483648
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648
    return s / 2147483648
  }
}

export function gerarBase(): BaseSimulada {
  const linhas: Linha[] = []
  const situacoes: Situacao[] = []
  const normais: ProdutoNormal[] = []
  const secundarios: AlertaSecundario[] = []
  const categorias = new Set<string>()

  /** Registra um produto e devolve as funções que lançam movimentações dele. */
  function produto(nome: string, categoria: string, minimo: number | null = null) {
    categorias.add(categoria)
    const aleatorio = criarAleatorio(nome)
    const minimoNa = (unidade: string) => (minimo === null ? null : minimo / FATOR[unidade])
    const responsavel = () => RESPONSAVEIS[Math.floor(aleatorio() * RESPONSAVEIS.length)]
    const linha = (l: Partial<Linha> & Pick<Linha, 'tipo' | 'data' | 'quantidade' | 'unidade'>) =>
      linhas.push({
        produto: nome, categoria, estoque_minimo: minimoNa(l.unidade), preco_unit: '', lote: '', validade: '',
        fornecedor: '', destino: '', responsavel: responsavel(), ...l,
      })

    const p = {
      nome,
      /** Valor em torno de `base`, ± `variacao`, com `casas` decimais. */
      perto(base: number, variacao: number, casas = 0): number {
        const f = 10 ** casas
        return Math.round((base + (aleatorio() * 2 - 1) * variacao) * f) / f
      },
      compra(data: string, quantidade: number, unidade: string, preco: string, fornecedor: string, lote = '', validade = '-') {
        linha({ tipo: 'entrada', data, quantidade, unidade, preco_unit: preco, fornecedor, lote, validade: validade === '-' ? '-' : dataBr(validade) })
      },
      retirada(data: string, quantidade: number, unidade: string, destino: string, lote = '') {
        linha({ tipo: 'saida', data, quantidade, unidade, destino, lote })
      },
      ajuste(data: string, quantidade: number, unidade: string, motivo: string) {
        linha({ tipo: 'ajuste', data, quantidade, unidade, destino: motivo })
      },
      /** Retiradas a cada `intervalo` dias de `inicio` a `fim` (inclusive). Devolve o total. */
      retiradas(inicio: string, fim: string, intervalo: number, qtd: () => number, unidade: string, destinos: string[]): number {
        let total = 0
        for (let d = inicio, i = 0; d <= fim; d = somarDias(d, intervalo), i++) {
          const q = qtd()
          p.retirada(d, q, unidade, destinos[i % destinos.length])
          total += q
        }
        return total
      },
    }
    return p
  }
  type ProdutoSimulado = ReturnType<typeof produto>

  function plantar(produtoNome: string, tipo: string, nivel: NivelAlerta, descricao: string) {
    situacoes.push({ numero: situacoes.length + 1, produto: produtoNome, tipo, nivel, descricao })
  }
  function normal(produtoNome: string, motivo: string) {
    normais.push({ produto: produtoNome, motivo })
  }

  interface Continuo {
    /** Unidade das retiradas. */
    unidade: string
    intervalo: number
    quantidade: number
    /** Variação de cada retirada, como fração da quantidade (padrão 20%). */
    variacao?: number
    casas?: number
    /** Preço por unidade de compra; `null` = compra sempre sem preço. */
    preco: number | null
    unidadeCompra?: string
    fornecedor: string
    destinos: string[]
    /** Prefixo do lote (o lote recebe o mês da compra). */
    lote?: string
    /** Validade do lote em anos após a compra. */
    validadeAnos?: number
    /** Texto de preço ausente em algumas compras (índice da compra → texto ou null). */
    precoAusente?: (indiceCompra: number) => string | null
  }

  /**
   * Consumo contínuo com recompra: compra ~90 dias de consumo quando o saldo cai abaixo
   * de ~45 dias. Na data de referência, a cobertura fica entre ~45 e ~135 dias (sem alerta).
   */
  function consumoContinuo(p: ProdutoSimulado, o: Continuo) {
    const unidadeCompra = o.unidadeCompra ?? o.unidade
    const fator = FATOR[unidadeCompra] / FATOR[o.unidade]
    const porDia = o.quantidade / o.intervalo
    let saldo = 0
    let compras = 0
    let i = 0
    for (let d = INICIO; d <= DATA_REFERENCIA; d = somarDias(d, 1), i++) {
      if (saldo < porDia * 45) {
        const q = Math.ceil((porDia * 90) / fator)
        const preco = o.precoAusente?.(compras) ?? (o.preco === null ? '-' : reais(p.perto(o.preco, o.preco * 0.03, 2)))
        const lote = o.lote ? `${o.lote}-${d.slice(2, 4)}${d.slice(5, 7)}` : ''
        p.compra(d, q, unidadeCompra, preco, o.fornecedor, lote, o.validadeAnos ? somarDias(d, 365 * o.validadeAnos) : '-')
        saldo += q * fator
        compras++
      }
      if (i % o.intervalo === 0) {
        const q = p.perto(o.quantidade, o.quantidade * (o.variacao ?? 0.2), o.casas ?? 0)
        p.retirada(d, q, o.unidade, o.destinos[Math.floor(i / o.intervalo) % o.destinos.length])
        saldo -= q
      }
    }
  }

  /**
   * Consumo contínuo com uma única compra no início, de um só lote, dimensionada para sobrar
   * ~90 dias de consumo. Usado nos defensivos normais: o lote nunca zera (sem alerta de embalagem).
   */
  function compraUnicaContinua(p: ProdutoSimulado, o: Continuo) {
    const unidadeCompra = o.unidadeCompra ?? o.unidade
    const fator = FATOR[unidadeCompra] / FATOR[o.unidade]
    const inicio = somarDias(INICIO, 2)
    const saidas: [string, number][] = []
    let total = 0
    for (let d = somarDias(inicio, 3), i = 0; d <= DATA_REFERENCIA; d = somarDias(d, o.intervalo), i++) {
      const q = p.perto(o.quantidade, o.quantidade * (o.variacao ?? 0.2), o.casas ?? 0)
      saidas.push([d, q])
      total += q
    }
    const q = Math.ceil((total + (o.quantidade / o.intervalo) * 90) / fator)
    p.compra(inicio, q, unidadeCompra, reais(o.preco!), o.fornecedor, `${o.lote}-${inicio.slice(2, 4)}${inicio.slice(5, 7)}`, somarDias(inicio, 365 * (o.validadeAnos ?? 3)))
    saidas.forEach(([d, s], i) => p.retirada(d, s, o.unidade, o.destinos[i % o.destinos.length]))
  }

  // ======================================================================
  // PRODUTOS NORMAIS — não devem gerar nenhum alerta
  // Catálogo = todos os exemplos do Anexo III (CLAUDE.md, seção 5); itens genéricos especificados.
  // ======================================================================

  // ---- Combustíveis e lubrificantes (Anexo III: óleo diesel S10; óleo de motor; óleo hidráulico; graxa)
  //      Óleo hidráulico e graxa são situações plantadas (abaixo).
  {
    const p = produto('Óleo diesel S10', 'Combustíveis e lubrificantes', 500)
    consumoContinuo(p, { unidade: 'L', intervalo: 3, quantidade: 100, preco: 6.1, fornecedor: 'Posto Gama', destinos: ['Trator 1', 'Trator 2', 'Gerador'], lote: 'DSL' })
    // Correção de inventário: append-only, por ajuste (nunca edição).
    p.ajuste('2026-07-31', -20, 'L', 'Inventário mensal')
    normal(p.nome, 'Consumo estável (~33 L/dia) com recompra regular; inclui um ajuste de inventário de −20 L')
  }
  {
    const p = produto('Óleo de motor 15W40', 'Combustíveis e lubrificantes', 20)
    consumoContinuo(p, { unidade: 'L', intervalo: 7, quantidade: 4, casas: 1, preco: 24.9, fornecedor: 'Revenda Agrícola Alfa', destinos: ['Oficina'] })
    normal(p.nome, 'Troca semanal estável')
  }

  // ---- EPI e materiais diversos (Anexo III: luvas; respiradores; filtros; óculos; aventais; botas;
  //      sacos; etiquetas; fitas; estacas)
  {
    const p = produto('Luva nitrílica', 'EPI e diversos', 20)
    // Toda 3ª compra chega sem preço na nota ("N/D"): R2, ausente nunca vira zero.
    consumoContinuo(p, {
      unidade: 'un', intervalo: 2, quantidade: 2, preco: 1.2, fornecedor: 'Revenda Agrícola Alfa', destinos: ['Pulverização'],
      precoAusente: (i) => (i % 3 === 2 ? 'N/D' : null),
    })
    normal(p.nome, 'Consumo estável; algumas compras sem preço ("N/D"), que não viram zero')
  }
  {
    const p = produto('Respirador PFF2', 'EPI e diversos', 10)
    consumoContinuo(p, { unidade: 'un', intervalo: 3, quantidade: 2, preco: 3.5, fornecedor: 'Revenda Agrícola Alfa', destinos: ['Pulverização'] })
    normal(p.nome, 'Consumo estável')
  }
  {
    const p = produto('Filtro para respirador', 'EPI e diversos', 4)
    consumoContinuo(p, { unidade: 'un', intervalo: 7, quantidade: 2, preco: 9.5, fornecedor: 'Revenda Agrícola Alfa', destinos: ['Pulverização'] })
    normal(p.nome, 'Troca semanal. Um dos três "filtros" do Anexo III: produto distinto, **não** é duplicidade dos outros dois (R8)')
  }
  {
    const p = produto('Óculos de proteção', 'EPI e diversos', 2)
    consumoContinuo(p, { unidade: 'un', intervalo: 10, quantidade: 1, preco: 15, fornecedor: 'Revenda Agrícola Alfa', destinos: ['Oficina', 'Pulverização'] })
    normal(p.nome, 'Troca regular a cada 10 dias')
  }
  {
    const p = produto('Avental impermeável', 'EPI e diversos', 2)
    consumoContinuo(p, { unidade: 'un', intervalo: 10, quantidade: 1, preco: 35, fornecedor: 'Revenda Agrícola Alfa', destinos: ['Preparo de calda'] })
    normal(p.nome, 'Troca regular a cada 10 dias')
  }
  {
    const p = produto('Bota de borracha', 'EPI e diversos', 2)
    consumoContinuo(p, { unidade: 'un', intervalo: 10, quantidade: 1, preco: 60, fornecedor: 'Revenda Agrícola Alfa', destinos: ['Equipe de campo'] })
    normal(p.nome, 'Reposição regular para a equipe')
  }
  {
    const p = produto('Saco de ráfia 60 kg', 'EPI e diversos', 20)
    consumoContinuo(p, { unidade: 'un', intervalo: 3, quantidade: 5, preco: 1.1, fornecedor: 'Revenda Agrícola Alfa', destinos: ['Galpão'] })
    normal(p.nome, 'Consumo estável no galpão')
  }
  {
    const p = produto('Etiqueta de identificação', 'EPI e diversos', 50)
    consumoContinuo(p, { unidade: 'un', intervalo: 3, quantidade: 20, preco: 0.15, fornecedor: 'Revenda Agrícola Alfa', destinos: ['Galpão'] })
    normal(p.nome, 'Consumo estável (identificação de lotes e sacarias)')
  }
  {
    const p = produto('Fita de sinalização', 'EPI e diversos', 2)
    consumoContinuo(p, { unidade: 'un', intervalo: 10, quantidade: 1, preco: 18, fornecedor: 'Revenda Agrícola Alfa', destinos: ['Área de aplicação'] })
    normal(p.nome, 'Rolo trocado a cada 10 dias')
  }
  {
    const p = produto('Estaca de madeira', 'EPI e diversos', 20)
    consumoContinuo(p, { unidade: 'un', intervalo: 5, quantidade: 10, preco: 4.5, fornecedor: 'Revenda Agrícola Alfa', destinos: ['Cercas e marcação de talhão'] })
    normal(p.nome, 'Reposição estável')
  }

  // ---- Materiais de irrigação (Anexo III: tubos PVC; mangueira de gotejamento; conectores; filtros; registros)
  {
    const p = produto('Tubo PVC 50 mm', 'Materiais de irrigação', 4)
    consumoContinuo(p, { unidade: 'un', intervalo: 10, quantidade: 2, preco: 48, fornecedor: 'Loja de Peças Delta', destinos: ['Irrigação talhão 3'] })
    normal(p.nome, 'Reposição regular de barras')
  }
  {
    const p = produto('Mangueira de gotejamento 16 mm', 'Materiais de irrigação', 2)
    consumoContinuo(p, { unidade: 'un', intervalo: 10, quantidade: 1, preco: 380, fornecedor: 'Loja de Peças Delta', destinos: ['Irrigação talhão 3'] })
    normal(p.nome, 'Reposição regular de rolos na área irrigada')
  }
  {
    const p = produto('Conector de linha 16 mm', 'Materiais de irrigação', 5)
    // Nenhuma compra tem preço ("-"): o item aparece como "sem preço" no resumo financeiro (R2).
    consumoContinuo(p, { unidade: 'un', intervalo: 7, quantidade: 2, preco: null, fornecedor: 'Loja de Peças Delta', destinos: ['Irrigação talhão 3'] })
    normal(p.nome, 'Consumo estável; nenhuma compra com preço (conta como "sem preço" no resumo financeiro)')
  }
  {
    const p = produto('Filtro de disco para irrigação', 'Materiais de irrigação', 1)
    consumoContinuo(p, { unidade: 'un', intervalo: 10, quantidade: 1, preco: 140, fornecedor: 'Loja de Peças Delta', destinos: ['Cabeçal de irrigação'] })
    normal(p.nome, 'Troca regular. Um dos três "filtros" do Anexo III: produto distinto, **não** é duplicidade dos outros dois (R8)')
  }
  {
    const p = produto('Registro de esfera 32 mm', 'Materiais de irrigação', 2)
    consumoContinuo(p, { unidade: 'un', intervalo: 10, quantidade: 1, preco: 22, fornecedor: 'Loja de Peças Delta', destinos: ['Irrigação talhão 3'] })
    normal(p.nome, 'Reposição regular')
  }

  // ---- Peças e manutenção (Anexo III: filtros; correias; rolamentos; bicos de pulverização; mangueiras;
  //      parafusos; discos de corte; eletrodos). O filtro de óleo é situação plantada (abaixo).
  {
    const p = produto('Correia do alternador', 'Peças e manutenção', 2)
    consumoContinuo(p, { unidade: 'un', intervalo: 10, quantidade: 1, preco: 65, fornecedor: 'Loja de Peças Delta', destinos: ['Trator 1', 'Trator 2'] })
    normal(p.nome, 'Troca regular')
  }
  {
    const p = produto('Rolamento 6205', 'Peças e manutenção', 2)
    consumoContinuo(p, { unidade: 'un', intervalo: 10, quantidade: 1, preco: 28, fornecedor: 'Loja de Peças Delta', destinos: ['Plantadeira', 'Grade'] })
    normal(p.nome, 'Troca regular')
  }
  {
    const p = produto('Bico de pulverização leque 110-02', 'Peças e manutenção', 4)
    consumoContinuo(p, { unidade: 'un', intervalo: 7, quantidade: 2, preco: 12, fornecedor: 'Loja de Peças Delta', destinos: ['Pulverizador'] })
    normal(p.nome, 'Troca semanal estável')
  }
  {
    const p = produto('Mangueira hidráulica 1/2 pol', 'Peças e manutenção', 2)
    consumoContinuo(p, { unidade: 'un', intervalo: 10, quantidade: 1, preco: 95, fornecedor: 'Loja de Peças Delta', destinos: ['Trator 1', 'Trator 2'] })
    normal(p.nome, 'Troca regular. **Não** é duplicidade da mangueira de gotejamento (palavras e números diferentes)')
  }
  {
    const p = produto('Parafuso sextavado M12', 'Peças e manutenção', 20)
    consumoContinuo(p, { unidade: 'un', intervalo: 7, quantidade: 10, preco: 1.8, fornecedor: 'Loja de Peças Delta', destinos: ['Oficina'] })
    normal(p.nome, 'Consumo estável na oficina')
  }
  {
    const p = produto('Disco de corte para esmerilhadeira', 'Peças e manutenção', 4)
    consumoContinuo(p, { unidade: 'un', intervalo: 7, quantidade: 2, preco: 12, fornecedor: 'Loja de Peças Delta', destinos: ['Oficina'] })
    normal(p.nome, 'Consumo estável na oficina')
  }
  {
    const p = produto('Eletrodo de solda 2,5 mm', 'Peças e manutenção', 2)
    consumoContinuo(p, { unidade: 'kg', intervalo: 10, quantidade: 1, casas: 1, preco: 38, fornecedor: 'Loja de Peças Delta', destinos: ['Oficina'] })
    normal(p.nome, 'Consumo regular na oficina')
  }

  // ---- Defensivos e biológicos de uso contínuo (Anexo III: herbicidas; fungicidas; inseticidas; adjuvante;
  //      Trichoderma; Azospirillum; inoculante). Uma compra no ano, um lote só (o lote nunca zera).
  //      Herbicidas, o outro fungicida, o outro inseticida e o inoculante são situações plantadas (abaixo).
  {
    const p = produto('Fungicida mancozebe', 'Defensivos e biológicos')
    compraUnicaContinua(p, { unidade: 'kg', intervalo: 7, quantidade: 3, casas: 1, preco: 32, fornecedor: 'Revenda Agrícola Alfa', destinos: ['Pulverizador'], lote: 'MAN' })
    normal(p.nome, 'Uma compra no ano, uso semanal; lote com validade de 3 anos e saldo para ~90 dias')
  }
  {
    const p = produto('Adjuvante óleo mineral', 'Defensivos e biológicos')
    compraUnicaContinua(p, { unidade: 'L', intervalo: 7, quantidade: 2, casas: 1, preco: 19, fornecedor: 'Revenda Agrícola Alfa', destinos: ['Pulverizador'], lote: 'ADJ' })
    normal(p.nome, 'Uma compra no ano, uso semanal junto da calda')
  }
  {
    const p = produto('Inseticida biológico Bacillus thuringiensis', 'Defensivos e biológicos')
    // Biológico em doses fracionadas: compra em L, retiradas em mL (R1).
    compraUnicaContinua(p, { unidade: 'mL', unidadeCompra: 'L', intervalo: 10, quantidade: 800, preco: 65, fornecedor: 'Cooperativa Beta', destinos: ['Pulverizador'], lote: 'BT', validadeAnos: 2 })
    normal(p.nome, 'Biológico comprado em L e retirado em mL (R1); uso regular')
  }
  {
    const p = produto('Trichoderma harzianum', 'Defensivos e biológicos')
    compraUnicaContinua(p, { unidade: 'kg', intervalo: 10, quantidade: 1, casas: 1, preco: 55, fornecedor: 'Cooperativa Beta', destinos: ['Talhão 3'], lote: 'TRI', validadeAnos: 2 })
    normal(p.nome, 'Biológico de uso regular')
  }
  {
    const p = produto('Azospirillum brasilense', 'Defensivos e biológicos')
    compraUnicaContinua(p, { unidade: 'mL', unidadeCompra: 'L', intervalo: 10, quantidade: 500, preco: 45, fornecedor: 'Cooperativa Beta', destinos: ['Tratamento de sementes'], lote: 'AZO', validadeAnos: 2 })
    normal(p.nome, 'Biológico comprado em L e retirado em mL (R1); uso regular')
  }

  // ---- Fertilizantes (Anexo III: ureia; KCl; MAP; NPK 04-14-08; NPK 10-10-10; NPK 04-30-16;
  //      sulfato de amônio; FTE BR-12). KCl e NPK 04-14-08 são situações plantadas (abaixo).
  //      Padrão de lavoura: adubo de plantio (NPK 04-30-16 + FTE em fevereiro) e cobertura ~25 dias
  //      depois (ureia e sulfato de amônio em março).
  {
    const p = produto('NPK 04-30-16', 'Fertilizantes')
    p.compra('2025-12-10', 70, 'sc 50 kg', '172,00', 'Cooperativa Beta', 'NPK0430-2512')
    p.retiradas('2026-02-05', '2026-02-23', 2, () => 350, 'kg', ['Talhão 1', 'Talhão 2'])
    normal(p.nome, 'Adubo de plantio do milho safrinha (fevereiro); usado todo (saldo zero). **Não** é duplicidade de NPK 04-14-08 (números diferentes, R8)')
  }
  {
    const p = produto('FTE BR-12', 'Fertilizantes')
    p.compra('2026-01-25', 400, 'kg', '9,00', 'Cooperativa Beta', 'FTE-2601')
    p.retiradas('2026-02-05', '2026-02-19', 2, () => 50, 'kg', ['Talhão 1', 'Talhão 2'])
    normal(p.nome, 'Micronutrientes aplicados com o adubo de plantio (fevereiro); usado todo (saldo zero)')
  }
  {
    const p = produto('Ureia', 'Fertilizantes')
    p.compra('2026-02-20', 60, 'sc 50 kg', '145,00', 'Cooperativa Beta', 'URE-2602')
    p.retiradas('2026-03-02', '2026-03-20', 2, () => 250, 'kg', ['Talhão 1', 'Talhão 2'])
    normal(p.nome, 'Adubo de cobertura do milho (~25 dias após o plantio); sobra pequena. O alerta de duplicidade fica no produto cadastrado depois ("UREIA 45%")')
  }
  {
    const p = produto('Sulfato de amônio', 'Fertilizantes')
    p.compra('2026-03-01', 40, 'sc 50 kg', '120,00', 'Cooperativa Beta', 'SAM-2603')
    p.retiradas('2026-03-05', '2026-03-23', 2, () => 200, 'kg', ['Talhão 3'])
    normal(p.nome, 'Cobertura do milho em março; usado todo (saldo zero)')
  }
  {
    const p = produto('NPK 10-10-10', 'Fertilizantes', 100)
    consumoContinuo(p, { unidade: 'kg', unidadeCompra: 'sc 50 kg', intervalo: 7, quantidade: 50, preco: 150, fornecedor: 'Cooperativa Beta', destinos: ['Horta e pomar'] })
    normal(p.nome, 'Uso semanal na horta e no pomar (fora da lavoura), com recompra em sacos de 50 kg')
  }
  {
    // COMPRA ANUAL NORMAL (insumo sazonal): a safra passada usou tudo; a compra deste ano (12 t em
    // agosto) começa a sair no plantio da soja. O saldo dá para ~200 dias de consumo: o padrão geral
    // (excesso > 180 dias) acusaria falso excesso; o limite sazonal de Fertilizantes (> 365 dias) não.
    const p = produto('MAP (fosfato monoamônico)', 'Fertilizantes')
    p.compra('2025-11-20', 60, 'sc 50 kg', '210,00', 'Cooperativa Beta', 'MAP-2511')
    p.retiradas('2025-11-25', '2025-12-13', 2, () => 300, 'kg', ['Talhão 3', 'Talhão 4'])
    p.compra('2026-08-25', 12, 't', '4200,00', 'Cooperativa Beta', 'MAP-2608')
    p.retiradas('2026-09-25', '2026-10-19', 3, () => 300, 'kg', ['Talhão 3', 'Talhão 4'])
    normal(p.nome, 'Compra anual normal (12 t em agosto) para o plantio da soja: saldo para ~200 dias é o esperado para insumo de safra (limite sazonal de Fertilizantes)')
  }

  // ---- Corretivos (Anexo III: calcário dolomítico; gesso agrícola). O calcário é situação plantada.
  {
    // COMPRA ANUAL NORMAL (insumo sazonal): 60 t em junho; 16 t aplicadas em junho e o restante
    // programado para depois do plantio. Fica ~110 dias sem retirada: o padrão geral (item parado
    // > 60 dias) acusaria falso item parado; o limite sazonal de Corretivos (> 180 dias) não.
    const p = produto('Gesso agrícola', 'Corretivos')
    p.compra('2026-06-10', 60, 't', '190,00', 'Revenda Agrícola Alfa')
    p.retiradas('2026-06-10', '2026-07-01', 7, () => 4, 't', ['Talhão 1', 'Talhão 2', 'Talhão 3', 'Talhão 4'])
    normal(p.nome, 'Compra anual normal (60 t em junho), aplicação parcial e o restante programado para depois do plantio: ~110 dias sem retirada é o esperado (limite sazonal de Corretivos)')
  }

  // ---- Sementes (Anexo III: milho; soja; feijão; braquiária): entram e saem em poucas semanas.
  {
    const p = produto('Semente de milho híbrido', 'Sementes')
    p.compra('2026-01-20', 600, 'kg', '38,00', 'Cooperativa Beta', 'MIL-2601', '2026-08-31')
    p.retiradas('2026-02-05', '2026-02-19', 2, () => 75, 'kg', ['Talhão 1', 'Talhão 2'])
    normal(p.nome, 'Entrou em janeiro e saiu toda no plantio de fevereiro (saldo zero)')
  }
  {
    const p = produto('Semente de feijão', 'Sementes')
    p.compra('2026-04-25', 300, 'kg', '12,00', 'Cooperativa Beta', 'FEI-2604', '2026-12-31')
    p.retiradas('2026-05-02', '2026-05-14', 3, () => 60, 'kg', ['Talhão 4'])
    normal(p.nome, 'Plantio de maio; saiu toda (saldo zero)')
  }
  {
    const p = produto('Semente de braquiária', 'Sementes')
    // Braquiária aqui é planta de cobertura (palhada para plantio direto), não pastagem.
    p.compra('2026-07-25', 200, 'kg', '15,00', 'Cooperativa Beta', 'BRA-2607', '2027-07-31')
    p.retiradas('2026-08-01', '2026-08-13', 3, () => 40, 'kg', ['Talhão 2'])
    normal(p.nome, 'Planta de cobertura (palhada para plantio direto), semeada em agosto; saiu toda (saldo zero)')
  }
  {
    const p = produto('Semente de soja', 'Sementes')
    p.compra('2026-10-08', 2400, 'kg', '9,00', 'Cooperativa Beta', 'SOJ-2610', '2027-04-30')
    p.retirada('2026-10-15', 400, 'kg', 'Talhão 4')
    p.retirada('2026-10-18', 400, 'kg', 'Talhão 4')
    normal(p.nome, 'Plantio começando: só 2 retiradas, confiança `insuficiente`, então nenhuma estimativa de dias é feita (R3)')
  }

  // ======================================================================
  // SITUAÇÕES PLANTADAS — uma para cada tipo de alerta da seção 6
  // ======================================================================

  // estoque_critico — saldo abaixo do mínimo e cobertura curta.
  // Como foi plantada: as retiradas (~100 kg a cada 2 dias desde julho) são geradas primeiro e a
  // única compra é dimensionada para sobrar exatamente 250 kg: ~5 dias de consumo e abaixo do mínimo de 1.000 kg.
  {
    const p = produto('Cloreto de potássio (KCl)', 'Fertilizantes', 1000)
    const saidas: [string, number][] = []
    let total = 0
    for (let d = '2026-07-20'; d <= '2026-10-19'; d = somarDias(d, 2)) {
      const q = p.perto(100, 10)
      saidas.push([d, q])
      total += q
    }
    p.compra('2026-07-15', (total + 250) / 1000, 't', '3200,00', 'Cooperativa Beta', 'KCL-2607')
    saidas.forEach(([d, q], i) => p.retirada(d, q, 'kg', ['Talhão 1', 'Talhão 2', 'Talhão 3'][i % 3]))
    plantar(p.nome, 'estoque_critico', 'critico', 'Saldo de 250 kg, abaixo do mínimo de 1.000 kg, e cobertura de ~5 dias')
  }

  // estoque_critico com confiança insuficiente (R3).
  // Como foi plantada: 6 filtros comprados e só 2 retiradas de 2 → saldo 2 ≤ mínimo 4, mas com
  // menos de 3 retiradas a mensagem não pode mostrar número de dias. Um dos três "filtros" do Anexo III.
  {
    const p = produto('Filtro de óleo do trator', 'Peças e manutenção', 4)
    p.compra('2026-03-10', 6, 'un', '85,00', 'Loja de Peças Delta')
    p.retirada('2026-06-02', 2, 'un', 'Trator 1')
    p.retirada('2026-09-15', 2, 'un', 'Trator 2')
    plantar(p.nome, 'estoque_critico', 'critico', 'Saldo abaixo do mínimo com só 2 retiradas: mensagem sem número de dias (R3)')
  }

  // ruptura_prevista — cobertura entre 7 e 30 dias.
  // Como foi plantada: retiradas de ~12 L a cada 4 dias (~3 L/dia); a compra única deixa 60 L de sobra (~19 dias).
  {
    const p = produto('Herbicida glifosato 480', 'Defensivos e biológicos', 20)
    const saidas: [string, number][] = []
    let total = 0
    for (let d = '2026-07-05'; d <= '2026-10-19'; d = somarDias(d, 4)) {
      const q = p.perto(12, 2)
      saidas.push([d, q])
      total += q
    }
    p.compra('2026-07-01', total + 60, 'L', '28,00', 'Revenda Agrícola Alfa', 'GLI-2607', '2028-06-30')
    saidas.forEach(([d, q]) => p.retirada(d, q, 'L', 'Pulverizador'))
    plantar(p.nome, 'ruptura_prevista', 'atencao', 'Saldo de 60 L para ~19 dias de consumo')
  }

  // vencimento (atenção) — lote com mais saldo do que será usado até a validade.
  // Como foi plantada: retiradas de 2.000 mL a cada 10 dias (0,2 L/dia); a compra deixa 30 L no lote
  // com validade em 31/01/2027 (103 dias): ~20,6 L serão usados, ~9,4 L ficam em risco.
  {
    const p = produto('Fungicida azoxistrobina', 'Defensivos e biológicos')
    const saidas: string[] = []
    for (let d = '2026-04-01'; d <= '2026-10-19'; d = somarDias(d, 10)) saidas.push(d)
    p.compra('2026-03-15', saidas.length * 2 + 30, 'L', '95,00', 'Revenda Agrícola Alfa', 'FUN-2603', '2027-01-31')
    saidas.forEach((d) => p.retirada(d, 2000, 'mL', 'Pulverizador'))
    plantar(p.nome, 'vencimento', 'atencao', 'Lote com 30 L, consumo de ~0,2 L/dia e validade em 31/01/2027: ~9 L em risco')
  }

  // vencimento (crítico) — lote já vencido com saldo.
  // Como foi plantada: 50 doses compradas para o plantio de soja de 2025, validade 10/10/2026;
  // 6 retiradas de 7 doses deixam 8 doses vencidas há 10 dias.
  {
    const p = produto('Inoculante para soja', 'Defensivos e biológicos')
    p.compra('2025-10-21', 50, 'un', '18,00', 'Cooperativa Beta', 'INO-2510', '2026-10-10')
    p.retiradas('2025-10-25', '2025-11-14', 4, () => 7, 'un', ['Plantadeira'])
    plantar(p.nome, 'vencimento', 'critico', 'Lote vencido em 10/10/2026 ainda com 8 doses')
  }

  // consumo_crescente — consumo dos últimos 30 dias > 1,5 × os 30 anteriores.
  // Como foi plantada: retiradas semanais de ~1 kg até 20/09; a partir de 22/09 (preparo das
  // plantadeiras) a mesma dose passa a sair a cada 3 dias, mais que dobrando o consumo.
  {
    const p = produto('Graxa para rolamentos', 'Combustíveis e lubrificantes', 5)
    p.compra('2026-05-01', 50, 'kg', '22,00', 'Revenda Agrícola Alfa')
    p.retiradas('2026-05-04', '2026-09-20', 7, () => p.perto(1, 0.1, 1), 'kg', ['Plantadeira', 'Trator 1'])
    p.retiradas('2026-09-22', '2026-10-19', 3, () => p.perto(1, 0.1, 1), 'kg', ['Plantadeira', 'Trator 1'])
    plantar(p.nome, 'consumo_crescente', 'atencao', 'Retiradas mais frequentes no último mês (preparo de máquinas): 2,5 × o mês anterior')
  }

  // retirada_atipica — retirada > mediana + 3 × MAD.
  // Como foi plantada: dose semanal de ~250 mL (±30) desde junho e uma retirada de 2.500 mL em 12/10/2026.
  {
    const p = produto('Inseticida lambda-cialotrina', 'Defensivos e biológicos')
    p.compra('2026-06-01', 12, 'L', '120,00', 'Revenda Agrícola Alfa', 'LAM-2606', '2028-05-31')
    p.retiradas('2026-06-05', '2026-10-16', 7, () => p.perto(250, 30), 'mL', ['Pulverizador'])
    p.retirada('2026-10-12', 2500, 'mL', 'Talhão 2')
    plantar(p.nome, 'retirada_atipica', 'atencao', 'Dose semanal de ~250 mL e uma retirada de 2.500 mL em 12/10/2026')
    // A retirada de 2,5 L também eleva o consumo do último mês acima de 1,5 × o anterior.
    secundarios.push({ produto: p.nome, tipo: 'consumo_crescente', nivel: 'atencao', motivo: 'a retirada atípica de 2,5 L também eleva o consumo dos últimos 30 dias; é efeito real da retirada, não falso positivo' })
  }

  // excesso — cobertura > 180 dias (Combustíveis e lubrificantes: categoria sem limite sazonal).
  // Como foi plantada: compra de 1.000 L (5 tambores) em agosto para um consumo de ~10 L a cada 5 dias
  // (~2 L/dia): o saldo dá para mais de um ano.
  {
    const p = produto('Óleo hidráulico', 'Combustíveis e lubrificantes')
    p.compra('2026-08-10', 1000, 'L', '18,50', 'Revenda Agrícola Alfa', 'HID-2608')
    p.retiradas('2026-08-15', '2026-10-19', 5, () => p.perto(10, 2), 'L', ['Trator 1', 'Trator 2'])
    plantar(p.nome, 'excesso', 'informativo', 'Compra de 1.000 L para ~2 L/dia de consumo: saldo para mais de um ano')
  }

  // item_parado — valor no top 20% e sem saída há mais tempo que o limite (180 dias para corretivos).
  // Como foi plantada: 150 t compradas em novembro de 2025, 70 t aplicadas até 16/12/2025; sobram
  // 80 t (R$ 19.200) da safra passada, entre os maiores valores em estoque, sem retirada há ~300 dias.
  {
    const p = produto('Calcário dolomítico', 'Corretivos')
    p.compra('2025-11-05', 150, 't', '240,00', 'Revenda Agrícola Alfa')
    p.retiradas('2025-11-10', '2025-12-16', 6, () => 10, 't', ['Talhão 1', 'Talhão 2', 'Talhão 3', 'Talhão 4'])
    plantar(p.nome, 'item_parado', 'informativo', 'Sobra da safra passada: 80 t (R$ 19.200) sem retirada desde 16/12/2025')
  }

  // variacao_preco — última compra > 20% acima da média das anteriores.
  // Como foi plantada: duas compras a R$ 155 e R$ 160 o saco de 50 kg; a de 02/10/2026 sai a R$ 205 (~30% acima).
  {
    const p = produto('NPK 04-14-08', 'Fertilizantes')
    p.compra('2025-10-25', 40, 'sc 50 kg', '155,00', 'Cooperativa Beta', 'NPK0414-2510')
    p.retiradas('2025-11-01', '2025-11-19', 2, () => p.perto(200, 20), 'kg', ['Talhão 3', 'Talhão 4'])
    p.compra('2026-03-01', 40, 'sc 50 kg', '160,00', 'Cooperativa Beta', 'NPK0414-2603')
    p.retiradas('2026-03-05', '2026-03-23', 2, () => p.perto(200, 20), 'kg', ['Talhão 3', 'Talhão 4'])
    p.compra('2026-10-02', 80, 'sc 50 kg', '205,00', 'Revenda Agrícola Alfa', 'NPK0414-2610')
    p.retiradas('2026-10-05', '2026-10-19', 2, () => p.perto(200, 20), 'kg', ['Talhão 3', 'Talhão 4'])
    plantar(p.nome, 'variacao_preco', 'informativo', 'Última compra a R$ 4,10/kg, ~30% acima da média anterior (R$ 3,15/kg)')
  }

  // possivel_duplicidade — mesmo produto cadastrado com nome diferente.
  // Como foi plantada: uma compra registrada como "UREIA 45%", nome que não bate com "Ureia",
  // virando um produto à parte; os nomes têm as mesmas palavras e não têm números diferentes.
  {
    const p = produto('UREIA 45%', 'Fertilizantes')
    p.compra('2026-10-01', 20, 'sc 50 kg', '150,00', 'Revenda Agrícola Alfa', 'U45-2610')
    plantar(p.nome, 'possivel_duplicidade', 'atencao', 'Cadastrado à parte de "Ureia": mesmas palavras e sem números diferentes (R8)')
  }

  // possivel_duplicidade por erro de digitação.
  // Como foi plantada: uma compra digitada como "Herbicida glifozato 480" (com z), mesmo número
  // de "Herbicida glifosato 480".
  {
    const p = produto('Herbicida glifozato 480', 'Defensivos e biológicos')
    p.compra('2026-10-14', 20, 'L', '28,00', 'Revenda Agrícola Alfa', 'GLI-2610', '2028-09-30')
    plantar(p.nome, 'possivel_duplicidade', 'atencao', 'Erro de digitação de "Herbicida glifosato 480": uma letra diferente e o mesmo número (R8)')
  }

  // devolucao_embalagem (extra do Victor) — lote de defensivo esgotado.
  // Como foi plantada: o lote H24-2603 (20 L) é consumido em 10 retiradas de 2 L até julho; o lote
  // H24-2609 segue em uso. O prazo provisório de devolução é de 1 ano da compra.
  {
    const p = produto('Herbicida 2,4-D', 'Defensivos e biológicos')
    p.compra('2026-03-05', 20, 'L', '32,00', 'Revenda Agrícola Alfa', 'H24-2603', '2028-02-28')
    p.retiradas('2026-03-10', '2026-07-23', 15, () => 2, 'L', ['Pulverizador'])
    p.compra('2026-09-01', 40, 'L', '33,00', 'Revenda Agrícola Alfa', 'H24-2609', '2028-08-31')
    p.retiradas('2026-09-05', '2026-10-17', 7, () => 2, 'L', ['Pulverizador'])
    plantar(p.nome, 'devolucao_embalagem', 'informativo', 'Primeiro lote (H24-2603) esgotado em julho; embalagem a devolver')
  }

  // ======================================================================
  // SAÍDA
  // ======================================================================

  const fora = linhas.filter((l) => l.data < INICIO || l.data > DATA_REFERENCIA)
  if (fora.length > 0) throw new Error(`Movimentação fora do período: ${fora[0].produto} em ${fora[0].data}`)

  const ordem = { entrada: 0, ajuste: 1, saida: 2 }
  linhas.sort((a, b) => a.data.localeCompare(b.data) || ordem[a.tipo] - ordem[b.tipo])
  const colunas = [
    'origem_dados', 'produto', 'categoria', 'unidade', 'quantidade', 'estoque_minimo', 'tipo', 'data',
    'preco_unit', 'lote', 'validade', 'fornecedor', 'destino', 'responsavel',
  ]
  const csv =
    [
      colunas.join(';'),
      ...linhas.map((l) =>
        [
          'SIMULADO', l.produto, l.categoria, l.unidade, fmt(l.quantidade),
          l.estoque_minimo === null ? '' : fmt(l.estoque_minimo), l.tipo === 'saida' ? 'saída' : l.tipo,
          dataBr(l.data), l.preco_unit, l.lote, l.validade, l.fornecedor, l.destino, l.responsavel,
        ].join(';'),
      ),
    ].join('\n') + '\n'

  const nomes = [...new Set(linhas.map((l) => l.produto))]
  const extras = nomes.filter((n) => !ANEXO_III.some((x) => x.produto === n))
  const base = {
    csv, situacoes, normais, secundarios, extras, totalProdutos: nomes.length, totalMovimentacoes: linhas.length, categorias: [...categorias],
  }
  return { ...base, situacoesMd: gerarSituacoesMd(base) }
}

function gerarSituacoesMd(b: Omit<BaseSimulada, 'situacoesMd'>): string {
  const celula = (t: string) => t.replace(/\|/g, '\\|')
  return `<!-- Arquivo GERADO por data/simulados/gerar.ts. Não edite à mão: altere o gerador e rode \`npm run gerar:simulados\`. -->

# Base simulada — situações plantadas

> **DADOS SIMULADOS.** Criados pela equipe Tetrarreme para testar e demonstrar o motor de análise,
> conforme a seção 4.2 do regulamento. Não representam nenhuma propriedade real.
> A organização não fornecerá base oficial: **esta é a base da demonstração**, sempre identificada
> como SIMULADA (R7). Toda linha de \`movimentacoes.csv\` traz \`origem_dados = SIMULADO\` e é
> importada com \`origem: "simulado"\`. Responsáveis pseudonimizados ("Funcionário A" a "D").

- **Arquivo:** \`movimentacoes.csv\` (separador \`;\`, decimal \`,\`, datas \`DD/MM/AAAA\`).
- **Gerador:** \`data/simulados/gerar.ts\` — determinístico (semente fixa); \`npm run gerar:simulados\` na raiz.
- **Data de referência da análise:** ${dataBr(DATA_REFERENCIA)}.
- **Período:** ${dataBr(INICIO)} a ${dataBr(DATA_REFERENCIA)} (12 meses).
- **Volume:** ${b.totalMovimentacoes} movimentações, ${b.totalProdutos} produtos, ${b.categorias.length} categorias do Anexo III.
- **Unidades misturadas de propósito (R1):** compras em t, sc 50 kg e L; retiradas em kg e mL.
- **Dados ausentes de propósito (R2):** preço \`N/D\` em parte das compras de luva, preço \`-\` em todas
  as compras do conector, validade \`-\` ou vazia em fertilizantes, corretivos e peças.
- **Padrões de lavoura:** compras grandes de safra (calcário, MAP, NPK), defensivos em doses
  fracionadas (mL), sementes que entram e saem em poucas semanas, adubo de plantio (NPK 04-30-16 em
  fevereiro) seguido da cobertura ~25 dias depois (ureia e sulfato de amônio em março).

## Catálogo × Anexo III

Todos os exemplos do Anexo III estão na base; os genéricos ("Herbicidas", "Filtros") foram
especificados. Produtos fora desta tabela existem só para manter situações plantadas
(${b.extras.map((e) => `"${e}"`).join(', ')}).

| Categoria | Exemplo do Anexo III | Produto na base |
|---|---|---|
${ANEXO_III.map((x) => `| ${x.categoria} | ${x.exemplo} | ${celula(x.produto)} |`).join('\n')}

## Situações plantadas

Uma para cada tipo de alerta da seção 6 do CLAUDE.md. O comentário acima de cada situação, no
gerador, explica como ela foi plantada. Os testes de detecção (\`web/test/deteccao.test.ts\`)
exigem cada alerta, no nível indicado, analisando a base na data de referência.

| # | Situação | Produto | Alerta esperado | Nível esperado |
|---|---|---|---|---|
${b.situacoes.map((s) => `| ${s.numero} | ${celula(s.descricao)} | ${celula(s.produto)} | ${s.tipo} | ${s.nivel} |`).join('\n')}

## Alertas secundários esperados

| Produto | Alerta | Nível | Motivo |
|---|---|---|---|
${b.secundarios.map((s) => `| ${celula(s.produto)} | ${s.tipo} | ${s.nivel} | ${celula(s.motivo)} |`).join('\n')}

## Produtos normais (não devem gerar nenhum alerta)

Os testes de falsos positivos exigem que nenhum destes ${b.normais.length} produtos gere alerta.

| Produto | Por que não deve alertar |
|---|---|
${b.normais.map((n) => `| ${celula(n.produto)} | ${celula(n.motivo)} |`).join('\n')}
`
}

// Execução direta: grava os arquivos versionados.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const pasta = dirname(fileURLToPath(import.meta.url))
  const base = gerarBase()
  writeFileSync(join(pasta, 'movimentacoes.csv'), base.csv)
  writeFileSync(join(pasta, 'SITUACOES.md'), base.situacoesMd)
  console.log(`${base.totalMovimentacoes} movimentações, ${base.totalProdutos} produtos, ${base.situacoes.length} situações plantadas.`)
}
