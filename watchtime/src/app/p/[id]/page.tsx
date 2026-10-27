import Link from "next/link";
import { notFound } from "next/navigation";
import { Sparkline } from "@/components/Sparkline";
import { WatchButton } from "@/components/WatchButton";
import { prisma } from "@/lib/db";
import { brl } from "@/lib/money";
import { discountPct } from "@/lib/score";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await prisma.product.findUnique({
    where: { id },
    include: { store: true, watches: true, history: { orderBy: { seenAt: "asc" }, take: 60 } },
  });
  if (!p) notFound();
  const pct = discountPct(p.price, p.listPrice);
  const w = p.watches[0];
  const fmtDate = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  return (
    <div className="flex flex-col gap-4">
      <Link href="/" className="text-sm text-muted">
        ← Ofertas
      </Link>
      <div className="rounded-md border border-line bg-card p-4 flex flex-col gap-3">
        {p.image ? (
          <div className="rounded bg-bg p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.image} alt="" className="mx-auto max-h-64 object-contain" />
          </div>
        ) : null}
        <div className="text-xs text-muted">
          {p.brand ? `${p.brand} · ` : ""}
          {p.store.name}
        </div>
        <h1 className="text-base leading-snug break-words">{p.name}</h1>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="num text-2xl">{brl(p.price)}</span>
          {p.listPrice ? <span className="num text-sm text-muted line-through">{brl(p.listPrice)}</span> : null}
          {pct > 0 ? <span className="num text-sm text-accent">-{pct}%</span> : null}
        </div>
        <dl className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <dt className="text-muted">Menor visto</dt>
            <dd className="num">{brl(p.minPrice)}</dd>
          </div>
          <div>
            <dt className="text-muted">Maior visto</dt>
            <dd className="num">{brl(p.maxPrice)}</dd>
          </div>
          <div>
            <dt className="text-muted">Desde</dt>
            <dd className="num">{fmtDate(p.firstSeenAt)}</dd>
          </div>
        </dl>
        <Sparkline points={p.history} />
        <a
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          className="h-11 rounded-md bg-accent text-bg font-medium text-sm flex items-center justify-center"
        >
          Ver na {p.store.name}
        </a>
      </div>
      <div className="rounded-md border border-line bg-card p-4">
        <WatchButton productId={p.id} watching={!!w} targetPrice={w?.targetPrice ?? null} price={p.price} />
      </div>
    </div>
  );
}
