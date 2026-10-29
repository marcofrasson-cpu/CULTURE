import { prisma } from "./db";
import type { Prisma } from "@/generated/prisma/client";
import { scrapeStore } from "./scrape";
import type { ScrapedProduct } from "./scrape/types";
import { MIN_PUSH_DISCOUNT, discountPct, scoreDeal } from "./score";
import { PUBLIC_HOST, SEED_STORES, STORE_GROUP } from "./stores";
import { sendToAll } from "./push";
import { brl } from "./money";

export type StoreResult = { slug: string; adapter?: string; found: number; changed: number; error?: string };

/** Garante que as lojas iniciais existem (não sobrescreve edições). */
export async function ensureSeedStores() {
  for (const s of SEED_STORES) {
    const { slug, ...rest } = s;
    await prisma.store.upsert({ where: { slug }, update: { ...rest, enabled: true }, create: { slug, ...rest } });
  }
  await prisma.store.updateMany({
    where: { slug: { notIn: SEED_STORES.map((s) => s.slug) } },
    data: { enabled: false },
  });
}

export async function scanAll(opts: { onlySlug?: string } = {}): Promise<StoreResult[]> {
  await ensureSeedStores();
  const stores = await prisma.store.findMany({
    where: { enabled: true, ...(opts.onlySlug ? { slug: opts.onlySlug } : {}) },
    orderBy: { name: "asc" },
  });
  const results: StoreResult[] = [];
  const newDeals: { name: string; price: number; pct: number; store: string }[] = [];
  const watchHits: { productId: string; name: string; price: number }[] = [];

  // 3 lojas por vez: cabe nos 300 s da função mesmo com 2500 itens por loja.
  const queue = [...stores];
  const busyGroups = new Set<string>();
  const next = () => {
    const i = queue.findIndex((s) => !busyGroups.has(STORE_GROUP[s.slug] ?? s.slug));
    if (i < 0) return undefined;
    const [s] = queue.splice(i, 1);
    busyGroups.add(STORE_GROUP[s.slug] ?? s.slug);
    return s;
  };
  const worker = async () => {
    for (let store = next(); store; store = next()) {
      const run = await prisma.scanRun.create({ data: { storeId: store.id } });
      try {
        const { adapter, products } = await scrapeStore(store);
        const host = PUBLIC_HOST[store.slug];
        if (host) for (const p of products) p.url = p.url.replace(/^https?:\/\/[^/]+/, `https://${host}`);
        const { changed, deals, hits } = await persist(store.id, products);
        newDeals.push(...deals.map((d) => ({ ...d, store: store.name })));
        watchHits.push(...hits);
        await prisma.scanRun.update({
          where: { id: run.id },
          data: { finishedAt: new Date(), adapter, found: products.length, changed },
        });
        results.push({ slug: store.slug, adapter, found: products.length, changed });
      } catch (e) {
        const error = (e instanceof Error ? e.message : String(e)).slice(0, 900);
        await prisma.scanRun.update({ where: { id: run.id }, data: { finishedAt: new Date(), error } });
        results.push({ slug: store.slug, found: 0, changed: 0, error });
      } finally {
        busyGroups.delete(STORE_GROUP[store.slug] ?? store.slug);
      }
    }
  };
  await Promise.all([worker(), worker(), worker()]);

  await notify(newDeals, watchHits);
  return results;
}

