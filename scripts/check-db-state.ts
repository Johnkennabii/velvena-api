import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function checkDB() {
  const org = await prisma.organization.findFirst({
    where: {
      stripe_subscription_id: "sub_1ShCOORJ7PlLrfUPhG2A4d9F",
    },
    select: {
      id: true,
      name: true,
      subscription_plan_id: true,
      subscription_status: true,
      subscription_ends_at: true,
      cancel_at_period_end: true,
      stripe_subscription_id: true,
    },
  });

  console.log("📊 Current DB state:");
  console.log(JSON.stringify(org, null, 2));

  await prisma.$disconnect();
}

checkDB();
