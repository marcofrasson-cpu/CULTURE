const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** centavos -> "R$ 1.234,56" */
export function brl(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return fmt.format(cents / 100);
}

/** "1.234,56" | "1234.56" | 1234.56 -> centavos (inteiro) */
export function toCents(v: string | number | null | undefined): number | null {
  if (v == null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? Math.round(v * 100) : null;
  let s = v.replace(/[^\d.,]/g, "");
  if (!s) return null;
  // pt-BR: "1.234,56" -> ponto é milhar, vírgula é decimal
  if (s.includes(",") && s.includes(".")) s = s.replace(/\./g, "").replace(",", ".");
  else if (s.includes(",")) s = s.replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

export function pct(part: number, whole: number): number {
  if (!whole) return 0;
  return Math.round(((whole - part) / whole) * 100);
}
