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
- **Volume:** 2220 movimentações, 53 produtos, 8 categorias do Anexo III.
- **Unidades misturadas de propósito (R1):** compras em t, sc 50 kg e L; retiradas em kg e mL.
- **Dados ausentes de propósito (R2):** preço `N/D` em parte das compras de luva, preço `-` em todas
  as compras do conector, validade `-` ou vazia em fertilizantes, corretivos e peças.
- **Padrões de lavoura:** compras grandes de safra (calcário, MAP, NPK), defensivos em doses
  fracionadas (mL), sementes que entram e saem em poucas semanas, adubo de plantio (NPK 04-30-16 em
  fevereiro) seguido da cobertura ~25 dias depois (ureia e sulfato de amônio em março).

## Catálogo × Anexo III

Todos os exemplos do Anexo III estão na base; os genéricos ("Herbicidas", "Filtros") foram
especificados. Produtos fora desta tabela existem só para manter situações plantadas
("UREIA 45%", "Herbicida glifozato 480").

| Categoria | Exemplo do Anexo III | Produto na base |
|---|---|---|
| Fertilizantes | Ureia | Ureia |
| Fertilizantes | KCl | Cloreto de potássio (KCl) |
| Fertilizantes | MAP | MAP (fosfato monoamônico) |
| Fertilizantes | NPK 04-14-08 | NPK 04-14-08 |
| Fertilizantes | NPK 10-10-10 | NPK 10-10-10 |
| Fertilizantes | NPK 04-30-16 | NPK 04-30-16 |
| Fertilizantes | Sulfato de amônio | Sulfato de amônio |
| Fertilizantes | FTE BR-12 | FTE BR-12 |
| Corretivos | Calcário dolomítico | Calcário dolomítico |
| Corretivos | Gesso agrícola | Gesso agrícola |
| Sementes | Milho | Semente de milho híbrido |
| Sementes | Soja | Semente de soja |
| Sementes | Feijão | Semente de feijão |
| Sementes | Braquiária | Semente de braquiária |
| Defensivos e biológicos | Herbicidas | Herbicida glifosato 480 |
| Defensivos e biológicos | Herbicidas | Herbicida 2,4-D |
| Defensivos e biológicos | Fungicidas | Fungicida azoxistrobina |
| Defensivos e biológicos | Fungicidas | Fungicida mancozebe |
| Defensivos e biológicos | Inseticidas | Inseticida lambda-cialotrina |
| Defensivos e biológicos | Inseticidas | Inseticida biológico Bacillus thuringiensis |
| Defensivos e biológicos | Adjuvante | Adjuvante óleo mineral |
| Defensivos e biológicos | Trichoderma | Trichoderma harzianum |
| Defensivos e biológicos | Azospirillum | Azospirillum brasilense |
| Defensivos e biológicos | Inoculante | Inoculante para soja |
| Combustíveis e lubrificantes | Óleo diesel S10 | Óleo diesel S10 |
| Combustíveis e lubrificantes | Óleo de motor | Óleo de motor 15W40 |
| Combustíveis e lubrificantes | Óleo hidráulico | Óleo hidráulico |
| Combustíveis e lubrificantes | Graxa | Graxa para rolamentos |
| Peças e manutenção | Filtros | Filtro de óleo do trator |
| Peças e manutenção | Correias | Correia do alternador |
| Peças e manutenção | Rolamentos | Rolamento 6205 |
| Peças e manutenção | Bicos de pulverização | Bico de pulverização leque 110-02 |
| Peças e manutenção | Mangueiras | Mangueira hidráulica 1/2 pol |
| Peças e manutenção | Parafusos | Parafuso sextavado M12 |
| Peças e manutenção | Discos de corte | Disco de corte para esmerilhadeira |
| Peças e manutenção | Eletrodos | Eletrodo de solda 2,5 mm |
| Materiais de irrigação | Tubos PVC | Tubo PVC 50 mm |
| Materiais de irrigação | Mangueira de gotejamento | Mangueira de gotejamento 16 mm |
| Materiais de irrigação | Conectores | Conector de linha 16 mm |
| Materiais de irrigação | Filtros | Filtro de disco para irrigação |
| Materiais de irrigação | Registros | Registro de esfera 32 mm |
| EPI e diversos | Luvas | Luva nitrílica |
| EPI e diversos | Respiradores | Respirador PFF2 |
| EPI e diversos | Filtros | Filtro para respirador |
| EPI e diversos | Óculos | Óculos de proteção |
| EPI e diversos | Aventais | Avental impermeável |
| EPI e diversos | Botas | Bota de borracha |
| EPI e diversos | Sacos | Saco de ráfia 60 kg |
| EPI e diversos | Etiquetas | Etiqueta de identificação |
| EPI e diversos | Fitas | Fita de sinalização |
| EPI e diversos | Estacas | Estaca de madeira |

