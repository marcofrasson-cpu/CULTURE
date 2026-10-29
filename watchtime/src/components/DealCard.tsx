import Link from "next/link";
import { brl } from "@/lib/money";
import { discountPct } from "@/lib/score";

export type DealCardData = {
  id: string;
  name: string;
  brand: string | null;
  image: string | null;
  price: number;
  listPrice: number | null;
  minPrice: number;
  prevPrice: number | null;
  caseMm?: number | null;
  store: { name: string };
};

/** Tira o "Relógio" repetido no início do nome; a marca já vai em destaque. */
export function displayName(name: string, brand: string | null) {
  let n = name.replace(/^rel[óo]gio\s+/i, "");
  if (brand && n.toLowerCase().startsWith(brand.toLowerCase() + " ")) n = n.slice(brand.length + 1);
  return n;
}

export function DealCard({ p }: { p: DealCardData }) {
  const pct = discountPct(p.price, p.listPrice);
  const isMin = p.price <= p.minPrice && (p.prevPrice ?? p.price) > p.price;
  return (
    <Link href={`/p/${p.id}`} className="flex gap-3 sm:flex-col rounded-md border border-line bg-card p-3 h-full">
      <div className="size-24 sm:size-auto sm:w-full sm:aspect-square shrink-0 rounded bg-white p-1.5 sm:p-4 flex items-center justify-center overflow-hidden">
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.image} alt="" loading="lazy" className="max-h-full max-w-full object-contain" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1 flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-medium truncate">{p.brand ?? "—"}</span>
          <span className="text-xs text-muted shrink-0">{p.store.name}</span>
        </div>
        <div className="text-sm text-muted leading-snug break-words">{displayName(p.name, p.brand)}</div>
        <div className="mt-auto pt-1 flex items-baseline gap-2 flex-wrap">
          <span className="num text-base">{brl(p.price)}</span>
          {p.listPrice ? <span className="num text-xs text-muted line-through">{brl(p.listPrice)}</span> : null}
          {pct > 0 ? <span className="num text-xs text-accent">-{pct}%</span> : null}
          {isMin ? <span className="text-xs text-accent">menor preço</span> : null}
          {p.caseMm ? <span className="num ml-auto text-xs text-muted">{p.caseMm} mm</span> : null}
        </div>
      </div>
    </Link>
  );
}