export async function persist(storeId: string, products: ScrapedProduct[]) {
  let changed = 0;
  const deals: { name: string; price: number; pct: number }[] = [];
  const hits: { productId: string; name: string; price: number }[] = [];
  const now = new Date();

  // Uma consulta por loja em vez de uma por produto: 13 mil idas ao banco viravam minutos.
  const existingRows = await prisma.product.findMany({ where: { storeId }, include: { watches: true } });
  const existing = new Map(existingRows.map((r) => [r.externalId, r]));

  const toCreate: Prisma.ProductCreateManyInput[] = [];
  const unchangedIds: string[] = [];

  for (const p of products) {
    const listPrice = p.listPrice ?? null;
    const row = existing.get(p.externalId);

    if (!row) {
      const score = scoreDeal({ price: p.price, listPrice, minPrice: p.price, prevPrice: null });
      toCreate.push({
        storeId,
        externalId: p.externalId,
        url: p.url,
        name: p.name,
        brand: p.brand ?? null,
        image: p.image ?? null,
        price: p.price,
        listPrice,
        minPrice: p.price,
        maxPrice: listPrice ?? p.price,
        available: p.available,
        gender: p.gender ?? null,
        caseMm: p.caseMm ?? null,
        score,
      });
      const pct = discountPct(p.price, listPrice);
      if (pct >= MIN_PUSH_DISCOUNT) deals.push({ name: p.name, price: p.price, pct });
      continue;
    }

    const priceChanged = row.price !== p.price || (row.listPrice ?? null) !== listPrice;
    const metaChanged =
      row.available !== p.available ||
      (p.gender != null && row.gender !== p.gender) ||
      (p.caseMm != null && row.caseMm !== p.caseMm) ||
      (p.brand != null && row.brand !== p.brand) ||
      row.url !== p.url;

    if (!priceChanged && !metaChanged) {
      unchangedIds.push(row.id);
      continue;
    }

    const minPrice = Math.min(row.minPrice, p.price);
    const maxPrice = Math.max(row.maxPrice, listPrice ?? p.price);
    const prevPrice = priceChanged ? row.price : row.prevPrice;
    const score = scoreDeal({ price: p.price, listPrice, minPrice, prevPrice });

    await prisma.product.update({
      where: { id: row.id },
      data: {
        url: p.url,
        name: p.name,
        brand: p.brand ?? row.brand,
        image: p.image ?? row.image,
        price: p.price,
        listPrice,
        minPrice,
        maxPrice,
        prevPrice,
        available: p.available,
        gender: p.gender ?? row.gender,
        caseMm: p.caseMm ?? row.caseMm,
        lastSeenAt: now,
        lastChangeAt: priceChanged ? now : row.lastChangeAt,
        score,
        ...(priceChanged ? { history: { create: { price: p.price, listPrice } } } : {}),
      },
    });

    if (priceChanged) {
      changed++;
      const dropped = p.price < row.price;
      const pct = discountPct(p.price, listPrice);
      if (dropped && pct >= MIN_PUSH_DISCOUNT) deals.push({ name: p.name, price: p.price, pct });
      const w = row.watches[0];
      if (w && dropped && (w.targetPrice == null || p.price <= w.targetPrice)) {
        hits.push({ productId: row.id, name: p.name, price: p.price });
        await prisma.watch.update({ where: { id: w.id }, data: { notifiedAt: now } });
      }
    }
  }

  // Novos: insere em lote e abre o histórico de cada um.
  for (let i = 0; i < toCreate.length; i += 500) {
    const created = await prisma.product.createManyAndReturn({ data: toCreate.slice(i, i + 500), select: { id: true, price: true, listPrice: true } });
    await prisma.priceHistory.createMany({ data: created.map((c) => ({ productId: c.id, price: c.price, listPrice: c.listPrice })) });
  }
  // Sem mudança: só marca que foi visto hoje.
  for (let i = 0; i < unchangedIds.length; i += 2000) {
    await prisma.product.updateMany({ where: { id: { in: unchangedIds.slice(i, i + 2000) } }, data: { lastSeenAt: now } });
  }
  // Sumiu do catálogo da loja: sai do feed.
  await prisma.product.updateMany({ where: { storeId, available: true, lastSeenAt: { lt: now } }, data: { available: false } });

  return { changed, deals, hits };
}

async function notify(
  deals: { name: string; price: number; pct: number; store: string }[],
  hits: { productId: string; name: string; price: number }[],
) {
  for (const h of hits) {
    await sendToAll({
      title: "Baixou: " + h.name,
      body: `Agora ${brl(h.price)}`,
      url: `/p/${h.productId}`,
      tag: `watch-${h.productId}`,
    });
  }
  if (deals.length > 0) {
    const top = [...deals].sort((a, b) => b.pct - a.pct)[0];
    await sendToAll({
      title: deals.length === 1 ? "1 oferta nova" : `${deals.length} ofertas novas`,
      body: `${top.name} · ${brl(top.price)} (-${top.pct}%) · ${top.store}`,
      url: "/",
      tag: "digest",
    });
  }
}
