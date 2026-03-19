import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Public: only expose pricing settings (not Gmail credentials)
export async function GET() {
  try {
    const rows = await prisma.$queryRaw<{ key: string; value: string }[]>`
      SELECT key, value FROM Setting WHERE key IN ('equipmentPrice', 'coachingPrice')
    `;
    const map = Object.fromEntries(rows.map((s) => [s.key, parseFloat(s.value)]));
    return NextResponse.json({
      equipmentPrice: map["equipmentPrice"] ?? 30,
      coachingPrice: map["coachingPrice"] ?? 120,
    });
  } catch {
    return NextResponse.json({ equipmentPrice: 30, coachingPrice: 120 });
  }
}
