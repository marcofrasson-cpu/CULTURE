"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = { stores: { slug: string; name: string }[]; brands: string[] };

export function Filters({ stores, brands }: Props) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();

  function set(key: string, value: string) {
    const next = new URLSearchParams(sp.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${path}?${next.toString()}`);
  }

  const sel = "h-9 rounded-md border border-line bg-card px-2 text-sm text-fg";
  return (
    <div className="flex flex-col gap-2">
      <input
        type="search"
        inputMode="search"
        placeholder="Buscar modelo, marca…"
        defaultValue={sp.get("q") ?? ""}
        onChange={(e) => set("q", e.target.value.trim())}
        className="h-10 w-full rounded-md border border-line bg-card px-3 text-sm placeholder:text-muted"
      />
      <div className="grid grid-cols-3 gap-2">
        <select className={sel} value={sp.get("loja") ?? ""} onChange={(e) => set("loja", e.target.value)}>
          <option value="">Loja</option>
          {stores.map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
        <select className={sel} value={sp.get("marca") ?? ""} onChange={(e) => set("marca", e.target.value)}>
          <option value="">Marca</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <select className={sel} value={sp.get("min") ?? ""} onChange={(e) => set("min", e.target.value)}>
          <option value="">Desconto</option>
          <option value="20">≥ 20%</option>
          <option value="30">≥ 30%</option>
          <option value="40">≥ 40%</option>
          <option value="50">≥ 50%</option>
        </select>
      </div>
    </div>
  );
}
