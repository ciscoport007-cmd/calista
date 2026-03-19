import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ALL_SLOTS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
  "19:00", "20:00", "21:00", "22:00", "23:00"
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const courtId = searchParams.get("courtId");

  if (!date || !courtId) {
    return NextResponse.json({ error: "Date and courtId are required" }, { status: 400 });
  }

  try {
    const court = await prisma.court.findUnique({ where: { id: courtId } });
    if (!court) {
      return NextResponse.json({ error: "Court not found" }, { status: 404 });
    }

    // Hard court or inactive courts have no available slots
    if (!court.isActive || court.isFull) {
      return NextResponse.json({
        slots: ALL_SLOTS.map((time) => ({ time, available: false })),
      });
    }

    const bookedOrBlockedSlots = await prisma.timeSlot.findMany({
      where: { courtId, date },
      include: { bookings: { where: { status: { not: "cancelled" } } } },
    });

    const unavailableTimes = bookedOrBlockedSlots
      .filter((s) => s.isBlocked || s.bookings.length > 0)
      .map((s) => s.startTime);

    const slots = ALL_SLOTS.map((time) => ({
      time,
      available: !unavailableTimes.includes(time),
    }));

    return NextResponse.json({ slots });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch slots" }, { status: 500 });
  }
}
