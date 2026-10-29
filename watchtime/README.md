# WATCHTIME

PWA que acompanha preços de relógios nas principais relojoarias do Brasil e mostra as melhores ofertas.

## O que faz

- Todo dia às 8h (horário de Brasília) um robô lê a categoria de relógios de cada loja cadastrada e grava o preço.
- O feed mostra só o que tem sinal de oferta: desconto sobre o preço "de", queda desde a última varredura, menor preço já visto.
- Em cada relógio dá pra criar alerta (qualquer queda, ou abaixo de um valor).
- Notificação push no iPhone (app instalado na tela inicial): resumo diário das ofertas com 25%+ e os alertas que você criou.
- Em Lojas você vê se cada loja respondeu, qual formato funcionou e pode rodar a varredura na hora.

## Como o robô lê as lojas

`adapter: "auto"` tenta, nesta ordem: API de catálogo VTEX, dados `schema.org/Product` embutidos na página (JSON-LD), `products.json` do Shopify. O primeiro que devolver produtos vence; o erro de cada tentativa aparece em Lojas. Para ajustar uma loja, edite `src/lib/stores.ts` (ou a linha da tabela `Store`).

## Deploy (Vercel)

1. Importar o repositório na Vercel (framework Next.js, sem mudar nada).
2. Storage → criar Postgres (Neon ou Prisma Postgres). A Vercel preenche `DATABASE_URL` sozinha.
3. Opcional: `CRON_SECRET` em Environment Variables (protege a rota do cron).
4. Deploy. O build roda `prisma migrate deploy` e cria as tabelas.
5. No iPhone, abrir a URL no Safari → Compartilhar → Adicionar à Tela de Início. Abrir pelo ícone e, em Alertas, tocar em Ativar.

O cron está em `vercel.json` (`0 11 * * *`, UTC = 8h Brasília). No plano Hobby o mínimo é uma vez por dia.

## Desenvolvimento

```
npm install
npm run db:migrate   # precisa de DATABASE_URL no .env
npm run dev
npm test             # vitest: parsers VTEX/Shopify/JSON-LD, dinheiro e pontuação
```
