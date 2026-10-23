// Monitora — dados SIMULADOS para o protótipo (espelham data/simulados/SITUACOES.md do repositório).
// Data de referência da análise: 20/10/2026. Nada aqui é dado real.
export const HOJE = new Date(2026, 9, 20);
export const HOJE_BR = '20/10/2026';

export const CATEGORIAS = ['Fertilizantes', 'Corretivos', 'Sementes', 'Defensivos e biológicos', 'Combustíveis e lubrificantes', 'Peças e manutenção', 'Materiais de irrigação', 'EPI e diversos'];

export const FUNCIONARIOS = ['Funcionário A', 'Funcionário B', 'Funcionário C', 'Funcionário D'];
export const DESTINOS = ['Talhão 1', 'Talhão 2', 'Talhão 3', 'Horta', 'Pomar', 'Oficina', 'Galpão', 'Irrigação'];

// Lucide (stroke 1.5), caminhos combinados num único <path>.
export const ICONS = {
  critico: 'M12 16h.01M12 8v4M15.312 2a2 2 0 0 1 1.414.586l4.688 4.688A2 2 0 0 1 22 8.688v6.624a2 2 0 0 1-.586 1.414l-4.688 4.688a2 2 0 0 1-1.414.586H8.688a2 2 0 0 1-1.414-.586l-4.688-4.688A2 2 0 0 1 2 15.312V8.688a2 2 0 0 1 .586-1.414l4.688-4.688A2 2 0 0 1 8.688 2z',
  atencao: 'M21.73 18l-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3M12 9v4M12 17h.01',
  informativo: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M12 16v-4M12 8h.01',
  estoque_critico: 'M21.73 18l-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3M12 9v4M12 17h.01',
  ruptura_prevista: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M12 6v6l4 2',
  vencimento: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2M12 14v2M12 18h.01',
  consumo_crescente: 'M22 7l-8.5 8.5-5-5L2 17M16 7h6v6',
  retirada_atipica: 'M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2',
  excesso: 'M12 2 2 7l10 5 10-5-10-5M2 17l10 5 10-5M2 12l10 5 10-5',
  item_parado: 'M20 5H4a2 2 0 0 0-2 2v2h20V7a2 2 0 0 0-2-2M4 9v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9M10 13h4',
  variacao_preco: 'M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42zM7.5 7.5h.01',
  possivel_duplicidade: 'M8 8h12v12H8zM16 8V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2',
  devolucao_embalagem: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5',
  wifi: 'M12 20h.01M2 8.82a15 15 0 0 1 20 0M5 12.859a10 10 0 0 1 14 0M8.5 16.429a5 5 0 0 1 7 0',
  wifi_off: 'M12 20h.01M8.5 16.429a5 5 0 0 1 7 0M5 12.859a10 10 0 0 1 5.17-2.69M19 12.859a10 10 0 0 0-2.007-1.523M2 8.82a15 15 0 0 1 4.177-2.643M22 8.82a15 15 0 0 0-11.288-3.764M2 2l20 20',
  sync: 'M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5',
  check: 'M20 6 9 17l-5-5',
  check_circle: 'M21.801 10A10 10 0 1 1 17 3.335M9 11l3 3L22 4',
  back: 'm12 19-7-7 7-7M19 12H5',
  search: 'M21 21l-4.34-4.34M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16',
  backspace: 'M10 5a2 2 0 0 0-1.344.519l-6.328 5.74a1 1 0 0 0 0 1.481l6.328 5.741A2 2 0 0 0 10 19h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zM12 9l6 6M18 9l-6 6',
  chevron: 'm9 18 6-6-6-6',
  retirada: 'M16 16h6M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14M16.5 9.4 7.55 4.24M3.29 7 12 12l8.71-5M12 22V12',
  entrada: 'M16 16h6M19 13v6M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14M16.5 9.4 7.55 4.24M3.29 7 12 12l8.71-5M12 22V12',
  user: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  painel: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',
  lista: 'M3 12h.01M3 18h.01M3 6h.01M8 12h13M8 18h13M8 6h13',
  financeiro: 'M2 6h20v12H2zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M6 12h.01M18 12h.01',
  destino: 'M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42',
  moon: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9',
  eye: 'M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
  regra: 'm16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1M7 21h10M12 3v18M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2',
  confianca: 'm12 14 4-4M3.34 19a10 10 0 1 1 17.32 0',
  recomendacao: 'M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5M9 18h6M10 22h4',
  evidencia: 'M4 9h16M4 15h16M10 3 8 21M16 3l-2 18',
  x: 'M18 6 6 18M6 6l12 12',
  historico: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5M12 7v5l4 2',
  grafico: 'M3 3v16a2 2 0 0 0 2 2h16M7 15l4-6 4 4 5-7',
  lote: 'M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7M3 7l9-4 9 4M3 7l9 4 9-4M12 11v8',
  sair: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  home: 'M3 10.182V22h18V10.182L12 2zM10 22v-7h4v7',
  flask: 'M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2M8.5 2h7M7 16h10',
  sem_preco: 'M2 2l20 20M2 6h20v12H2M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
  parado: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M10 15V9M14 15V9',
  nota: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M10 13h4M10 17h4',
};

