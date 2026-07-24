import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { servicePrecautionDefaults } from "../lib/service-precaution-defaults";

const prisma = new PrismaClient();

async function main() {
  for (const [name, warning] of Object.entries(servicePrecautionDefaults)) {
    const services = await prisma.service.findMany({ where: { name: { equals: name, mode: "insensitive" } } });
    for (const service of services) {
      const hasExistingWarning = Boolean(service.bookingWarningTitle || service.bookingWarningIntro || service.bookingWarningInstructions || service.bookingWarningContact);
      if (hasExistingWarning) continue;
      await prisma.service.update({
        where: { id: service.id },
        data: {
          bookingWarningTitle: warning.title,
          bookingWarningIntro: warning.intro,
          bookingWarningInstructions: warning.instructions,
          bookingWarningContact: warning.contact,
          bookingWarningActive: true,
        },
      });
    }
  }

  if (await prisma.precautionDocument.count() === 0) {
    const fileName = "Viola_Brows_Beauty_Client_Pre_Procedure_Precautions.pdf";
    const filePath = path.join(process.cwd(), "prisma", "assets", fileName);
    const [fileData, fileStat] = await Promise.all([readFile(filePath), stat(filePath)]);
    await prisma.precautionDocument.create({
      data: {
        title: "Client Pre-Procedure Precautions",
        fileName,
        contentType: "application/pdf",
        fileSize: fileStat.size,
        fileData,
        isActive: true,
        activatedAt: new Date(),
      },
    });
  }
}

main().finally(() => prisma.$disconnect());
