import { NextResponse } from "next/server";
import { scanAll } from "@/lib/scan";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Botão "Rodar agora" em /admin. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { slug?: string };
  const results = await scanAll({ onlySlug: body.slug });
  return NextResponse.json({ ok: true, results });
}
