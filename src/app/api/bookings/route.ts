import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendBookingConfirmation } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      date, time, courtId, name, email, phone, roomNumber, guests,
      equipment, professionalEquipment, ballsOnly,
      coaching, professionalCoaching,
    } = body;

    if (!date || !time || !courtId || !name || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const court = await prisma.court.findUnique({ where: { id: courtId } });
    if (!court) {
      return NextResponse.json({ error: "Court not found" }, { status: 404 });
    }
    if (!court.isActive || court.isFull) {
      return NextResponse.json({ error: "This court is not available for booking" }, { status: 400 });
    }

    // Upsert user
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: { name, email, phone, ageConfirmed: true },
      });
    }

    // Check: max 1 active booking per user per day
    const existingUserBooking = await prisma.booking.findFirst({
      where: {
        userId: user.id,
        status: { not: "cancelled" },
        timeSlot: { date },
      },
    });
    if (existingUserBooking) {
      return NextResponse.json(
        { error: "You already have an active booking on this date." },
        { status: 400 }
      );
    }

    // Upsert timeslot for this court
    let timeSlot = await prisma.timeSlot.findUnique({
      where: { courtId_date_startTime: { courtId, date, startTime: time } },
    });

    if (timeSlot && timeSlot.isBlocked) {
      return NextResponse.json({ error: "Slot is blocked" }, { status: 400 });
    }

    if (!timeSlot) {
      const hour = parseInt(time.split(":")[0]);
      const endHour = hour + 1 >= 24 ? "00" : String(hour + 1).padStart(2, "0");
      timeSlot = await prisma.timeSlot.create({
        data: {
          courtId,
          date,
          startTime: time,
          endTime: `${endHour}:00`,
        },
      });
    }

    // Check slot availability
    const existingBooking = await prisma.booking.findFirst({
      where: { slotId: timeSlot.id, status: { not: "cancelled" } },
    });
    if (existingBooking) {
      return NextResponse.json({ error: "Slot is already booked" }, { status: 400 });
    }

    // Price calculation using court base price + DB add-on prices
    const addonSettings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            "equipmentPrice", "professionalEquipmentPrice", "ballsOnlyPrice",
            "coachingPrice", "professionalCoachingPrice",
          ],
        },
      },
    });
    const addonMap = Object.fromEntries(addonSettings.map((s) => [s.key, parseFloat(s.value)]));

    const base = court.basePrice;
    const subtotal =
      base +
      (equipment             ? (addonMap["equipmentPrice"]             ?? 30)  : 0) +
      (professionalEquipment ? (addonMap["professionalEquipmentPrice"] ?? 50)  : 0) +
      (ballsOnly             ? (addonMap["ballsOnlyPrice"]             ?? 10)  : 0) +
      (coaching              ? (addonMap["coachingPrice"]              ?? 120) : 0) +
      (professionalCoaching  ? (addonMap["professionalCoachingPrice"]  ?? 180) : 0);
    const serviceCharge = subtotal * 0.1;
    const gst = subtotal * 0.09;
    const totalPrice = Math.round((subtotal + serviceCharge + gst) * 100) / 100;

    const booking = await prisma.booking.create({
      data: {
        userId: user.id,
        slotId: timeSlot.id,
        courtId,
        equipmentRental:       equipment             ?? false,
        professionalEquipment: professionalEquipment ?? false,
        ballsOnly:             ballsOnly             ?? false,
        coaching:              coaching              ?? false,
        professionalCoaching:  professionalCoaching  ?? false,
        totalPrice,
        status: "pending",
      },
    });

    if (roomNumber) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { roomNumber },
      });
    }

    const ref = booking.id.split("-")[0].toUpperCase();
    await sendBookingConfirmation(
      user.email,
      user.name,
      date,
      time,
      court.name,
      ref,
      totalPrice
    );

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("Booking error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
