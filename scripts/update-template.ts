import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import prisma from "../src/lib/prisma.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../.env") });

async function updateTemplate() {
  try {
    // Lire le template corrigé
    const templatePath = join(__dirname, "../TEMPLATE_CORRECTED.html");
    const content = fs.readFileSync(templatePath, "utf-8");

    console.log("📄 Template content loaded");
    console.log(`Content length: ${content.length} characters`);

    // ID du template à mettre à jour
    const templateId = "2f63b5a2-ef1a-4183-a2e3-66df8a5700cd";

    // Mettre à jour le template
    console.log(`Updating template ${templateId}...`);
    const template = await prisma.contractTemplate.update({
      where: { id: templateId },
      data: {
        content: content,
        name: "Contrat de Location",
        description: "Template de contrat de location avec clauses standards (corrigé)",
        version: { increment: 1 },
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

    console.log("✅ Template updated successfully!");
    console.log(JSON.stringify({
      id: template.id,
      name: template.name,
      version: template.version,
      contract_type: template.contract_type?.name,
      organization: template.organization?.name,
    }, null, 2));

  } catch (error: any) {
    console.error("❌ Error updating template:");
    console.error(error);
    if (error.meta) {
      console.error("Meta:", error.meta);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateTemplate();
