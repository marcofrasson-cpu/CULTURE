import { ScanButton } from "@/components/ScanButton";
import { prisma } from "@/lib/db";
import { ensureSeedStores } from "@/lib/scan";

export const dynamic = "force-dynamic";

export default async function Lojas() {
  await ensureSeedStores();
  const stores = await prisma.store.findMany({
    orderBy: { name: "asc" },
    include: { runs: { orderBy: { startedAt: "desc" }, take: 1 }, _count: { select: { products: true } } },
  });
  const fmt = (d: Date) => d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-semibold tracking-tight">Lojas</h1>
        <ScanButton label="Varrer todas" />
      </header>
      <ul className="flex flex-col gap-2">
        {stores.map((s) => {
          const r = s.runs[0];
          const status = !r ? "Nunca varrida" : !r.finishedAt ? "Em andamento" : r.error ? "Falhou" : "OK";
          return (
            <li key={s.id} className="rounded-md border border-line bg-card p-3 flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm">{s.name}</div>
                  <div className="text-xs text-muted break-all">
                    {s.domain}
                    {s.path}
                  </div>
                </div>
                <ScanButton slug={s.slug} label="Rodar" />
              </div>
              <div className="num text-xs text-muted flex gap-3 flex-wrap">
                <span className={status === "Falhou" ? "text-danger" : status === "OK" ? "text-accent" : ""}>{status}</span>
                {r ? <span>{fmt(r.startedAt)}</span> : null}
                {r?.adapter ? <span>{r.adapter}</span> : null}
                <span>{s._count.products} produtos</span>
                {r && r.finishedAt && !r.error ? <span>{r.changed} mudaram</span> : null}
              </div>
              {r?.error ? <div className="text-xs text-danger break-words">{r.error}</div> : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
