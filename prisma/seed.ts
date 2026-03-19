import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Delete existing courts to avoid duplicates
  await prisma.booking.deleteMany();
  await prisma.timeSlot.deleteMany();
  await prisma.court.deleteMany();

  await prisma.court.createMany({
    data: [
      {
        id: "court-hard-1",
        name: "Hard Court",
        type: "hard",
        description: "Professional-grade hard court with premium acrylic surface.",
        isActive: false,
        isFull: true,
        basePrice: 65,
        sortOrder: 1,
      },
      {
        id: "court-clay-1",
        name: "Toprak Kort 1",
        type: "clay",
        description: "Classic red clay court — ideal for baseline players.",
        isActive: true,
        isFull: false,
        basePrice: 50,
        sortOrder: 2,
      },
      {
        id: "court-clay-2",
        name: "Toprak Kort 2",
        type: "clay",
        description: "Classic red clay court — ideal for baseline players.",
        isActive: true,
        isFull: false,
        basePrice: 50,
        sortOrder: 3,
      },
      {
        id: "court-clay-3",
        name: "Toprak Kort 3",
        type: "clay",
        description: "Classic red clay court — ideal for baseline players.",
        isActive: true,
        isFull: false,
        basePrice: 50,
        sortOrder: 4,
      },
      {
        id: "court-padel-1",
        name: "Pro Panoramic Padel Court 1",
        type: "padel",
        description: "360° glass panoramic padel court with breathtaking views.",
        isActive: true,
        isFull: false,
        basePrice: 70,
        sortOrder: 5,
      },
      {
        id: "court-padel-2",
        name: "Pro Panoramic Padel Court 2",
        type: "padel",
        description: "360° glass panoramic padel court with breathtaking views.",
        isActive: true,
        isFull: false,
        basePrice: 70,
        sortOrder: 6,
      },
    ],
  });

  console.log("✅ 6 courts seeded successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
