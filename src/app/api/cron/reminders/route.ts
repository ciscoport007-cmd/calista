import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminderEmail } from "@/lib/email";
import { addDays, format } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");

    const upcomingBookings = await prisma.booking.findMany({
      where: {
        status: { in: ["confirmed", "pending"] },
        timeSlot: { date: tomorrow },
      },
      include: { user: true, timeSlot: true, court: true },
    });

    for (const booking of upcomingBookings) {
      await sendReminderEmail(
        booking.user.email,
        booking.user.name,
        booking.timeSlot.date,
        booking.timeSlot.startTime,
        booking.court.name
      );
    }

    return NextResponse.json({ success: true, processed: upcomingBookings.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to process reminders" }, { status: 500 });
  }
}
