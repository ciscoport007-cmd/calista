import { prisma } from "@/lib/prisma";
import AdminDashboard from "./AdminDashboard";
import { startOfWeek, endOfWeek, format, subDays } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const bookings = await prisma.booking.findMany({
    include: { user: true, timeSlot: true, court: true },
    orderBy: { createdAt: "desc" },
  });

  const courts = await prisma.court.findMany({ orderBy: { sortOrder: "asc" } });

  const blockedSlots = await prisma.timeSlot.findMany({
    where: { isBlocked: true },
    include: { court: true },
    orderBy: { date: "asc" },
  });

  // Revenue calculations
  const activeBookings = bookings.filter((b) => b.status !== "cancelled");
  const totalRevenue = activeBookings.reduce((sum, b) => sum + b.totalPrice, 0);

  const today = format(new Date(), "yyyy-MM-dd");
  const todayRevenue = activeBookings
    .filter((b) => b.timeSlot.date === today)
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekRevenue = activeBookings
    .filter((b) => b.timeSlot.date >= weekStart && b.timeSlot.date <= weekEnd)
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const dailyRevenue: { date: string; revenue: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = format(subDays(new Date(), i), "yyyy-MM-dd");
    const rev = activeBookings
      .filter((b) => b.timeSlot.date === d)
      .reduce((sum, b) => sum + b.totalPrice, 0);
    dailyRevenue.push({ date: d, revenue: rev });
  }

  // Use Prisma client directly (regenerated, knows all models/fields)
  const settingsRows = await prisma.setting.findMany();
  const settings = Object.fromEntries(settingsRows.map((s) => [s.key, s.value]));

  const roomNumbers = await prisma.booking.findMany({
    select: { id: true, roomNumber: true },
  });
  const roomMap = Object.fromEntries(roomNumbers.map((r) => [r.id, r.roomNumber ?? ""]));

  return (
    <AdminDashboard
      bookings={bookings}
      blockedSlots={blockedSlots}
      courts={courts}
      totalRevenue={totalRevenue}
      todayRevenue={todayRevenue}
      weekRevenue={weekRevenue}
      dailyRevenue={dailyRevenue}
      settings={settings}
      roomMap={roomMap}
    />
  );
}
