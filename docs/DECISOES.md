# Decisões de arquitetura

| Data | Decisão | Motivo |
|---|---|---|
| 21/10/2026 | PWA com React + TypeScript, IndexedDB (Dexie) e motor de análise no cliente | Offline-first sem Play Store; alertas funcionam sem internet |
| 21/10/2026 | Backend Node + TypeScript (Hono) apenas para sincronização | Uma linguagem só no projeto; Hono roda em Node e em Cloudflare Workers |
| 21/10/2026 | Frontend no Cloudflare Pages | Hospedagem estática gratuita |
| 21/10/2026 | Banco: Neon (PostgreSQL serverless) | Plano gratuito permanente, sem pausa por inatividade; Postgres padrão |
| 21/10/2026 | Backend: Cloudflare Workers com Hono | Mesma plataforma do frontend (Pages); sem espera de inicialização do plano gratuito do Render |
| 21/10/2026 | Movimentações append-only com UUID gerado no cliente | Sincronização idempotente e sem conflitos de edição |
| 21/10/2026 | CLAUDE.md seção 6: caminho do arquivo de limites corrigido de `src/analise/config.ts` para `web/src/analise/config.ts` | Alinhar com a seção 7, que coloca o motor de análise em `web/src/analise/` |
| 21/10/2026 | CLAUDE.md seção 7: itens **Banco** (Neon + `@neondatabase/serverless`) e **Hospedagem** (backend no Cloudflare Workers) atualizados | Refletir a decisão de infraestrutura acima |
| 21/10/2026 | Motor: nomes que diferem só em maiúsculas, acentos ou pontuação são o mesmo nome; demais variações só geram sugestão | R8: normalização trivial não é unificação semântica |
| 21/10/2026 | Motor: na duplicidade, número ausente em um dos nomes é compatível ("Ureia" × "UREIA 45%"); números presentes devem ser iguais e na mesma ordem | Exemplo do Projeto trata esse par como duplicado; R8 proíbe unir números diferentes |
| 21/10/2026 | Motor: `confirmarAlias` recusa números diferentes mesmo com confirmação humana | R8: "nunca unificar quando os números diferem" |
| 21/10/2026 | Motor: consumo médio = saídas da janela ÷ menor entre 60 dias e o histórico do produto; ajustes não contam como consumo | Produto novo não tem 60 dias de histórico; ajuste é correção, não uso |
| 21/10/2026 | Motor: confiança conta todas as saídas do histórico até a data de análise | Seção 6 fala em "saídas", sem janela |
| 21/10/2026 | Motor: alertas de cobertura (crítico por cobertura, ruptura, excesso) não disparam com confiança `insuficiente`; crítico por estoque mínimo dispara sempre, sem número de dias | Seção 6: com confiança insuficiente, não exibir dias |
| 21/10/2026 | Motor: níveis por tipo — crítico: estoque crítico, lote vencido ou vencendo em até 30 dias; atenção: ruptura, vencimento > 30 dias, consumo crescente, retirada atípica, duplicidade; informativo: excesso, item parado, variação de preço, embalagem | A especificação não define o nível de cada tipo |
| 21/10/2026 | Motor: limites provisórios adicionais em `config.ts` — vencimento só para lotes que vencem em até 180 dias; retirada atípica só nos últimos 30 dias, contra as retiradas anteriores, com MAD mínimo de 10% da mediana; variação de preço só da última compra (últimos 60 dias) e com ≥ 2 compras anteriores | Evitar alertas eternos sobre fatos antigos e alertas espúrios quando todas as doses são iguais; a calibrar com o Victor |
| 21/10/2026 | Motor: retirada sem lote consome primeiro o lote de validade mais próxima (sem validade por último) | Risco de vencimento é por lote; prática usual de almoxarifado |
| 21/10/2026 | Motor: `preco_unit` é por unidade da movimentação; preço do produto = média ponderada das compras; valor do lote usa o preço do próprio lote | Compras chegam em t, sc 50 kg, L; R1 exige conversão também no preço |
| 21/10/2026 | Motor: `valorEnvolvido` por tipo — reposição de 30 dias de consumo (crítico, ruptura), quantidade em risco (vencimento), excedente (excesso), valor parado, diferença de preço × quantidade, soma dos saldos (duplicidade), `null` (embalagem) | R5 ordena por valor, mas a especificação não define o valor de cada tipo |
| 21/10/2026 | Motor: devolução de embalagem com prazo provisório de 365 dias da compra do lote; o alerta fica ativo até o prazo | O modelo de dados não registra a devolução; prazo a confirmar com o Victor |
| 21/10/2026 | Motor: `analisar` ganhou um 4º parâmetro opcional (`config`, `importacoes`) e devolve `origens` | Permitir calibração sem editar código e mostrar a origem dos dados na UI (R7) |
| 21/10/2026 | Importação: nome sem correspondência cria produto novo (unidade base kg, L ou un pela dimensão); estoque mínimo vem na unidade da linha; categoria deve estar no Anexo III; responsável pseudonimizado por padrão | Formato da base oficial desconhecido; conduta exige pseudonimização |
| 21/10/2026 | Base simulada: CSV com `;` e vírgula decimal, coluna `origem_dados = SIMULADO` em toda linha, gerada por script determinístico | Formato comum em planilhas brasileiras; identificação explícita (R7) sem quebrar leitores de CSV |
| 21/10/2026 | Testes do motor em `web/test/` (fora de `src/`) | Testes usam APIs do Node (leitura de arquivo), que não devem entrar no bundle do navegador |
