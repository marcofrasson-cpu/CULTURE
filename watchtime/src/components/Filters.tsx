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
  const good = sp.get("marcas") !== "todas";
  return (
    <div className="flex flex-col gap-2 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
      <input
        type="search"
        inputMode="search"
        placeholder="Buscar modelo, marca…"
        defaultValue={sp.get("q") ?? ""}
        onChange={(e) => set("q", e.target.value.trim())}
        className="h-10 w-full rounded-md border border-line bg-card px-3 text-sm placeholder:text-muted"
      />
      <div className="grid grid-cols-3 gap-2 lg:contents">
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
          <option value="">Com ou sem desconto</option>
          <option value="10">≥ 10%</option>
          <option value="20">≥ 20%</option>
          <option value="30">≥ 30%</option>
          <option value="40">≥ 40%</option>
          <option value="50">≥ 50%</option>
        </select>
      </div>
      <div className="grid grid-cols-3 gap-2 lg:col-span-2">
        <select className={sel} value={sp.get("genero") ?? "masculino"} onChange={(e) => set("genero", e.target.value)}>
          <option value="masculino">Masculino</option>
          <option value="feminino">Feminino</option>
          <option value="unissex">Unissex</option>
          <option value="todos">Todos</option>
        </select>
        <select className={sel} value={sp.get("caixa") ?? "38"} onChange={(e) => set("caixa", e.target.value)}>
          <option value="36">Caixa ≤ 36 mm</option>
          <option value="38">Caixa ≤ 38 mm</option>
          <option value="40">Caixa ≤ 40 mm</option>
          <option value="42">Caixa ≤ 42 mm</option>
          <option value="0">Qualquer caixa</option>
        </select>
        <button
          type="button"
          onClick={() => set("marcas", good ? "todas" : "")}
          className={`h-9 rounded-md border px-2 text-sm ${good ? "border-accent text-accent" : "border-line text-muted"}`}
          aria-pressed={good}
        >
          Boas marcas
        </button>
      </div>
    </div>
  );
}
