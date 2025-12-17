/**
 * POC Controller - Unified Template System
 *
 * Endpoint de démonstration du nouveau système de templates
 */

import type { Response } from "express";
import type { AuthenticatedRequest } from "../types/express.js";
import { templateRenderer, type TemplateStructure } from "../services/unifiedTemplateRenderer.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import prisma from "../lib/prisma.js";
import { prepareContractTemplateData } from "../services/templateDataService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Endpoint POC: Rendre un template JSON avec des données de démo
 */
export const renderDemoTemplate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // 1. Charger le template JSON d'exemple
    const templatePath = path.join(
      __dirname,
      "../../examples/template-location-simple.json"
    );
    const templateContent = fs.readFileSync(templatePath, "utf-8");
    const templateStructure: TemplateStructure = JSON.parse(templateContent);

    // 2. Données de démonstration
    const demoData = {
      // Contrat
      contract_number: "CT-2025-DEMO-001",
      created_at: "15/01/2025",
      start_datetime: "20/02/2025 14:00",
      end_datetime: "22/02/2025 18:00",
      contract_type_name: "Location",
      status: "draft",
      deposit_payment_method: "Carte bancaire",

      // Prix
      total_price_ht: "1200.00",
      total_price_ttc: "1440.00",
      account_ht: "600.00",
      account_ttc: "720.00",
      account_paid_ht: "600.00",
      account_paid_ttc: "720.00",
      caution_ht: "500.00",
      caution_ttc: "600.00",
      caution_paid_ht: "0.00",
      caution_paid_ttc: "0.00",

      // Client
      customer_firstname: "Marie",
      customer_lastname: "Dupont",
      customer_email: "marie.dupont@example.com",
      customer_phone: "06 12 34 56 78",
      customer_address: "123 rue de la Paix",
      customer_postal_code: "75001",
      customer_city: "Paris",
      customer_country: "France",
      customer_birthday: null,

      // Organisation
      org: {
        name: "VELVENA",
        address: "456 avenue des Champs",
        city: "Paris 75008",
        phone: "01 23 45 67 89",
        email: "contact@velvena.com",
        siret: "123 456 789 00012",
        managerFullName: "Jean Martin",
      },

      // Robes
      dresses: [
        {
          name: "Robe Mariée Princesse",
          reference: "RM-001",
          type_name: "Mariée",
          size_name: "38",
          color_name: "Blanc ivoire",
          condition_name: "Neuf",
          price_ht: "800.00",
          price_ttc: "960.00",
        },
        {
          name: "Robe de Soirée Sirène",
          reference: "RS-045",
          type_name: "Soirée",
          size_name: "40",
          color_name: "Rouge",
          condition_name: "Excellent",
          price_ht: "400.00",
          price_ttc: "480.00",
        },
      ],

      // Options
      addons: [
        {
          name: "Voile cathédrale",
          price_ttc: "150.00",
          included: false,
        },
        {
          name: "Retouches",
          price_ttc: "0.00",
          included: true,
        },
      ],
    };

    // 3. Rendre le template
    const html = templateRenderer.render(templateStructure, demoData);

    // 4. Retourner le HTML
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error: any) {
    console.error("Error rendering demo template:", error);
    res.status(500).json({
      success: false,
      error: "Failed to render demo template",
      details: error.message,
    });
  }
};

/**
 * Endpoint POC: Rendre un template JSON avec un vrai contrat
 */
export const renderTemplateWithContract = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { contractId } = req.params;

    if (!contractId) {
      return res.status(400).json({
        success: false,
        error: "Contract ID is required",
      });
    }

    // 1. Récupérer le contrat avec toutes ses relations
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        customer: true,
        contract_type: true,
        organization: true,
        package: {
          include: { addons: { include: { addon: true } } },
        },
        dresses: {
          include: {
            dress: {
              include: {
                type: true,
                size: true,
                color: true,
                condition: true,
              },
            },
          },
        },
        addon_links: { include: { addon: true } },
      },
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        error: "Contract not found",
      });
    }

    // 2. Charger le template JSON d'exemple
    const templatePath = path.join(
      __dirname,
      "../../examples/template-location-simple.json"
    );
    const templateContent = fs.readFileSync(templatePath, "utf-8");
    const templateStructure: TemplateStructure = JSON.parse(templateContent);

    // 3. Préparer les données du contrat
    const contractData = prepareContractTemplateData(contract);

    // 4. Rendre le template
    const html = templateRenderer.render(templateStructure, contractData);

    // 5. Retourner le HTML
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  } catch (error: any) {
    console.error("Error rendering template with contract:", error);
    res.status(500).json({
      success: false,
      error: "Failed to render template with contract",
      details: error.message,
    });
  }
};

/**
 * Endpoint POC: Obtenir le template JSON (pour édition frontend)
 */
export const getTemplateStructure = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const templatePath = path.join(
      __dirname,
      "../../examples/template-location-simple.json"
    );
    const templateContent = fs.readFileSync(templatePath, "utf-8");
    const templateStructure: TemplateStructure = JSON.parse(templateContent);

    res.json({
      success: true,
      data: templateStructure,
    });
  } catch (error: any) {
    console.error("Error loading template structure:", error);
    res.status(500).json({
      success: false,
      error: "Failed to load template structure",
      details: error.message,
    });
  }
};

/**
 * Endpoint POC: Sauvegarder un template JSON (simulé)
 */
export const saveTemplateStructure = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { structure } = req.body;

    if (!structure) {
      return res.status(400).json({
        success: false,
        error: "Template structure is required",
      });
    }

    // Valider la structure
    if (!structure.version || !structure.metadata || !structure.sections) {
      return res.status(400).json({
        success: false,
        error: "Invalid template structure",
      });
    }

    // Dans un vrai système, on sauvegarderait en DB
    // Pour le POC, on retourne juste la structure
    res.json({
      success: true,
      message: "Template structure validated successfully",
      data: structure,
    });
  } catch (error: any) {
    console.error("Error saving template structure:", error);
    res.status(500).json({
      success: false,
      error: "Failed to save template structure",
      details: error.message,
    });
  }
};
