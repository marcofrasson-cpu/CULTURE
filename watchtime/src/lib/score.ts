export type ScoreInput = {
  price: number;
  listPrice: number | null;
  minPrice: number; // menor preço já visto (inclui o atual)
  prevPrice: number | null;
};

/**
 * Pontuação da oferta. Soma: desconto sobre o preço "de" (0-100),
 * queda desde a última varredura (peso 1,5) e bônus de menor preço histórico.
 * Retorna 0 quando não há nenhum sinal de oferta.
 */
export function scoreDeal(i: ScoreInput): number {
  let s = 0;
  if (i.listPrice && i.listPrice > i.price) {
    s += Math.round(((i.listPrice - i.price) / i.listPrice) * 100);
  }
  if (i.prevPrice && i.prevPrice > i.price) {
    s += Math.round(((i.prevPrice - i.price) / i.prevPrice) * 150);
  }
  if (s > 0 && i.price <= i.minPrice) s += 15;
  return s;
}

export function discountPct(price: number, listPrice: number | null): number {
  if (!listPrice || listPrice <= price) return 0;
  return Math.round(((listPrice - price) / listPrice) * 100);
}

/** Desconto mínimo para entrar no feed e na notificação diária. */
export const MIN_FEED_DISCOUNT = 10;
export const MIN_PUSH_DISCOUNT = 25;
