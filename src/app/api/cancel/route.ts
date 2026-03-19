import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendCancellationNotice } from "@/lib/email";

export const dynamic = "force-dynamic";

// GET /api/cancel?ref=ABCD1234&email=user@example.com
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("ref")?.toLowerCase();
  const email = searchParams.get("email")?.toLowerCase();

  if (!ref || !email) {
    return NextResponse.json({ error: "ref and email are required" }, { status: 400 });
  }

  try {
    const bookings = await prisma.booking.findMany({
      where: { user: { email } },
      include: { user: true, timeSlot: true, court: true },
      orderBy: { createdAt: "desc" },
    });

    const booking = bookings.find(
      (b) => b.id.split("-")[0].toLowerCase() === ref
    );

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/cancel — cancel a booking
export async function POST(request: Request) {
  try {
    const { bookingId, email } = await request.json();

    if (!bookingId || !email) {
      return NextResponse.json({ error: "bookingId and email required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true, timeSlot: true, court: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.user.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (booking.status === "cancelled") {
      return NextResponse.json({ error: "Booking is already cancelled" }, { status: 400 });
    }

    if (booking.status === "completed") {
      return NextResponse.json({ error: "Cannot cancel a completed booking" }, { status: 400 });
    }

    // Check 24-hour cancellation policy
    const bookingDateTime = new Date(
      `${booking.timeSlot.date}T${booking.timeSlot.startTime}:00`
    );
    const hoursUntilBooking =
      (bookingDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
    const isLateCancellation = hoursUntilBooking < 24;

    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "cancelled" },
    });

    await sendCancellationNotice(
      booking.user.email,
      booking.user.name,
      booking.timeSlot.date,
      booking.timeSlot.startTime,
      booking.court.name
    );

    return NextResponse.json({
      success: true,
      isLateCancellation,
      message: isLateCancellation
        ? "Your booking has been cancelled. Note: Late cancellations (within 24 hours) are subject to full charge."
        : "Your booking has been cancelled successfully.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
