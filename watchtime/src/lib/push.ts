import webpush from "web-push";
import { prisma } from "./db";

type Payload = { title: string; body: string; url: string; tag?: string };

/** Chaves VAPID vivem na tabela Setting: geradas na primeira vez, sem passo manual. */
export async function getVapid(): Promise<{ publicKey: string; privateKey: string }> {
  const rows = await prisma.setting.findMany({ where: { key: { in: ["vapid_public", "vapid_private"] } } });
  const pub = rows.find((r) => r.key === "vapid_public")?.value;
  const priv = rows.find((r) => r.key === "vapid_private")?.value;
  if (pub && priv) return { publicKey: pub, privateKey: priv };
  const k = webpush.generateVAPIDKeys();
  await prisma.setting.createMany({
    data: [
      { key: "vapid_public", value: k.publicKey },
      { key: "vapid_private", value: k.privateKey },
    ],
    skipDuplicates: true,
  });
  return getVapid();
}

function subject() {
  const u = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return u ? (u.startsWith("http") ? u : `https://${u}`) : "https://watchtime.local";
}

export async function sendToAll(payload: Payload): Promise<{ sent: number; removed: number }> {
  const subs = await prisma.pushSubscription.findMany();
  if (subs.length === 0) return { sent: 0, removed: 0 };
  const { publicKey, privateKey } = await getVapid();
  webpush.setVapidDetails(subject(), publicKey, privateKey);
  let sent = 0;
  let removed = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
        { TTL: 60 * 60 * 12 },
      );
      sent++;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) {
        await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
        removed++;
      }
    }
  }
  return { sent, removed };
}