// Embalagens genéricas, traço fino (viewBox 0 0 64 64).
export const PACK = {
  saco: 'M18 14h28l-4-6H22zM16 14c-2 8-4 20-4 30a6 6 0 0 0 6 6h28a6 6 0 0 0 6-6c0-10-2-22-4-30M24 30h16',
  frasco: 'M26 6h12v8l6 8v30a4 4 0 0 1-4 4H24a4 4 0 0 1-4-4V22l6-8zM24 30h16v14H24z',
  galao: 'M20 10h18l10 10v30a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4M24 10V6h10v4M48 20H38V10M22 28h20v16H22z',
  tambor: 'M14 12c0-3 8-5 18-5s18 2 18 5v40c0 3-8 5-18 5s-18-2-18-5zM14 12c0 3 8 5 18 5s18-2 18-5M14 24h36M14 44h36',
  caixa: 'M8 20l24-10 24 10v26L32 56 8 46zM8 20l24 10 24-10M32 30v26',
  rolo: 'M10 20h36M10 44h36M10 20c-4 0-6 4-6 12s2 12 6 12M46 20c4 0 6 4 6 12s-2 12-6 12M46 20c-4 0-6 4-6 12s2 12 6 12',
  peca: 'M22 10h20v44H22zM22 18h20M22 46h20M32 24a6 6 0 1 0 0 12 6 6 0 0 0 0-12',
  lata: 'M24 8h16v10H24zM18 18h28v36a4 4 0 0 1-4 4H22a4 4 0 0 1-4-4z',
  bigbag: 'M12 20h40l-6-10H18zM12 20v28l20 10 20-10V20M12 48l20-8 20 8M32 40v18',
};

export const UNIDADES = {
  kg: { base: 'kg', opcoes: ['g', 'kg'], fator: { g: 0.001, kg: 1 } },
  t: { base: 't', opcoes: ['kg', 't'], fator: { kg: 0.001, t: 1 } },
  L: { base: 'L', opcoes: ['mL', 'L'], fator: { mL: 0.001, L: 1 } },
  un: { base: 'un', opcoes: ['un'], fator: { un: 1 } },
  dose: { base: 'doses', opcoes: ['doses'], fator: { doses: 1 } },
};

