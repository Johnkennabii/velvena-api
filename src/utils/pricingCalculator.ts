/**
 * Pricing Calculator - Système de calcul de prix configurable
 *
 * Supporte plusieurs stratégies de pricing :
 * - per_day: Prix par jour (prix_par_jour × nombre_de_jours)
 * - flat_rate: Forfait période (weekend, semaine, mois)
 * - fixed_price: Prix fixe
 * - tiered: Prix dégressif selon durée
 */

import { Decimal } from "@prisma/client/runtime/library";

// ============================================
// TYPES
// ============================================

export type PricingStrategy = "per_day" | "flat_rate" | "fixed_price" | "tiered";

export interface PricingContext {
  // Dress information
  dress: {
    id: string;
    price_per_day_ht: Decimal;
    price_per_day_ttc: Decimal;
    price_ht?: Decimal; // Prix total (pour vente)
    price_ttc?: Decimal;
  };

  // Rental period
  rental: {
    start_date: Date;
    end_date: Date;
    duration_days: number;
  };

  // Pricing rule to apply
  pricing_rule?: {
    strategy: PricingStrategy;
    calculation_config: any;
    applies_to?: any;
  };

  // Organization business rules
  business_rules?: {
    pricing?: {
      tax_rate?: number;
      currency?: string;
      default_strategy?: PricingStrategy;
    };
  };

  // Optional custom overrides
  overrides?: {
    price_ht?: number;
    price_ttc?: number;
    discount_percentage?: number;
  };
}

