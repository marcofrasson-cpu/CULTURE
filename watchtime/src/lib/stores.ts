/**
 * Lojas iniciais. `adapter: "auto"` testa VTEX > JSON-LD > Shopify na primeira
 * varredura; o resultado (ou o erro) aparece em /lojas. `path` é a categoria
 * de relógios no catálogo da loja. Loja retirada daqui é desativada no banco.
 */
export const SEED_STORES = [
  { slug: "vivara", name: "Vivara", domain: "www.vivara.com.br", path: "/vivara/relogios", adapter: "vtex" },
  { slug: "timecenter", name: "Time Center", domain: "www.timecenter.com.br", path: "/relogios", adapter: "vtex" },
  { slug: "montecarlo", name: "Monte Carlo", domain: "www.montecarlo.com.br", path: "/relogios", adapter: "vtex" },
  { slug: "technos", name: "Technos", domain: "www.technos.com.br", path: "/relogio", adapter: "vtex" },
  { slug: "euro", name: "Euro", domain: "www.eurorelogios.com.br", path: "/relogio", adapter: "vtex" },
  { slug: "fossil", name: "Fossil", domain: "www.fossil.com.br", path: "/relogio", adapter: "vtex" },
  { slug: "mondaine", name: "Mondaine", domain: "www.mondaine.com.br", path: "/relogios", adapter: "vtex" },
  { slug: "seculus", name: "Seculus", domain: "www.seculus.com.br", path: "/relogios", adapter: "vtex" },
] as const;