// sim: saldo hoje, uso diário (número ou função diasAtrás→qtd), entradas (diasAtrás, qtd, lote, validade, preço/unid.)
export const PRODUTOS = [
  { id: 'kcl', nome: 'Cloreto de potássio (KCl)', categoria: 'Fertilizantes', un: 'kg', pack: 'saco', saldo: 250, minimo: 1000, preco: 3.8, cobertura: 5, confianca: 'alta', ultimaSaida: '19/10/2026',
    sim: { uso: 50, entradas: [{ dias: 120, qtd: 3000, lote: 'K26-06', validade: null, preco: 3.8, fornecedor: 'Agro Norte' }, { dias: 300, qtd: 2000, lote: 'K25-12', validade: null, preco: 3.6, fornecedor: 'Agro Norte' }] },
    historico: [
      { data: '19/10/2026', tipo: 'saida', qtd: '50 kg', quem: 'Funcionário B', onde: 'Talhão 2' },
      { data: '18/10/2026', tipo: 'saida', qtd: '50 kg', quem: 'Funcionário A', onde: 'Talhão 2' },
      { data: '17/10/2026', tipo: 'saida', qtd: '60 kg', quem: 'Funcionário B', onde: 'Talhão 1' },
      { data: '15/10/2026', tipo: 'saida', qtd: '40 kg', quem: 'Funcionário A', onde: 'Talhão 3' },
      { data: '22/06/2026', tipo: 'entrada', qtd: '3.000 kg', quem: 'Funcionário A', onde: 'Agro Norte · lote K26-06' },
    ] },
  { id: 'filtro-oleo', nome: 'Filtro de óleo do trator', categoria: 'Peças e manutenção', un: 'un', pack: 'peca', saldo: 1, minimo: 3, preco: null, cobertura: null, confianca: 'insuficiente', ultimaSaida: '02/09/2026',
    sim: { uso: (d) => (d === 48 || d === 170 ? 1 : 0), entradas: [{ dias: 200, qtd: 3, lote: 'FO-01', validade: null, preco: null, fornecedor: 'Peças Rondônia' }] },
    historico: [
      { data: '02/09/2026', tipo: 'saida', qtd: '1 un', quem: 'Funcionário C', onde: 'Oficina' },
      { data: '03/05/2026', tipo: 'saida', qtd: '1 un', quem: 'Funcionário C', onde: 'Oficina' },
      { data: '03/04/2026', tipo: 'entrada', qtd: '3 un', quem: 'Funcionário A', onde: 'Peças Rondônia · sem preço' },
    ] },
  { id: 'inoculante', nome: 'Inoculante para soja', categoria: 'Defensivos e biológicos', un: 'dose', pack: 'frasco', saldo: 8, minimo: null, preco: 42, cobertura: null, confianca: 'baixa', ultimaSaida: '28/09/2026',
    sim: { uso: (d) => (d > 20 && d < 60 && d % 7 === 1 ? 6 : 0), entradas: [{ dias: 240, qtd: 40, lote: 'I26-02', validade: '10/10/2026', preco: 42, fornecedor: 'BioSemente' }] },
    historico: [
      { data: '28/09/2026', tipo: 'saida', qtd: '6 doses', quem: 'Funcionário D', onde: 'Talhão 3' },
      { data: '21/09/2026', tipo: 'saida', qtd: '6 doses', quem: 'Funcionário D', onde: 'Talhão 3' },
      { data: '22/02/2026', tipo: 'entrada', qtd: '40 doses', quem: 'Funcionário A', onde: 'BioSemente · lote I26-02' },
    ] },
  { id: 'glifosato', nome: 'Herbicida glifosato 480', categoria: 'Defensivos e biológicos', un: 'L', pack: 'galao', saldo: 60, minimo: 40, preco: 28, cobertura: 19, confianca: 'media', ultimaSaida: '18/10/2026',
    sim: { uso: 3.2, entradas: [{ dias: 90, qtd: 200, lote: 'G26-07', validade: '01/07/2028', preco: 28, fornecedor: 'Agro Norte' }] },
    historico: [
      { data: '18/10/2026', tipo: 'saida', qtd: '20 L', quem: 'Funcionário B', onde: 'Talhão 1' },
      { data: '11/10/2026', tipo: 'saida', qtd: '25 L', quem: 'Funcionário B', onde: 'Talhão 2' },
      { data: '04/10/2026', tipo: 'saida', qtd: '20 L', quem: 'Funcionário A', onde: 'Talhão 1' },
      { data: '22/07/2026', tipo: 'entrada', qtd: '200 L', quem: 'Funcionário A', onde: 'Agro Norte · lote G26-07' },
    ] },
  { id: 'azoxistrobina', nome: 'Fungicida azoxistrobina', categoria: 'Defensivos e biológicos', un: 'L', pack: 'frasco', saldo: 30, minimo: null, preco: 180, cobertura: 150, confianca: 'media', ultimaSaida: '16/10/2026',
    sim: { uso: 0.2, entradas: [{ dias: 150, qtd: 40, lote: 'F26-05', validade: '31/01/2027', preco: 180, fornecedor: 'Defensivos Sul' }] },
    historico: [
      { data: '16/10/2026', tipo: 'saida', qtd: '1,5 L', quem: 'Funcionário D', onde: 'Pomar' },
      { data: '09/10/2026', tipo: 'saida', qtd: '1,5 L', quem: 'Funcionário D', onde: 'Pomar' },
      { data: '23/05/2026', tipo: 'entrada', qtd: '40 L', quem: 'Funcionário A', onde: 'Defensivos Sul · lote F26-05' },
    ] },
  { id: 'graxa', nome: 'Graxa para rolamentos', categoria: 'Combustíveis e lubrificantes', un: 'kg', pack: 'lata', saldo: 8, minimo: 4, preco: 38, cobertura: 20, confianca: 'alta', ultimaSaida: '19/10/2026',
    sim: { uso: (d) => (d < 30 ? 0.4 : 0.16), entradas: [{ dias: 60, qtd: 20, lote: 'GR-26-08', validade: null, preco: 38, fornecedor: 'Peças Rondônia' }] },
    historico: [
      { data: '19/10/2026', tipo: 'saida', qtd: '2 kg', quem: 'Funcionário C', onde: 'Oficina' },
      { data: '14/10/2026', tipo: 'saida', qtd: '3 kg', quem: 'Funcionário C', onde: 'Oficina' },
      { data: '07/10/2026', tipo: 'saida', qtd: '3 kg', quem: 'Funcionário C', onde: 'Oficina' },
      { data: '21/08/2026', tipo: 'entrada', qtd: '20 kg', quem: 'Funcionário A', onde: 'Peças Rondônia' },
    ] },
  { id: 'lambda', nome: 'Inseticida lambda-cialotrina', categoria: 'Defensivos e biológicos', un: 'L', pack: 'frasco', saldo: 4.2, minimo: 1, preco: 95, cobertura: 35, confianca: 'alta', ultimaSaida: '19/10/2026',
    sim: { uso: (d) => (d === 8 ? 2.5 : d % 7 === 1 ? 0.25 : 0), entradas: [{ dias: 180, qtd: 10, lote: 'L26-04', validade: '30/04/2028', preco: 95, fornecedor: 'Defensivos Sul' }] },
    historico: [
      { data: '19/10/2026', tipo: 'saida', qtd: '250 mL', quem: 'Funcionário D', onde: 'Horta' },
      { data: '12/10/2026', tipo: 'saida', qtd: '2.500 mL', quem: 'Funcionário B', onde: 'Talhão 3', atipica: true },
      { data: '05/10/2026', tipo: 'saida', qtd: '250 mL', quem: 'Funcionário D', onde: 'Horta' },
      { data: '28/09/2026', tipo: 'saida', qtd: '250 mL', quem: 'Funcionário D', onde: 'Horta' },
      { data: '23/04/2026', tipo: 'entrada', qtd: '10 L', quem: 'Funcionário A', onde: 'Defensivos Sul · lote L26-04' },
    ] },
  { id: 'ureia45', nome: 'UREIA 45%', categoria: 'Fertilizantes', un: 'kg', pack: 'saco', saldo: 400, minimo: null, preco: 3.1, cobertura: null, confianca: 'insuficiente', ultimaSaida: null,
    sim: { uso: 0, entradas: [{ dias: 45, qtd: 400, lote: 'U26-09', validade: null, preco: 3.1, fornecedor: 'Agro Norte' }] },
    historico: [{ data: '05/09/2026', tipo: 'entrada', qtd: '400 kg', quem: 'Funcionário B', onde: 'Agro Norte · lote U26-09' }] },
  { id: 'oleo-hidraulico', nome: 'Óleo hidráulico', categoria: 'Combustíveis e lubrificantes', un: 'L', pack: 'tambor', saldo: 920, minimo: 60, preco: 22, cobertura: 460, confianca: 'alta', ultimaSaida: '19/10/2026',
    sim: { uso: 2, entradas: [{ dias: 40, qtd: 1000, lote: 'OH26-09', validade: null, preco: 22, fornecedor: 'Lubrifica RO' }] },
    historico: [
      { data: '19/10/2026', tipo: 'saida', qtd: '4 L', quem: 'Funcionário C', onde: 'Oficina' },
      { data: '17/10/2026', tipo: 'saida', qtd: '6 L', quem: 'Funcionário C', onde: 'Oficina' },
      { data: '10/09/2026', tipo: 'entrada', qtd: '1.000 L', quem: 'Funcionário A', onde: 'Lubrifica RO · lote OH26-09' },
    ] },
  { id: 'calcario', nome: 'Calcário dolomítico', categoria: 'Corretivos', un: 't', pack: 'bigbag', saldo: 80, minimo: null, preco: 240, cobertura: null, confianca: 'alta', ultimaSaida: '16/12/2025',
    sim: { uso: (d) => (d >= 308 && d < 338 ? 4 : 0), entradas: [{ dias: 365, qtd: 200, lote: 'CD25-10', validade: null, preco: 240, fornecedor: 'Mineração Jamari' }] },
    historico: [
      { data: '16/12/2025', tipo: 'saida', qtd: '4 t', quem: 'Funcionário B', onde: 'Talhão 2' },
      { data: '15/12/2025', tipo: 'saida', qtd: '4 t', quem: 'Funcionário B', onde: 'Talhão 2' },
      { data: '20/10/2025', tipo: 'entrada', qtd: '200 t', quem: 'Funcionário A', onde: 'Mineração Jamari · lote CD25-10' },
    ] },
  { id: 'npk041408', nome: 'NPK 04-14-08', categoria: 'Fertilizantes', un: 'kg', pack: 'saco', saldo: 5000, minimo: 500, preco: 4.1, cobertura: null, confianca: 'insuficiente', ultimaSaida: '14/03/2026',
    sim: { uso: (d) => (d > 220 && d < 250 ? 100 : 0), entradas: [{ dias: 20, qtd: 5000, lote: 'N26-09', validade: null, preco: 4.1, fornecedor: 'Fertisul' }, { dias: 260, qtd: 3000, lote: 'N26-01', validade: null, preco: 3.3, fornecedor: 'Agro Norte' }] },
    historico: [
      { data: '30/09/2026', tipo: 'entrada', qtd: '5.000 kg', quem: 'Funcionário A', onde: 'Fertisul · R$ 4,10/kg' },
      { data: '14/03/2026', tipo: 'saida', qtd: '100 kg', quem: 'Funcionário B', onde: 'Talhão 1' },
      { data: '02/02/2026', tipo: 'entrada', qtd: '3.000 kg', quem: 'Funcionário A', onde: 'Agro Norte · R$ 3,30/kg' },
    ] },
  { id: '24d', nome: 'Herbicida 2,4-D', categoria: 'Defensivos e biológicos', un: 'L', pack: 'galao', saldo: 20, minimo: 10, preco: 32, cobertura: 40, confianca: 'alta', ultimaSaida: '17/10/2026',
    sim: { uso: 0.5, entradas: [{ dias: 60, qtd: 40, lote: 'H26-08', validade: '01/08/2028', preco: 32, fornecedor: 'Agro Norte' }, { dias: 330, qtd: 60, lote: 'H24-2603', validade: '01/03/2027', preco: 30, fornecedor: 'Agro Norte' }] },
    historico: [
      { data: '17/10/2026', tipo: 'saida', qtd: '5 L', quem: 'Funcionário B', onde: 'Talhão 1' },
      { data: '21/08/2026', tipo: 'entrada', qtd: '40 L', quem: 'Funcionário A', onde: 'Agro Norte · lote H26-08' },
      { data: '14/07/2026', tipo: 'saida', qtd: '3 L', quem: 'Funcionário B', onde: 'Talhão 3 · lote H24-2603 esgotado' },
    ] },
  // Produtos normais (sem alerta)
  { id: 'diesel', nome: 'Óleo diesel S10', categoria: 'Combustíveis e lubrificantes', un: 'L', pack: 'tambor', saldo: 1800, minimo: 500, preco: 6.1, cobertura: 54, confianca: 'alta', ultimaSaida: '20/10/2026', sim: { uso: 33, entradas: [{ dias: 15, qtd: 2000, lote: 'D26-10', validade: null, preco: 6.1, fornecedor: 'Posto Rural' }, { dias: 75, qtd: 2000, lote: 'D26-08', validade: null, preco: 5.9, fornecedor: 'Posto Rural' }] } },
  { id: 'oleo-motor', nome: 'Óleo de motor 15W40', categoria: 'Combustíveis e lubrificantes', un: 'L', pack: 'galao', saldo: 36, minimo: 10, preco: 29, cobertura: 63, confianca: 'alta', ultimaSaida: '15/10/2026', sim: { uso: 0.57, entradas: [{ dias: 100, qtd: 80, lote: 'OM26-07', validade: null, preco: 29, fornecedor: 'Lubrifica RO' }] } },
  { id: 'ureia', nome: 'Ureia', categoria: 'Fertilizantes', un: 'kg', pack: 'saco', saldo: 150, minimo: null, preco: 3.05, cobertura: null, confianca: 'insuficiente', ultimaSaida: '20/03/2026', sim: { uso: (d) => (d > 210 && d < 220 ? 300 : 0), entradas: [{ dias: 230, qtd: 3000, lote: 'UR26-03', validade: null, preco: 3.05, fornecedor: 'Agro Norte' }] } },
  { id: 'map', nome: 'MAP (fosfato monoamônico)', categoria: 'Fertilizantes', un: 'kg', pack: 'bigbag', saldo: 12000, minimo: 1000, preco: 5.2, cobertura: 200, confianca: 'baixa', ultimaSaida: '10/10/2026', sim: { uso: (d) => (d < 12 ? 60 : 0), entradas: [{ dias: 70, qtd: 12000, lote: 'MAP26-08', validade: null, preco: 5.2, fornecedor: 'Fertisul' }] } },
  { id: 'gesso', nome: 'Gesso agrícola', categoria: 'Corretivos', un: 't', pack: 'bigbag', saldo: 36, minimo: null, preco: 180, cobertura: null, confianca: 'baixa', ultimaSaida: '02/07/2026', sim: { uso: (d) => (d > 108 && d < 114 ? 4 : 0), entradas: [{ dias: 130, qtd: 60, lote: 'GA26-06', validade: null, preco: 180, fornecedor: 'Mineração Jamari' }] } },
  { id: 'soja', nome: 'Semente de soja', categoria: 'Sementes', un: 'kg', pack: 'saco', saldo: 1800, minimo: null, preco: 9.8, cobertura: null, confianca: 'insuficiente', ultimaSaida: '18/10/2026', sim: { uso: (d) => (d < 6 ? 100 : 0), entradas: [{ dias: 20, qtd: 2000, lote: 'SJ26-09', validade: '30/09/2027', preco: 9.8, fornecedor: 'BioSemente' }] } },
  { id: 'mancozebe', nome: 'Fungicida mancozebe', categoria: 'Defensivos e biológicos', un: 'kg', pack: 'saco', saldo: 18, minimo: 5, preco: 48, cobertura: 90, confianca: 'alta', ultimaSaida: '17/10/2026', sim: { uso: 0.2, entradas: [{ dias: 200, qtd: 50, lote: 'MZ26-03', validade: '01/03/2029', preco: 48, fornecedor: 'Defensivos Sul' }] } },
  { id: 'luva', nome: 'Luva nitrílica', categoria: 'EPI e diversos', un: 'un', pack: 'caixa', saldo: 24, minimo: 10, preco: null, cobertura: 48, confianca: 'alta', ultimaSaida: '19/10/2026', semPrecoParcial: true, sim: { uso: 0.5, entradas: [{ dias: 30, qtd: 40, lote: null, validade: null, preco: null, fornecedor: 'EPI Center · N/D' }] } },
  { id: 'conector', nome: 'Conector de linha 16 mm', categoria: 'Materiais de irrigação', un: 'un', pack: 'caixa', saldo: 120, minimo: 30, preco: null, cobertura: 80, confianca: 'alta', ultimaSaida: '16/10/2026', sim: { uso: 1.5, entradas: [{ dias: 50, qtd: 200, lote: null, validade: null, preco: null, fornecedor: 'Irriga Norte · sem preço' }] } },
  { id: 'gotejo', nome: 'Mangueira de gotejamento 16 mm', categoria: 'Materiais de irrigação', un: 'un', pack: 'rolo', saldo: 6, minimo: 2, preco: 310, cobertura: 90, confianca: 'media', ultimaSaida: '12/10/2026', sim: { uso: 0.07, entradas: [{ dias: 90, qtd: 10, lote: null, validade: null, preco: 310, fornecedor: 'Irriga Norte' }] } },
  { id: 'pff2', nome: 'Respirador PFF2', categoria: 'EPI e diversos', un: 'un', pack: 'caixa', saldo: 30, minimo: 10, preco: 4.5, cobertura: 60, confianca: 'alta', ultimaSaida: '19/10/2026', sim: { uso: 0.5, entradas: [{ dias: 40, qtd: 50, lote: null, validade: null, preco: 4.5, fornecedor: 'EPI Center' }] } },
  { id: 'bico', nome: 'Bico de pulverização leque 110-02', categoria: 'Peças e manutenção', un: 'un', pack: 'peca', saldo: 14, minimo: 6, preco: 12, cobertura: 49, confianca: 'alta', ultimaSaida: '18/10/2026', sim: { uso: 0.29, entradas: [{ dias: 60, qtd: 30, lote: null, validade: null, preco: 12, fornecedor: 'Peças Rondônia' }] } },
];

