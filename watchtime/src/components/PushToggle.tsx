"use client";
import { useEffect, useState } from "react";

type State = "loading" | "unsupported" | "needs-install" | "off" | "on" | "denied";

function b64ToU8(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function PushToggle() {
  const [state, setState] = useState<State>("loading");

  useEffect(() => {
    (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        const ios = /iPhone|iPad/.test(navigator.userAgent);
        const standalone = (navigator as { standalone?: boolean }).standalone === true;
        setState(ios && !standalone ? "needs-install" : "unsupported");
        return;
      }
      if (Notification.permission === "denied") return setState("denied");
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    })();
  }, []);

  async function enable() {
    setState("loading");
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return setState("denied");
    const reg = await navigator.serviceWorker.ready;
    const { publicKey } = (await fetch("/api/push/vapid").then((r) => r.json())) as { publicKey: string };
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToU8(publicKey) });
    await fetch("/api/push/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
    setState("on");
  }
  async function disable() {
    setState("loading");
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await fetch("/api/push/subscribe", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
      await sub.unsubscribe();
    }
    setState("off");
  }

  const box = "rounded-md border border-line bg-card p-3 text-sm";
  if (state === "loading") return <div className={box + " text-muted"}>Verificando notificações…</div>;
  if (state === "needs-install")
    return <div className={box + " text-muted"}>Para receber avisos no iPhone: Compartilhar → Adicionar à Tela de Início, depois abra o app pela tela inicial.</div>;
  if (state === "unsupported") return <div className={box + " text-muted"}>Este navegador não suporta notificações.</div>;
  if (state === "denied") return <div className={box + " text-muted"}>Notificações bloqueadas. Libere em Ajustes → Notificações → WATCHTIME.</div>;
  return (
    <div className={box + " flex items-center justify-between gap-3"}>
      <span>{state === "on" ? "Notificações ativas neste aparelho" : "Receber aviso de queda de preço"}</span>
      {state === "on" ? (
        <button onClick={disable} className="h-9 rounded-md border border-line px-3 text-sm">
          Desativar
        </button>
      ) : (
        <button onClick={enable} className="h-9 rounded-md bg-accent px-3 text-sm font-medium text-bg">
          Ativar
        </button>
      )}
    </div>
  );
}
