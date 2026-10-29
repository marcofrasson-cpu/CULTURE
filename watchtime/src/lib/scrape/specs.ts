/** Extrai gênero e tamanho da caixa (mm) das especificações VTEX ou do nome. */
export function parseSpecs(name: string, specKeys: string[], obj: Record<string, unknown>) {
  const get = (k: string): string[] => {
    const v = obj[k];
    return Array.isArray(v) ? v.map(String) : v == null ? [] : [String(v)];
  };
  let gender: string | null = null;
  let caseMm: number | null = null;

  for (const k of specKeys) {
    const kl = k.toLowerCase();
    if (!gender && /g[êe]nero|sexo|p[úu]blico/.test(kl) && !/xml/.test(kl)) {
      gender = normGender(get(k).join(" "));
    }
    if (caseMm == null && /caixa/.test(kl) && /tamanho|largura|di[âa]metro|modelcase|caixa do modelo/.test(kl) && !/pulseira|vidro|espessura|altura/.test(kl)) {
      caseMm = parseMm(get(k)[0] ?? "", /\(cm\)|\bcm\b/.test(kl));
    }
  }
  if (!gender) gender = normGender(name);
  if (caseMm == null) {
    const m = name.match(/(\d{2}(?:[.,]\d)?)\s?mm\b/i);
    if (m) caseMm = parseMm(m[1], false);
  }
  return { gender, caseMm };
}

export function normGender(s: string): string | null {
  const t = s.toLowerCase();
  if (/unissex|unisex/.test(t)) return "unissex";
  if (/masculin|\bmen\b|\bhomem/.test(t)) return "masculino";
  if (/feminin|\bwomen\b|\bwoman\b|\bmulher|\blady\b|\bladies\b|\bsenhora/.test(t)) return "feminino";
  return null;
}

/** "38 mm" -> 38; "4,0" (cm) -> 40; "22x32mm" -> 32; "31 a 40 mm" (faixa) -> null */
export function parseMm(raw: string, isCm: boolean): number | null {
  const s = raw.toLowerCase().trim();
  if (!s || /\d\s*a\s*\d/.test(s)) return null;
  const nums = [...s.matchAll(/\d+(?:[.,]\d+)?/g)].map((m) => Number(m[0].replace(",", ".")));
  if (nums.length === 0) return null;
  let v = Math.max(...nums);
  if (isCm && v < 10) v = v * 10; // "4,0" cm; "40" em campo (cm) já está em mm
  else if (!isCm && v < 10) v = v * 10; // "3.8" sem unidade
  const mm = Math.round(v);
  return mm >= 15 && mm <= 70 ? mm : null;
}
