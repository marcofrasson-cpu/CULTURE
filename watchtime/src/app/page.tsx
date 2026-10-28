import { Suspense } from "react";
import { DealCard } from "@/components/DealCard";
import { Filters } from "@/components/Filters";
import { prisma } from "@/lib/db";
import { GOOD_BRANDS } from "@/lib/brands";

export const dynamic = "force-dynamic";

type SP = Promise<{ q?: string; loja?: string; marca?: string; min?: string; genero?: string; caixa?: string; marcas?: string }>;

export default async function Home({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const min = Number(sp.min) || 0;
  const genero = sp.genero ?? "masculino";
  const caixa = sp.caixa == null ? 38 : Number(sp.caixa) || 0;
  const soBoas = sp.marcas !== "todas";

  const [stores, brandRows, products, lastRun] = await Promise.all([
    prisma.store.findMany({ where: { enabled: true }, orderBy: { name: "asc" }, select: { slug: true, name: true } }),
    prisma.product.findMany({ where: { brand: { not: null }, score: { gt: 0 } }, distinct: ["brand"], select: { brand: true }, orderBy: { brand: "asc" } }),
    prisma.product.findMany({
      where: {
        available: true,
        score: { gte: min },
        ...(sp.loja ? { store: { slug: sp.loja } } : {}),
        ...(sp.marca ? { brand: sp.marca } : soBoas ? { brand: { in: GOOD_BRANDS, mode: "insensitive" } } : {}),
        ...(genero !== "todos" ? { gender: genero } : {}),
        ...(caixa > 0 ? { caseMm: { lte: caixa } } : {}),
        ...(sp.q ? { OR: [{ name: { contains: sp.q, mode: "insensitive" } }, { brand: { contains: sp.q, mode: "insensitive" } }] } : {}),
      },
      orderBy: [{ score: "desc" }, { lastChangeAt: "desc" }],
      take: 120,
      include: { store: { select: { name: true } } },
    }),
    prisma.scanRun.findFirst({ where: { finishedAt: { not: null }, error: null }, orderBy: { finishedAt: "desc" } }),
  ]);
  const deals = products.filter((p) => p.listPrice && p.listPrice > p.price).length;
  const updated = lastRun?.finishedAt
    ? lastRun.finishedAt.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
    : null;
  const brands = brandRows.map((b) => b.brand!).filter(Boolean);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-baseline justify-between gap-3 flex-wrap">
        <h1 className="text-base">
          <span className="num">{products.length}{products.length >= 120 ? "+" : ""}</span> relógios
          {deals > 0 ? (
            <span className="text-muted">
              {" · "}
              <span className="num text-accent">{deals}</span> em promoção
            </span>
          ) : null}
        </h1>
        {updated ? <span className="num text-xs text-muted">atualizado {updated}</span> : null}
      </header>
      <Suspense>
        <Filters stores={stores} brands={brands} />
      </Suspense>
      {products.length === 0 ? (
        <p className="rounded-md border border-line bg-card p-4 text-sm text-muted">
          Nenhuma oferta com esses filtros. Experimente Qualquer caixa ou desligar Boas marcas.
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <li key={p.id} className="min-w-0">
              <DealCard p={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
