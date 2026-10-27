import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const Body = z.object({ productId: z.string().min(1), targetPrice: z.number().int().positive().nullable().optional() });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "dados inválidos" }, { status: 400 });
  const { productId, targetPrice } = parsed.data;
  const w = await prisma.watch.upsert({
    where: { productId },
    update: { targetPrice: targetPrice ?? null, notifiedAt: null },
    create: { productId, targetPrice: targetPrice ?? null },
  });
  return NextResponse.json({ ok: true, watch: w });
}

export async function DELETE(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { productId?: string };
  if (!body.productId) return NextResponse.json({ error: "productId" }, { status: 400 });
  await prisma.watch.deleteMany({ where: { productId: body.productId } });
  return NextResponse.json({ ok: true });
}
