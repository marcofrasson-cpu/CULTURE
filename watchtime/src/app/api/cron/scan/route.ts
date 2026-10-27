import { NextResponse } from "next/server";
import { scanAll } from "@/lib/scan";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Vercel Cron chama aqui (vercel.json). Se CRON_SECRET estiver definido, exige o Bearer. */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const results = await scanAll();
  return NextResponse.json({ ok: true, results });
}