## Situações plantadas

Uma para cada tipo de alerta da seção 6 do CLAUDE.md. O comentário acima de cada situação, no
gerador, explica como ela foi plantada. Os testes de detecção (`web/test/deteccao.test.ts`)
exigem cada alerta, no nível indicado, analisando a base na data de referência.

| # | Situação | Produto | Alerta esperado | Nível esperado |
|---|---|---|---|---|
| 1 | Saldo de 250 kg, abaixo do mínimo de 1.000 kg, e cobertura de ~5 dias | Cloreto de potássio (KCl) | estoque_critico | critico |
| 2 | Saldo abaixo do mínimo com só 2 retiradas: mensagem sem número de dias (R3) | Filtro de óleo do trator | estoque_critico | critico |
| 3 | Saldo de 60 L para ~19 dias de consumo | Herbicida glifosato 480 | ruptura_prevista | atencao |
| 4 | Lote com 30 L, consumo de ~0,2 L/dia e validade em 31/01/2027: ~9 L em risco | Fungicida azoxistrobina | vencimento | atencao |
| 5 | Lote vencido em 10/10/2026 ainda com 8 doses | Inoculante para soja | vencimento | critico |
| 6 | Retiradas mais frequentes no último mês (preparo de máquinas): 2,5 × o mês anterior | Graxa para rolamentos | consumo_crescente | atencao |
| 7 | Dose semanal de ~250 mL e uma retirada de 2.500 mL em 12/10/2026 | Inseticida lambda-cialotrina | retirada_atipica | atencao |
| 8 | Compra de 1.000 L para ~2 L/dia de consumo: saldo para mais de um ano | Óleo hidráulico | excesso | informativo |
| 9 | Sobra da safra passada: 80 t (R$ 19.200) sem retirada desde 16/12/2025 | Calcário dolomítico | item_parado | informativo |
| 10 | Última compra a R$ 4,10/kg, ~30% acima da média anterior (R$ 3,15/kg) | NPK 04-14-08 | variacao_preco | informativo |
| 11 | Cadastrado à parte de "Ureia": mesmas palavras e sem números diferentes (R8) | UREIA 45% | possivel_duplicidade | atencao |
| 12 | Erro de digitação de "Herbicida glifosato 480": uma letra diferente e o mesmo número (R8) | Herbicida glifozato 480 | possivel_duplicidade | atencao |
| 13 | Primeiro lote (H24-2603) esgotado em julho; embalagem a devolver | Herbicida 2,4-D | devolucao_embalagem | informativo |

## Alertas secundários esperados

| Produto | Alerta | Nível | Motivo |
|---|---|---|---|
| Inseticida lambda-cialotrina | consumo_crescente | atencao | a retirada atípica de 2,5 L também eleva o consumo dos últimos 30 dias; é efeito real da retirada, não falso positivo |

## Produtos normais (não devem gerar nenhum alerta)

Os testes de falsos positivos exigem que nenhum destes 40 produtos gere alerta.

