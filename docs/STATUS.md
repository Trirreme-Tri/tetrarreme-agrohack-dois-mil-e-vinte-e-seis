# STATUS

> Atualizado pelo Claude Code ao fim de cada sessão. Enviado ao Projeto do claude.ai para revisão.

## Última atualização
23/10/2026 — Sessão 4 (ajustes do motor, dados locais e interface)

## Feito nesta sessão
- **Parte 1 — motor:**
  - `avisosDados` (saldo negativo no total ou em lote), separado dos alertas;
  - `excesso` sem consumo: cobertura nula e saldo > 10 × estoque mínimo (PROVISÓRIO), nova situação
    plantada (lâmina de roçadeira); 40 normais e compras sazonais continuam sem alerta;
  - resumo financeiro com uma definição só: `valorConhecido`, `itensSemPreco`, `lotesComPrecoMedio`, `estimado`;
  - `serieDoProduto`: consumo por mês e por semana e série do saldo com entradas (pergunta 3);
  - confiança `fato` no contrato (lote vencido, duplicidade, embalagem, variação de preço, excesso sem consumo);
  - evidência de reposição (30 dias) e frase curta dos cartões (`gerarResumo`) geradas no motor;
  - ordem estável das movimentações no mesmo dia (entradas, ajustes, saídas) e alerta de duplicidade
    no produto que apareceu por último — o IndexedDB não devolve na ordem do arquivo.
- **Parte 2 — dados locais (Dexie):** tabelas do contrato + `decisoes_duplicidade`, `cadastro`,
  `preferencias`; carga inicial da base simulada com **deslocamento de datas** (base termina hoje);
  registros com data real, validados pelo contrato e nunca bloqueados por saldo; "Sim, é o mesmo"
  grava apelido confirmado (unificação na análise, sem editar registros); "Não, são diferentes"
  persiste; perfil, funcionário e tema guardados no aparelho; botão "Recarregar dados simulados".
- **Parte 3 — interface (Monitora):** painel do dono (celular e computador, filtro por categoria,
  painel vazio, avisos de dados), detalhe do alerta (evidência, regra com origem do limite,
  confiança, recomendação, botões de duplicidade), fluxo do funcionário (perfil → quem → início →
  produto → quantidade → destino → registrado), registrar entrada (lote, validade DD/MM/AAAA,
  "não tem validade", preço opcional), detalhe do produto (lotes, consumo por mês/semana, saldo,
  retirada atípica destacada), resumo financeiro, lista de produtos com alerta primeiro. Temas claro
  e escuro, fontes locais, PWA (verificado offline), selo "Dados simulados", indicador de conexão.
- **Parte 4 — testes:** integração com fake-indexeddb + Testing Library (carga inicial = alertas do
  motor; reanálise do glifosato ruptura → crítico pelo fluxo do funcionário; "Não, são diferentes"
  persiste após recarregar); deslocamento de datas (base deslocada = mesmos alertas).
- **Parte 5 — publicação:** `npm run build` gera `web/dist`; README (seções 2, 3, 4 e 8) com o passo a
  passo do Cloudflare Pages.
- Capturas de tela em `docs/capturas/` (16 imagens).

## Testes
`npm test` na raiz: **206 testes, 206 passaram**.
- `contrato/`: 28.
- `web/`: 178 em 7 arquivos — `conformidade`, `deteccao` (14 situações, 40 normais), `motor`,
  `config`, `avisos-financeiro-serie`, `dados` (Dexie + deslocamento), `interface` (jsdom).

Também passam `npm run typecheck`, `oxlint` (0 avisos) e `npm run build`.

## Decisões tomadas (detalhes em `docs/DECISOES.md`, 23/10/2026)
- Deslocamento de datas da base simulada na carga; "hoje" = data local do aparelho.
- Registros do aparelho na importação "registros no aparelho", origem `simulado`.
- Valor estimado com definição única; confiança `fato`; excesso sem consumo (10 × mínimo, provisório).
- Design só como referência visual; números sempre do motor; ordem dos alertas pela R5.
- PWA com Workbox; Cloudflare Pages (`web/dist`, Node 24).

## Regras R1–R8: situação
| Regra | Implementada | Testada |
|---|---|---|
| R1 | Sim — conversão em saldo, consumo, preço, importação e registro (unidade de outra dimensão é recusada) | Sim |
| R2 | Sim — ausentes `null`; "Sem preço" e "sem consumo recente" na tela; valor estimado explicado | Sim |
| R3 | Sim — confiança pela janela; sem dias com histórico insuficiente (motor e frase curta) | Sim |
| R4 | Sim — mensagem, frase curta e evidência geradas dos campos; origem do limite na tela | Sim |
| R5 | Sim — painel na ordem do motor (testado na integração) | Sim |
| R6 | Sim — cada registro dispara nova análise; painel atualiza (teste de integração) | Sim |
| R7 | Sim — origem em toda movimentação; selo "Dados simulados" sempre visível | Sim |
| R8 | Sim — confirmação humana persistente; "diferente" não volta; números diferentes nunca unem | Sim |

## Apoio de IA nesta sessão
- Claude Code implementou as partes 1 a 5 (motor, dados locais, interface, testes, publicação) a partir
  do `CLAUDE.md`, do design do Claude Design e das instruções da sessão 4, e gerou as capturas.
- A interface foi comparada com capturas do protótipo; as divergências estão listadas na resposta da
  sessão e resumidas abaixo.
- Pendente: revisão humana (`docs/REVISAO.md` ainda não cobre `web/src/dados/` e a interface).

## Pendências e bloqueios
- Publicar no Cloudflare Pages (Leonardo conecta o repositório) e preencher o link no README.
- Sincronização com o backend (Hono + Neon): sessão 5.
- Divergências do design ainda abertas: "Marcar como visto" não implementado; detalhe do alerta no
  computador abre no lugar da lista (não ao lado); sem estado "Sincronizando".
- Calibração com o Victor (`docs/PERGUNTAS_VICTOR.md`), incluindo o novo limite de excesso sem consumo.
- Atualizar `docs/REVISAO.md` com os novos arquivos (dados locais e interface).
- Base oficial: não será fornecida (confirmação formal pendente). Prazo de entrega: não divulgado.
