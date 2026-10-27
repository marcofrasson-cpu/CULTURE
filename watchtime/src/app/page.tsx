import { Suspense } from "react";
import { DealCard } from "@/components/DealCard";
import { Filters } from "@/components/Filters";
import { prisma } from "@/lib/db";
import { MIN_FEED_DISCOUNT } from "@/lib/score";

export const dynamic = "force-dynamic";

type SP = Promise<{ q?: string; loja?: string; marca?: string; min?: string }>;

export default async function Home({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const min = Number(sp.min) || MIN_FEED_DISCOUNT;

  const [stores, brandRows, products] = await Promise.all([
    prisma.store.findMany({ where: { enabled: true }, orderBy: { name: "asc" }, select: { slug: true, name: true } }),
    prisma.product.findMany({ where: { brand: { not: null }, score: { gt: 0 } }, distinct: ["brand"], select: { brand: true }, orderBy: { brand: "asc" } }),
    prisma.product.findMany({
      where: {
        available: true,
        score: { gte: min },
        ...(sp.loja ? { store: { slug: sp.loja } } : {}),
        ...(sp.marca ? { brand: sp.marca } : {}),
        ...(sp.q ? { OR: [{ name: { contains: sp.q, mode: "insensitive" } }, { brand: { contains: sp.q, mode: "insensitive" } }] } : {}),
      },
      orderBy: [{ score: "desc" }, { lastChangeAt: "desc" }],
      take: 120,
      include: { store: { select: { name: true } } },
    }),
  ]);
  const brands = brandRows.map((b) => b.brand!).filter(Boolean);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-baseline justify-between">
        <h1 className="text-lg font-semibold tracking-tight">WATCHTIME</h1>
        <span className="num text-xs text-muted">{products.length} ofertas</span>
      </header>
      <Suspense>
        <Filters stores={stores} brands={brands} />
      </Suspense>
      {products.length === 0 ? (
        <p className="rounded-md border border-line bg-card p-4 text-sm text-muted">
          Nenhuma oferta ainda. A varredura roda todo dia às 8h; em Lojas você pode rodar agora.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {products.map((p) => (
            <li key={p.id}>
              <DealCard p={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
