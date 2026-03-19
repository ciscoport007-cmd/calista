import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, courtId, date, startTime, id } = body;

    if (action === "block") {
      if (!courtId || !date || !startTime) {
        return NextResponse.json({ error: "Missing courtId, date or startTime" }, { status: 400 });
      }
      const endTime = `${parseInt(startTime.split(":")[0]) + 1}:00`;
      const slot = await prisma.timeSlot.upsert({
        where: { courtId_date_startTime: { courtId, date, startTime } },
        update: { isBlocked: true },
        create: { courtId, date, startTime, endTime, isBlocked: true },
      });
      return NextResponse.json({ success: true, slot });
    }

    if (action === "unblock") {
      if (!id) return NextResponse.json({ error: "Missing slot ID" }, { status: 400 });
      const slot = await prisma.timeSlot.update({
        where: { id },
        data: { isBlocked: false },
      });
      return NextResponse.json({ success: true, slot });
    }

    return NextResponse.json({ error: "Invalid action. Use 'block' or 'unblock'." }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to process slot action" }, { status: 500 });
  }
}