export const RECENTES = ['lambda', 'glifosato', 'kcl', 'graxa'];

// Alertas — saídas do motor na data de referência. valor null = sem preço / sem valor.
export const ALERTAS = [
  { id: 'a1', nivel: 'critico', tipo: 'estoque_critico', produtoId: 'kcl', curta: 'Saldo de 250 kg, abaixo do mínimo de 1.000 kg; cerca de 5 dias de consumo.', valor: 5700, confianca: 'alta',
    mensagem: 'Estoque crítico: Cloreto de potássio (KCl) está com 250 kg, no limite ou abaixo do estoque mínimo de 1.000 kg. Mantendo o consumo médio recente, o saldo atual poderá ser suficiente por aproximadamente 5 dias.',
    evidencia: [['Saldo atual', '250 kg'], ['Estoque mínimo', '1.000 kg'], ['Consumo médio (60 dias)', '50 kg/dia'], ['Cobertura estimada', '5 dias'], ['Saídas na janela', '34'], ['Valor da reposição (30 dias)', 'R$ 5.700,00']],
    regra: 'Saldo igual ou abaixo do estoque mínimo, ou cobertura menor que 7 dias.', origem: 'Limite da categoria Fertilizantes', textoConfianca: 'Estimativa com histórico amplo: 34 retiradas nos últimos 60 dias.',
    recomendacao: 'Programar a compra de KCl para os próximos dias. A reposição para 30 dias de consumo é de cerca de 1.500 kg.' },
  { id: 'a2', nivel: 'critico', tipo: 'estoque_critico', produtoId: 'filtro-oleo', curta: 'Abaixo do mínimo. Histórico insuficiente para estimar dias.', valor: null, confianca: 'insuficiente',
    mensagem: 'Estoque crítico: Filtro de óleo do trator está com 1 un, no limite ou abaixo do estoque mínimo de 3 un. Não há histórico suficiente para estimar por quantos dias o saldo vai durar.',
    evidencia: [['Saldo atual', '1 un'], ['Estoque mínimo', '3 un'], ['Saídas na janela', '2'], ['Cobertura estimada', 'Não estimada'], ['Valor da reposição', 'Sem preço']],
    regra: 'Saldo igual ou abaixo do estoque mínimo.', origem: 'Limite do produto Filtro de óleo do trator', textoConfianca: 'Histórico insuficiente: menos de 3 retiradas na janela. Nenhum número de dias é exibido.',
    recomendacao: 'Repor o filtro antes da próxima troca de óleo. Informar o preço na próxima compra para o item entrar no resumo financeiro.' },
  { id: 'a3', nivel: 'critico', tipo: 'vencimento', produtoId: 'inoculante', curta: 'Lote vencido em 10/10/2026 ainda com 8 doses.', valor: 336, confianca: 'fato',
    mensagem: 'Lote vencido: o lote I26-02 de Inoculante para soja venceu em 10/10/2026 e ainda tem 8 doses em estoque.',
    evidencia: [['Lote', 'I26-02'], ['Validade', '10/10/2026'], ['Dias desde o vencimento', '10'], ['Saldo do lote', '8 doses'], ['Valor do lote', 'R$ 336,00']],
    regra: 'Lote com validade vencida e saldo maior que zero.', origem: 'Limite do padrão geral', textoConfianca: 'Fato registrado: não é estimativa.',
    recomendacao: 'Separar o lote e não usar no plantio. Registrar um ajuste de baixa das 8 doses.' },
  { id: 'a4', nivel: 'atencao', tipo: 'ruptura_prevista', produtoId: 'glifosato', curta: '60 L, suficientes para cerca de 19 dias.', valor: 2660, confianca: 'media',
    mensagem: 'Ruptura prevista: mantendo o consumo médio recente, o saldo de Herbicida glifosato 480 (60 L) poderá acabar em aproximadamente 19 dias.',
    evidencia: [['Saldo atual', '60 L'], ['Consumo médio (60 dias)', '3,2 L/dia'], ['Cobertura estimada', '19 dias'], ['Saídas na janela', '8'], ['Valor da reposição (30 dias)', 'R$ 2.660,00']],
    regra: 'Cobertura entre 7 e 30 dias.', origem: 'Limite do padrão geral', textoConfianca: 'Estimativa com histórico moderado: 8 retiradas na janela.',
    recomendacao: 'Incluir cerca de 95 L na próxima compra de defensivos.' },
  { id: 'a5', nivel: 'atencao', tipo: 'vencimento', produtoId: 'azoxistrobina', curta: 'Lote vence em 31/01/2027; cerca de 9 L podem vencer antes do uso.', valor: 1620, confianca: 'media',
    mensagem: 'Risco de vencimento: mantendo o consumo médio recente, cerca de 9 L do lote F26-05 de Fungicida azoxistrobina podem vencer antes do uso (validade 31/01/2027).',
    evidencia: [['Lote', 'F26-05'], ['Validade', '31/01/2027'], ['Dias até a validade', '103'], ['Saldo do lote', '30 L'], ['Consumo médio', '0,2 L/dia'], ['Quantidade em risco', '≈ 9 L'], ['Valor em risco', 'R$ 1.620,00']],
    regra: 'Saldo do lote maior que o consumo projetado até a validade.', origem: 'Limite do padrão geral', textoConfianca: 'Estimativa com histórico moderado: 7 retiradas na janela.',
    recomendacao: 'Priorizar este lote nas próximas aplicações e adiar novas compras do produto.' },
  { id: 'a6', nivel: 'atencao', tipo: 'consumo_crescente', produtoId: 'graxa', curta: 'Consumo do último mês 2,5 × maior que o anterior.', valor: 456, confianca: 'alta',
    mensagem: 'Consumo em alta: Graxa para rolamentos teve 12 kg retirados nos últimos 30 dias, 2,5 vezes o consumo dos 30 dias anteriores (4,8 kg).',
    evidencia: [['Consumo últimos 30 dias', '12 kg'], ['Consumo 30 dias anteriores', '4,8 kg'], ['Razão', '2,5 ×'], ['Saídas na janela', '11'], ['Valor do consumo recente', 'R$ 456,00']],
    regra: 'Consumo dos últimos 30 dias maior que 1,5 × os 30 dias anteriores.', origem: 'Limite do padrão geral', textoConfianca: 'Estimativa com histórico amplo: 11 retiradas na janela.',
    recomendacao: 'Confirmar com a oficina se o aumento é do preparo de máquinas para o plantio.' },
  { id: 'a7', nivel: 'atencao', tipo: 'retirada_atipica', produtoId: 'lambda', curta: 'Retirada de 2.500 mL em 12/10/2026; a dose habitual é ~250 mL.', valor: 237.5, confianca: 'fato',
    mensagem: 'Retirada fora do padrão: em 12/10/2026, foram retirados 2.500 mL de Inseticida lambda-cialotrina. O normal para este produto é perto de 250 mL por retirada.',
    evidencia: [['Data', '12/10/2026'], ['Quantidade retirada', '2.500 mL'], ['Mediana das retiradas', '250 mL'], ['Limite (mediana + 3 × MAD)', '325 mL'], ['Responsável', 'Funcionário B'], ['Destino', 'Talhão 3'], ['Valor da retirada', 'R$ 237,50']],
    regra: 'Saída maior que a mediana + 3 × MAD do produto (exige 5 ou mais saídas).', origem: 'Limite do padrão geral', textoConfianca: 'Fato registrado: a comparação usa 22 retiradas anteriores.',
    recomendacao: 'Conferir com o Funcionário B se a quantidade foi digitada certa (2.500 mL ou 250 mL). Se errada, registrar um ajuste.' },
  { id: 'a8', nivel: 'atencao', tipo: 'possivel_duplicidade', produtoId: 'ureia45', curta: 'Pode ser o mesmo produto que "Ureia" — confirmar.', valor: 1240, confianca: 'fato',
    mensagem: 'Possível duplicidade: "UREIA 45%" e "Ureia" parecem ser o mesmo produto. Confirme antes de unificar.',
    evidencia: [['Produto', 'UREIA 45%'], ['Outro produto', 'Ureia'], ['Semelhança dos nomes', '100% das palavras'], ['Números diferentes', 'Nenhum'], ['Saldo do produto', '400 kg'], ['Valor em estoque', 'R$ 1.240,00']],
    regra: 'Nomes normalizados semelhantes e sem números diferentes.', origem: 'Limite do padrão geral', textoConfianca: 'Sugestão automática: só vale depois de uma pessoa confirmar (R8).',
    recomendacao: 'Confirmar se é o mesmo produto. Se for, os saldos passam a ser somados; se não, o alerta é encerrado.' },
  { id: 'a9', nivel: 'informativo', tipo: 'excesso', produtoId: 'oleo-hidraulico', curta: '1.000 L comprados para ~2 L/dia de consumo: saldo para mais de um ano.', valor: 20240, confianca: 'alta',
    mensagem: 'Estoque em excesso: mantendo o consumo médio recente, o saldo de Óleo hidráulico (920 L) daria para aproximadamente 460 dias.',
    evidencia: [['Saldo atual', '920 L'], ['Consumo médio (60 dias)', '2 L/dia'], ['Cobertura estimada', '460 dias'], ['Última compra', '1.000 L em 10/09/2026'], ['Valor em estoque', 'R$ 20.240,00']],
    regra: 'Cobertura maior que 180 dias.', origem: 'Limite da categoria Combustíveis e lubrificantes', textoConfianca: 'Estimativa com histórico amplo: 26 retiradas na janela.',
    recomendacao: 'Não comprar óleo hidráulico este ano. Verificar se parte pode ser remanejada.' },
  { id: 'a10', nivel: 'informativo', tipo: 'item_parado', produtoId: 'calcario', curta: '80 t (R$ 19.200,00) sem retirada desde 16/12/2025.', valor: 19200, confianca: 'alta',
    mensagem: 'Item parado: Calcário dolomítico tem R$ 19.200,00 em estoque e nenhuma retirada há 308 dias.',
    evidencia: [['Saldo atual', '80 t'], ['Última retirada', '16/12/2025'], ['Dias sem retirada', '308'], ['Valor em estoque', 'R$ 19.200,00'], ['Posição no estoque', 'Entre os 20% de maior valor']],
    regra: 'Valor em estoque entre os 20% maiores e sem saída há mais de 180 dias.', origem: 'Limite da categoria Corretivos', textoConfianca: 'Fato registrado sobre as datas; a posição por valor é estimada com os preços conhecidos.',
    recomendacao: 'Planejar a aplicação da sobra na próxima correção de solo em vez de comprar novo calcário.' },
  { id: 'a11', nivel: 'informativo', tipo: 'variacao_preco', produtoId: 'npk041408', curta: 'Última compra a R$ 4,10/kg, ~30% acima da média (R$ 3,15/kg).', valor: 4750, confianca: 'fato',
    mensagem: 'Variação de preço: a compra de NPK 04-14-08 em 30/09/2026 custou R$ 4,10/kg, 30% acima da média das compras anteriores (R$ 3,15/kg).',
    evidencia: [['Data da compra', '30/09/2026'], ['Preço da compra', 'R$ 4,10/kg'], ['Média das compras anteriores', 'R$ 3,15/kg'], ['Compras anteriores', '2'], ['Variação', '+30%'], ['Diferença na compra (5.000 kg)', 'R$ 4.750,00']],
    regra: 'Preço unitário difere mais de 20% da média das compras anteriores.', origem: 'Limite do padrão geral', textoConfianca: 'Fato registrado: comparação de preços informados.',
    recomendacao: 'Comparar fornecedores antes da próxima compra de NPK.' },
  { id: 'a12', nivel: 'informativo', tipo: 'devolucao_embalagem', produtoId: '24d', curta: 'Lote H24-2603 esgotado; embalagem vazia a devolver.', valor: null, confianca: 'fato',
    mensagem: 'Devolução de embalagem: o lote H24-2603 de Herbicida 2,4-D acabou em 14/07/2026. Devolva as embalagens vazias até 25/11/2026 (faltam 36 dias).',
    evidencia: [['Lote', 'H24-2603'], ['Esgotado em', '14/07/2026'], ['Prazo de devolução', '25/11/2026'], ['Dias até o prazo', '36'], ['Valor envolvido', 'Não se aplica']],
    regra: 'Defensivo com lote zerado: devolver a embalagem em até 365 dias da compra.', origem: 'Limite da categoria Defensivos e biológicos', textoConfianca: 'Fato registrado: datas da compra e da última saída.',
    recomendacao: 'Levar as embalagens tríplice-lavadas ao posto de recebimento antes de 25/11/2026.' },
];

