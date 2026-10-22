# CLAUDE.md — Tetrarreme · AGROHACK 2026/2

Este arquivo é a especificação do projeto. Leia inteiro antes de qualquer tarefa.
Em caso de conflito entre um pedido e as **Regras invioláveis**, pare e avise.

## 1. Contexto

- Hackathon AGROHACK 2026/2 (IFRO Campus Ariquemes). Apresentação: **29/10/2026**, na SNCT.
- Banca: Incubadora de Software Ariquemes. Avalia funcionamento, utilidade para o campo e clareza.
- Desafio: **gestão inteligente de insumos em uma propriedade rural**.
- Equipe: Leonardo (responsável, ADS), Bryan (ADS), Wellington (ADS), Victor (Agronomia).
- Idioma: todo texto de interface, mensagens e documentação em **português do Brasil**.

## 2. O problema

O produtor registra compras e retiradas, mas não consegue transformar os registros em decisão.
Consequências: faltas em momentos críticos, produtos vencidos, dinheiro parado e consumo
anormal despercebido. Além disso (relato do Victor), o registro na ponta é falho: quem dá
baixa é o funcionário, no galpão, sem internet, com pouca familiaridade com aplicativos.

**A solução tem duas pontas:** registro fácil e offline (funcionário) e leitura automática
com alertas priorizados e justificados (dono).

**Isto NÃO é um CRUD de estoque.** Cadastro sem análise = "ausência de aderência" =
desclassificação.

## 3. Escopo: as 7 perguntas do edital (seção 4.3)

Toda funcionalidade deve responder a pelo menos uma. Se não responder, é extra ou sai.

1. O que está acabando ou pode acabar em breve (saldo + consumo)?
2. Quais produtos podem vencer antes de serem usados?
3. Como o consumo varia ao longo do tempo?
4. Há retiradas ou mudanças de consumo fora do padrão?
5. Por quanto tempo o estoque deve durar?
6. Onde está concentrado o valor financeiro / o que está em excesso?
7. O que merece atenção imediata, e por quê?

**Fora do escopo:** pecuária, ração, fabricação de ração na fazenda.

**Extras permitidos (vindos do Victor), sem depender da base oficial:** alerta de devolução
de embalagem vazia de defensivo; tempo de armazenamento de sementes; baixa fracionada (mL).

## 4. Regras invioláveis (cada uma tem teste automatizado)

| # | Regra | Implementação obrigatória |
|---|---|---|
| R1 | Unidades diferentes nunca são somadas sem conversão | Tabela `unidade` com `dimensao` (massa, volume, contagem) e `fator_para_base`. Toda quantidade é convertida para a unidade base do produto. Somar dimensões diferentes lança erro. |
| R2 | Ausência de validade ou preço ≠ zero | Campos ausentes são `null`. Na importação, `""`, `"-"`, `"N/D"`, `"NA"` viram `null`, nunca `0`. Todo total financeiro informa quantos itens ficaram sem preço. |
| R3 | Pouco histórico → comunicar incerteza | A confiança é calculada **na análise**, nunca armazenada no registro. Níveis: `alta`, `media`, `baixa`, `insuficiente`. |
| R4 | Todo alerta tem justificativa compreensível | Alerta é um objeto estruturado (ver seção 6). Nenhum campo obrigatório vazio. A mensagem é gerada dos campos. |
| R5 | Alertas priorizados | Três níveis: `critico`, `atencao`, `informativo`. Ordem dentro do nível: maior valor financeiro envolvido. |
| R6 | Atualização → reanálise | Alertas **não são persistidos como verdade**: são sempre recalculados a partir das movimentações. |
| R7 | Dados simulados identificados | Toda movimentação pertence a uma `importacao` com `origem: "simulado" \| "oficial"`. A UI mostra a origem. A demonstração usa a base simulada, sempre identificada como SIMULADA. |
| R8 | Produtos com nomes diferentes | Produto canônico + tabela de apelidos. A unificação é **sugerida** automaticamente e **confirmada** por humano. Nunca unificar quando os números diferem (ex.: `NPK 04-14-08` ≠ `NPK 04-30-16`). Possível duplicidade gera alerta. |

### Conduta (seções 6, 7 e 10 do edital)

- Nunca commitar credenciais, `.env`, tokens nem o comprovante de inscrição.
- O campo "responsável" é **pseudonimizado** ("Funcionário A") antes de entrar no repositório ou na demo.
- A base oficial só entra no repositório se a organização permitir. Até lá: `data/oficial/` no `.gitignore`.
- Uso de IA é declarado no README (seção 8). Ao concluir uma tarefa relevante, registre em `docs/STATUS.md` o que foi feito com apoio de IA.
- Respeite licenças de bibliotecas; registre dependências relevantes no README.

