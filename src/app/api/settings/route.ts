import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            "equipmentPrice",
            "professionalEquipmentPrice",
            "ballsOnlyPrice",
            "coachingPrice",
            "professionalCoachingPrice",
          ],
        },
      },
    });
    const map = Object.fromEntries(rows.map((s) => [s.key, parseFloat(s.value)]));
    return NextResponse.json({
      equipmentPrice:             map["equipmentPrice"]             ?? 30,
      professionalEquipmentPrice: map["professionalEquipmentPrice"] ?? 50,
      ballsOnlyPrice:             map["ballsOnlyPrice"]             ?? 10,
      coachingPrice:              map["coachingPrice"]              ?? 120,
      professionalCoachingPrice:  map["professionalCoachingPrice"]  ?? 180,
    });
  } catch {
    return NextResponse.json({
      equipmentPrice: 30,
      professionalEquipmentPrice: 50,
      ballsOnlyPrice: 10,
      coachingPrice: 120,
      professionalCoachingPrice: 180,
    });
  }
}
