/**
 * Contract Template Controller
 * Gère les templates de contrats personnalisables
 */

import type { Response } from "express";
import prisma from "../lib/prisma.js";
import logger from "../lib/logger.js";
import { requireOrganizationContext } from "../utils/organizationHelper.js";
import type { AuthenticatedRequest } from "../types/express.js";
import { renderContractTemplate, validateTemplate } from "../services/templateRenderer.js";
import { templateRenderer } from "../services/unifiedTemplateRenderer.js";
import { prepareContractTemplateData } from "../services/templateDataService.js";

// 📌 Get all templates
export const getAllTemplates = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = requireOrganizationContext(req, res);
    if (!organizationId) return;

    const { contract_type_id, is_active } = req.query;

    const where: any = {
      deleted_at: null,
      OR: [
        { organization_id: organizationId }, // Templates de l'organisation
        { organization_id: null }, // Templates globaux
      ],
    };

    if (contract_type_id) {
      where.contract_type_id = String(contract_type_id);
    }

    if (is_active !== undefined) {
      where.is_active = is_active === "true";
    }

    const templates = await prisma.contractTemplate.findMany({
      where,
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
      orderBy: [
        { is_default: "desc" }, // Templates par défaut en premier
        { created_at: "desc" },
      ],
    });

    res.json({ success: true, data: templates });
  } catch (error) {
    logger.error(error, "Failed to fetch templates");
    res.status(500).json({ success: false, error: "Failed to fetch templates" });
  }
};

// 📌 Get template by ID
export const getTemplateById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "Template ID is required" });
    }

    const organizationId = requireOrganizationContext(req, res);
    if (!organizationId) return;

    const template = await prisma.contractTemplate.findFirst({
      where: {
        id,
        deleted_at: null,
        OR: [
          { organization_id: organizationId },
          { organization_id: null }, // Global templates
        ],
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

    if (!template) {
      return res.status(404).json({ success: false, error: "Template not found" });
    }

    res.json({ success: true, data: template });
  } catch (error) {
    logger.error(error, "Failed to fetch template");
    res.status(500).json({ success: false, error: "Failed to fetch template" });
  }
};

// 📌 Create template
export const createTemplate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const organizationId = requireOrganizationContext(req, res);
    if (!organizationId) return;

    const { name, description, contract_type_id, content, structure, is_default } = req.body;

    // Valider qu'au moins content OU structure est fourni
    if (!name || !contract_type_id || (!content && !structure)) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: name, contract_type_id, and either content or structure",
      });
    }

    // Valider le template selon le type
    if (content && !structure) {
      // Legacy: HTML avec Handlebars
      const validation = validateTemplate(content);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: `Invalid template syntax: ${validation.error}`,
        });
      }
    } else if (structure) {
      // Nouveau: Structure JSON
      if (!structure.version || !structure.metadata || !structure.sections) {
        return res.status(400).json({
          success: false,
          error: "Invalid template structure: missing version, metadata, or sections",
        });
      }
    }

    // Utiliser une transaction pour éviter les violations de contraintes
    const template = await prisma.$transaction(async (tx) => {
      // Si is_default est true, retirer le défaut des autres templates du même type
      if (is_default) {
        await tx.contractTemplate.updateMany({
          where: {
            contract_type_id,
            organization_id: organizationId,
            is_default: true,
            deleted_at: null,
          },
          data: { is_default: false },
        });
      }

      // Créer le nouveau template
      return await tx.contractTemplate.create({
        data: {
          name,
          description,
          contract_type_id,
          content: content || null,
          structure: structure || null,
          is_default: is_default || false,
          organization_id: organizationId,
          created_by: req.user?.id || null,
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
    });

    res.status(201).json({ success: true, data: template });
  } catch (error) {
    logger.error(error, "Failed to create template");
    // Log the full error details for debugging
    console.error("❌ Template creation error:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    res.status(500).json({
      success: false,
      error: "Failed to create template",
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

// 📌 Update template
export const updateTemplate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "Template ID is required" });
    }

    const organizationId = requireOrganizationContext(req, res);
    if (!organizationId) return;

    const { name, description, content, structure, is_active, is_default } = req.body;

    // Vérifier que le template existe et appartient à l'organisation
    const existing = await prisma.contractTemplate.findFirst({
      where: {
        id,
        organization_id: organizationId,
        deleted_at: null,
      },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: "Template not found" });
    }

    // Valider le nouveau contenu si fourni
    if (content && !structure) {
      // Legacy: HTML avec Handlebars
      const validation = validateTemplate(content);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: `Invalid template syntax: ${validation.error}`,
        });
      }
    } else if (structure) {
      // Nouveau: Structure JSON
      if (!structure.version || !structure.metadata || !structure.sections) {
        return res.status(400).json({
          success: false,
          error: "Invalid template structure: missing version, metadata, or sections",
        });
      }
    }

    // Utiliser une transaction pour éviter les violations de contraintes
    const template = await prisma.$transaction(async (tx) => {
      // Si on le définit comme défaut, retirer le défaut des autres
      if (is_default === true && !existing.is_default) {
        await tx.contractTemplate.updateMany({
          where: {
            contract_type_id: existing.contract_type_id,
            organization_id: organizationId,
            is_default: true,
            deleted_at: null,
            id: { not: id },
          },
          data: { is_default: false },
        });
      }

      // Mettre à jour le template
      return await tx.contractTemplate.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(content && { content }),
          ...(structure && { structure }),
          ...(is_active !== undefined && { is_active }),
          ...(is_default !== undefined && { is_default }),
          // Invalider le cache HTML si content ou structure change
          ...((content || structure) && { html_cache: null }),
          updated_by: req.user?.id || null,
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
    });

    res.json({ success: true, data: template });
  } catch (error) {
    logger.error(error, "Failed to update template");
    res.status(500).json({ success: false, error: "Failed to update template" });
  }
};

