import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const courts = await prisma.court.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ courts });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch courts" }, { status: 500 });
  }
}