| Produto | Por que não deve alertar |
|---|---|
| Óleo diesel S10 | Consumo estável (~33 L/dia) com recompra regular; inclui um ajuste de inventário de −20 L |
| Óleo de motor 15W40 | Troca semanal estável |
| Luva nitrílica | Consumo estável; algumas compras sem preço ("N/D"), que não viram zero |
| Respirador PFF2 | Consumo estável |
| Filtro para respirador | Troca semanal. Um dos três "filtros" do Anexo III: produto distinto, **não** é duplicidade dos outros dois (R8) |
| Óculos de proteção | Troca regular a cada 10 dias |
| Avental impermeável | Troca regular a cada 10 dias |
| Bota de borracha | Reposição regular para a equipe |
| Saco de ráfia 60 kg | Consumo estável no galpão |
| Etiqueta de identificação | Consumo estável (identificação de lotes e sacarias) |
| Fita de sinalização | Rolo trocado a cada 10 dias |
| Estaca de madeira | Reposição estável |
| Tubo PVC 50 mm | Reposição regular de barras |
| Mangueira de gotejamento 16 mm | Reposição regular de rolos na área irrigada |
| Conector de linha 16 mm | Consumo estável; nenhuma compra com preço (conta como "sem preço" no resumo financeiro) |
| Filtro de disco para irrigação | Troca regular. Um dos três "filtros" do Anexo III: produto distinto, **não** é duplicidade dos outros dois (R8) |
| Registro de esfera 32 mm | Reposição regular |
| Correia do alternador | Troca regular |
| Rolamento 6205 | Troca regular |
| Bico de pulverização leque 110-02 | Troca semanal estável |
| Mangueira hidráulica 1/2 pol | Troca regular. **Não** é duplicidade da mangueira de gotejamento (palavras e números diferentes) |
| Parafuso sextavado M12 | Consumo estável na oficina |
| Disco de corte para esmerilhadeira | Consumo estável na oficina |
| Eletrodo de solda 2,5 mm | Consumo regular na oficina |
| Fungicida mancozebe | Uma compra no ano, uso semanal; lote com validade de 3 anos e saldo para ~90 dias |
| Adjuvante óleo mineral | Uma compra no ano, uso semanal junto da calda |
| Inseticida biológico Bacillus thuringiensis | Biológico comprado em L e retirado em mL (R1); uso regular |
| Trichoderma harzianum | Biológico de uso regular |
| Azospirillum brasilense | Biológico comprado em L e retirado em mL (R1); uso regular |
| NPK 04-30-16 | Adubo de plantio do milho safrinha (fevereiro); usado todo (saldo zero). **Não** é duplicidade de NPK 04-14-08 (números diferentes, R8) |
| FTE BR-12 | Micronutrientes aplicados com o adubo de plantio (fevereiro); usado todo (saldo zero) |
| Ureia | Adubo de cobertura do milho (~25 dias após o plantio); sobra pequena. O alerta de duplicidade fica no produto cadastrado depois ("UREIA 45%") |
| Sulfato de amônio | Cobertura do milho em março; usado todo (saldo zero) |
| NPK 10-10-10 | Uso semanal na horta e no pomar (fora da lavoura), com recompra em sacos de 50 kg |
| MAP (fosfato monoamônico) | Adubo de plantio da soja de 2025; usado todo (saldo zero) |
| Gesso agrícola | Comprado e aplicado todo no inverno (saldo zero) |
| Semente de milho híbrido | Entrou em janeiro e saiu toda no plantio de fevereiro (saldo zero) |
| Semente de feijão | Plantio de maio; saiu toda (saldo zero) |
| Semente de braquiária | Planta de cobertura (palhada para plantio direto), semeada em agosto; saiu toda (saldo zero) |
| Semente de soja | Plantio começando: só 2 retiradas, confiança `insuficiente`, então nenhuma estimativa de dias é feita (R3) |