export const NIVEIS = [
  { id: 'critico', rotulo: 'Crítico' },
  { id: 'atencao', rotulo: 'Atenção' },
  { id: 'informativo', rotulo: 'Informativo' },
];

export const TIPOS = {
  estoque_critico: 'Estoque crítico', ruptura_prevista: 'Acaba em breve', vencimento: 'Vencimento', consumo_crescente: 'Consumo crescente',
  retirada_atipica: 'Retirada atípica', excesso: 'Excesso', item_parado: 'Item parado', variacao_preco: 'Variação de preço',
  possivel_duplicidade: 'Possível duplicidade', devolucao_embalagem: 'Devolução de embalagem',
};

export const CONFIANCA = {
  alta: { rotulo: 'Confiança alta' }, media: { rotulo: 'Confiança média' }, baixa: { rotulo: 'Confiança baixa' },
  insuficiente: { rotulo: 'Histórico insuficiente' }, fato: { rotulo: 'Fato registrado' },
};

// Resumo financeiro (valores simulados; itens sem preço ficam fora do total).
export const FINANCEIRO = {
  total: 161400, itensComEstoque: 41, itensSemPreco: 3,
  porCategoria: [
    { categoria: 'Fertilizantes', valor: 48600, itens: 7, semPreco: 0 },
    { categoria: 'Combustíveis e lubrificantes', valor: 38700, itens: 4, semPreco: 0 },
    { categoria: 'Corretivos', valor: 31400, itens: 2, semPreco: 0 },
    { categoria: 'Defensivos e biológicos', valor: 22900, itens: 9, semPreco: 0 },
    { categoria: 'Sementes', valor: 9800, itens: 1, semPreco: 0 },
    { categoria: 'Peças e manutenção', valor: 4300, itens: 7, semPreco: 1 },
    { categoria: 'Materiais de irrigação', valor: 3100, itens: 5, semPreco: 1 },
    { categoria: 'EPI e diversos', valor: 2600, itens: 6, semPreco: 1 },
  ],
  parados: [{ produtoId: 'calcario', valor: 19200, desde: '16/12/2025' }],
  semPreco: [{ produtoId: 'filtro-oleo', nota: 'Nenhuma compra com preço' }, { produtoId: 'conector', nota: 'Nenhuma compra com preço' }, { produtoId: 'luva', nota: 'Parte das compras sem preço (valor estimado)' }],
};

