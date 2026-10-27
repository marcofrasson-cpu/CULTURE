"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { productId: string; watching: boolean; targetPrice: number | null; price: number };

export function WatchButton({ productId, watching, targetPrice, price }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [target, setTarget] = useState(targetPrice != null ? String(targetPrice / 100) : "");

  async function save() {
    setBusy(true);
    const t = target.replace(/[^\d,.]/g, "").replace(/\./g, "").replace(",", ".");
    const cents = t ? Math.round(Number(t) * 100) : null;
    await fetch("/api/watch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ productId, targetPrice: cents && cents > 0 ? cents : null }),
    });
    setBusy(false);
    router.refresh();
  }
  async function remove() {
    setBusy(true);
    await fetch("/api/watch", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ productId }) });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs text-muted">Avisar quando baixar para (R$), opcional</label>
      <div className="flex gap-2">
        <input
          inputMode="decimal"
          placeholder={(price / 100).toFixed(2).replace(".", ",")}
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="num h-10 flex-1 rounded-md border border-line bg-card px-3 text-sm"
        />
        <button
          onClick={save}
          disabled={busy}
          className="h-10 rounded-md border border-line px-4 text-sm text-fg disabled:opacity-50"
        >
          {watching ? "Atualizar alerta" : "Criar alerta"}
        </button>
      </div>
      {watching ? (
        <button onClick={remove} disabled={busy} className="self-start text-xs text-muted underline-offset-2 hover:underline">
          Remover alerta
        </button>
      ) : null}
    </div>
  );
}
