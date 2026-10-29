import { DealCard } from "@/components/DealCard";
import { PushToggle } from "@/components/PushToggle";
import { prisma } from "@/lib/db";
import { brl } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function Alertas() {
  const watches = await prisma.watch.findMany({
    include: { product: { include: { store: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold tracking-tight">Alertas</h1>
      <PushToggle />
      <p className="text-xs text-muted">
        Todo dia você recebe um resumo das ofertas novas com 25% ou mais de desconto. Abaixo, relógios que você acompanha.
      </p>
      {watches.length === 0 ? (
        <p className="rounded-md border border-line bg-card p-4 text-sm text-muted">
          Nenhum relógio acompanhado. Abra uma oferta e toque em Criar alerta.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {watches.map((w) => (
            <li key={w.id} className="flex flex-col gap-1">
              <DealCard p={w.product} />
              <span className="num px-1 text-xs text-muted">
                {w.targetPrice ? `Avisar abaixo de ${brl(w.targetPrice)}` : "Avisar em qualquer queda"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
