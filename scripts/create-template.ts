import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import prisma from "../src/lib/prisma.js";
import logger from "../src/lib/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../.env") });

async function createTemplate() {
  try {
    // Lire le template corrigé
    const templatePath = join(__dirname, "../TEMPLATE_CORRECTED.html");
    const content = fs.readFileSync(templatePath, "utf-8");

    console.log("📄 Template content loaded");
    console.log(`Content length: ${content.length} characters`);

    // Récupérer le ContractType "Location"
    const contractType = await prisma.contractType.findFirst({
      where: { name: "Location" },
    });

    if (!contractType) {
      console.error("❌ ContractType 'Location' not found");
      process.exit(1);
    }

    console.log(`✅ Found ContractType: ${contractType.name} (${contractType.id})`);

    // Récupérer une organisation
    const organization = await prisma.organization.findFirst({
      where: { is_active: true, deleted_at: null },
    });

    if (!organization) {
      console.error("❌ No active organization found");
      process.exit(1);
    }

    console.log(`✅ Found Organization: ${organization.name} (${organization.id})`);

    // Créer le template
    console.log("Creating template...");
    const template = await prisma.contractTemplate.create({
      data: {
        name: "Contrat Location Standard",
        description: "Template de contrat de location avec clauses standards",
        contract_type_id: contractType.id,
        content: content,
        is_default: true,
        is_active: true,
        organization_id: organization.id,
        created_by: null,
      },
      include: {
        contract_type: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    console.log("✅ Template created successfully!");
    console.log(JSON.stringify({
      id: template.id,
      name: template.name,
      contract_type: template.contract_type?.name,
      organization: template.organization?.name,
    }, null, 2));

  } catch (error: any) {
    console.error("❌ Error creating template:");
    console.error(error);
    if (error.meta) {
      console.error("Meta:", error.meta);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTemplate();
