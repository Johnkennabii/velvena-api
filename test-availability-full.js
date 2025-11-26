import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function testFullAvailability() {
  const start = '2025-11-20T10:00:00.000Z';
  const end = '2025-11-21T10:00:00.000Z';

  const startDate = new Date(start);
  const endDate = new Date(end);

  const activeStatuses = ["DRAFT", "PENDING", "PENDING_SIGNATURE", "SIGNED", "SIGNED_ELECTRONICALLY"];

  console.log('🔍 Testing full availability query...\n');
  console.log('Query period:', start, 'to', end);
  console.log('Active statuses:', activeStatuses.join(', '));

  const conditions = [
    Prisma.sql`cf.deleted_at IS NULL`,
    Prisma.sql`cf.status IN (${Prisma.join(activeStatuses)})`,
    Prisma.sql`cf.end_datetime >= ${startDate}`,
  ];

  if (endDate) {
    conditions.push(Prisma.sql`cf.start_datetime <= ${endDate}`);
  }

  const occupiedRows = await prisma.$queryRaw(Prisma.sql`
    SELECT
      d->>'id' AS dress_id,
      cf.id AS contract_id,
      cf.status AS contract_status,
      cf.start_datetime,
      cf.end_datetime
    FROM contracts_full_view cf,
         jsonb_array_elements(cf.dresses::jsonb) AS d
    WHERE ${Prisma.join(conditions, " AND ")}
    ORDER BY cf.status, cf.start_datetime
  `);

  console.log('\n📊 Results by status:');
  const byStatus = {};
  occupiedRows.forEach(row => {
    if (!byStatus[row.contract_status]) {
      byStatus[row.contract_status] = [];
    }
    byStatus[row.contract_status].push(row);
  });

  for (const [status, rows] of Object.entries(byStatus)) {
    console.log(`\n${status}: ${rows.length} contracts`);
    rows.forEach(row => {
      console.log(`  - Contract ${row.contract_id.substring(0, 8)}...`);
      console.log(`    Dress: ${row.dress_id.substring(0, 8)}...`);
      console.log(`    Period: ${row.start_datetime.toISOString()} to ${row.end_datetime.toISOString()}`);
    });
  }

  console.log('\n📈 Total occupied rows:', occupiedRows.length);

  await prisma.$disconnect();
}

testFullAvailability().catch(console.error);
