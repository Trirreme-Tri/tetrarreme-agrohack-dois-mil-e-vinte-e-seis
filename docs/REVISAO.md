# Guia de revisão humana

O edital (seção 6) exige que a equipe **compreenda o código, os critérios e as limitações**, e a
banca vai perguntar. Boa parte do código foi escrita com apoio de IA (Claude Code); este guia
organiza a leitura para que cada integrante consiga explicar o próprio trecho.

**Como usar:** cada responsável segue o seu roteiro de 15 minutos, lê as fichas dos seus arquivos,
tenta responder às perguntas **antes** de olhar a resposta e, no fim, marca a caixa de verificação.
A coluna "Revisão pela equipe" do README só deve ser preenchida depois disso, pelos próprios integrantes.

## 1. Mapa de responsáveis

| Responsável | Arquivos |
|---|---|
| **Leonardo** | `web/src/analise/analisar.ts`, `web/src/analise/consumo.ts` |
| **Bryan** | `web/src/analise/detectores/` (11 arquivos) |
| **Wellington** | `contrato/src/index.ts`, `web/src/analise/importacao.ts`, `web/src/analise/produtos.ts` |
| **Victor** | `data/simulados/SITUACOES.md` (gerado por `data/simulados/gerar.ts`), limites do `web/src/analise/config.ts`, `docs/PERGUNTAS_VICTOR.md` |

**Arquivos sem responsável definido** (sugestão; a equipe confirma):

| Arquivo | O que faz | Sugestão |
|---|---|---|
| `web/src/analise/unidades.ts` | Tabela de unidades e conversão; lança erro ao somar massa com volume (R1) | Wellington (dados de entrada) |
| `web/src/analise/mensagens.ts` | Monta a frase de cada alerta a partir dos campos (R4) | Bryan (junto dos detectores) |
| `web/src/analise/financeiro.ts`, `formatacao.ts` | Resumo de valor em estoque com contagem de itens sem preço (R2); "sem preço" e "sem consumo recente" na tela | Bryan |
| `web/src/analise/datas.ts` | Datas como número de dias, sem fuso horário | Leonardo |
| `data/simulados/gerar.ts` | Gera a base simulada e o `SITUACOES.md` | Victor (conteúdo agronômico) + Leonardo (código) |
| `web/test/*.test.ts`, `contrato/test/` | Testes automatizados | Cada um lê os testes dos próprios arquivos |

**Respostas que todo mundo precisa saber dar:**
- *O que o sistema faz?* Lê as movimentações (compras e retiradas) e responde às 7 perguntas do
  edital com alertas priorizados, cada um com números, regra, confiança e recomendação.
- *Usa inteligência artificial para decidir os alertas?* Não. São regras estatísticas simples e
  explicáveis (médias, mediana, comparação com limites). A IA foi usada para **escrever** o código,
  e isso está declarado no README.
- *De onde vêm os dados da demonstração?* Da base **simulada**, criada pela equipe e identificada
  como SIMULADA em toda linha: a organização não fornecerá base oficial.
- *Os limites (7 dias, 180 dias...) vêm de onde?* São provisórios, ficam todos em `config.ts` e
  estão sendo calibrados com o Victor (`PERGUNTAS_VICTOR.md`).

---

## 2. Fichas por arquivo

### Leonardo

#### `web/src/analise/analisar.ts`

**O que faz.** É a porta de entrada do motor: recebe movimentações, produtos e a data de referência
(`hoje`) e devolve alertas ordenados, resumo financeiro, a análise de cada produto, a origem dos
dados e avisos de configuração. Separa as movimentações por produto, resolve os limites de cada um
(`limitesPara`), roda os 10 detectores e ordena o resultado.

**Decisão mais importante.** A função é **pura e determinística**: recebe `hoje` como parâmetro,
não lê o relógio, não grava nada. Chamar de novo com uma movimentação a mais recalcula tudo do zero
(R6) — alerta nunca é guardado como verdade.

**Limitação conhecida.** Recalcula tudo a cada chamada. Para a base simulada (53 produtos, ~2.200
movimentações) leva milissegundos, mas com dezenas de milhares de registros seria preciso calcular
só os produtos alterados.

