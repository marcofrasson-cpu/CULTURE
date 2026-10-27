import { UA, type Fetcher } from "./types";

/** fetch com timeout e cabeçalhos de navegador móvel. */
export const httpFetch: Fetcher = async (url, init) => {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20_000);
  try {
    return await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: {
        "user-agent": UA,
        accept: "text/html,application/json;q=0.9,*/*;q=0.8",
        "accept-language": "pt-BR,pt;q=0.9",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
  } finally {
    clearTimeout(t);
  }
};
