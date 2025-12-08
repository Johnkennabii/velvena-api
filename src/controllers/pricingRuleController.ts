import type { Response } from "express";
import type { AuthenticatedRequest } from "../types/express.js";
import prisma from "../lib/prisma.js";
import logger from "../lib/logger.js";
import { withOrgOrGlobal, withOrgData } from "../utils/tenantHelper.js";
import { calculatePrice, findBestPricingRule, type PricingContext } from "../utils/pricingCalculator.js";

/**
 * GET /pricing-rules
 * Liste toutes les règles de pricing (globales + org-specific)
 */
export const getPricingRules = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(403).json({ error: "Organization context required" });
    }

    const { service_type_id, strategy } = req.query;

    const where: any = withOrgOrGlobal(req.user.organizationId, {
      deleted_at: null,
      is_active: true,
    });

    if (service_type_id) {
      where.AND.push({ service_type_id: service_type_id as string });
    }

    if (strategy) {
      where.AND.push({ strategy: strategy as string });
    }

    const pricingRules = await prisma.pricingRule.findMany({
      where,
      include: {
        service_type: true,
      },
      orderBy: [{ priority: "desc" }, { name: "asc" }],
    });

    res.json({
      success: true,
      data: pricingRules,
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to fetch pricing rules");
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /pricing-rules/:id
 * Récupère une règle de pricing par ID
 */
export const getPricingRuleById = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(403).json({ error: "Organization context required" });
    }

    const { id } = req.params;

    const pricingRule = await prisma.pricingRule.findFirst({
      where: {
        ...(id && { id }),
        OR: [
          { organization_id: req.user.organizationId },
          { organization_id: null },
        ],
        deleted_at: null,
      },
      include: {
        service_type: true,
      },
    });

    if (!pricingRule) {
      return res.status(404).json({
        success: false,
        error: "Pricing rule not found",
      });
    }

    res.json({
      success: true,
      data: pricingRule,
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to fetch pricing rule");
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /pricing-rules
 * Créer une nouvelle règle de pricing (org-specific)
 */
export const createPricingRule = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user?.organizationId || !req.user?.id) {
      return res.status(403).json({ error: "Organization context required" });
    }

    const {
      name,
      service_type_id,
      strategy,
      calculation_config,
      applies_to,
      priority = 0,
    } = req.body;

    if (!name || !strategy) {
      return res.status(400).json({
        success: false,
        error: "name and strategy are required",
      });
    }

    // Validate strategy
    const validStrategies = ["per_day", "flat_rate", "fixed_price", "tiered"];
    if (!validStrategies.includes(strategy)) {
      return res.status(400).json({
        success: false,
        error: `Invalid strategy. Must be one of: ${validStrategies.join(", ")}`,
      });
    }

    const pricingRule = await prisma.pricingRule.create({
      data: withOrgData(req.user.organizationId, req.user.id, {
        name,
        service_type_id: service_type_id || null,
        strategy,
        calculation_config,
        applies_to,
        priority,
        is_active: true,
      }),
      include: {
        service_type: true,
      },
    });

    logger.info(
      { pricingRuleId: pricingRule.id, organizationId: req.user.organizationId },
      "Pricing rule created"
    );

    res.status(201).json({
      success: true,
      data: pricingRule,
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to create pricing rule");
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * PUT /pricing-rules/:id
 * Mettre à jour une règle de pricing
 */
export const updatePricingRule = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user?.organizationId || !req.user?.id) {
      return res.status(403).json({ error: "Organization context required" });
    }

    const { id } = req.params;
    const {
      name,
      service_type_id,
      calculation_config,
      applies_to,
      priority,
      is_active,
    } = req.body;

    // Check ownership
    const existing = await prisma.pricingRule.findFirst({
      where: {
        ...(id && { id }),
        organization_id: req.user.organizationId,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: "Pricing rule not found or cannot be modified",
      });
    }

    const pricingRule = await prisma.pricingRule.update({
      where: { id: existing.id },
      data: withOrgData(
        req.user.organizationId,
        req.user.id,
        {
          name,
          service_type_id: service_type_id !== undefined ? service_type_id : undefined,
          calculation_config,
          applies_to,
          priority,
          is_active,
        },
        true
      ),
      include: {
        service_type: true,
      },
    });

    logger.info(
      { pricingRuleId: pricingRule.id, organizationId: req.user.organizationId },
      "Pricing rule updated"
    );

    res.json({
      success: true,
      data: pricingRule,
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to update pricing rule");
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * DELETE /pricing-rules/:id
 * Supprimer une règle de pricing (soft delete)
 */
export const deletePricingRule = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user?.organizationId || !req.user?.id) {
      return res.status(403).json({ error: "Organization context required" });
    }

    const { id } = req.params;

    const existing = await prisma.pricingRule.findFirst({
      where: {
        ...(id && { id }),
        organization_id: req.user.organizationId,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        error: "Pricing rule not found",
      });
    }

    await prisma.pricingRule.update({
      where: { id: existing.id },
      data: {
        deleted_at: new Date(),
        deleted_by: req.user.id,
      },
    });

    logger.info(
      { pricingRuleId: id, organizationId: req.user.organizationId },
      "Pricing rule deleted"
    );

    res.json({
      success: true,
      message: "Pricing rule deleted successfully",
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to delete pricing rule");
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /pricing-rules/calculate
 * Calculer le prix pour un contexte donné
 */
export const calculatePriceEndpoint = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(403).json({ error: "Organization context required" });
    }

    const {
      dress_id,
      start_date,
      end_date,
      pricing_rule_id,
      overrides,
    } = req.body;

    if (!dress_id || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: "dress_id, start_date, and end_date are required",
      });
    }

    // Get dress
    const dress = await prisma.dress.findFirst({
      where: {
        id: dress_id,
        organization_id: req.user.organizationId,
        deleted_at: null,
      },
      include: {
        type: true,
      },
    });

    if (!dress) {
      return res.status(404).json({
        success: false,
        error: "Dress not found",
      });
    }

    // Get organization business rules
    const organization = await prisma.organization.findUnique({
      where: { id: req.user.organizationId },
      select: { business_rules: true },
    });

    // Get pricing rule if specified, or find best matching rule
    let pricingRule;
    if (pricing_rule_id) {
      pricingRule = await prisma.pricingRule.findFirst({
        where: {
          id: pricing_rule_id,
          OR: [
            { organization_id: req.user.organizationId },
            { organization_id: null },
          ],
          is_active: true,
          deleted_at: null,
        },
      });
    } else {
      // Find best matching rule
      const allRules = await prisma.pricingRule.findMany({
        where: withOrgOrGlobal(req.user.organizationId, {
          is_active: true,
          deleted_at: null,
        }),
        orderBy: { priority: "desc" },
      });

      const startDate = new Date(start_date);
      const endDate = new Date(end_date);
      const durationDays = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      pricingRule = findBestPricingRule(allRules as any, {
        ...(dress.type?.name && { dress_type: dress.type.name }),
        duration_days: durationDays,
      });
    }

    // Build context
    const context: PricingContext = {
      dress: {
        id: dress.id,
        price_per_day_ht: dress.price_per_day_ht,
        price_per_day_ttc: dress.price_per_day_ttc,
        price_ht: dress.price_ht,
        price_ttc: dress.price_ttc,
      },
      rental: {
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        duration_days: 0, // Will be calculated
      },
      ...(pricingRule && {
        pricing_rule: {
          strategy: pricingRule.strategy as any,
          calculation_config: pricingRule.calculation_config,
          applies_to: pricingRule.applies_to,
        },
      }),
      business_rules: organization?.business_rules as any,
      overrides,
    };

    // Calculate price
    const result = calculatePrice(context);

    logger.info(
      {
        dressId: dress.id,
        organizationId: req.user.organizationId,
        strategy: result.strategy_used,
      },
      "Price calculated"
    );

    res.json({
      success: true,
      data: {
        ...result,
        pricing_rule_used: pricingRule
          ? {
              id: pricingRule.id,
              name: pricingRule.name,
              strategy: pricingRule.strategy,
            }
          : null,
        dress: {
          id: dress.id,
          name: dress.name,
          reference: dress.reference,
        },
      },
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to calculate price");
    res.status(500).json({ success: false, error: err.message });
  }
};
