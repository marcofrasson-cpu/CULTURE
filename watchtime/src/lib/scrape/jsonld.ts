import * as cheerio from "cheerio";
import { toCents } from "../money";
import { inferBrand } from "../brands";
import { parseSpecs } from "./specs";
import { MAX_PAGES, baseUrl, type Adapter, type ScrapedProduct } from "./types";

type Offer = { price?: string | number; lowPrice?: string | number; highPrice?: string | number; availability?: string; url?: string };
type LdProduct = {
  "@type"?: string | string[];
  name?: string;
  sku?: string;
  productID?: string;
  url?: string;
  image?: string | string[] | { url?: string };
  brand?: string | { name?: string };
  offers?: Offer | Offer[];
  mainEntityOfPage?: string | { "@id"?: string };
};

function asArray<T>(v: T | T[] | undefined | null): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

function isProduct(n: unknown): n is LdProduct {
  if (!n || typeof n !== "object") return false;
  const t = (n as LdProduct)["@type"];
  return asArray(t).some((x) => String(x).toLowerCase() === "product");
}

/** Percorre o grafo JSON-LD e devolve todos os nós Product (inclui ItemList > ListItem > item). */
export function collectProducts(root: unknown, acc: LdProduct[] = [], depth = 0): LdProduct[] {
  if (depth > 6 || root == null) return acc;
  if (Array.isArray(root)) {
    for (const r of root) collectProducts(r, acc, depth + 1);
    return acc;
  }
  if (typeof root !== "object") return acc;
  if (isProduct(root)) acc.push(root);
  const o = root as Record<string, unknown>;
  for (const k of ["@graph", "itemListElement", "item", "mainEntity", "hasVariant"]) {
    if (k in o) collectProducts(o[k], acc, depth + 1);
  }
  return acc;
}

export function parseJsonLdHtml(html: string, base: string): ScrapedProduct[] {
  const $ = cheerio.load(html);
  const out: ScrapedProduct[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).text();
    if (!raw.trim()) return;
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return;
    }
    for (const p of collectProducts(json)) {
      const offers = asArray(p.offers);
      const o = offers[0];
      const price = toCents(o?.price ?? o?.lowPrice ?? null);
      if (!price) continue;
      const high = toCents(o?.highPrice ?? null);
      const main = typeof p.mainEntityOfPage === "object" ? p.mainEntityOfPage?.["@id"] : p.mainEntityOfPage;
      const url = p.url ?? o?.url ?? main;
      if (!url || !p.name) continue;
      const abs = new URL(url, base).toString();
      const img = Array.isArray(p.image) ? p.image[0] : typeof p.image === "object" ? p.image?.url : p.image;
      const brand = (typeof p.brand === "object" ? p.brand?.name : p.brand) ?? inferBrand(p.name);
      const specs = parseSpecs(p.name, [], {});
      out.push({
        ...specs,
        externalId: p.sku ?? p.productID ?? abs,
        url: abs,
        name: p.name,
        brand: brand ?? null,
        image: img ?? null,
        price,
        listPrice: high && high > price ? high : null,
        available: !/OutOfStock|SoldOut|Discontinued/i.test(o?.availability ?? ""),
      });
    }
  });
  return out;
}

/** Páginas de categoria com schema.org/Product embutido (ItemList). Pagina com ?page=N. */
export const jsonld: Adapter = {
  name: "jsonld",
  async run(store, fetcher) {
    const base = baseUrl(store.domain);
    const out: ScrapedProduct[] = [];
    const seen = new Set<string>();
    for (let page = 1; page <= MAX_PAGES; page++) {
      const u = new URL(store.path, base);
      if (page > 1) u.searchParams.set("page", String(page));
      const res = await fetcher(u.toString());
      if (!res.ok) {
        if (page === 1) throw new Error(`jsonld: HTTP ${res.status}`);
        break;
      }
      const html = await res.text();
      const items = parseJsonLdHtml(html, base).filter((p) => !seen.has(p.externalId));
      if (items.length === 0) break;
      for (const p of items) {
        seen.add(p.externalId);
        out.push(p);
      }
    }
    if (out.length === 0) throw new Error("jsonld: nenhum produto com schema.org/Product");
    return out;
  },
};
