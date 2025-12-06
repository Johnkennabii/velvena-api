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
export type PricingStrategy = "per_day" | "flat_rate" | "fixed_price" | "tiered";
export interface PricingContext {
    dress: {
        id: string;
        price_per_day_ht: Decimal;
        price_per_day_ttc: Decimal;
        price_ht?: Decimal;
        price_ttc?: Decimal;
    };
    rental: {
        start_date: Date;
        end_date: Date;
        duration_days: number;
    };
    pricing_rule?: {
        strategy: PricingStrategy;
        calculation_config: any;
        applies_to?: any;
    };
    business_rules?: {
        pricing?: {
            tax_rate?: number;
            currency?: string;
            default_strategy?: PricingStrategy;
        };
    };
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
/**
 * Calculate price based on context and strategy
 */
export declare function calculatePrice(context: PricingContext): PricingResult;
/**
 * Calculate total for multiple items
 */
export declare function calculateTotalPrice(items: PricingContext[]): {
    items: PricingResult[];
    total_ht: number;
    total_ttc: number;
    total_tax: number;
};
/**
 * Check if a pricing rule applies to a given context
 */
export declare function isPricingRuleApplicable(rule: {
    applies_to?: any;
    is_active: boolean;
}, context: {
    dress_type?: string;
    duration_days: number;
    customer_type?: string;
}): boolean;
/**
 * Find the best pricing rule for a context (highest priority applicable rule)
 */
export declare function findBestPricingRule(rules: Array<{
    id: string;
    name: string;
    strategy: string;
    calculation_config: any;
    applies_to?: any;
    priority: number;
    is_active: boolean;
}>, context: {
    dress_type?: string;
    duration_days: number;
    customer_type?: string;
}): (typeof rules)[0] | null;
//# sourceMappingURL=pricingCalculator.d.ts.map