# STATUS

> Atualizado pelo Claude Code ao fim de cada sessão. Enviado ao Projeto do claude.ai para revisão.

## Última atualização
22/10/2026 — Sessão 2 + adendos (contrato de dados; sem base oficial)

## Feito nesta sessão
- Pendências registradas neste arquivo.
- Decisão de infraestrutura: Neon + Cloudflare Workers (`docs/DECISOES.md` e `CLAUDE.md`, seção 7).
- Projeto `web/` criado (Vite + React + TypeScript, template sem telas) com Vitest (`npm test`).
- Motor de análise em `web/src/analise/`, TypeScript puro, sem UI, rede ou banco:
  - `tipos.ts`, `config.ts` (todos os limites provisórios), `datas.ts`, `unidades.ts` (R1);
  - `produtos.ts` (canônico, apelidos, sugestão de duplicidade, R8);
  - `importacao.ts` (CSV com mapeamento de colunas configurável, ausentes → `null`, origem, pseudonimização; R2, R7);
  - `consumo.ts` (saldo por lote, consumo médio, cobertura, confiança na análise; R3);
  - `detectores/` (os 10 tipos da seção 6, um arquivo cada), `mensagens.ts` (R4), `financeiro.ts` (R2);
  - `analisar.ts`: `analisar(movimentacoes, produtos, hoje, opcoes?)` pura e determinística; ordena alertas (R5); recalcula tudo a cada chamada (R6).
- Base simulada em `data/simulados/` (ver adendo "sem base oficial" abaixo).
- Testes em `web/test/`: conformidade (R1–R8), detecção guiada pelas situações do gerador, falsos positivos,
  reanálise e testes unitários dos limites de cada detector.
- README: tabela de tecnologias/licenças e linha de uso do Claude Code.
- **Adendo:** monorepo com npm workspaces (`contrato/`, `web/`). Pacote `@tetrarreme/contrato`
  (`contrato/src/index.ts`) com schemas Zod e tipos inferidos de Unidade, Produto, ProdutoAlias,
  Importacao, Movimentacao e Alerta. O motor importa os tipos de lá (`web/src/analise/tipos.ts` removido).
  O importador valida cada linha com `MovimentacaoSchema`; linha inválida vira erro com linha e motivo.
- **Adendo — sem base oficial:** a organização não fornecerá a base; a demonstração usa a base simulada,
  sempre identificada como SIMULADA (CLAUDE.md R7 e seção 12 atualizados). Novo gerador
  `data/simulados/gerar.ts`: semente fixa, 44 produtos nas 8 categorias, 1.753 movimentações de
  21/10/2025 a 20/10/2026, 13 situações plantadas (todos os 10 tipos, cada uma comentada no código),
  31 produtos normais; gera `movimentacoes.csv` e `SITUACOES.md` (`npm run gerar:simulados`).
  Testes de detecção usam essa base e a data de referência exportada pelo gerador.
- Heurística de duplicidade refinada (palavra a palavra), para não confundir "Calcário calcítico" com
  "Calcário dolomítico" e continuar pegando "Glifozato 480" × "Glifosato 480".

## Testes
`npm test` na raiz (todos os workspaces): **131 testes, 131 passaram**.
- `contrato/`: 27 testes (`contrato.test.ts`: válidos e inválidos de cada schema).
- `web/`: 104 testes (`conformidade.test.ts`, `deteccao.test.ts` — 13 situações, 31 produtos normais,
  determinismo do gerador —, `motor.test.ts`).

Também passam `npm run typecheck` (os dois workspaces), `oxlint` e `vite build`.

## Decisões tomadas
- Banco Neon; backend Cloudflare Workers com Hono.
- Contrato de dados único em `contrato/` (Zod), compartilhado por interface, motor e API; monorepo com npm workspaces.
- Sem base oficial: demonstração com a base simulada; importador continua com mapeamento configurável.
- Interpretações da especificação no motor, todas registradas em `docs/DECISOES.md` (21/10/2026). Principais:
  níveis de cada tipo de alerta; limites adicionais provisórios em `config.ts` (horizonte de vencimento,
  janela da retirada atípica, piso do MAD, regras da variação de preço); definição do `valorEnvolvido` de
  cada tipo; consumo de lotes por validade (FEFO); número ausente compatível na duplicidade.

## Regras R1–R8: situação
| Regra | Implementada | Testada |
|---|---|---|
| R1 | Sim — `unidades.ts`, conversão em saldo, consumo, preço e importação | Sim |
| R2 | Sim — `importacao.ts` (ausentes → `null`; cada linha validada pelo contrato, inválida reportada com motivo), `financeiro.ts` (itens sem preço), `fmtReais` ("sem preço") | Sim |
| R3 | Sim — `calcularConfianca` na análise; mensagens sem dias com confiança insuficiente | Sim |
| R4 | Sim — alerta estruturado; `gerarMensagem` monta a mensagem a partir dos campos | Sim |
| R5 | Sim — `ordenarAlertas` (nível, depois maior valor envolvido) | Sim |
| R6 | Sim — `analisar` puro, sem persistência; `hoje` é parâmetro | Sim |
| R7 | Sim — toda movimentação aponta para uma `importacao` com origem; `analisar` recusa movimentação sem importação e informa `origens`; toda linha da base traz `SIMULADO`. Falta a UI mostrar a origem (a demonstração usa a base simulada) | Sim (motor) |
| R8 | Sim — `produtos.ts`: sugestão sem unificação automática, alerta de duplicidade (inclusive erro de digitação), recusa de números diferentes | Sim |

## Apoio de IA nesta sessão
- Claude Code escreveu todo o código do motor de análise, a base simulada, o gerador e os testes,
  a partir do `CLAUDE.md` e das instruções da sessão 2 preparadas no Projeto do claude.ai.
- Claude Code registrou as decisões de interpretação em `docs/DECISOES.md` e atualizou o README.
- Claude Code criou o pacote `contrato/` (schemas Zod e testes) e migrou o motor e o importador para ele (adendo).
- Claude Code reescreveu o gerador da base simulada (44 produtos, 12 meses) e refinou a heurística de duplicidade (adendo sem base oficial).
- Pendente: revisão humana do código e dos limites (coluna "Revisão pela equipe" do README).

## Pendências e bloqueios
- Base oficial de dados: Organização não fornecerá a base; confirmação formal pendente.
- Prazo de entrega do repositório: não divulgado.
- Limites dos alertas (`web/src/analise/config.ts`): provisórios, aguardando calibração do Victor.
- Provisionamento: conta Neon e conta Cloudflare a cargo do Leonardo (variáveis de ambiente
  serão fornecidas como secrets do Codespaces, nunca commitadas).
- Nomes de produtos da base simulada: o texto do Anexo III não estava disponível nesta sessão;
  foram usados nomes comuns de insumos para cada categoria. Conferir com o anexo.
- Para o Victor: níveis de cada alerta, prazo de devolução de embalagem (provisório: 365 dias da
  compra) e se adubos sazonais (usados uma vez por safra) devem ficar fora do alerta de item parado.
- Próximas prioridades (CLAUDE.md, seção 9): painel do dono, tela do funcionário, sincronização.
