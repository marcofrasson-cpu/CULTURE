import { toCents } from "../money";
import { parseSpecs } from "./specs";
import { MAX_PAGES, baseUrl, type Adapter, type ScrapedProduct } from "./types";

type VtexItem = {
  itemId: string;
  images?: { imageUrl: string }[];
  sellers?: { commertialOffer?: { Price?: number; ListPrice?: number; AvailableQuantity?: number } }[];
};
type VtexProduct = {
  productId: string;
  productName: string;
  brand?: string;
  link?: string;
  linkText?: string;
  items?: VtexItem[];
  allSpecifications?: string[];
  [spec: string]: unknown;
};

/**
 * Lojas VTEX expõem o catálogo em /api/catalog_system/pub/products/search/<categoria>.
 * Pagina de 50 em 50 (_from/_to), limite 2500 itens pela própria VTEX.
 */
export const vtex: Adapter = {
  name: "vtex",
  async run(store, fetcher) {
    const cat = store.path.replace(/^\/+|\/+$/g, "");
    const out: ScrapedProduct[] = [];
    for (let page = 0; page < MAX_PAGES; page++) {
      const from = page * 50;
      const url = `${baseUrl(store.domain)}/api/catalog_system/pub/products/search/${cat}?_from=${from}&_to=${from + 49}`;
      const res = await fetcher(url, { headers: { accept: "application/json" } });
      if (res.status === 206 || res.ok) {
        const ct = res.headers.get("content-type") ?? "";
        if (!ct.includes("json")) throw new Error(`vtex: resposta não-JSON (${ct})`);
        const data = (await res.json()) as VtexProduct[];
        if (!Array.isArray(data)) throw new Error("vtex: formato inesperado");
        for (const p of data) {
          const item = p.items?.[0];
          const offer = item?.sellers?.[0]?.commertialOffer;
          const price = toCents(offer?.Price ?? null);
          if (!price) continue;
          const listPrice = toCents(offer?.ListPrice ?? null);
          const specs = parseSpecs(p.productName, p.allSpecifications ?? [], p);
          out.push({
            ...specs,
            externalId: p.productId,
            url: p.link ?? `${baseUrl(store.domain)}/${p.linkText}/p`,
            name: p.productName,
            brand: p.brand ?? null,
            image: item?.images?.[0]?.imageUrl ?? null,
            price,
            listPrice: listPrice && listPrice > price ? listPrice : null,
            available: (offer?.AvailableQuantity ?? 1) > 0,
          });
        }
        if (data.length < 50) break;
      } else {
        throw new Error(`vtex: HTTP ${res.status}`);
      }
    }
    if (out.length === 0) throw new Error("vtex: nenhum produto");
    return out;
  },
};
