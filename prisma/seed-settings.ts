import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const defaults = [
    { key: "equipmentPrice", value: "30" },
    { key: "coachingPrice", value: "120" },
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
