# Perguntas para o Victor — calibração dos alertas

Victor, o aplicativo avisa o produtor quando algo no estoque merece atenção. Para decidir **quando**
avisar, ele usa alguns números que nós chutamos. Precisamos da sua experiência de campo para
acertá-los. Responda do jeito que for mais fácil (pode ser "depende" e explicar do que depende).

**Como ler cada pergunta:**
- **Hoje:** o valor que o aplicativo usa agora (provisório).
- **Onde muda:** só para a equipe de TI saber o que alterar. Todos os números ficam em
  `web/src/analise/config.ts`. Dá para ter um valor geral, um valor por categoria e um valor
  para um produto específico (o mais específico vale).

As 8 categorias são as do Anexo III: Fertilizantes; Corretivos; Sementes; Defensivos e biológicos;
Combustíveis e lubrificantes; Peças e manutenção; Materiais de irrigação; EPI e diversos.

---

## 1. Produto que vai acabar

**1.1. Com quantos dias de antecedência avisar que um produto vai acabar? Muda por categoria?**
(Ex.: diesel acaba rápido e a entrega é fácil; semente pode levar semanas para chegar.)

| Aviso | Hoje | Onde muda |
|---|---|---|
| Aviso **crítico** (vermelho): o estoque dura menos de… | 7 dias, em todas as categorias | `estoqueCritico.coberturaMaximaDias` (em `padrao` ou `porCategoria.<categoria>`) |
| Aviso de **atenção** (amarelo): o estoque dura entre… | 7 e 30 dias, em todas as categorias | `rupturaPrevista.coberturaMinimaDias` e `rupturaPrevista.coberturaMaximaDias` |

| Categoria | Crítico abaixo de (dias) | Atenção abaixo de (dias) |
|---|---|---|
| Fertilizantes | | |
| Corretivos | | |
| Sementes | | |
| Defensivos e biológicos | | |
| Combustíveis e lubrificantes | | |
| Peças e manutenção | | |
| Materiais de irrigação | | |
| EPI e diversos | | |

**1.2. Para saber quanto o produtor gasta por dia, olhamos as retiradas dos últimos 60 dias.
Esse período está bom?** Em safra, talvez 30 dias represente melhor o ritmo atual.
- Hoje: **60 dias** · Onde muda: `janelaConsumoDias`

**Resposta:**

---

## 2. Vencimento

**2.1. Com quantos dias de antecedência avisar que um lote vai vencer sem ser usado? Muda por categoria?**
O aplicativo compara o que sobra no lote com o que deve ser usado até a validade.

| Aviso | Hoje | Onde muda |
|---|---|---|
| Começa a olhar lotes que vencem nos próximos… | 180 dias | `vencimento.horizonteDias` |
| Vira **crítico** quando faltam… | 30 dias (ou já venceu) | `vencimento.diasParaCritico` |

| Categoria | Olhar a partir de (dias antes) | Crítico a partir de (dias antes) |
|---|---|---|
| Sementes | | |
| Defensivos e biológicos | | |
| (outras, se fizer sentido) | | |

**Resposta:**

---

## 3. Fertilizantes e corretivos (insumos de safra)

Você explicou que eles são comprados uma vez por ano e usados ao longo da safra. Por isso já
colocamos valores mais longos para essas duas categorias.

**3.1. A partir de quanto tempo sem nenhuma retirada vale avisar que o produto está parado?**
(O aviso só aparece para os produtos que estão entre os 20% de maior valor em estoque.)
- Hoje: **180 dias** para Fertilizantes e Corretivos; **60 dias** para as outras categorias
- Onde muda: `porCategoria.Fertilizantes.itemParado.diasSemSaida`, `porCategoria.Corretivos.itemParado.diasSemSaida`
  (outras categorias: `itemParado.diasSemSaida` em `padrao`)

**3.2. Quanto estoque é "demais"? Hoje avisamos quando o estoque dá para mais de…**
- Hoje: **365 dias** de consumo para Fertilizantes e Corretivos; **180 dias** para as outras
- Onde muda: `porCategoria.<categoria>.excesso.coberturaMinimaDias`

**3.3. Sobra de safra (ex.: calcário que sobrou do ano passado) deve ser avisada? Depois de quanto tempo?**
- Hoje: avisa se passar de 180 dias sem retirada (mesmo valor da 3.1)

**Resposta:**

---

## 4. Sementes

**4.1. Depois de quantos dias armazenadas vale avisar que a semente pode estar perdendo qualidade
(germinação, vigor)? Muda por cultura (milho, soja, feijão, braquiária)?**
- Hoje: **esse aviso ainda não existe.** O aplicativo só avisa pela data de validade do lote (pergunta 2).
- Onde muda: seria um limite novo (ex.: `sementes.diasArmazenamento`) e um tipo de alerta novo.
  É um dos extras que você sugeriu; com a sua resposta, a equipe de TI implementa.

