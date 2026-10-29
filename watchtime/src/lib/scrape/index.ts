import { httpFetch } from "./http";
import { jsonld } from "./jsonld";
import { shopify } from "./shopify";
import type { Adapter, Fetcher, ScrapedProduct, StoreInput } from "./types";
import { tray } from "./tray";
import { vtex } from "./vtex";

export const adapters: Record<string, Adapter> = { vtex, jsonld, shopify, tray };

export type ScrapeResult = { adapter: string; products: ScrapedProduct[] };

/**
 * adapter="auto": tenta VTEX, depois JSON-LD, depois Shopify. O primeiro que
 * devolver produtos vence. Junta as mensagens de erro quando todos falham.
 */
export async function scrapeStore(
  store: StoreInput & { adapter: string },
  fetcher: Fetcher = httpFetch,
): Promise<ScrapeResult> {
  const order = store.adapter === "auto" ? [vtex, jsonld, shopify] : [adapters[store.adapter]];
  if (!order[0]) throw new Error(`adapter desconhecido: ${store.adapter}`);
  const errors: string[] = [];
  for (const a of order) {
    try {
      const products = await a.run(store, fetcher);
      return { adapter: a.name, products: dedupe(products) };
    } catch (e) {
      errors.push(e instanceof Error ? e.message : String(e));
    }
  }
  throw new Error(errors.join(" | "));
}

function dedupe(list: ScrapedProduct[]): ScrapedProduct[] {
  const m = new Map<string, ScrapedProduct>();
  for (const p of list) if (!m.has(p.externalId)) m.set(p.externalId, p);
  return [...m.values()];
}
