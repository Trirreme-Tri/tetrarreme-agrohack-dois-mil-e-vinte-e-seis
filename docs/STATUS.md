# STATUS

> Atualizado pelo Claude Code ao fim de cada sessão. Enviado ao Projeto do claude.ai para revisão.

## Última atualização
22/10/2026 — Sessão 3 (ajustes da revisão de conformidade + adendo sobre o `config.ts`)

## Feito nesta sessão
- **Parte 1 — Anexo III:** tabela de exemplos por categoria copiada para o `CLAUDE.md` (seção 5).
  Catálogo do `data/simulados/gerar.ts` refeito com **todos** os 52 exemplos do Anexo (genéricos
  especificados) + 2 extras só para as situações de duplicidade ("UREIA 45%", "Herbicida glifozato 480");
  53 produtos, 2.229 movimentações. Mapa "exemplo do Anexo → produto" exportado (`ANEXO_III`) e
  publicado no `SITUACOES.md`. Os três "filtros" (peças, irrigação, EPI) são produtos distintos e
  nunca sugeridos para unificação (teste). `excesso` plantado passou para o óleo hidráulico e
  `item_parado` para a sobra de calcário da safra passada (superfosfato saiu: não está no Anexo).
- **Parte 2 — origem do limite:** função única `limitesPara(produto, config)` resolve os limites e a
  origem de cada um; os detectores não leem a config (recebem limites por produto e os globais).
  Todo alerta registra na evidência (`origemLimite`) e no fim da regra de qual nível veio o limite
  ("limite da categoria Fertilizantes", "limite do padrão geral", "limite do produto X").
- **Adendo 1 — confiança (R3):** conta só as saídas dentro da janela do consumo médio.
- **Adendo 2 — consumo zero:** cobertura `null` (nunca infinita), exibida como "sem consumo recente"
  (`fmtCobertura`); sem ruptura nem excesso; estoque crítico só pelo mínimo, sem dias.
- **Adendo 3 — chaves órfãs:** `analisar()` devolve `avisosConfiguracao` quando uma chave de
  `porProduto` não corresponde a nenhum produto (separado dos alertas de estoque).
- **Adendo 4 — embalagem:** nível progressivo (informativo; atenção a ≤ 60 dias do prazo; crítico a
  ≤ 15 dias), valores provisórios; a mensagem informa quantos dias faltam.
- **Parte 3 — insumos sazonais:** Fertilizantes e Corretivos com `excesso` > 365 dias e
  `item_parado` > 180 dias (`// PROVISÓRIO — calibrar com o Victor`). Compras anuais normais de MAP
  e gesso na base; testes mostram que sem o ajuste elas seriam falsos alarmes, e que o excesso e o
  item parado plantados continuam disparando.
- **Parte 4:** `docs/PERGUNTAS_VICTOR.md` (9 blocos de perguntas, valor atual e chave da config).
- **Parte 5:** `docs/REVISAO.md` (mapa de responsáveis, ficha por arquivo com 3 perguntas da banca,
  roteiro de 15 minutos e caixa de verificação por pessoa). A coluna "Revisão pela equipe" do
  README **não** foi preenchida.

## Testes
`npm test` na raiz: **170 testes, 170 passaram**.
- `contrato/`: 27 (`contrato.test.ts`).
- `web/`: 143 em 4 arquivos — `conformidade.test.ts` (R1–R8, contrato, filtros), `deteccao.test.ts`
  (13 situações, 40 produtos normais, catálogo do Anexo III, determinismo do gerador),
  `motor.test.ts` (módulos, limites de cada detector, consumo zero, embalagem progressiva),
  `config.test.ts` (três níveis, origem do limite, chaves órfãs, insumos sazonais).

Também passam `npm run typecheck` (contrato e web), `oxlint` (0 avisos) e `vite build`.

## Decisões tomadas (detalhes em `docs/DECISOES.md`)
- Confiança conta só as saídas da janela (substitui a decisão de 21/10).
- Consumo zero: cobertura nula, nunca infinita; sem ruptura nem excesso.
- Avisos de configuração para chaves órfãs de `porProduto`.
- Embalagem com nível progressivo (60 / 15 dias, provisórios).
- Limites sazonais para Fertilizantes e Corretivos (365 / 180 dias, provisórios).
- Base simulada alinhada ao Anexo III; filtros distintos nas três categorias.

## Regras R1–R8: situação
| Regra | Implementada | Testada |
|---|---|---|
| R1 | Sim — `unidades.ts`; conversão em saldo, consumo, preço e importação | Sim |
| R2 | Sim — ausentes → `null` na importação e no contrato; linha inválida reportada com motivo; resumo financeiro conta itens sem preço; "sem preço" e "sem consumo recente" na exibição | Sim |
| R3 | Sim — confiança calculada na análise com as saídas da janela; sem dias quando insuficiente | Sim |
| R4 | Sim — alerta estruturado (validado pelo contrato); mensagem gerada dos campos; regra e evidência informam a origem do limite | Sim |
| R5 | Sim — `ordenarAlertas` (nível, depois maior valor envolvido) | Sim |
| R6 | Sim — `analisar` puro; `hoje` é parâmetro; nada persistido | Sim |
| R7 | Sim — toda movimentação aponta para uma importação com origem; base marcada SIMULADO. Falta a UI mostrar a origem | Sim (motor) |
| R8 | Sim — sugestão sem unificação automática; números diferentes nunca se unem; filtros distintos | Sim |

## Apoio de IA nesta sessão
- Claude Code implementou as partes 1 a 3 e o adendo (código, base simulada e testes) e escreveu
  `PERGUNTAS_VICTOR.md`, `REVISAO.md` e as entradas do `DECISOES.md`, a partir das instruções da
  sessão 3 preparadas no Projeto do claude.ai.
- O `REVISAO.md` foi escrito pela IA para orientar a revisão; as respostas da banca devem ser
  confirmadas por cada responsável ao ler o próprio código.
- Pendente: revisão humana (caixas de verificação do `REVISAO.md` e coluna do README).

## Pendências e bloqueios
- Base oficial de dados: Organização não fornecerá a base; confirmação formal pendente.
- Prazo de entrega do repositório: não divulgado.
- Calibração com o Victor: responder `docs/PERGUNTAS_VICTOR.md` (todos os limites são provisórios).
- Alerta de tempo de armazenamento de sementes (extra do Victor): não implementado; depende da pergunta 4.
- Devolução de embalagem: o modelo não registra a devolução; depois do prazo o alerta some (pergunta 5.3).
- Níveis fixos no código para 8 dos 10 tipos de alerta; passar para a config se o Victor pedir mudanças (pergunta 8).
- Revisão humana: cada integrante seguir o roteiro do `docs/REVISAO.md`.
- Provisionamento: conta Neon e conta Cloudflare a cargo do Leonardo (secrets do Codespaces, nunca commitados).
- Próximas prioridades (CLAUDE.md, seção 9): painel do dono, tela do funcionário, sincronização.
