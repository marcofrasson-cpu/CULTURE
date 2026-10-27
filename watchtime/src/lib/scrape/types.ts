export type ScrapedProduct = {
  externalId: string;
  url: string;
  name: string;
  brand?: string | null;
  image?: string | null;
  price: number; // centavos
  listPrice?: number | null; // centavos
  available: boolean;
};

export type StoreInput = {
  domain: string; // ex.: www.vivara.com.br
  path: string; // ex.: /relogios
};

export type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

export type Adapter = {
  name: "vtex" | "jsonld" | "shopify";
  /** Lança erro quando a loja não responde nesse formato. */
  run(store: StoreInput, fetcher: Fetcher): Promise<ScrapedProduct[]>;
};

export const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

export const MAX_PAGES = 12;

/** http só para loja local de teste (localhost:porta); produção sempre https. */
export function baseUrl(domain: string): string {
  return (domain.startsWith("localhost") ? "http://" : "https://") + domain;
}
