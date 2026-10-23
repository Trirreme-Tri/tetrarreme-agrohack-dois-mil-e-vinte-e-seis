# Monitora — Equipe Tetrarreme · AGROHACK 2026/2

> Gestão inteligente de insumos em uma propriedade rural · IFRO Campus Ariquemes · SNCT 2026

## 1. Equipe

| Integrante | Curso | Período | Função |
|---|---|---|---|
| Leonardo Eliel Dias da Silva (responsável) | ADS | 6º | _a definir_ |
| Bryan Fernando Serafim Costa | ADS | 6º | _a definir_ |
| Wellington Pereira Luiz | ADS | 6º | _a definir_ |
| Victor Hugo Oliveira Thomes | Agronomia | 8º | _a definir_ |

## 2. Problema e público

O produtor registra compras e retiradas de insumos, mas não consegue transformar esses registros
em decisão: faltam produtos em momentos críticos, lotes vencem sem uso, dinheiro fica parado e
consumos anormais passam despercebidos. Além disso, quem dá baixa é o funcionário, no galpão,
muitas vezes sem internet e com pouca familiaridade com aplicativos.

O **Monitora** atende às duas pontas:

- **Funcionário:** registra retiradas e entradas em poucos toques, com botões grandes, mesmo offline.
- **Dono da propriedade:** abre o app e vê, em segundos, o que merece atenção e por quê — alertas
  priorizados, com evidência em números, regra usada, confiança da estimativa e recomendação.

A propriedade da demonstração é o **Sítio Bom Futuro** (Ariquemes/RO), **fictícia**: a organização
não fornecerá base oficial, então todos os dados da demonstração são **simulados** e identificados
como tal na tela (selo "Dados simulados").

## 3. Solução

**Acesso:** _link do Cloudflare Pages — a preencher depois da publicação (ver seção 4)._

Aplicativo web instalável (PWA), que funciona sem internet depois da primeira visita:

- **Painel do dono:** alertas agrupados por nível (crítico, atenção, informativo), ordenados pelo valor
  envolvido, com filtro por categoria; no computador, resumo financeiro fixo ao lado.
- **Detalhe do alerta:** mensagem, evidência em números, regra **com a origem do limite** (padrão,
  categoria ou produto), confiança da estimativa e recomendação. Possível duplicidade pode ser
  confirmada ("Sim, é o mesmo") ou descartada ("Não, são diferentes"), e a resposta fica guardada.
- **Registro do funcionário:** perfil → produto → quantidade (teclado grande, mL/L, g/kg/t) → destino;
  entrada com lote, validade (DD/MM/AAAA) e preço opcional. O registro nunca é bloqueado: se passar do
  saldo, o teclado avisa e o painel mostra um aviso de qualidade dos dados.
- **Reanálise imediata:** cada registro grava no aparelho (IndexedDB) e a análise roda de novo; o painel
  muda na hora (R6).
- **Detalhe do produto:** saldo por lote com validade, consumo por mês (ou semana) e linha do saldo com
  as entradas marcadas, movimentações com a retirada atípica destacada.
- **Resumo financeiro:** onde está o valor, itens parados e itens sem preço — nunca "R$ 0,00" para
  preço desconhecido; quando parte do valor é estimada, a tela diz por quê.

Ainda não implementado nesta versão: sincronização com o servidor (sessão seguinte).

## 4. Como testar

Requisitos: Node.js 22.12 ou mais novo (o projeto usa 24, ver `.nvmrc`).

```bash
npm ci                 # instala as dependências de todos os pacotes (monorepo)
npm test               # testes do contrato e do app (motor, dados locais e interface)
npm run dev            # app em modo de desenvolvimento: http://localhost:5173
npm run build          # gera o site estático em web/dist
npm run preview        # serve web/dist em http://localhost:4173
npm run gerar:simulados   # regenera a base simulada e o data/simulados/SITUACOES.md
```

**Dados para teste:** a base simulada (`data/simulados/movimentacoes.csv`, 54 produtos, 12 meses) é
carregada automaticamente na primeira abertura. As datas são deslocadas para a base terminar no dia
em que o app é aberto (ver `docs/DECISOES.md`). Para recomeçar uma demonstração, use "Recarregar dados
simulados" na tela de escolha de perfil (apaga os registros feitos no aparelho).

### Publicar no Cloudflare Pages

O site é estático (sem servidor nesta versão). No painel da Cloudflare: **Workers & Pages → Create →
Pages → Connect to Git**, escolha este repositório e configure:

| Campo | Valor |
|---|---|
| Production branch | `main` |
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `web/dist` |
| Root directory | _(vazio: raiz do repositório)_ |
| Variável de ambiente | `NODE_VERSION` = `24` |

A Cloudflare instala as dependências com `npm ci` (há `package-lock.json` na raiz) e publica `web/dist`.
O arquivo `web/public/_headers` impede que o service worker fique guardado em cache. Depois da
publicação, preencha o link na seção 3.

## 5. Dados e critérios

_Campos utilizados, tratamentos (normalização de nomes, conversão de unidades, dados ausentes), critérios de cada alerta e forma de cálculo das estimativas._

> Dados criados pela equipe ficam em `data/simulados/` e estão identificados como **simulados**, conforme a seção 4.2 do regulamento.

## 6. Demonstração

_Vídeo, exemplos de alertas e demonstração de atualização dos registros com nova análise._

## 7. Validação

_Testes, resultados, feedback recebido, o que funciona e o que precisa ser melhorado._

## 8. Tecnologias e IA

_Tecnologias utilizadas._

| Tecnologia | Uso | Licença |
|---|---|---|
| TypeScript | Linguagem do app e do motor de análise | Apache-2.0 |
| React | Interface (PWA) | MIT |
| Vite | Build e servidor de desenvolvimento | MIT |
| Zod | Contrato de dados e validação (`contrato/`) | MIT |
| Vitest | Testes automatizados | MIT |
| Dexie.js e dexie-react-hooks | Banco local (IndexedDB), offline | Apache-2.0 |
| vite-plugin-pwa (Workbox) | PWA: funciona sem internet | MIT |
| Testing Library, jsdom, fake-indexeddb | Testes de integração da interface | MIT · MIT · Apache-2.0 |
| Barlow e Barlow Condensed (via @fontsource) | Fontes, hospedadas no app | SIL OFL 1.1 |
| Ícones Lucide | Ícones da interface | ISC |
| Design system "Industry" (Claude Design) | Tokens e estilos de base (`web/src/styles/`) | gerado para o projeto |
| oxlint | Lint | MIT |

Uso de IA (seção 6 do regulamento):

| Ferramenta | Finalidade | Partes apoiadas | Revisão pela equipe |
|---|---|---|---|
| Claude (Anthropic) | Leitura do regulamento, organização de requisitos e planejamento | Planejamento inicial e estrutura deste README | _a preencher_ |
| Claude Code (Anthropic) | Geração de código e testes a partir da especificação (`CLAUDE.md`) | Estrutura do repositório, contrato de dados (`contrato/`), motor de análise (`web/src/analise/`), dados locais (`web/src/dados/`), interface (`web/src/app`, `telas`, `componentes`), base simulada e testes | _a preencher_ |
| Claude Design (Anthropic) | Protótipo das telas | Referência visual em `docs/design/` (layout, tokens, componentes, textos) | _a preencher_ |

## 9. Autoria e licença

_Referências, bibliotecas utilizadas e licença do código._

## 10. Versão de entrega

_Tag ou commit da versão avaliada (ex.: `v1.0-entrega`)._