**4.2. As condições do galpão (calor, umidade) mudam esse prazo de um jeito que dê para usar?**

**Resposta:**

---

## 5. Devolução de embalagem de defensivo

**5.1. O prazo para devolver a embalagem vazia é 1 ano a partir da compra?**
- Hoje: **365 dias** a partir da compra do lote · Onde muda: `devolucaoEmbalagem.prazoDias`

**5.2. Quando o aviso deve ficar mais forte?**

| Aviso | Hoje | Onde muda |
|---|---|---|
| Informativo (azul) | desde que o lote acaba | — |
| Atenção (amarelo) quando faltam… | 60 dias para o prazo | `devolucaoEmbalagem.diasAtencao` |
| Crítico (vermelho) quando faltam… | 15 dias para o prazo | `devolucaoEmbalagem.diasCritico` |

**5.3. Depois que o prazo passa, o aviso deve continuar?** Hoje ele some, porque o aplicativo
não sabe se a embalagem foi devolvida. Vale ter um botão "embalagem devolvida"?

**5.4. Isso vale só para defensivos? E biológicos (Trichoderma, Azospirillum, inoculante)?**
- Hoje: vale para toda a categoria "Defensivos e biológicos" · Onde muda: `globais.categoriasDevolucaoEmbalagem`

**Resposta:**

---

## 6. Preço

**6.1. Qual diferença de preço entre uma compra e as anteriores chama a atenção do produtor?**
- Hoje: **20%** acima ou abaixo da média das compras anteriores · Onde muda: `variacaoPreco.variacaoMinima` (0,2 = 20%)

**6.2. Precisa de quantas compras anteriores para comparar?**
- Hoje: **2** · Onde muda: `variacaoPreco.minimoComprasAnteriores`

**6.3. Fertilizante varia muito de preço com o dólar e a época. Para essa categoria, o limite deve ser maior?**
- Hoje: 20% para todas · Onde muda: `porCategoria.Fertilizantes.variacaoPreco.variacaoMinima`

**Resposta:**

---

## 7. Consumo fora do normal

**7.1. Quando o consumo do último mês deve chamar a atenção?**
- Hoje: quando é **mais de 1,5 vez** o consumo do mês anterior · Onde muda: `consumoCrescente.fatorAumento`
- Em época de plantio isso é normal. Vale aumentar para Fertilizantes, Sementes e Defensivos?

**7.2. Uma única retirada muito grande deve ser avisada?** Hoje avisamos quando a retirada é bem
maior que as retiradas costumeiras daquele produto (precisa de pelo menos 5 retiradas para comparar).
- Onde muda: `retiradaAtipica.multiplicadorMad` (quanto maior, menos avisos) e `retiradaAtipica.minimoSaidas`

**Resposta:**

---

## 8. Nível de cada aviso

**8.1. O nível de cada tipo de aviso está certo?**

| Aviso | Nível hoje | Está certo? Qual seria? |
|---|---|---|
| Estoque crítico (vai acabar em poucos dias ou abaixo do mínimo) | Crítico | |
| Ruptura prevista (vai acabar em algumas semanas) | Atenção | |
| Lote vencido ou vencendo em até 30 dias | Crítico | |
| Lote vencendo depois de 30 dias | Atenção | |
| Consumo em alta | Atenção | |
| Retirada fora do padrão | Atenção | |
| Possível produto duplicado no cadastro | Atenção | |
| Estoque em excesso | Informativo | |
| Item parado | Informativo | |
| Variação de preço | Informativo | |
| Devolução de embalagem | Informativo → Atenção → Crítico (pergunta 5.2) | |

- Onde muda: o nível do vencimento e da embalagem muda pela config (perguntas 2 e 5). Os outros
  níveis estão no código de cada aviso (`web/src/analise/detectores/<aviso>.ts`); se você quiser
  mudar, a equipe de TI passa esses níveis para a config.

**Resposta:**

---

## 9. Quanto histórico é preciso para confiar na estimativa

**9.1. Com poucas retiradas, o aplicativo não mostra "dura X dias" e diz que não há histórico
suficiente. Esses números fazem sentido?**

| Confiança da estimativa | Hoje | Onde muda |
|---|---|---|
| Insuficiente (não mostra dias) | menos de 3 retiradas nos últimos 60 dias | `confianca.saidasInsuficiente` |
| Baixa | menos de 5 retiradas, ou menos de 30 dias de registros | `confianca.saidasBaixa`, `confianca.historicoMinimoDias` |
| Média | menos de 10 retiradas | `confianca.saidasMedia` |
| Alta | 10 retiradas ou mais | — |

**Resposta:**