## 5. Modelo de dados

```
unidade        (id, sigla, dimensao, fator_para_base)
produto        (id, nome_canonico, categoria, unidade_base_id, estoque_minimo)
produto_alias  (nome_original, produto_id, confirmado)
importacao     (id, origem, criada_em, arquivo)
movimentacao   (id UUID gerado no cliente, produto_id, nome_original, tipo [entrada|saida|ajuste],
                quantidade, unidade_id, data, preco_unit NULL, lote, validade NULL,
                fornecedor, destino, responsavel_pseudonimo, importacao_id, criado_em, dispositivo)
```

- Movimentações são **append-only**. Correção = nova movimentação do tipo `ajuste`. Nunca editar nem apagar.
- Saldo e validade são acompanhados **por lote** (o risco de vencimento é por lote).
- Categorias (Anexo III): Fertilizantes; Corretivos; Sementes; Defensivos e biológicos;
  Combustíveis e lubrificantes; Peças e manutenção; Materiais de irrigação; EPI e diversos.
- Exemplos de produtos por categoria (Anexo III do edital):

  | Categoria | Exemplos de produtos (Anexo III) |
  |---|---|
  | Fertilizantes | Ureia; KCl; MAP; NPK 04-14-08; NPK 10-10-10; NPK 04-30-16; sulfato de amônio; FTE BR-12 |
  | Corretivos | Calcário dolomítico; gesso agrícola |
  | Sementes | Milho; soja; feijão; braquiária |
  | Defensivos e biológicos | Herbicidas; fungicidas; inseticidas; adjuvante; Trichoderma; Azospirillum; inoculante |
  | Combustíveis e lubrificantes | Óleo diesel S10; óleo de motor; óleo hidráulico; graxa |
  | Peças e manutenção | Filtros; correias; rolamentos; bicos de pulverização; mangueiras; parafusos; discos de corte; eletrodos |
  | Materiais de irrigação | Tubos PVC; mangueira de gotejamento; conectores; filtros; registros |
  | EPI e materiais diversos | Luvas; respiradores; filtros; óculos; aventais; botas; sacos; etiquetas; fitas; estacas |

  No código e no contrato, a última categoria se chama `EPI e diversos`. "Filtros" aparece em três
  categorias e são produtos distintos (nunca sugerir unificação entre eles).
- O importador usa **mapeamento de colunas configurável**: o formato da base oficial ainda é desconhecido.

## 6. Alertas

Estrutura obrigatória:

```ts
type Alerta = {
  tipo: TipoAlerta;            // ver lista abaixo
  nivel: "critico" | "atencao" | "informativo";
  produtoId: string;
  evidencia: Record<string, number | string | null>; // números que sustentam o alerta
  regra: string;               // critério que disparou, em linguagem simples
  confianca: "alta" | "media" | "baixa" | "insuficiente";
  recomendacao: string;        // o que o responsável deve fazer
  mensagem: string;            // gerada a partir dos campos acima
  valorEnvolvido: number | null;
}
```

Exemplo de mensagem (edital): "Estoque crítico: mantendo o consumo médio recente, o saldo atual
poderá ser suficiente por aproximadamente 8 dias."

Tipos e regras iniciais. **Todos os limites são PROVISÓRIOS** e ficam em um único arquivo de
configuração (`web/src/analise/config.ts`), para calibração com o Victor:

| Tipo | Regra inicial |
|---|---|
| `estoque_critico` | saldo ≤ estoque mínimo, ou cobertura < 7 dias |
| `ruptura_prevista` | cobertura entre 7 e 30 dias |
| `vencimento` | por lote: quantidade do lote > consumo projetado até a validade |
| `consumo_crescente` | consumo dos últimos 30 dias > 1,5 × os 30 dias anteriores |
| `retirada_atipica` | saída > mediana + 3 × MAD do produto (exige ≥ 5 saídas) |
| `excesso` | cobertura > 180 dias |
| `item_parado` | valor em estoque no top 20% e sem saída há > 60 dias |
| `variacao_preco` | preço unitário difere > 20% da média das compras anteriores |
| `possivel_duplicidade` | nomes normalizados semelhantes e mesmos números |
| `devolucao_embalagem` (extra) | defensivo com lote zerado: devolver a embalagem (prazo a confirmar com o Victor) |

