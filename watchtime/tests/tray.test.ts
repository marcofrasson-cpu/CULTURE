import { describe, expect, it } from "vitest";
import { discoverCategories, parseTrayHtml } from "@/lib/scrape/tray";
import { parseJsonLdHtml } from "@/lib/scrape/jsonld";
import { inferBrand } from "@/lib/brands";

const card = `<a href="https://www.newstorerj.com.br/relogios/christopher-ward/relogio-cw-c60-36mm" class="!no-underline relative product_card">
<div><img src="https://images.tcdn.com.br/x.png" alt="x"/></div>
<h3 class="font-semibold">Christopher Ward</h3>
<p class="text-xs">Relógio Christopher Ward C63 Sealander Automático Preto 36 mm C63-36ADA4</p>
<div><span class="line-through">R$ 9.899,99</span><span class="text-green">R$ 8.414,99 <small>VIA PIX</small></span></div></a>`;

describe("tray (New Store RJ)", () => {
  it("lê card: marca, nome, preço pix, preço de, caixa", () => {
    const [p] = parseTrayHtml(card, "https://www.newstorerj.com.br");
    expect(p).toMatchObject({ brand: "Christopher Ward", price: 841499, listPrice: null, caseMm: 36, externalId: "relogio-cw-c60-36mm" });
  });
});

describe("tray categorias", () => {
  it("acha categorias de relógio por marca no menu", () => {
    const html = `<a href="https://www.newstorerj.com.br/relogios-seiko">Seiko</a><a href="/relogio-nomos/">Nomos</a><a href="/perfumes">x</a><a href="https://outro.com/relogios-x">y</a><a href="/relogios">todos</a>`;
    expect(discoverCategories(html, "https://www.newstorerj.com.br")).toEqual(["/relogio-nomos", "/relogios-seiko"]);
  });
});

describe("jsonld (Clock Society / Nuvemshop)", () => {
  it("usa mainEntityOfPage como URL e deduz marca e caixa do nome", () => {
    const html = `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "Product", name: "Relógio Baltic Aquascaphe MK2 Automático Azul 39.5mm", image: "https://i/x.jpg", offers: { "@type": "Offer", price: "4999", availability: "https://schema.org/InStock" }, mainEntityOfPage: { "@type": "WebPage", "@id": "https://clocksociety.com.br/produtos/relogio-baltic/" } })}</script>`;
    const [p] = parseJsonLdHtml(html, "https://clocksociety.com.br");
    expect(p).toMatchObject({ url: "https://clocksociety.com.br/produtos/relogio-baltic/", price: 499900, brand: "Baltic", caseMm: 40 });
  });
});

describe("inferBrand", () => {
  it("prefere o nome mais longo", () => {
    expect(inferBrand("Relógio Nivada Grenchen Antarctic 35mm")).toBe("Nivada Grenchen");
    expect(inferBrand("Relógio Genérico 40mm")).toBeNull();
  });
});
