<!-- Arquivo GERADO por data/simulados/gerar.ts. Não edite à mão: altere o gerador e rode `npm run gerar:simulados`. -->

# Base simulada — situações plantadas

> **DADOS SIMULADOS.** Criados pela equipe Tetrarreme para testar e demonstrar o motor de análise,
> conforme a seção 4.2 do regulamento. Não representam nenhuma propriedade real.
> A organização não fornecerá base oficial: **esta é a base da demonstração**, sempre identificada
> como SIMULADA (R7). Toda linha de `movimentacoes.csv` traz `origem_dados = SIMULADO` e é
> importada com `origem: "simulado"`. Responsáveis pseudonimizados ("Funcionário A" a "D").

- **Arquivo:** `movimentacoes.csv` (separador `;`, decimal `,`, datas `DD/MM/AAAA`).
- **Gerador:** `data/simulados/gerar.ts` — determinístico (semente fixa); `npm run gerar:simulados` na raiz.
- **Data de referência da análise:** 20/10/2026.
- **Período:** 21/10/2025 a 20/10/2026 (12 meses).
- **Volume:** 1753 movimentações, 44 produtos, 8 categorias do Anexo III.
- **Unidades misturadas de propósito (R1):** compras em t, sc 50 kg e L; retiradas em kg e mL.
- **Dados ausentes de propósito (R2):** preço `N/D` em parte das compras de luva, preço `-` em todas
  as compras do conector, validade `-` ou vazia em fertilizantes, corretivos e peças.
- **Padrões de lavoura:** compras grandes de safra (calcário, superfosfato, NPK), defensivos em doses
  fracionadas (mL), sementes que entram e saem em poucas semanas, adubo de plantio (NPK 04-30-16 em
  fevereiro) seguido da cobertura ~25 dias depois (ureia e sulfato de amônio em março).

## Situações plantadas

Uma para cada tipo de alerta da seção 6 do CLAUDE.md. O comentário acima de cada situação, no
gerador, explica como ela foi plantada. Os testes de detecção (`web/test/deteccao.test.ts`)
exigem cada alerta, no nível indicado, analisando a base na data de referência.

| # | Situação | Produto | Alerta esperado | Nível esperado |
|---|---|---|---|---|
| 1 | Saldo de 250 kg, abaixo do mínimo de 1.000 kg, e cobertura de ~5 dias | Cloreto de potássio | estoque_critico | critico |
| 2 | Saldo abaixo do mínimo com só 2 retiradas: mensagem sem número de dias (R3) | Filtro de óleo do motor | estoque_critico | critico |
| 3 | Saldo de 60 L para ~19 dias de consumo | Glifosato 480 | ruptura_prevista | atencao |
| 4 | Lote com 30 L, consumo de ~0,2 L/dia e validade em 31/01/2027: ~9 L em risco | Fungicida azoxistrobina | vencimento | atencao |
| 5 | Lote vencido em 10/10/2026 ainda com 8 doses | Inoculante para soja | vencimento | critico |
| 6 | Retiradas mais frequentes no último mês (preparo de máquinas): 2,5 × o mês anterior | Graxa para rolamentos | consumo_crescente | atencao |
| 7 | Dose semanal de ~250 mL e uma retirada de 2.500 mL em 12/10/2026 | Inseticida lambda-cialotrina | retirada_atipica | atencao |
| 8 | Saldo de 12,3 t para ~300 dias de consumo | Superfosfato simples | excesso | informativo |
| 9 | R$ 19.200 em estoque (2º maior valor) e nenhuma retirada desde 28/06/2026 | Calcário dolomítico | item_parado | informativo |
| 10 | Última compra a R$ 4,10/kg, ~30% acima da média anterior (R$ 3,15/kg) | NPK 04-14-08 | variacao_preco | informativo |
| 11 | Cadastrado à parte de "Ureia": mesmas palavras e sem números diferentes (R8) | UREIA 45% | possivel_duplicidade | atencao |
| 12 | Erro de digitação de "Glifosato 480": uma letra diferente e o mesmo número (R8) | Glifozato 480 | possivel_duplicidade | atencao |
| 13 | Primeiro lote (H24-2603) esgotado em julho; embalagem a devolver | Herbicida 2,4-D | devolucao_embalagem | informativo |

## Alertas secundários esperados

| Produto | Alerta | Nível | Motivo |
|---|---|---|---|
| Inseticida lambda-cialotrina | consumo_crescente | atencao | a retirada atípica de 2,5 L também eleva o consumo dos últimos 30 dias; é efeito real da retirada, não falso positivo |

## Produtos normais (não devem gerar nenhum alerta)

Os testes de falsos positivos exigem que nenhum destes 31 produtos gere alerta.

| Produto | Por que não deve alertar |
|---|---|
| Óleo diesel S10 | Consumo estável (~33 L/dia) com recompra regular; inclui um ajuste de inventário de −20 L |
| Gasolina comum | Consumo semanal estável (roçadeira e motobomba) |
| Óleo lubrificante 15W40 | Troca semanal estável |
| Fluido hidráulico | Reposição estável a cada 10 dias |
| Arla 32 | Consumo estável acompanhando o diesel |
| Luva nitrílica | Consumo estável; algumas compras sem preço ("N/D"), que não viram zero |
| Máscara PFF2 | Consumo estável. "PFF2" tem número: não é confundida com outros EPIs |
| Macacão de proteção | Troca regular a cada 10 dias |
| Óculos de proteção | Troca regular a cada 10 dias |
| Saco de ráfia 60 kg | Consumo estável no galpão |
| Conector para mangueira 16 mm | Consumo estável; nenhuma compra com preço (conta como "sem preço" no resumo financeiro) |
| Registro de esfera 32 mm | Reposição regular |
| Fita gotejadora (rolo) | Reposição regular de rolos na área irrigada |
| Elemento filtrante de ar | Troca regular |
| Bico de pulverização leque 110-02 | Troca semanal estável |
| Lâmina de roçadeira | Troca regular |
| Nitrato de cálcio | Fertirrigação semanal estável |
| Adubo foliar com boro | Aplicação foliar regular |
| Fungicida mancozebe | Uma compra no ano, uso semanal; lote com validade de 3 anos e saldo para ~90 dias |
| Óleo mineral adjuvante | Uma compra no ano, uso semanal junto da calda |
| Bacillus thuringiensis | Biológico comprado em L e retirado em mL (R1); uso regular |
| Trichoderma harzianum | Biológico de uso regular |
| NPK 04-30-16 | Adubo de plantio do milho safrinha (fevereiro); sobra pequena. **Não** é duplicidade de NPK 04-14-08 (números diferentes, R8) |
| Ureia | Adubo de cobertura do milho (~25 dias após o plantio); sobra pequena. O alerta de duplicidade fica no produto cadastrado depois ("UREIA 45%") |
| Sulfato de amônio | Cobertura do milho em março; usado todo (saldo zero) |
| Semente de milho híbrido | Entrou em janeiro e saiu toda no plantio de fevereiro (saldo zero) |
| Semente de feijão | Plantio de maio; saiu toda (saldo zero) |
| Semente de crotalária | Adubação verde semeada em agosto; saiu toda (saldo zero) |
| Semente de soja | Plantio começando: só 2 retiradas, confiança `insuficiente`, então nenhuma estimativa de dias é feita (R3) |
| Gesso agrícola | Comprado e aplicado todo no inverno (saldo zero) |
| Calcário calcítico | Aplicado todo em julho (saldo zero). **Não** é duplicidade de "Calcário dolomítico": só uma palavra em comum (R8) |
