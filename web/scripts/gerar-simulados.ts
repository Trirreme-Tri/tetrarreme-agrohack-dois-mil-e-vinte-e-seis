// Gera data/simulados/movimentacoes.csv — DADOS SIMULADOS, criados pela equipe.
// Determinístico (semente fixa). Data de referência da base: 20/10/2026.
// Uso: node scripts/gerar-simulados.ts   (a partir de web/)
// As situações plantadas estão descritas em data/simulados/SITUACOES.md.
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HOJE = '2026-10-20'

let semente = 20261029
function aleatorio(): number {
  semente = (semente * 1103515245 + 12345) % 2147483648
  return semente / 2147483648
}
/** Valor em torno de `base`, ± `variacao`, com `casas` decimais. */
function perto(base: number, variacao: number, casas = 0): number {
  const f = 10 ** casas
  return Math.round((base + (aleatorio() * 2 - 1) * variacao) * f) / f
}

function somarDias(iso: string, dias: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
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

const linhas: Linha[] = []
const RESPONSAVEIS = ['Funcionário A', 'Funcionário B', 'Funcionário C']
const responsavel = () => RESPONSAVEIS[Math.floor(aleatorio() * RESPONSAVEIS.length)]

const fmt = (n: number) => String(n).replace('.', ',')

/** Fator da unidade para a unidade base (kg, L, un): o estoque mínimo vai na unidade da linha. */
const FATOR: Record<string, number> = { t: 1000, kg: 1, 'sc 50 kg': 50, L: 1, mL: 0.001, un: 1 }
const minimoNaUnidade = (p: Produto, unidade: string) => (p.minimo === null ? null : p.minimo / FATOR[unidade])

interface Produto {
  nome: string
  categoria: string
  /** Na unidade base (kg, L, un). */
  minimo: number | null
}

function compra(
  p: Produto,
  data: string,
  quantidade: number,
  unidade: string,
  preco: string,
  fornecedor: string,
  lote = '',
  validade = '-',
) {
  linhas.push({
    produto: p.nome, categoria: p.categoria, unidade, quantidade, estoque_minimo: minimoNaUnidade(p, unidade),
    tipo: 'entrada', data, preco_unit: preco, lote, validade, fornecedor, destino: '', responsavel: responsavel(),
  })
}

function retirada(p: Produto, data: string, quantidade: number, unidade: string, destino: string, lote = '') {
  linhas.push({
    produto: p.nome, categoria: p.categoria, unidade, quantidade, estoque_minimo: minimoNaUnidade(p, unidade),
    tipo: 'saida', data, preco_unit: '', lote, validade: '', fornecedor: '', destino, responsavel: responsavel(),
  })
}

/** Retiradas periódicas de `inicio` até `fim` (inclusive). Devolve o total retirado. */
function retiradas(
  p: Produto, inicio: string, fim: string, intervalo: number,
  qtd: () => number, unidade: string, destinos: string[],
): number {
  let total = 0
  for (let d = inicio, i = 0; d <= fim; d = somarDias(d, intervalo), i++) {
    const q = qtd()
    retirada(p, d, q, unidade, destinos[i % destinos.length])
    total += q
  }
  return total
}


// ---------------------------------------------------------------- produtos normais

// Óleo diesel: consumo contínuo, compra de 3.000 L quando o saldo cai abaixo de 1.500 L.
{
  const p = { nome: 'Óleo diesel S10', categoria: 'Combustíveis e lubrificantes', minimo: 500 }
  let saldo = 0
  for (let d = '2025-10-01'; d <= HOJE; d = somarDias(d, 1)) {
    if (saldo < 1500) {
      compra(p, d, 3000, 'L', fmt(perto(6.1, 0.15, 2)), 'Posto Gama', `DSL-${d.slice(2, 7).replace('-', '')}`)
      saldo += 3000
    }
    if ((Date.parse(d) / 86_400_000) % 3 === 0) {
      const q = perto(100, 20)
      retirada(p, d, q, 'L', ['Trator 1', 'Trator 2', 'Gerador'][Math.floor(aleatorio() * 3)])
      saldo -= q
    }
  }
  // Correção de inventário (append-only: ajuste, nunca edição).
  linhas.push({
    produto: p.nome, categoria: p.categoria, unidade: 'L', quantidade: -20, estoque_minimo: p.minimo, tipo: 'ajuste',
    data: '2026-07-31', preco_unit: '', lote: '', validade: '', fornecedor: '', destino: 'Inventário mensal', responsavel: 'Funcionário A',
  })
}

// Óleo lubrificante: troca semanal, compra de 60 L quando o saldo fica abaixo de 30 L.
{
  const p = { nome: 'Óleo lubrificante 15W40', categoria: 'Combustíveis e lubrificantes', minimo: 20 }
  let saldo = 0
  for (let d = '2025-10-06'; d <= HOJE; d = somarDias(d, 7)) {
    if (saldo < 30) {
      compra(p, somarDias(d, -1), 60, 'L', '24,90', 'Revenda Agrícola Alfa')
      saldo += 60
    }
    const q = perto(4, 1, 1)
    retirada(p, d, q, 'L', 'Oficina')
    saldo -= q
  }
}

// Luva nitrílica: preço às vezes não informado na nota ("N/D").
{
  const p = { nome: 'Luva nitrílica', categoria: 'EPI e diversos', minimo: 20 }
  let saldo = 0
  let compras = 0
  for (let d = '2025-10-02'; d <= HOJE; d = somarDias(d, 2)) {
    if (saldo < 50) {
      compra(p, d, 100, 'un', compras % 3 === 2 ? 'N/D' : '1,20', 'Revenda Agrícola Alfa')
      saldo += 100
      compras++
    }
    const q = perto(2, 1)
    retirada(p, d, q, 'un', 'Pulverização')
    saldo -= q
  }
}

// Conector de irrigação: nenhuma compra tem preço ("-"): conta como item sem preço.
{
  const p = { nome: 'Conector para mangueira 16 mm', categoria: 'Materiais de irrigação', minimo: 10 }
  let saldo = 0
  for (let d = '2025-10-03'; d <= HOJE; d = somarDias(d, 7)) {
    if (saldo < 15) {
      compra(p, d, 25, 'un', '-', 'Loja de Peças Delta')
      saldo += 25
    }
    const q = perto(2, 1)
    retirada(p, d, q, 'un', 'Irrigação talhão 3')
    saldo -= q
  }
}

// NPK 04-30-16: adubo de plantio do milho safrinha (fevereiro). Sobra pequena.
{
  const p = { nome: 'NPK 04-30-16', categoria: 'Fertilizantes', minimo: null }
  compra(p, '2025-12-10', 80, 'sc 50 kg', '172,00', 'Cooperativa Beta', 'NPK0430-2512')
  retiradas(p, '2026-02-05', '2026-02-23', 2, () => perto(350, 30), 'kg', ['Talhão 1', 'Talhão 2'])
}

// Semente de milho: entra em janeiro e sai toda no plantio de fevereiro.
{
  const p = { nome: 'Semente de milho híbrido', categoria: 'Sementes', minimo: null }
  compra(p, '2026-01-20', 600, 'kg', '38,00', 'Cooperativa Beta', 'MIL-2601', '31/08/2026')
  for (let i = 0; i < 8; i++) retirada(p, somarDias('2026-02-05', 2 * i), 75, 'kg', ['Talhão 1', 'Talhão 2'][i % 2])
}

// Semente de soja: plantio começando agora; só 2 retiradas (confiança insuficiente, sem alerta).
{
  const p = { nome: 'Semente de soja', categoria: 'Sementes', minimo: null }
  compra(p, '2026-10-08', 2400, 'kg', '9,00', 'Cooperativa Beta', 'SOJ-2610', '30/04/2027')
  retirada(p, '2026-10-15', 400, 'kg', 'Talhão 4')
  retirada(p, '2026-10-18', 400, 'kg', 'Talhão 4')
}

// Gesso agrícola: comprado e aplicado todo no inverno.
{
  const p = { nome: 'Gesso agrícola', categoria: 'Corretivos', minimo: null }
  compra(p, '2026-06-10', 20, 't', '190,00', 'Revenda Agrícola Alfa')
  for (let i = 0; i < 5; i++) retirada(p, somarDias('2026-06-20', 7 * i), 4, 't', `Talhão ${i + 1}`)
}

// Ureia: adubo de cobertura do milho, ~25 dias após o plantio (março).
{
  const p = { nome: 'Ureia', categoria: 'Fertilizantes', minimo: null }
  compra(p, '2026-02-20', 60, 'sc 50 kg', '145,00', 'Cooperativa Beta', 'URE-2602')
  retiradas(p, '2026-03-02', '2026-03-20', 2, () => 250, 'kg', ['Talhão 1', 'Talhão 2'])
}

// ---------------------------------------------------------------- situações plantadas

// 1. estoque_critico: cloreto de potássio com saldo para ~5 dias e abaixo do mínimo.
{
  const p = { nome: 'Cloreto de potássio', categoria: 'Fertilizantes', minimo: 1000 }
  let total = 0
  const saidas: [string, number][] = []
  for (let d = '2026-07-20'; d <= '2026-10-19'; d = somarDias(d, 2)) {
    const q = perto(100, 10)
    saidas.push([d, q])
    total += q
  }
  compra(p, '2026-07-15', (total + 250) / 1000, 't', '3200,00', 'Cooperativa Beta', 'KCL-2607')
  saidas.forEach(([d, q], i) => retirada(p, d, q, 'kg', ['Talhão 1', 'Talhão 2', 'Talhão 3'][i % 3]))
}

// 2. estoque_critico com confiança insuficiente: filtro com só 2 retiradas, saldo abaixo do mínimo.
{
  const p = { nome: 'Filtro de óleo do motor', categoria: 'Peças e manutenção', minimo: 4 }
  compra(p, '2026-03-10', 6, 'un', '85,00', 'Loja de Peças Delta')
  retirada(p, '2026-06-02', 2, 'un', 'Trator 1')
  retirada(p, '2026-09-15', 2, 'un', 'Trator 2')
}

// 3. ruptura_prevista: glifosato com saldo para ~20 dias.
{
  const p = { nome: 'Glifosato 480', categoria: 'Defensivos e biológicos', minimo: 20 }
  let total = 0
  const saidas: [string, number][] = []
  for (let d = '2026-07-05'; d <= '2026-10-19'; d = somarDias(d, 4)) {
    const q = perto(12, 2)
    saidas.push([d, q])
    total += q
  }
  compra(p, '2026-07-01', total + 60, 'L', '28,00', 'Revenda Agrícola Alfa', 'GLI-2607', '30/06/2028')
  saidas.forEach(([d, q]) => retirada(p, d, q, 'L', 'Pulverizador'))
}

// 4. vencimento (atenção): fungicida com mais saldo no lote do que será usado até 31/01/2027.
//    Doses fracionadas em mL (frasco comprado em L).
{
  const p = { nome: 'Fungicida azoxistrobina', categoria: 'Defensivos e biológicos', minimo: null }
  let total = 0
  const saidas: string[] = []
  for (let d = '2026-04-01'; d <= '2026-10-19'; d = somarDias(d, 10)) {
    saidas.push(d)
    total += 2
  }
  compra(p, '2026-03-15', total + 30, 'L', '95,00', 'Revenda Agrícola Alfa', 'FUN-2603', '31/01/2027')
  saidas.forEach((d) => retirada(p, d, 2000, 'mL', 'Pulverizador'))
}

// 5. vencimento (crítico): inoculante com lote vencido em 10/10/2026 e ainda com saldo.
{
  const p = { nome: 'Inoculante para soja', categoria: 'Defensivos e biológicos', minimo: null }
  compra(p, '2025-09-20', 50, 'un', '18,00', 'Cooperativa Beta', 'INO-2509', '10/10/2026')
  for (let i = 0; i < 6; i++) retirada(p, somarDias('2025-10-10', 4 * i), 7, 'un', 'Plantadeira')
}

// 6. consumo_crescente: graxa com retiradas mais frequentes no último mês (preparo das máquinas).
{
  const p = { nome: 'Graxa para rolamentos', categoria: 'Combustíveis e lubrificantes', minimo: 5 }
  compra(p, '2026-05-01', 50, 'kg', '22,00', 'Revenda Agrícola Alfa')
  retiradas(p, '2026-05-04', '2026-09-20', 7, () => perto(1, 0.1, 1), 'kg', ['Plantadeira', 'Trator 1'])
  retiradas(p, '2026-09-22', '2026-10-19', 3, () => perto(1, 0.1, 1), 'kg', ['Plantadeira', 'Trator 1'])
}

// 7. retirada_atipica: inseticida com dose semanal de ~250 mL e uma retirada de 2.500 mL.
{
  const p = { nome: 'Inseticida lambda-cialotrina', categoria: 'Defensivos e biológicos', minimo: null }
  compra(p, '2026-06-01', 12, 'L', '120,00', 'Revenda Agrícola Alfa', 'LAM-2606', '31/05/2028')
  for (let d = '2026-06-05'; d <= '2026-10-16'; d = somarDias(d, 7)) {
    retirada(p, d, perto(250, 30), 'mL', 'Pulverizador')
  }
  retirada(p, '2026-10-12', 2500, 'mL', 'Talhão 2')
}

// 8. excesso: superfosfato com saldo para mais de 180 dias.
{
  const p = { nome: 'Superfosfato simples', categoria: 'Fertilizantes', minimo: null }
  compra(p, '2026-08-15', 15, 't', '2100,00', 'Cooperativa Beta', 'SSP-2608')
  retiradas(p, '2026-08-20', '2026-10-19', 7, () => perto(300, 30), 'kg', ['Talhão 3'])
}

// 9. item_parado: calcário de alto valor sem retirada desde junho.
{
  const p = { nome: 'Calcário dolomítico', categoria: 'Corretivos', minimo: null }
  compra(p, '2026-04-10', 150, 't', '240,00', 'Revenda Agrícola Alfa')
  for (let i = 0; i < 7; i++) retirada(p, somarDias('2026-05-05', 9 * i), 10, 't', `Talhão ${(i % 4) + 1}`)
}

// 10. variacao_preco: última compra de NPK 04-14-08 cerca de 30% mais cara.
//     O par NPK 04-14-08 × NPK 04-30-16 NÃO é duplicidade (números diferentes).
{
  const p = { nome: 'NPK 04-14-08', categoria: 'Fertilizantes', minimo: null }
  compra(p, '2025-10-25', 40, 'sc 50 kg', '155,00', 'Cooperativa Beta', 'NPK0414-2510')
  retiradas(p, '2025-11-01', '2025-11-19', 2, () => perto(200, 20), 'kg', ['Talhão 3', 'Talhão 4'])
  compra(p, '2026-03-01', 40, 'sc 50 kg', '160,00', 'Cooperativa Beta', 'NPK0414-2603')
  retiradas(p, '2026-03-05', '2026-03-23', 2, () => perto(200, 20), 'kg', ['Talhão 3', 'Talhão 4'])
  compra(p, '2026-10-02', 80, 'sc 50 kg', '205,00', 'Revenda Agrícola Alfa', 'NPK0414-2610')
  retiradas(p, '2026-10-05', '2026-10-19', 2, () => perto(200, 20), 'kg', ['Talhão 3', 'Talhão 4'])
}

// 11. possivel_duplicidade: "UREIA 45%" cadastrada à parte de "Ureia".
{
  const p = { nome: 'UREIA 45%', categoria: 'Fertilizantes', minimo: null }
  compra(p, '2026-10-01', 20, 'sc 50 kg', '150,00', 'Revenda Agrícola Alfa', 'U45-2610')
}

// 12. devolucao_embalagem: 2,4-D com o primeiro lote esgotado em agosto.
{
  const p = { nome: 'Herbicida 2,4-D', categoria: 'Defensivos e biológicos', minimo: null }
  compra(p, '2026-03-05', 20, 'L', '32,00', 'Revenda Agrícola Alfa', 'H24-2603', '28/02/2028')
  for (let i = 0; i < 10; i++) retirada(p, somarDias('2026-03-10', 15 * i), 2, 'L', 'Pulverizador')
  compra(p, '2026-09-01', 40, 'L', '33,00', 'Revenda Agrícola Alfa', 'H24-2609', '31/08/2028')
  retiradas(p, '2026-09-05', '2026-10-17', 7, () => 2, 'L', ['Pulverizador'])
}

// ---------------------------------------------------------------- escrita

const COLUNAS = [
  'origem_dados', 'produto', 'categoria', 'unidade', 'quantidade', 'estoque_minimo', 'tipo', 'data',
  'preco_unit', 'lote', 'validade', 'fornecedor', 'destino', 'responsavel',
]
const ordem = { entrada: 0, ajuste: 1, saida: 2 }
linhas.sort((a, b) => a.data.localeCompare(b.data) || ordem[a.tipo] - ordem[b.tipo])
const dataBr = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`
const csv = [
  COLUNAS.join(';'),
  ...linhas.map((l) =>
    [
      'SIMULADO', l.produto, l.categoria, l.unidade, fmt(l.quantidade),
      l.estoque_minimo === null ? '' : fmt(l.estoque_minimo), l.tipo === 'saida' ? 'saída' : l.tipo,
      dataBr(l.data), l.preco_unit, l.lote, l.validade, l.fornecedor, l.destino, l.responsavel,
    ].join(';'),
  ),
].join('\n')

const destino = join(dirname(fileURLToPath(import.meta.url)), '../../data/simulados/movimentacoes.csv')
writeFileSync(destino, csv + '\n')
console.log(`${linhas.length} movimentações simuladas gravadas em ${destino}`)
