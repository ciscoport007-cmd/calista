import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const defaults = [
    { key: "equipmentPrice", value: "30" },
    { key: "professionalEquipmentPrice", value: "50" },
    { key: "ballsOnlyPrice", value: "10" },
    { key: "coachingPrice", value: "120" },
    { key: "professionalCoachingPrice", value: "180" },
    { key: "gmailUser", value: "" },
    { key: "gmailPass", value: "" },
  ];
  for (const s of defaults) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  const all = await prisma.setting.findMany();
  console.log("Settings:", all);
}

main().finally(() => prisma.$disconnect());
