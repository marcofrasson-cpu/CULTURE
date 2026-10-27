import { toCents } from "../money";
import { MAX_PAGES, baseUrl, type Adapter, type ScrapedProduct } from "./types";

type ShopifyProduct = {
  id: number;
  title: string;
  handle: string;
  vendor?: string;
  images?: { src: string }[];
  variants?: { price: string; compare_at_price: string | null; available?: boolean }[];
};

/** Lojas Shopify: /collections/<handle>/products.json?limit=250&page=N */
export const shopify: Adapter = {
  name: "shopify",
  async run(store, fetcher) {
    const handle = store.path.replace(/^\/+|\/+$/g, "").replace(/^collections\//, "");
    const out: ScrapedProduct[] = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
      const url = `${baseUrl(store.domain)}/collections/${handle}/products.json?limit=250&page=${page}`;
      const res = await fetcher(url, { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`shopify: HTTP ${res.status}`);
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("json")) throw new Error(`shopify: resposta não-JSON (${ct})`);
      const data = (await res.json()) as { products?: ShopifyProduct[] };
      const list = data.products ?? [];
      for (const p of list) {
        const v = p.variants?.[0];
        const price = toCents(v?.price ?? null);
        if (!price) continue;
        const listPrice = toCents(v?.compare_at_price ?? null);
        out.push({
          externalId: String(p.id),
          url: `${baseUrl(store.domain)}/products/${p.handle}`,
          name: p.title,
          brand: p.vendor ?? null,
          image: p.images?.[0]?.src ?? null,
          price,
          listPrice: listPrice && listPrice > price ? listPrice : null,
          available: v?.available ?? true,
        });
      }
      if (list.length < 250) break;
    }
    if (out.length === 0) throw new Error("shopify: nenhum produto");
    return out;
  },
};