// 📌 Hard delete template (suppression définitive)
export const softDeleteTemplate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "Template ID is required" });
    }

    const organizationId = requireOrganizationContext(req, res);
    if (!organizationId) return;

    const existing = await prisma.contractTemplate.findFirst({
      where: {
        id,
        organization_id: organizationId,
      },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: "Template not found" });
    }

    // Vérifier si le template est utilisé par des contrats
    const contractsUsingTemplate = await prisma.contract.count({
      where: {
        template_id: id,
        deleted_at: null,
      },
    });

    if (contractsUsingTemplate > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete template: ${contractsUsingTemplate} contract(s) are using it`,
      });
    }

    // Hard delete - suppression physique définitive
    await prisma.contractTemplate.delete({
      where: { id },
    });

    logger.info({ templateId: id, templateName: existing.name }, "Template permanently deleted");

    res.json({ success: true, message: "Template permanently deleted" });
  } catch (error) {
    logger.error(error, "Failed to delete template");
    res.status(500).json({ success: false, error: "Failed to delete template" });
  }
};

// 📌 Duplicate template
export const duplicateTemplate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "Template ID is required" });
    }

    const organizationId = requireOrganizationContext(req, res);
    if (!organizationId) return;

    const original = await prisma.contractTemplate.findFirst({
      where: {
        id,
        deleted_at: null,
        OR: [
          { organization_id: organizationId },
          { organization_id: null },
        ],
      },
    });

    if (!original) {
      return res.status(404).json({ success: false, error: "Template not found" });
    }

    const duplicate = await prisma.contractTemplate.create({
      data: {
        name: `${original.name} (Copie)`,
        description: original.description,
        contract_type_id: original.contract_type_id,
        content: original.content,
        is_default: false, // Une copie n'est jamais par défaut
        organization_id: organizationId, // Toujours attribuer à l'org actuelle
        created_by: req.user?.id || null,
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

    res.status(201).json({ success: true, data: duplicate });
  } catch (error) {
    logger.error(error, "Failed to duplicate template");
    res.status(500).json({ success: false, error: "Failed to duplicate template" });
  }
};

// 📌 Preview template with contract data
export const previewTemplate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "Template ID is required" });
    }

    const { contract_id } = req.query;

    const organizationId = requireOrganizationContext(req, res);
    if (!organizationId) return;

    // Récupérer le template
    const template = await prisma.contractTemplate.findFirst({
      where: {
        id,
        deleted_at: null,
        OR: [
          { organization_id: organizationId },
          { organization_id: null },
        ],
      },
      include: {
        contract_type: true, // ✅ Inclure le type de contrat
      },
    });

    if (!template) {
      return res.status(404).json({ success: false, error: "Template not found" });
    }

    // Si un contract_id est fourni, utiliser ses données
    let contract;
    if (contract_id) {
      contract = await prisma.contract.findFirst({
        where: {
          id: String(contract_id),
          organization_id: organizationId,
          deleted_at: null,
        },
        include: {
          customer: true,
          contract_type: true,
          organization: true,
          package: {
            include: {
              addons: { include: { addon: true } },
            },
          },
          dresses: { include: { dress: true } },
          addon_links: { include: { addon: true } },
        },
      });

      if (!contract) {
        return res.status(404).json({ success: false, error: "Contract not found" });
      }
    } else {
      // Sinon, créer des données de démonstration
      contract = {
        customer: {
          firstname: "Sophie",
          lastname: "Martin",
          email: "sophie.martin@example.com",
          phone: "+33 6 12 34 56 78",
          address: "10 rue de Paris",
          city: "Paris",
          postal_code: "75001",
          country: "France",
        },
        contract_number: "CNT-DEMO-001",
        contract_type: {
          name: template.contract_type?.name || "Forfait",
        },
        start_datetime: new Date(),
        end_datetime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        created_at: new Date(),
        total_price_ttc: 2500,
        total_price_ht: 2083.33,
        account_ttc: 1250,
        account_paid_ttc: 1250,
        caution_ttc: 500,
        deposit_payment_method: "card",
        dresses: [],
        addon_links: [],
        package: null,
        organization: await prisma.organization.findUnique({
          where: { id: organizationId },
        }),
      };
    }

    // Préparer les données du contrat pour le template
    const templateData = prepareContractTemplateData(contract);

    // Rendre le template selon son type
    let html: string;
    if (template.structure) {
      // Nouveau système: Structure JSON
      html = templateRenderer.render(template.structure as any, templateData);
    } else if (template.content) {
      // Legacy: HTML avec Handlebars
      html = renderContractTemplate(template.content, contract);
    } else {
      return res.status(400).json({ success: false, error: "Template has no content or structure" });
    }

    res.json({ success: true, data: { html } });
  } catch (error) {
    logger.error(error, "Failed to preview template");
    res.status(500).json({ success: false, error: "Failed to preview template" });
  }
};

// 📌 Validate template syntax
export const validateTemplateSyntax = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, error: "Missing content field" });
    }

    const validation = validateTemplate(content);

    res.json({
      success: true,
      data: validation,
    });
  } catch (error) {
    logger.error(error, "Failed to validate template");
    res.status(500).json({ success: false, error: "Failed to validate template" });
  }
};
