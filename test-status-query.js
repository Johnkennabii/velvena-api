import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function testStatusQuery() {
  const activeStatuses = ["DRAFT", "PENDING", "PENDING_SIGNATURE", "SIGNED", "SIGNED_ELECTRONICALLY"];

  console.log('🧪 Testing different status query approaches...\n');

  // Approche 1: Prisma.join avec array direct (actuel - potentiellement bugué)
  try {
    console.log('1️⃣ Testing with Prisma.join(activeStatuses):');
    const result1 = await prisma.$queryRaw(
      Prisma.sql`SELECT COUNT(*) as count FROM contracts_full_view WHERE status IN (${Prisma.join(activeStatuses)})`
    );
    console.log('✅ Result:', result1);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Approche 2: Sans Prisma.join, interpolation directe
  try {
    console.log('\n2️⃣ Testing with direct interpolation:');
    const result2 = await prisma.$queryRaw(
      Prisma.sql`SELECT COUNT(*) as count FROM contracts_full_view WHERE status = ANY(${activeStatuses})`
    );
    console.log('✅ Result:', result2);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Approche 3: Map vers Prisma.sql fragments
  try {
    console.log('\n3️⃣ Testing with mapped Prisma.sql fragments:');
    const statusFragments = activeStatuses.map(status => Prisma.sql`${status}`);
    const result3 = await prisma.$queryRaw(
      Prisma.sql`SELECT COUNT(*) as count FROM contracts_full_view WHERE status IN (${Prisma.join(statusFragments, ',')})`
    );
    console.log('✅ Result:', result3);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Test avec un status spécifique
  console.log('\n🎯 Testing specific statuses:');
  for (const status of ['PENDING_SIGNATURE', 'SIGNED_ELECTRONICALLY']) {
    try {
      const result = await prisma.$queryRaw(
        Prisma.sql`SELECT COUNT(*) as count FROM contracts_full_view WHERE status = ${status}`
      );
      console.log(`  ${status}: ${result[0].count} contracts`);
    } catch (error) {
      console.log(`  ${status}: ❌ Error - ${error.message}`);
    }
  }

  await prisma.$disconnect();
}

testStatusQuery().catch(console.error);
