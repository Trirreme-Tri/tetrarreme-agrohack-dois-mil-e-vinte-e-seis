# Base simulada — situações plantadas

> **DADOS SIMULADOS.** Criados pela equipe Tetrarreme para testar o motor de análise,
> conforme a seção 4.2 do regulamento. Não representam nenhuma propriedade real.
> Toda linha de `movimentacoes.csv` traz `origem_dados = SIMULADO` e é importada com
> `origem: "simulado"` (R7). Responsáveis pseudonimizados ("Funcionário A/B/C").

- **Arquivo:** `movimentacoes.csv` (separador `;`, decimal `,`, datas `DD/MM/AAAA`).
- **Gerador:** `web/scripts/gerar-simulados.ts` (determinístico; rodar com `node scripts/gerar-simulados.ts` dentro de `web/`).
- **Data de referência da análise:** 20/10/2026.
- **Período:** 20/09/2025 a 19/10/2026, 21 produtos, 8 categorias do Anexo III.
- **Unidades misturadas de propósito (R1):** compras em t, sc 50 kg e L; retiradas em kg e mL.
- **Dados ausentes de propósito (R2):** preço `N/D` (luva), preço `-` em todas as compras do
  conector, validade `-` ou vazia em fertilizantes e peças.

## Situações plantadas

Os testes de detecção (`web/test/deteccao.test.ts`) leem esta tabela: cada linha deve
disparar o alerta no nível indicado.

| # | Situação | Produto | Alerta esperado | Nível esperado |
|---|---|---|---|---|
| 1 | Saldo de 250 kg, abaixo do mínimo de 1.000 kg, e cobertura de ~5 dias | Cloreto de potássio | estoque_critico | critico |
| 2 | Saldo abaixo do mínimo com só 2 retiradas: mensagem sem número de dias (R3) | Filtro de óleo do motor | estoque_critico | critico |
| 3 | Saldo de 60 L para ~18 dias de consumo | Glifosato 480 | ruptura_prevista | atencao |
| 4 | Lote com 30 L, consumo de ~0,2 L/dia e validade em 31/01/2027: ~9 L em risco | Fungicida azoxistrobina | vencimento | atencao |
| 5 | Lote vencido em 10/10/2026 ainda com 8 doses | Inoculante para soja | vencimento | critico |
| 6 | Retiradas mais frequentes no último mês (preparo de máquinas): 2,6 × o mês anterior | Graxa para rolamentos | consumo_crescente | atencao |
| 7 | Dose semanal de ~250 mL e uma retirada de 2.500 mL em 12/10/2026 | Inseticida lambda-cialotrina | retirada_atipica | atencao |
| 8 | Saldo de 12,3 t para ~300 dias de consumo | Superfosfato simples | excesso | informativo |
| 9 | R$ 19.200 em estoque (maior valor) e nenhuma retirada desde junho | Calcário dolomítico | item_parado | informativo |
| 10 | Última compra a R$ 4,10/kg, ~30% acima da média anterior (R$ 3,15/kg) | NPK 04-14-08 | variacao_preco | informativo |
| 11 | Cadastrado à parte de "Ureia": nomes iguais e sem números diferentes (R8) | UREIA 45% | possivel_duplicidade | atencao |
| 12 | Primeiro lote (H24-2603) esgotado em julho; embalagem a devolver | Herbicida 2,4-D | devolucao_embalagem | informativo |

**Alerta secundário esperado:** a retirada atípica do inseticida (situação 7) também eleva o
consumo dos últimos 30 dias, então ele recebe `consumo_crescente` (atenção). É um efeito real
da retirada, não um falso positivo.

## Produtos normais (não devem gerar nenhum alerta)

Os testes de falsos positivos leem esta tabela.

| Produto | Por que não deve alertar |
|---|---|
| Óleo diesel S10 | Consumo estável (~33 L/dia), recompra regular; cobertura entre 30 e 180 dias |
| Óleo lubrificante 15W40 | Troca semanal estável; cobertura entre 30 e 180 dias |
| Luva nitrílica | Consumo estável; algumas compras sem preço (`N/D`), que não viram zero |
| Conector para mangueira 16 mm | Consumo estável; nenhuma compra com preço (conta como "sem preço" no resumo financeiro) |
| NPK 04-30-16 | Adubo de plantio do milho safrinha (fevereiro); sobra pequena. **Não** é duplicidade de NPK 04-14-08 (números diferentes, R8) |
| Ureia | Adubo de cobertura do milho (~25 dias após o plantio); sobra pequena. O alerta de duplicidade fica no produto cadastrado depois ("UREIA 45%") |
| Semente de milho híbrido | Entrou em janeiro e saiu toda no plantio de fevereiro (saldo zero) |
| Semente de soja | Plantio começando: só 2 retiradas, confiança `insuficiente`, então nenhuma estimativa de dias é feita |
| Gesso agrícola | Comprado e aplicado todo no inverno (saldo zero) |
