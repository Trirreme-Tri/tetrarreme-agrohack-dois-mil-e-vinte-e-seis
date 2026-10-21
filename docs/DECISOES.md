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