export interface PricingResult {
  strategy_used: PricingStrategy;
  base_price_ht: number;
  base_price_ttc: number;
  discount_amount?: number;
  discount_percentage?: number;
  final_price_ht: number;
  final_price_ttc: number;
  tax_amount: number;
  tax_rate: number;
  duration_days: number;
  breakdown: {
    description: string;
    amount_ht: number;
    amount_ttc: number;
  }[];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function decimalToNumber(value: Decimal): number {
  return parseFloat(value.toString());
}

function calculateDays(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 0 ? 1 : diffDays; // Au moins 1 jour
}

function roundPrice(value: number, rounding: "up" | "down" | "nearest" = "nearest"): number {
  switch (rounding) {
    case "up":
      return Math.ceil(value * 100) / 100;
    case "down":
      return Math.floor(value * 100) / 100;
    case "nearest":
    default:
      return Math.round(value * 100) / 100;
  }
}

function applyTax(amountHT: number, taxRate: number): number {
  return roundPrice(amountHT * (1 + taxRate / 100));
}

// ============================================
// PRICING STRATEGIES
// ============================================

/**
 * Strategy: Per Day
 * Prix total = prix_par_jour × nombre_de_jours
 */
function calculatePerDay(context: PricingContext): PricingResult {
  const config = context.pricing_rule?.calculation_config || {};
  const taxRate = config.tax_rate ?? context.business_rules?.pricing?.tax_rate ?? 20;
  const rounding = config.rounding || "nearest";

  const pricePerDayHT = decimalToNumber(context.dress.price_per_day_ht);
  const days = context.rental.duration_days;

  let basePriceHT = pricePerDayHT * days;

  // Apply discount if any
  let discountAmount = 0;
  let discountPercentage = 0;

  if (context.overrides?.discount_percentage) {
    discountPercentage = context.overrides.discount_percentage;
    discountAmount = basePriceHT * (discountPercentage / 100);
    basePriceHT -= discountAmount;
  }

  const finalPriceHT = roundPrice(basePriceHT, rounding);
  const finalPriceTTC = applyTax(finalPriceHT, taxRate);
  const taxAmount = finalPriceTTC - finalPriceHT;

  return {
    strategy_used: "per_day",
    base_price_ht: pricePerDayHT * days,
    base_price_ttc: applyTax(pricePerDayHT * days, taxRate),
    discount_amount: discountAmount > 0 ? roundPrice(discountAmount) : 0,
    discount_percentage: discountPercentage > 0 ? discountPercentage : 0,
    final_price_ht: finalPriceHT,
    final_price_ttc: finalPriceTTC,
    tax_amount: taxAmount,
    tax_rate: taxRate,
    duration_days: days,
    breakdown: [
      {
        description: `Location ${days} jour(s) à ${pricePerDayHT}€/jour`,
        amount_ht: pricePerDayHT * days,
        amount_ttc: applyTax(pricePerDayHT * days, taxRate),
      },
      ...(discountAmount > 0
        ? [
            {
              description: `Réduction ${discountPercentage}%`,
              amount_ht: -discountAmount,
              amount_ttc: -applyTax(discountAmount, taxRate),
            },
          ]
        : []),
    ],
  };
}

/**
 * Strategy: Flat Rate
 * Prix total = prix_par_jour (forfait période)
 * Ex: forfait weekend = 1x prix_par_jour, peu importe la durée
 */
function calculateFlatRate(context: PricingContext): PricingResult {
  const config = context.pricing_rule?.calculation_config || {};
  const taxRate = config.tax_rate ?? context.business_rules?.pricing?.tax_rate ?? 20;
  const rounding = config.rounding || "nearest";
  const multiplier = config.fixed_multiplier ?? 1.0;
  const period = config.applies_to_period || "period";

  const pricePerDayHT = decimalToNumber(context.dress.price_per_day_ht);
  const basePriceHT = pricePerDayHT * multiplier;

  const finalPriceHT = roundPrice(basePriceHT, rounding);
  const finalPriceTTC = applyTax(finalPriceHT, taxRate);
  const taxAmount = finalPriceTTC - finalPriceHT;

  return {
    strategy_used: "flat_rate",
    base_price_ht: basePriceHT,
    base_price_ttc: applyTax(basePriceHT, taxRate),
    final_price_ht: finalPriceHT,
    final_price_ttc: finalPriceTTC,
    tax_amount: taxAmount,
    tax_rate: taxRate,
    duration_days: context.rental.duration_days,
    breakdown: [
      {
        description: `Forfait ${period} (${context.rental.duration_days} jours)`,
        amount_ht: basePriceHT,
        amount_ttc: applyTax(basePriceHT, taxRate),
      },
    ],
  };
}

/**
 * Strategy: Fixed Price
 * Prix total = forfait fixe défini
 */
function calculateFixedPrice(context: PricingContext): PricingResult {
  const config = context.pricing_rule?.calculation_config || {};
  const taxRate = config.tax_rate ?? context.business_rules?.pricing?.tax_rate ?? 20;

  // Use override if provided, otherwise use config, fallback to dress price
  let finalPriceHT: number;
  let finalPriceTTC: number;

  if (context.overrides?.price_ht && context.overrides?.price_ttc) {
    finalPriceHT = context.overrides.price_ht;
    finalPriceTTC = context.overrides.price_ttc;
  } else if (config.fixed_amount_ht && config.fixed_amount_ttc) {
    finalPriceHT = config.fixed_amount_ht;
    finalPriceTTC = config.fixed_amount_ttc;
  } else if (context.dress.price_ht && context.dress.price_ttc) {
    finalPriceHT = decimalToNumber(context.dress.price_ht);
    finalPriceTTC = decimalToNumber(context.dress.price_ttc);
  } else {
    // Fallback to per_day price
    finalPriceHT = decimalToNumber(context.dress.price_per_day_ht);
    finalPriceTTC = applyTax(finalPriceHT, taxRate);
  }

  const taxAmount = finalPriceTTC - finalPriceHT;

  return {
    strategy_used: "fixed_price",
    base_price_ht: finalPriceHT,
    base_price_ttc: finalPriceTTC,
    final_price_ht: finalPriceHT,
    final_price_ttc: finalPriceTTC,
    tax_amount: taxAmount,
    tax_rate: taxRate,
    duration_days: context.rental.duration_days,
    breakdown: [
      {
        description: `Forfait fixe (${context.rental.duration_days} jours)`,
        amount_ht: finalPriceHT,
        amount_ttc: finalPriceTTC,
      },
    ],
  };
}

/**
 * Strategy: Tiered
 * Prix dégressif selon la durée
 * Ex: 1-3 jours = 0%, 4-7 jours = -10%, 8+ jours = -20%
 */
function calculateTiered(context: PricingContext): PricingResult {
  const config = context.pricing_rule?.calculation_config || {};
  const taxRate = config.tax_rate ?? context.business_rules?.pricing?.tax_rate ?? 20;
  const rounding = config.rounding || "nearest";
  const tiers = config.tiers || [];

  const pricePerDayHT = decimalToNumber(context.dress.price_per_day_ht);
  const days = context.rental.duration_days;

  // Find applicable tier
  let discountPercentage = 0;
  for (const tier of tiers) {
    const minDays = tier.min_days ?? 0;
    const maxDays = tier.max_days ?? Infinity;

    if (days >= minDays && days <= maxDays) {
      discountPercentage = tier.discount_percentage ?? 0;
      break;
    }
  }

  const basePriceHT = pricePerDayHT * days;
  const discountAmount = basePriceHT * (discountPercentage / 100);
  const finalPriceHT = roundPrice(basePriceHT - discountAmount, rounding);
  const finalPriceTTC = applyTax(finalPriceHT, taxRate);
  const taxAmount = finalPriceTTC - finalPriceHT;

  return {
    strategy_used: "tiered",
    base_price_ht: basePriceHT,
    base_price_ttc: applyTax(basePriceHT, taxRate),
    discount_amount: discountAmount > 0 ? roundPrice(discountAmount) : 0,
    discount_percentage: discountPercentage > 0 ? discountPercentage : 0,
    final_price_ht: finalPriceHT,
    final_price_ttc: finalPriceTTC,
    tax_amount: taxAmount,
    tax_rate: taxRate,
    duration_days: days,
    breakdown: [
      {
        description: `Location ${days} jour(s) à ${pricePerDayHT}€/jour`,
        amount_ht: basePriceHT,
        amount_ttc: applyTax(basePriceHT, taxRate),
      },
      ...(discountAmount > 0
        ? [
            {
              description: `Réduction palier ${discountPercentage}% (${days} jours)`,
              amount_ht: -discountAmount,
              amount_ttc: -applyTax(discountAmount, taxRate),
            },
          ]
        : []),
    ],
  };
}

// ============================================
// MAIN CALCULATOR
// ============================================

/**
 * Calculate price based on context and strategy
 */
export function calculatePrice(context: PricingContext): PricingResult {
  // Calculate duration if not provided
  if (!context.rental.duration_days) {
    context.rental.duration_days = calculateDays(
      context.rental.start_date,
      context.rental.end_date
    );
  }

  // Determine strategy to use
  const strategy =
    context.pricing_rule?.strategy ||
    context.business_rules?.pricing?.default_strategy ||
    "per_day";

  // Apply appropriate calculation
  switch (strategy) {
    case "per_day":
      return calculatePerDay(context);
    case "flat_rate":
      return calculateFlatRate(context);
    case "fixed_price":
      return calculateFixedPrice(context);
    case "tiered":
      return calculateTiered(context);
    default:
      return calculatePerDay(context); // Fallback
  }
}

/**
 * Calculate total for multiple items
 */
export function calculateTotalPrice(items: PricingContext[]): {
  items: PricingResult[];
  total_ht: number;
  total_ttc: number;
  total_tax: number;
} {
  const results = items.map(calculatePrice);

  const total_ht = results.reduce((sum, r) => sum + r.final_price_ht, 0);
  const total_ttc = results.reduce((sum, r) => sum + r.final_price_ttc, 0);
  const total_tax = total_ttc - total_ht;

  return {
    items: results,
    total_ht: roundPrice(total_ht),
    total_ttc: roundPrice(total_ttc),
    total_tax: roundPrice(total_tax),
  };
}

// ============================================
// HELPERS FOR VALIDATION
// ============================================

/**
 * Check if a pricing rule applies to a given context
 */
export function isPricingRuleApplicable(
  rule: {
    applies_to?: any;
    is_active: boolean;
  },
  context: {
    dress_type?: string;
    duration_days: number;
    customer_type?: string;
  }
): boolean {
  if (!rule.is_active) return false;
  if (!rule.applies_to) return true; // No restrictions = applies to all

  const applies = rule.applies_to;

  // Check dress types
  if (applies.dress_types && applies.dress_types.length > 0) {
    if (!context.dress_type || !applies.dress_types.includes(context.dress_type)) {
      return false;
    }
  }

  // Check duration
  if (applies.min_duration_days && context.duration_days < applies.min_duration_days) {
    return false;
  }

  if (applies.max_duration_days && context.duration_days > applies.max_duration_days) {
    return false;
  }

  // Check customer types
  if (applies.customer_types && applies.customer_types.length > 0) {
    if (!context.customer_type || !applies.customer_types.includes(context.customer_type)) {
      return false;
    }
  }

  return true;
}

/**
 * Find the best pricing rule for a context (highest priority applicable rule)
 */
export function findBestPricingRule(
  rules: Array<{
    id: string;
    name: string;
    strategy: string;
    calculation_config: any;
    applies_to?: any;
    priority: number;
    is_active: boolean;
  }>,
  context: {
    dress_type?: string;
    duration_days: number;
    customer_type?: string;
  }
): (typeof rules)[0] | null {
  const applicableRules = rules
    .filter((rule) => isPricingRuleApplicable(rule, context))
    .sort((a, b) => a.priority - b.priority); // Lowest priority first (0 = highest priority)

  return applicableRules[0] || null;
}
