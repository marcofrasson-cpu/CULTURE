"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ScanButton({ slug, label = "Rodar agora" }: { slug?: string; label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    try {
      await fetch("/api/scan", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug }) });
    } finally {
      setBusy(false);
      router.refresh();
    }
  }
  return (
    <button
      onClick={run}
      disabled={busy}
      className={`h-9 rounded-md px-3 text-sm disabled:opacity-50 ${slug ? "border border-line text-fg" : "bg-accent text-bg font-medium"}`}
    >
      {busy ? "Varrendo…" : label}
    </button>
  );
}
