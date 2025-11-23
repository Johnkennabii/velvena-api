import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkContract() {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: '6bbed9ce-a70b-4171-95de-c337959a2f15' },
      select: {
        id: true,
        contract_number: true,
        status: true,
        signed_at: true,
        signature_reference: true,
        signed_pdf_url: true,
      },
    });

    if (!contract) {
      console.log('❌ Contrat introuvable');
    } else {
      console.log('✅ Contrat trouvé:');
      console.log(JSON.stringify(contract, null, 2));
    }
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkContract();
