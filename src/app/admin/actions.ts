"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { sendStatusChangeEmail } from "@/lib/email";

export async function loginAdmin(password: string) {
  if (password === (process.env.ADMIN_PASSWORD ?? "luxuryadmin")) {
    const cookieStore = await cookies();
    cookieStore.set("admin_token", "secret123", { httpOnly: true, path: "/" });
    return { success: true };
  }
  return { error: "Invalid password" };
}

export async function updateBookingStatus(id: string, status: string) {
  try {
    const booking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: { user: true, timeSlot: true, court: true },
    });

    await sendStatusChangeEmail(
      booking.user.email,
      booking.user.name,
      booking.timeSlot.date,
      booking.timeSlot.startTime,
      booking.court.name,
      status
    );

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Failed to update booking status" };
  }
}

export async function blockTimeSlot(courtId: string, date: string, startTime: string) {
  try {
    const hour = parseInt(startTime.split(":")[0]);
    const endTime = `${hour + 1 >= 24 ? "00" : String(hour + 1).padStart(2, "0")}:00`;
    await prisma.timeSlot.upsert({
      where: { courtId_date_startTime: { courtId, date, startTime } },
      update: { isBlocked: true },
      create: { courtId, date, startTime, endTime, isBlocked: true },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Failed to block time slot" };
  }
}

export async function unblockTimeSlot(id: string) {
  try {
    await prisma.timeSlot.update({
      where: { id },
      data: { isBlocked: false },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Failed to unblock slot" };
  }
}

export async function updateSetting(key: string, value: string) {
  try {
    await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Failed to save setting" };
  }
}

export async function updateCourtPrice(courtId: string, basePrice: number) {
  try {
    if (isNaN(basePrice) || basePrice < 0) {
      return { error: "Invalid price" };
    }
    await prisma.court.update({
      where: { id: courtId },
      data: { basePrice },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Failed to update price" };
  }
}
