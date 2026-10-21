# Brief para o Claude Design — interface do app de insumos

Cole este texto no Claude Design.

---

Crie a interface de um aplicativo web (PWA) de gestão de insumos para uma propriedade rural em
Rondônia. Projeto mobile-first, com o painel do dono expandindo para desktop. Todo o texto em
português do Brasil simples. Use dados fictícios.

**Duas personas:**

1. **Funcionário** — pessoa com pouca familiaridade com aplicativos, usando o celular no galpão,
   muitas vezes sem internet e sob sol forte. Precisa registrar uma retirada em poucos toques:
   escolher o produto (com foto/ícone grande da embalagem), informar a quantidade (ex.: 200 mL
   de um frasco de 1 L) e o destino. Estilo amigável e convidativo, como apps de aprendizado com
   botões grandes. Nada de telas poluídas.

2. **Dono da propriedade** — quer abrir o app e saber em segundos o que merece atenção.

**Telas:**

1. Início do funcionário: botões grandes "Registrar retirada" e "Registrar entrada".
2. Escolher produto: grade com foto e nome, busca, filtro por categoria (Fertilizantes, Corretivos,
   Sementes, Defensivos e biológicos, Combustíveis e lubrificantes, Peças e manutenção,
   Materiais de irrigação, EPI e diversos).
3. Informar quantidade: teclado numérico grande, unidade visível, saldo atual do produto.
4. Confirmação: "Registrado! Será sincronizado quando houver internet."
5. Painel do dono: alertas agrupados em Crítico (vermelho), Atenção (amarelo) e Informativo (azul),
   cada um com uma frase curta e o valor financeiro envolvido.
6. Detalhe do alerta: a frase completa, a evidência em números, a regra usada, o nível de
   confiança da estimativa e a recomendação. Ex.: "Estoque crítico: mantendo o consumo médio
   recente, o saldo atual poderá ser suficiente por aproximadamente 8 dias."
7. Detalhe do produto: saldo por lote com validade, gráfico de consumo ao longo do tempo,
   histórico de movimentações.
8. Visão financeira: onde está concentrado o valor em estoque, itens parados, e a contagem de
   itens "sem preço" (nunca exibir R$ 0,00 para preço desconhecido).

**Regras visuais:**
- Alvos de toque ≥ 48 px, fontes grandes, alto contraste.
- Sempre ícone + texto, nunca só ícone.
- Indicador permanente de conexão: "Online", "Sem internet — 3 registros aguardando envio",
  "Sincronizando".
- Cor nunca é a única forma de indicar gravidade: use também ícone e rótulo.
- Selo discreto "Dados simulados" quando os dados forem de teste.
- Tema claro e escuro.

