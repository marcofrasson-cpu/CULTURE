/**
 * Lojas iniciais. `adapter: "auto"` testa VTEX > JSON-LD > Shopify na primeira
 * varredura; o resultado (ou o erro) aparece em /admin. Ajuste `path` se a
 * loja mudar a URL da categoria de relógios.
 */
export const SEED_STORES = [
  { slug: "vivara", name: "Vivara", domain: "www.vivara.com.br", path: "/relogios", adapter: "auto" },
  { slug: "timecenter", name: "Time Center", domain: "www.timecenter.com.br", path: "/relogios", adapter: "auto" },
  { slug: "montecarlo", name: "Monte Carlo", domain: "www.montecarlo.com.br", path: "/relogios", adapter: "auto" },
  { slug: "sarajoias", name: "Sara Joias", domain: "www.sarajoias.com.br", path: "/relogios", adapter: "auto" },
  { slug: "technos", name: "Technos", domain: "www.technos.com.br", path: "/relogios", adapter: "auto" },
  { slug: "orient", name: "Orient", domain: "www.orientrelogios.com.br", path: "/relogios", adapter: "auto" },
  { slug: "mondaine", name: "Mondaine", domain: "www.mondaine.com.br", path: "/relogios", adapter: "auto" },
  { slug: "seculus", name: "Seculus", domain: "www.seculus.com.br", path: "/relogios", adapter: "auto" },
  { slug: "casio", name: "Casio", domain: "www.casio.com.br", path: "/relogios", adapter: "auto" },
  { slug: "chronos", name: "Chronos", domain: "www.chronos.com.br", path: "/relogios", adapter: "auto" },
] as const;
