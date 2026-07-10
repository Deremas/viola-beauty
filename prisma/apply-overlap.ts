import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS btree_gist`);
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'no_overlapping_active_bookings'
      ) THEN
        ALTER TABLE "Booking"
        ADD CONSTRAINT no_overlapping_active_bookings
        EXCLUDE USING gist (
          tsrange("startDateTime", "endDateTime", '[)') WITH &&
        )
        WHERE (
          status IN ('PAYMENT_UPLOADED', 'CONFIRMED')
        );
      END IF;
    END
    $$;
  `);
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
