import { describe, expect, it } from "vitest";
import { scrapeStore } from "@/lib/scrape";
import { parseJsonLdHtml } from "@/lib/scrape/jsonld";
import type { Fetcher } from "@/lib/scrape/types";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8" } });
const html = (body: string, status = 200) => new Response(body, { status, headers: { "content-type": "text/html" } });

const vtexPage = [
  {
    productId: "123",
    productName: "Relógio Technos Masculino Prata",
    brand: "Technos",
    link: "https://www.loja.com.br/relogio-technos/p",
    items: [{ itemId: "1", images: [{ imageUrl: "https://img/1.jpg" }], sellers: [{ commertialOffer: { Price: 399.9, ListPrice: 599.9, AvailableQuantity: 3 } }] }],
  },
  {
    productId: "124",
    productName: "Relógio Orient Automático",
    brand: "Orient",
    linkText: "relogio-orient",
    items: [{ itemId: "2", sellers: [{ commertialOffer: { Price: 1200, ListPrice: 1200, AvailableQuantity: 0 } }] }],
  },
];

describe("vtex", () => {
  it("lê catálogo paginado e converte para centavos", async () => {
    const calls: string[] = [];
    const fetcher: Fetcher = async (url) => {
      calls.push(url);
      return json(vtexPage, 206);
    };
    const r = await scrapeStore({ domain: "www.loja.com.br", path: "/relogios", adapter: "vtex" }, fetcher);
    expect(r.adapter).toBe("vtex");
    expect(calls[0]).toBe("https://www.loja.com.br/api/catalog_system/pub/products/search/relogios?_from=0&_to=49");
    expect(r.products).toHaveLength(2);
    expect(r.products[0]).toMatchObject({ externalId: "123", price: 39990, listPrice: 59990, available: true, brand: "Technos" });
    expect(r.products[1]).toMatchObject({ price: 120000, listPrice: null, available: false, url: "https://www.loja.com.br/relogio-orient/p" });
  });
});

describe("shopify", () => {
  it("lê products.json", async () => {
    const fetcher: Fetcher = async () =>
      json({ products: [{ id: 9, title: "Casio G-Shock", handle: "g-shock", vendor: "Casio", images: [{ src: "https://img/g.jpg" }], variants: [{ price: "799.00", compare_at_price: "999.00", available: true }] }] });
    const r = await scrapeStore({ domain: "shop.com.br", path: "/collections/relogios", adapter: "shopify" }, fetcher);
    expect(r.adapter).toBe("shopify");
    expect(r.products[0]).toMatchObject({ externalId: "9", price: 79900, listPrice: 99900, url: "https://shop.com.br/products/g-shock" });
  });
});

describe("jsonld", () => {
  const page = `<html><head><script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: [
      { "@type": "ListItem", position: 1, item: { "@type": "Product", name: "Relógio Seiko 5", sku: "S5", url: "/relogio-seiko-5/p", image: ["https://img/s.jpg"], brand: { "@type": "Brand", name: "Seiko" }, offers: { "@type": "AggregateOffer", lowPrice: "1.499,00", highPrice: "1.999,00", availability: "https://schema.org/InStock" } } },
      { "@type": "ListItem", position: 2, item: { "@type": "Product", name: "Sem preço", sku: "X", url: "/x/p" } },
    ],
  })}</script></head><body></body></html>`;

  it("extrai Product de ItemList e resolve URL relativa", () => {
    const list = parseJsonLdHtml(page, "https://www.loja.com.br");
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ externalId: "S5", price: 149900, listPrice: 199900, brand: "Seiko", url: "https://www.loja.com.br/relogio-seiko-5/p" });
  });

  it("para na página sem novos itens", async () => {
    const calls: string[] = [];
    const fetcher: Fetcher = async (url) => {
      calls.push(url);
      return html(page);
    };
    const r = await scrapeStore({ domain: "www.loja.com.br", path: "/relogios", adapter: "jsonld" }, fetcher);
    expect(r.products).toHaveLength(1);
    expect(calls).toHaveLength(2); // página 2 repetiu o item -> parou
    expect(calls[1]).toBe("https://www.loja.com.br/relogios?page=2");
  });
});

describe("auto", () => {
  it("cai do VTEX para JSON-LD e junta erros quando tudo falha", async () => {
    const fetcher: Fetcher = async (url) => (url.includes("/api/catalog_system") ? html("<html>404</html>", 404) : json({ products: [] }));
    await expect(scrapeStore({ domain: "x.com.br", path: "/relogios", adapter: "auto" }, fetcher)).rejects.toThrow(/vtex: HTTP 404 \| jsonld: .* \| shopify: nenhum produto/);
  });
});