**Cobertura** = saldo ÷ consumo médio diário recente (janela padrão: 60 dias).
**Confiança:** `insuficiente` < 3 saídas; `baixa` < 5 saídas ou histórico < 30 dias; `media` < 10 saídas; `alta` caso contrário.
Com confiança `insuficiente`, não exibir número de dias: dizer que não há histórico suficiente.

## 7. Stack e arquitetura

- **Frontend:** React + TypeScript + Vite, PWA (vite-plugin-pwa). Mobile-first, responsivo até o desktop.
- **Dados locais:** IndexedDB via Dexie.js. O app funciona 100% sem internet.
- **Motor de análise:** TypeScript puro em `web/src/analise/`, sem dependência de UI ou rede.
  Roda no navegador, portanto os alertas funcionam offline.
- **Sincronização:** fila de saída (outbox) no IndexedDB → `POST /sync` em lote. Idempotente pelo
  UUID da movimentação. Pull incremental por cursor. Sem conflitos de edição (append-only).
- **Backend:** Node + TypeScript com **Hono** (roda em Node e em Cloudflare Workers sem reescrita).
  Responsabilidades: receber/servir movimentações. Não analisa.
- **Banco:** PostgreSQL no Neon. Conexão via `DATABASE_URL` (secret), usando o driver
  serverless do Neon (`@neondatabase/serverless`), compatível com Workers.
- **Hospedagem:** Frontend no Cloudflare Pages; backend no Cloudflare Workers.
- **Testes:** Vitest em todo o projeto (motor de análise obrigatório).
- **Estrutura:** monorepo com npm workspaces (`package.json` na raiz):
  - `contrato/` (`@tetrarreme/contrato`): contrato de dados único — schemas Zod e tipos inferidos
    (`z.infer`) de Unidade, Produto, ProdutoAlias, Importacao, Movimentacao e Alerta (seções 5 e 6).
    Interface, motor e API importam os tipos daqui; nenhum outro pacote os redeclara.
  - `web/`: PWA + motor de análise (`web/src/analise/`).
  - `api/`: sincronização (ainda não criado).
- **Validação:** todo dado que entra (importação de CSV e, futuramente, registro na interface e `POST /sync`)
  é validado pelos schemas do contrato. Registro inválido é reportado com o motivo, nunca corrigido em silêncio (R2).

## 8. Interface

- Duas personas: **funcionário** (registra saída em poucos toques) e **dono** (painel de alertas).
- Botões grandes (alvo de toque ≥ 48 px), alto contraste (uso ao sol), ícone + texto, frases curtas.
- Indicador sempre visível: online/offline e quantas movimentações aguardam sincronização.
- Cada alerta abre mostrando evidência, regra, confiança e recomendação.
- Valor sem preço aparece como "sem preço", nunca "R$ 0,00".
- O design de referência vem do Claude Design e fica em `docs/design/`.

## 9. Prioridades (apresentação em 29/10)

1. Motor de análise + testes de conformidade (R1–R8) + base simulada. **Vale a maior parte da nota.**
2. Painel do dono com alertas priorizados e justificados.
3. Tela de registro do funcionário, gravando no IndexedDB.
4. Sincronização com o backend (demonstrar: registrar offline → reconectar → painel atualizado).
5. Extras do Victor.

## 10. Testes obrigatórios

- **Conformidade:** pelo menos um teste por regra R1–R8.
- **Detecção:** para cada tipo de alerta, um caso plantado na base simulada que deve disparar,
  e um produto normal que **não** deve disparar nada (falsos positivos tiram credibilidade).
- **Reanálise:** inserir uma movimentação e verificar a mudança do alerta.
- A base simulada fica em `data/simulados/`, com um arquivo `SITUACOES.md` listando cada situação
  plantada, o produto e o alerta esperado.
  A base e o `SITUACOES.md` são gerados por `data/simulados/gerar.ts` (semente fixa, `npm run gerar:simulados`).

## 11. Fluxo de trabalho

- O gerenciamento e a revisão de conformidade acontecem fora daqui (Projeto no claude.ai).
- Ao fim de cada sessão de trabalho, atualize `docs/STATUS.md`: o que foi feito, decisões
  tomadas, pendências e o que teve apoio de IA. Esse arquivo é a ponte com a revisão.
- Decisões de arquitetura vão para `docs/DECISOES.md` (data, decisão, motivo).
- Não altere esta especificação sem registrar em `docs/DECISOES.md`.

## 12. Pendências externas

- Base oficial de dados: Organização não fornecerá a base; confirmação formal pendente.
  O importador mantém o mapeamento de colunas configurável (a base pode surgir tarde).
- Prazo de entrega do repositório: não divulgado.
- Limites dos alertas: aguardando calibração do Victor.

