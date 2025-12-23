import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function listAll() {
  const orgs = await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      subscription_plan_id: true,
      subscription_status: true,
      subscription_ends_at: true,
      cancel_at_period_end: true,
      stripe_subscription_id: true,
    },
    orderBy: {
      created_at: 'desc',
    },
    take: 10,
  });

  console.log(`📊 Found ${orgs.length} organizations:\n`);
  orgs.forEach((org, index) => {
    console.log(`${index + 1}. ${org.name} (${org.id})`);
    console.log(`   Email: ${org.email}`);
    console.log(`   Stripe Sub ID: ${org.stripe_subscription_id || 'none'}`);
    console.log(`   Plan ID: ${org.subscription_plan_id || 'none'}`);
    console.log(`   Status: ${org.subscription_status}`);
    console.log(`   Ends at: ${org.subscription_ends_at || 'null'}`);
    console.log(`   Cancel at end: ${org.cancel_at_period_end}`);
    console.log('');
  });

  await prisma.$disconnect();
}

listAll();