const fmtN = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });
const fmtN2 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const fmtR = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export function fmtNum(n) { if (typeof n !== 'number') return '?'; return Math.abs(n) < 10 ? fmtN2.format(n) : fmtN.format(n); }
export function fmtReais(n) { return typeof n === 'number' ? fmtR.format(n) : 'Sem preço'; }
export function fmtQtd(n, un) { return `${fmtNum(n)} ${un === 'dose' ? 'doses' : un}`; }
export function dataBr(d) { return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`; }
export function diasAtras(n) { const d = new Date(HOJE); d.setDate(d.getDate() - n); return d; }
export function parseBr(s) { const [d, m, a] = s.split('/').map(Number); return new Date(a, m - 1, d); }

export function produto(id) { return PRODUTOS.find((p) => p.id === id); }
export function alertasDoProduto(id) { return ALERTAS.filter((a) => a.produtoId === id); }

/** Série do saldo (365 dias, do mais antigo ao mais recente) com as entradas marcadas. */
export function serieSaldo(p) {
  const uso = typeof p.sim.uso === 'function' ? p.sim.uso : () => p.sim.uso;
  const ent = new Map(p.sim.entradas.map((e) => [e.dias, e]));
  const s = new Array(366);
  s[0] = p.saldo;
  for (let d = 0; d < 365; d++) {
    const e = ent.get(d);
    s[d + 1] = Math.max(0, s[d] + uso(d) - (e ? e.qtd : 0));
  }
  const pontos = [];
  for (let d = 365; d >= 0; d--) pontos.push({ dias: d, saldo: s[d], entrada: ent.get(d) || null });
  return pontos;
}

/** Lotes com saldo: o mais antigo consome primeiro (FIFO). */
export function lotes(p) {
  const ents = [...p.sim.entradas].sort((a, b) => b.dias - a.dias);
  const consumido = ents.reduce((t, e) => t + e.qtd, 0) - p.saldo;
  let resta = consumido;
  return ents.map((e) => {
    const usado = Math.min(e.qtd, Math.max(0, resta));
    resta -= usado;
    const saldo = e.qtd - usado;
    const val = e.validade ? parseBr(e.validade) : null;
    const diasVal = val ? Math.round((val - HOJE) / 86400000) : null;
    return { lote: e.lote || 'Sem lote', saldo, validade: e.validade, diasVal, vencido: diasVal !== null && diasVal < 0, entradaEm: dataBr(diasAtras(e.dias)), preco: e.preco, fornecedor: e.fornecedor };
  }).filter((l) => l.saldo > 0 || l.vencido);
}

/** Treemap simples: divide a lista em duas metades de soma parecida, alternando o lado maior. */
export function treemap(itens, x = 0, y = 0, w = 100, h = 100) {
  if (!itens.length) return [];
  if (itens.length === 1) return [{ ...itens[0], x, y, w, h }];
  const total = itens.reduce((t, i) => t + i.valor, 0);
  let acc = 0, k = 0;
  while (k < itens.length - 1 && acc + itens[k].valor < total / 2) acc += itens[k++].valor;
  if (k === 0) { acc = itens[0].valor; k = 1; }
  const f = acc / total;
  const a = itens.slice(0, k), b = itens.slice(k);
  return w >= h
    ? [...treemap(a, x, y, w * f, h), ...treemap(b, x + w * f, y, w * (1 - f), h)]
    : [...treemap(a, x, y, w, h * f), ...treemap(b, x, y + h * f, w, h * (1 - f))];
}