**Perguntas prováveis da banca**
1. *Se o funcionário registrar uma retirada nova, o que acontece com os alertas?*
   — `analisar` roda de novo com a lista atualizada e os alertas mudam na hora; nada fica "preso" de
   uma análise anterior. Há teste disso (R6, em `conformidade.test.ts`).
2. *Como vocês decidem a ordem dos alertas?*
   — Primeiro pelo nível (crítico, atenção, informativo); dentro do nível, pelo maior valor em
   dinheiro envolvido. Alerta sem preço vai para o fim do nível (`ordenarAlertas`, R5).
3. *Por que `hoje` é parâmetro e não a data do computador?*
   — Para o resultado ser reproduzível: a mesma base, na mesma data, dá sempre os mesmos alertas.
   Isso permite testar e demonstrar com a data de referência da base (20/10/2026).

#### `web/src/analise/consumo.ts`

**O que faz.** Para cada produto calcula o saldo **por lote**, o consumo médio diário, a cobertura
(quantos dias o saldo dura), a confiança da estimativa e o valor em estoque. É a base numérica de
quase todos os alertas.

**Decisão mais importante.** Cobertura = saldo ÷ consumo médio dos últimos 60 dias (ou do histórico,
se for mais curto). A **confiança conta só as retiradas dentro dessa janela** e é calculada na
análise, nunca gravada no registro (R3). Sem consumo na janela, a cobertura é `null` ("sem consumo
recente"), nunca infinita.

**Limitação conhecida.** Média simples: não enxerga sazonalidade (um mês de plantio puxa a média
para cima). Retirada sem lote informado sai do lote que vence primeiro (FEFO), o que pode não ser o
que aconteceu no galpão.

**Perguntas prováveis da banca**
1. *Como o sistema estima que o estoque dura 8 dias?*
   — Soma as retiradas dos últimos 60 dias, divide por 60 para ter o consumo por dia e divide o
   saldo atual por esse consumo.
2. *E se o produto tem pouco histórico?*
   — Com menos de 3 retiradas na janela, a confiança é "insuficiente" e o alerta **não mostra número
   de dias**; diz que não há histórico suficiente (R3).
3. *Como funciona o saldo por lote?*
   — Cada entrada soma no lote dela; cada retirada tira do lote informado ou, sem lote, do que vence
   primeiro. É isso que permite saber qual lote vai vencer sem uso.

**Roteiro de 15 minutos — Leonardo**
1. (3 min) `analisar.ts`: leia `analisar()` de cima a baixo e `ordenarAlertas`.
2. (5 min) `consumo.ts`: `analisarProduto` (consumo, cobertura, confiança) e `calcularLotes` (FEFO).
3. (4 min) `web/test/conformidade.test.ts`: blocos R3 e R6.
4. (3 min) Responda às 6 perguntas acima sem olhar e confira.

- [ ] **Leonardo** — Li, entendi e consigo explicar.

---

### Bryan

Todos os detectores recebem a análise de cada produto já calculada (`consumo.ts`) e os limites já
resolvidos; **nenhum lê a configuração diretamente**. Cada alerta sai com tipo, nível, evidência
(números), regra (com a origem do limite: "limite da categoria Fertilizantes"), confiança,
recomendação e valor envolvido. A frase final é montada em `mensagens.ts` a partir desses campos (R4).

#### `detectores/comum.ts` e `detectores/index.ts`

**O que faz.** `comum.ts` define o contexto dos detectores e as partes repetidas da evidência
(produto, unidade, saldo, consumo, cobertura) e `limiteUsado`, que escreve de qual nível veio o
limite. `index.ts` lista os 10 detectores na ordem em que rodam.

**Decisão mais importante.** Evidência padronizada: todo alerta de cobertura mostra os mesmos
números, e a cobertura em dias é omitida (`null`) quando a confiança é insuficiente.

**Limitação conhecida.** Um detector novo precisa ser registrado à mão em `index.ts`.

**Perguntas prováveis da banca**
1. *Onde o alerta mostra o porquê?* — Na evidência (números) e na regra (critério + origem do limite).
2. *Como incluir um alerta novo?* — Criar o arquivo em `detectores/`, registrar em `index.ts`,
   adicionar o tipo no contrato e a frase em `mensagens.ts`, e plantar um caso na base simulada.
3. *O que é "origem do limite"?* — Diz se o número usado veio do padrão geral, da categoria ou do
   produto; faz parte da justificativa.

#### `detectores/estoqueCritico.ts`

**O que faz.** Avisa (crítico) quando o saldo está no estoque mínimo ou abaixo, ou quando a
cobertura é menor que 7 dias.

**Decisão mais importante.** Pelo mínimo, avisa sempre; pela cobertura, só com histórico suficiente
(sem confiança, não inventa dias).

**Limitação conhecida.** Não considera prazo de entrega do fornecedor.

**Perguntas prováveis**
1. *Qual a diferença entre crítico e ruptura?* — Crítico: menos de 7 dias ou abaixo do mínimo.
   Ruptura: entre 7 e 30 dias.
2. *E se o produto não tem estoque mínimo cadastrado?* — Vale só a regra da cobertura (mínimo
   ausente é `null`, nunca zero).
3. *Qual o valor envolvido?* — O custo estimado de repor 30 dias de consumo.

#### `detectores/rupturaPrevista.ts`

**O que faz.** Avisa (atenção) quando o saldo dura entre 7 e 30 dias.

**Decisão mais importante.** Não repete o alerta se o produto já é crítico pelo estoque mínimo.

**Limitação conhecida.** Mesmo limite para todas as categorias até o Victor calibrar.

**Perguntas prováveis**
1. *Por que 30 dias?* — Valor provisório; está em `PERGUNTAS_VICTOR.md`, pergunta 1.
2. *E produto sem consumo recente?* — Sem cobertura, não há ruptura (fertilizante fora da safra não
   "vai acabar").
3. *Como fica a frase?* — "Ruptura prevista: mantendo o consumo médio recente, o saldo de X poderá
   acabar em aproximadamente N dias."

#### `detectores/vencimento.ts`

**O que faz.** Para cada lote com validade, compara o saldo com o consumo previsto até a validade,
consumindo primeiro os lotes que vencem antes. O que sobra está "em risco". Lote já vencido com
saldo é crítico.

**Decisão mais importante.** O risco é **por lote**, não por produto; lote sem validade nunca é
tratado como vencido (R2).

**Limitação conhecida.** Só olha lotes que vencem nos próximos 180 dias; usa o consumo médio, então
uma safra que ainda vai começar não entra na conta.

**Perguntas prováveis**
1. *Como sabem que vai vencer sem uso?* — Consumo por dia × dias até a validade = o que deve sair;
   o resto do lote está em risco.
2. *E produto sem validade cadastrada?* — Validade ausente é `null` e não gera alerta.
3. *Quando é crítico?* — Lote já vencido ou vencendo em até 30 dias.

#### `detectores/consumoCrescente.ts`

**O que faz.** Compara o consumo dos últimos 30 dias com os 30 anteriores; avisa (atenção) se
passou de 1,5 vez.

**Decisão mais importante.** Exige consumo no período anterior (sem base, não há comparação) e
histórico suficiente.

**Limitação conhecida.** Época de plantio dispara naturalmente; o limite por categoria vai resolver
isso (pergunta 7.1 ao Victor).

**Perguntas prováveis**
1. *Isso responde a qual pergunta do edital?* — "Como o consumo varia ao longo do tempo?" e "há
   mudanças de consumo fora do padrão?".
2. *Uma retirada grande dispara também este alerta?* — Pode disparar; na base simulada isso aparece
   no inseticida e está documentado como alerta secundário esperado.
3. *Por que 1,5?* — Provisório, calibrável na config.

#### `detectores/retiradaAtipica.ts`

**O que faz.** Avisa (atenção) quando uma retirada recente é muito maior que as retiradas
costumeiras do produto: maior que a mediana + 3 × MAD (desvio típico em relação à mediana).

**Decisão mais importante.** Usa mediana e MAD, que não se deixam levar por um valor extremo
(diferente da média). Exige pelo menos 5 retiradas anteriores.

**Limitação conhecida.** Quando todas as doses são iguais, o MAD é zero; usamos um piso de 10% da
mediana para não avisar por qualquer variação mínima.

**Perguntas prováveis**
1. *Por que mediana e não média?* — Uma retirada enorme puxaria a média para cima e esconderia a si
   mesma; a mediana não muda.
2. *Isso é machine learning?* — Não. É uma regra estatística simples e explicável.
3. *Só olha retiradas recentes?* — Sim, as dos últimos 30 dias; anomalias antigas não ficam
   alertando para sempre.

#### `detectores/excesso.ts`

**O que faz.** Avisa (informativo) quando o saldo dá para mais de 180 dias de consumo (365 para
Fertilizantes e Corretivos).

**Decisão mais importante.** Limite maior para insumos de safra, que são comprados uma vez por ano:
sem isso, a compra anual geraria falso alarme nos itens mais caros.

**Limitação conhecida.** Sem consumo recente não há cobertura e o excesso não é avaliado; esse
caso é coberto pelo item parado.

**Perguntas prováveis**
1. *Isso responde a qual pergunta?* — "O que está em excesso?" (pergunta 6 do edital).
2. *Por que o MAP com estoque para 200 dias não gera alerta?* — É insumo de safra; o limite da
   categoria Fertilizantes é 365 dias (provisório).
3. *Qual o valor envolvido?* — O valor do que excede os 180 (ou 365) dias de consumo.

#### `detectores/itemParado.ts`

**O que faz.** Entre os 20% de produtos de maior valor em estoque, avisa (informativo) os que estão
sem retirada há mais de 60 dias (180 para Fertilizantes e Corretivos).

**Decisão mais importante.** Só olha os itens caros: dinheiro parado em item barato não é prioridade.

**Limitação conhecida.** O corte de 20% é relativo: o mesmo produto pode entrar ou sair da lista
conforme os outros estoques mudam.

**Perguntas prováveis**
1. *Por que só os 20% mais caros?* — É onde o dinheiro está concentrado (pergunta 6 do edital).
2. *Produto que nunca teve retirada?* — Conta o tempo desde a primeira entrada.
3. *Calcário parado gera alerta?* — Se ficar mais de 180 dias parado e estiver entre os mais caros,
   sim — é o caso plantado da sobra da safra passada.

#### `detectores/variacaoPreco.ts`

**O que faz.** Compara o preço da última compra (feita nos últimos 60 dias) com a média das
anteriores; avisa (informativo) acima de 20% de diferença.

**Decisão mais importante.** Preço convertido para a unidade base antes de comparar (saco de 50 kg
vs. kg, R1).

**Limitação conhecida.** Exige pelo menos 2 compras anteriores com preço; compras sem preço ficam
fora da conta.

**Perguntas prováveis**
1. *Comparam preço de saco com preço de tonelada?* — Não: tudo vira preço por kg (ou L, ou unidade).
2. *E se a compra veio sem preço?* — Fica fora da média; nunca vira R$ 0,00 (R2).
3. *Por que só a última compra?* — Para o aviso ser sobre uma decisão atual, não histórica.

#### `detectores/possivelDuplicidade.ts`

**O que faz.** Procura pares de produtos cadastrados com nomes parecidos e sem números diferentes
(ex.: "Ureia" × "UREIA 45%", "glifosato" × "glifozato") e avisa (atenção) para alguém confirmar.

**Decisão mais importante.** Só **sugere**: nunca junta produtos sozinho (R8). Números diferentes
(NPK 04-14-08 × NPK 04-30-16) nunca são o mesmo produto.

**Limitação conhecida.** Heurística de texto: um nome muito diferente para o mesmo produto (marca
comercial × princípio ativo) não é detectado.

**Perguntas prováveis**
1. *Os três "filtros" do Anexo III viram duplicidade?* — Não: as outras palavras são diferentes
   ("de óleo do trator", "de disco para irrigação", "para respirador"); há teste disso.
2. *Por que não unificar automaticamente?* — Unir errado mistura saldos e estraga todas as análises;
   a decisão é humana.
3. *Como comparam os nomes?* — Palavra a palavra, tolerando erro de digitação, e exigindo os mesmos
   números.

#### `detectores/devolucaoEmbalagem.ts`

**O que faz.** Quando um lote de defensivo acaba, avisa que a embalagem vazia deve ser devolvida até
1 ano após a compra. O nível sobe conforme o prazo se aproxima: informativo, atenção (≤ 60 dias),
crítico (≤ 15 dias).

**Decisão mais importante.** É um extra sugerido pelo Victor (obrigação legal do produtor), com
prazos provisórios.

**Limitação conhecida.** O sistema não registra a devolução; depois do prazo o alerta some.

**Perguntas prováveis**
1. *Por que esse alerta?* — Devolução de embalagem é obrigação legal; esquecer gera multa.
2. *Como sabem que o lote acabou?* — O saldo do lote chegou a zero.
3. *O prazo de 1 ano é certo?* — Provisório; está em `PERGUNTAS_VICTOR.md`, pergunta 5.

**Roteiro de 15 minutos — Bryan**
1. (2 min) `detectores/comum.ts` e `index.ts`.
2. (6 min) `estoqueCritico.ts`, `vencimento.ts`, `retiradaAtipica.ts` (os três que a banca mais deve perguntar).
3. (4 min) Passe os olhos pelos outros 7 detectores e por `mensagens.ts`.
4. (3 min) `data/simulados/SITUACOES.md`: veja um caso plantado de cada tipo e responda às perguntas sem olhar.

- [ ] **Bryan** — Li, entendi e consigo explicar.

---

### Wellington

#### `contrato/src/index.ts`

**O que faz.** Define, com Zod, o formato de cada dado do sistema (Unidade, Produto, Apelido,
Importação, Movimentação, Alerta) e exporta os tipos. Interface, motor e (futuramente) API usam
essa mesma definição.

**Decisão mais importante.** Um contrato único: o mesmo dado inválido é recusado pelo mesmo motivo
em qualquer lugar. Ausente é `null`, nunca string vazia ou zero (R2); movimentação sem importação
de origem é inválida (R7).

**Limitação conhecida.** Valida o formato, não o significado (uma retirada de 10 t de luva passa
se os campos estiverem certos).

**Perguntas prováveis**
1. *Por que Zod?* — Escreve a regra uma vez e ganha validação e tipos do TypeScript ao mesmo tempo.
2. *O que acontece com uma data 31/02/2026?* — É recusada, com o motivo.
3. *A movimentação tem campo de confiança?* — Não: confiança é calculada na análise (R3).

#### `web/src/analise/importacao.ts`

**O que faz.** Lê planilhas CSV com **mapeamento de colunas configurável** (a coluna "Insumo" do
arquivo pode virar o campo `produto`), converte textos em números, datas e unidades, valida cada
linha com o contrato e pseudonimiza o responsável ("Funcionário A").

**Decisão mais importante.** `""`, `"-"`, `"N/D"`, `"NA"` viram `null`, nunca 0; linha inválida é
**reportada** com número da linha e motivo, nunca descartada em silêncio (R2).

**Limitação conhecida.** Nome desconhecido vira produto novo (com sugestão de unificação, se
parecido); unidade fora da tabela (ex.: "balde") é recusada até alguém cadastrá-la.

**Perguntas prováveis**
1. *E se a base vier com outro formato de colunas?* — Basta mudar o mapeamento; o código não muda.
2. *Preço em branco vira zero?* — Não: vira "sem preço" e o resumo financeiro informa quantos itens
   ficaram sem preço.
3. *Como protegem o nome do funcionário?* — Na importação, cada nome vira "Funcionário A", "B"...
   sempre o mesmo para a mesma pessoa.

#### `web/src/analise/produtos.ts`

**O que faz.** Normaliza nomes (maiúsculas, acentos, pontuação), identifica o produto de um nome
(nome canônico ou apelido confirmado) e sugere possíveis duplicidades.

**Decisão mais importante.** Unificação só com confirmação humana, e **recusada** quando os números
diferem, mesmo se alguém confirmar (`confirmarAlias`, R8).

**Limitação conhecida.** Compara texto; não sabe que uma marca comercial e um princípio ativo são o
mesmo produto.

**Perguntas prováveis**
1. *"UREIA" e "Ureia" são o mesmo produto?* — Sim, diferença só de maiúsculas é o mesmo nome.
   "UREIA 45%" é sugerido como possível duplicidade.
2. *Por que NPK 04-14-08 e 04-30-16 nunca se juntam?* — Números diferentes são formulações
   diferentes.
3. *Como toleram erro de digitação?* — Palavras com até ~20% de diferença contam como iguais
   ("glifozato" × "glifosato").

**Roteiro de 15 minutos — Wellington**
1. (4 min) `contrato/src/index.ts`: `MovimentacaoSchema` e `AlertaSchema`.
2. (5 min) `importacao.ts`: `textoOuNulo`, `numeroOuNulo` e o laço de `importarCsv`.
3. (3 min) `produtos.ts`: `numerosCompativeis`, `similaridadeNomes`, `confirmarAlias`.
4. (3 min) Blocos R2, R7 e R8 em `web/test/conformidade.test.ts`; responda às perguntas sem olhar.

- [ ] **Wellington** — Li, entendi e consigo explicar.

---

### Victor

#### `data/simulados/SITUACOES.md` (gerado por `data/simulados/gerar.ts`)

**O que faz.** Descreve a base simulada da demonstração: 53 produtos (todos os exemplos do Anexo
III), 12 meses de movimentações, as 13 situações plantadas (uma para cada tipo de alerta) e os
produtos normais que não devem gerar alerta. Os testes usam essa lista.

**Decisão mais importante.** Padrões de lavoura realistas: compra anual de fertilizante e corretivo,
adubo de plantio seguido da cobertura ~25 dias depois, defensivos em mL, sementes que entram e
saem em semanas.

**Limitação conhecida.** É simulada: os números foram escolhidos pela equipe e precisam do olhar
agronômico para soarem verdadeiros para a banca.

**Perguntas prováveis**
1. *Os dados são reais?* — Não; são simulados e identificados como SIMULADOS (a organização não
   fornecerá base oficial).
2. *Como sabem que o sistema acerta?* — Cada situação plantada tem um alerta esperado e um teste
   automático; os produtos normais não podem gerar nenhum alerta.
3. *Esse consumo é realista?* — (Victor responde com base na experiência; anotar correções.)

#### Limites do `web/src/analise/config.ts`

**O que faz.** Guarda todos os números que decidem quando avisar, em três níveis: padrão geral →
categoria → produto (o mais específico vale).

**Decisão mais importante.** Fertilizantes e Corretivos já têm limites próprios (excesso > 365 dias,
item parado > 180 dias), porque são comprados uma vez por safra.

**Limitação conhecida.** Todos os valores são provisórios até a calibração.

**Perguntas prováveis**
1. *Por que avisar com 7 dias e não 15?* — Provisório; a calibração está em andamento
   (`PERGUNTAS_VICTOR.md`).
2. *Dá para ter um limite diferente para um produto específico?* — Sim, em `porProduto`, pelo nome.
3. *O alerta diz de onde veio o limite?* — Sim: "limite da categoria Fertilizantes", por exemplo.

#### `docs/PERGUNTAS_VICTOR.md`

**O que faz.** Lista, em linguagem simples, as perguntas de calibração com o valor atual de cada
limite e onde ele muda.

**Decisão mais importante.** Cada resposta tem um destino exato na config, então a calibração não
exige mexer no código (exceto o nível de alguns alertas).

**Limitação conhecida.** O alerta de tempo de armazenamento de sementes ainda não existe; depende da
resposta à pergunta 4.

**Perguntas prováveis**
1. *Quem definiu os critérios agronômicos?* — O Victor, a partir destas perguntas.
2. *Faz sentido avisar excesso de fertilizante?* — Só acima do ciclo da safra; por isso o limite é maior.
3. *Por que a devolução de embalagem é um alerta?* — Obrigação legal do produtor; esquecer gera multa.

**Roteiro de 15 minutos — Victor**
1. (5 min) `SITUACOES.md`: leia a tabela de situações plantadas e a de produtos normais. Algo soa irreal?
2. (5 min) `PERGUNTAS_VICTOR.md`: responda o que já souber.
3. (3 min) `config.ts`: localize os blocos `Fertilizantes` e `Corretivos` em `porCategoria`.
4. (2 min) Responda às perguntas acima sem olhar.

- [ ] **Victor** — Li, entendi e consigo explicar.
