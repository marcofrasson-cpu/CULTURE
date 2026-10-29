import * as cheerio from "cheerio";
import { inferBrand } from "../brands";
import { toCents } from "../money";
import { MAX_PAGES, baseUrl, type Adapter, type ScrapedProduct } from "./types";
import { parseSpecs } from "./specs";

/** Lê os cards HTML de uma listagem (tema da New Store RJ, plataforma Tray). Paginação ?pg=N. */
export function parseTrayHtml(html: string, base: string): ScrapedProduct[] {
  const $ = cheerio.load(html);
  const out: ScrapedProduct[] = [];
  $("a.product_card").each((_, el) => {
    const a = $(el);
    const href = a.attr("href");
    const name = a.find("p").first().text().replace(/\s+/g, " ").trim();
    if (!href || !name) return;
    const url = new URL(href, base).toString();
    const brand = a.find("h3").first().text().trim() || inferBrand(name);
    const image = a.find("img").first().attr("src") ?? null;
    // O "de" riscado é o preço de cartão; o verde é o PIX. Não é promoção: guarda só o PIX.
    const nowText = a
      .find("span")
      .filter((_, s) => /R\$/.test($(s).text()) && !$(s).hasClass("line-through"))
      .first()
      .text();
    const price = toCents(nowText.replace(/VIA PIX.*$/i, ""));
    if (!price) return;
    out.push({
      ...parseSpecs(name, [], {}),
      externalId: url.replace(/\/+$/, "").split("/").pop() ?? url,
      url,
      name,
      brand: brand || null,
      image,
      price,
      listPrice: null,
      available: true,
    });
  });
  return out;
}

/** Tray serve HTML em ISO-8859-1; respeita o charset do cabeçalho. */
async function decode(res: Response): Promise<string> {
  const ct = res.headers.get("content-type") ?? "";
  const m = ct.match(/charset=([\w-]+)/i);
  const buf = await res.arrayBuffer();
  try {
    return new TextDecoder(m?.[1] ?? "utf-8").decode(buf);
  } catch {
    return new TextDecoder("utf-8").decode(buf);
  }
}

/** Links de categoria de relógios presentes na página (menu por marca). */
export function discoverCategories(html: string, base: string): string[] {
  const host = new URL(base).host;
  const out = new Set<string>();
  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    try {
      const u = new URL(m[1], base);
      if (u.host === host && /^\/relogios?-[a-z0-9-]+\/?$/.test(u.pathname)) out.add(u.pathname.replace(/\/$/, ""));
    } catch {
      /* link inválido */
    }
  }
  return [...out].sort();
}

export const tray: Adapter = {
  name: "tray",
  async run(store, fetcher) {
    const base = baseUrl(store.domain);
    const out: ScrapedProduct[] = [];
    const seen = new Set<string>();
    const first = await fetcher(new URL(store.path, base).toString());
    if (!first.ok) throw new Error(`tray: HTTP ${first.status}`);
    const firstHtml = await decode(first);
    const paths = [store.path, ...discoverCategories(firstHtml, base).filter((p) => p !== store.path)];

    const scanPath = async (path: string) => {
      for (let page = 1; page <= MAX_PAGES; page++) {
        let html: string;
        if (page === 1 && path === store.path) html = firstHtml;
        else {
          const u = new URL(path, base);
          if (page > 1) u.searchParams.set("pg", String(page));
          const res = await fetcher(u.toString());
          if (!res.ok) break;
          html = await decode(res);
        }
        const items = parseTrayHtml(html, base).filter((p) => !seen.has(p.externalId));
        if (items.length === 0) break;
        for (const p of items) {
          if (seen.has(p.externalId)) continue;
          seen.add(p.externalId);
          out.push(p);
        }
      }
    };
    // 4 categorias por vez: a loja tem ~30 categorias por marca e 12 itens por página.
    const queue = [...paths];
    const worker = async () => {
      for (let p = queue.shift(); p; p = queue.shift()) await scanPath(p);
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    if (out.length === 0) throw new Error("tray: nenhum produto");
    return out;
  },
};
