import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import prisma from "../src/lib/prisma.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../.env") });

async function checkSystemHealth() {
  try {
    console.log("🏥 Vérification de la santé du système de templates...\n");
    console.log("═".repeat(70));

    // 1. Statistiques générales
    const allTemplates = await prisma.contractTemplate.findMany({
      where: { deleted_at: null },
      include: {
        contract_type: { select: { name: true } },
        organization: { select: { name: true } },
      },
    });

    const jsonTemplates = allTemplates.filter(t => t.structure !== null);
    const htmlTemplates = allTemplates.filter(t => t.content !== null && t.structure === null);
    const cachedTemplates = allTemplates.filter(t => t.html_cache !== null);
    const defaultTemplates = allTemplates.filter(t => t.is_default);

    console.log("\n📊 STATISTIQUES GLOBALES\n");
    console.log(`   Total templates actifs : ${allTemplates.length}`);
    console.log(`   ✨ Templates JSON (nouveau) : ${jsonTemplates.length}`);
    console.log(`   📜 Templates HTML (legacy) : ${htmlTemplates.length}`);
    console.log(`   💾 Templates avec cache : ${cachedTemplates.length}`);
    console.log(`   ⭐ Templates par défaut : ${defaultTemplates.length}`);

    // 2. Détails des templates
    console.log("\n\n📋 DÉTAILS DES TEMPLATES\n");
    console.log("═".repeat(70));

    for (const template of allTemplates) {
      const type = template.structure ? "JSON ✨" : template.content ? "HTML 📜" : "VIDE ⚠️";
      const cached = template.html_cache ? "✅" : "❌";
      const isDefault = template.is_default ? "⭐" : "  ";

      console.log(`\n${isDefault} ${template.name}`);
      console.log(`   ID: ${template.id}`);
      console.log(`   Type: ${type}`);
      console.log(`   Version: ${template.version}`);
      console.log(`   Cache HTML: ${cached}`);
      console.log(`   Contract Type: ${template.contract_type?.name || "N/A"}`);
      console.log(`   Organization: ${template.organization?.name || "Global"}`);
      console.log(`   Actif: ${template.is_active ? "✅" : "❌"}`);

      if (template.structure) {
        const structure = template.structure as any;
        console.log(`   Sections JSON: ${structure.sections?.length || 0}`);
      }
    }

    // 3. Vérifications de santé
    console.log("\n\n🔍 VÉRIFICATIONS DE SANTÉ\n");
    console.log("═".repeat(70));

    const checks = [];

    // Check 1: Templates sans contenu
    const emptyTemplates = allTemplates.filter(t => !t.structure && !t.content);
    if (emptyTemplates.length === 0) {
      checks.push({ status: "✅", message: "Tous les templates ont du contenu" });
    } else {
      checks.push({
        status: "⚠️",
        message: `${emptyTemplates.length} template(s) vide(s) trouvé(s)`,
        details: emptyTemplates.map(t => t.name),
      });
    }

    // Check 2: Migration JSON
    const migrationPercentage = allTemplates.length > 0
      ? Math.round((jsonTemplates.length / allTemplates.length) * 100)
      : 0;

    if (migrationPercentage === 100) {
      checks.push({ status: "✅", message: "Migration JSON complète à 100%" });
    } else if (migrationPercentage >= 50) {
      checks.push({ status: "⚠️", message: `Migration JSON à ${migrationPercentage}%` });
    } else {
      checks.push({ status: "❌", message: `Migration JSON seulement à ${migrationPercentage}%` });
    }

    // Check 3: Cache HTML
    const cachePercentage = jsonTemplates.length > 0
      ? Math.round((cachedTemplates.length / jsonTemplates.length) * 100)
      : 0;

    if (cachePercentage >= 80) {
      checks.push({ status: "✅", message: `Cache HTML à ${cachePercentage}%` });
    } else if (cachePercentage >= 50) {
      checks.push({ status: "⚠️", message: `Cache HTML à ${cachePercentage}% (peut être amélioré)` });
    } else {
      checks.push({ status: "ℹ️", message: `Cache HTML à ${cachePercentage}% (se remplira automatiquement)` });
    }

    // Check 4: Templates par défaut
    const contractTypes = await prisma.contractType.findMany({
      where: { deleted_at: null },
    });

    const typesWithoutDefault = [];
    for (const type of contractTypes) {
      const hasDefault = defaultTemplates.some(t => t.contract_type_id === type.id);
      if (!hasDefault) {
        typesWithoutDefault.push(type.name);
      }
    }

    if (typesWithoutDefault.length === 0) {
      checks.push({ status: "✅", message: "Tous les types de contrats ont un template par défaut" });
    } else {
      checks.push({
        status: "⚠️",
        message: `${typesWithoutDefault.length} type(s) sans template par défaut`,
        details: typesWithoutDefault,
      });
    }

    // Afficher les résultats
    for (const check of checks) {
      console.log(`\n${check.status} ${check.message}`);
      if (check.details) {
        for (const detail of check.details) {
          console.log(`     - ${detail}`);
        }
      }
    }

    // 4. Recommandations
    console.log("\n\n💡 RECOMMANDATIONS\n");
    console.log("═".repeat(70));

    const recommendations = [];

    if (htmlTemplates.length > 0) {
      recommendations.push(
        `📝 Convertir les ${htmlTemplates.length} template(s) HTML restant(s) en JSON`,
        `   Commande: npx tsx scripts/convert-all-templates-to-json.ts`
      );
    }

    if (typesWithoutDefault.length > 0) {
      recommendations.push(
        `⭐ Créer des templates par défaut pour: ${typesWithoutDefault.join(", ")}`,
        `   Utiliser: POST /contract-templates avec is_default: true`
      );
    }

    if (cachePercentage < 100 && jsonTemplates.length > 0) {
      recommendations.push(
        `💾 Le cache HTML se remplira automatiquement lors de la génération de PDFs`,
        `   Rien à faire, le système est automatique`
      );
    }

    if (recommendations.length === 0) {
      console.log("\n🎉 Aucune recommandation ! Le système est optimal.");
    } else {
      for (const rec of recommendations) {
        console.log(`\n${rec}`);
      }
    }

    // 5. Statut global
    console.log("\n\n🎯 STATUT GLOBAL\n");
    console.log("═".repeat(70));

    const criticalIssues = checks.filter(c => c.status === "❌").length;
    const warnings = checks.filter(c => c.status === "⚠️").length;

    if (criticalIssues > 0) {
      console.log("\n❌ CRITIQUE - Actions requises\n");
    } else if (warnings > 0) {
      console.log("\n⚠️  ATTENTION - Améliorations recommandées\n");
    } else {
      console.log("\n✅ EXCELLENT - Système en parfait état\n");
    }

    console.log(`   Templates actifs: ${allTemplates.length}`);
    console.log(`   Migration JSON: ${migrationPercentage}%`);
    console.log(`   Cache: ${cachePercentage}%`);
    console.log(`   Problèmes critiques: ${criticalIssues}`);
    console.log(`   Avertissements: ${warnings}`);

    console.log("\n" + "═".repeat(70));
    console.log("\n✅ Vérification terminée !\n");

  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkSystemHealth();
