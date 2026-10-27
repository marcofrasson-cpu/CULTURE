import { NextResponse } from "next/server";
import { getVapid } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function GET() {
  const { publicKey } = await getVapid();
  return NextResponse.json({ publicKey });
}
