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
  store: { name: string };
};

export function DealCard({ p }: { p: DealCardData }) {
  const pct = discountPct(p.price, p.listPrice);
  const isMin = p.price <= p.minPrice && (p.prevPrice ?? p.price) > p.price;
  return (
    <Link href={`/p/${p.id}`} className="flex gap-3 rounded-md border border-line bg-card p-3">
      <div className="size-20 shrink-0 rounded bg-bg overflow-hidden">
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.image} alt="" loading="lazy" className="size-full object-contain" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1 flex flex-col gap-1">
        <div className="text-xs text-muted">
          {p.brand ? `${p.brand} · ` : ""}
          {p.store.name}
        </div>
        <div className="text-sm leading-snug break-words">{p.name}</div>
        <div className="mt-auto flex items-baseline gap-2 flex-wrap">
          <span className="num text-base">{brl(p.price)}</span>
          {p.listPrice ? <span className="num text-xs text-muted line-through">{brl(p.listPrice)}</span> : null}
          {pct > 0 ? <span className="num text-xs text-accent">-{pct}%</span> : null}
          {isMin ? <span className="text-xs text-muted">menor preço</span> : null}
        </div>
      </div>
    </Link>
  );
}
