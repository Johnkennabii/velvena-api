// src/routes/billing.ts
import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getSubscriptionStatus, changeSubscriptionPlan, checkQuotas, checkFeatures, } from "../utils/subscriptionManager.js";
import prisma from "../lib/prisma.js";
import logger from "../lib/logger.js";
const router = Router();
/**
 * GET /api/billing/status
 * Récupérer le statut de souscription de l'organisation
 */
router.get("/status", authMiddleware, async (req, res) => {
    try {
        if (!req.user?.organizationId) {
            return res.status(401).json({ error: "Organization context required" });
        }
        const status = await getSubscriptionStatus(req.user.organizationId);
        res.json(status);
    }
    catch (err) {
        logger.error({ err }, "Failed to get subscription status");
        res.status(500).json({ error: err.message });
    }
});
/**
 * GET /api/billing/plans
 * Lister tous les plans de souscription disponibles (public)
 */
router.get("/plans", async (_req, res) => {
    try {
        const plans = await prisma.subscriptionPlan.findMany({
            where: { is_public: true },
            orderBy: { sort_order: "asc" },
            select: {
                id: true,
                name: true,
                code: true,
                description: true,
                price_monthly: true,
                price_yearly: true,
                currency: true,
                trial_days: true,
                limits: true,
                features: true,
                is_popular: true,
                sort_order: true,
            },
        });
        res.json(plans);
    }
    catch (err) {
        logger.error({ err }, "Failed to list subscription plans");
        res.status(500).json({ error: err.message });
    }
});
/**
 * GET /api/billing/quotas
 * Récupérer l'état des quotas de l'organisation
 */
router.get("/quotas", authMiddleware, async (req, res) => {
    try {
        if (!req.user?.organizationId) {
            return res.status(401).json({ error: "Organization context required" });
        }
        const quotas = await checkQuotas(req.user.organizationId, [
            "users",
            "dresses",
            "customers",
            "prospects",
            "contracts",
        ]);
        res.json(quotas);
    }
    catch (err) {
        logger.error({ err }, "Failed to get quotas");
        res.status(500).json({ error: err.message });
    }
});
/**
 * GET /api/billing/features
 * Récupérer l'état des features de l'organisation
 */
router.get("/features", authMiddleware, async (req, res) => {
    try {
        if (!req.user?.organizationId) {
            return res.status(401).json({ error: "Organization context required" });
        }
        const features = await checkFeatures(req.user.organizationId, [
            "prospect_management",
            "contract_generation",
            "electronic_signature",
            "inventory_management",
            "customer_portal",
            "advanced_analytics",
            "export_data",
            "api_access",
            "white_label",
            "sms_notifications",
        ]);
        res.json(features);
    }
    catch (err) {
        logger.error({ err }, "Failed to get features");
        res.status(500).json({ error: err.message });
    }
});
/**
 * GET /api/billing/dashboard
 * Récupérer quotas + features + subscription status (tout en un)
 */
router.get("/dashboard", authMiddleware, async (req, res) => {
    try {
        if (!req.user?.organizationId) {
            return res.status(401).json({ error: "Organization context required" });
        }
        const orgId = req.user.organizationId;
        // Paralléliser les requêtes
        const [quotas, features, subscription] = await Promise.all([
            checkQuotas(orgId, ["users", "dresses", "customers", "prospects", "contracts"]),
            checkFeatures(orgId, [
                "electronic_signature",
                "advanced_analytics",
                "api_access",
                "export_data",
                "customer_portal",
                "white_label",
            ]),
            getSubscriptionStatus(orgId),
        ]);
        res.json({
            quotas,
            features,
            subscription,
        });
    }
    catch (err) {
        logger.error({ err }, "Failed to get billing dashboard");
        res.status(500).json({ error: err.message });
    }
});
/**
 * POST /api/billing/upgrade
 * Changer de plan de souscription (après paiement)
 */
router.post("/upgrade", authMiddleware, async (req, res) => {
    try {
        if (!req.user?.organizationId) {
            return res.status(401).json({ error: "Organization context required" });
        }
        const { plan_code } = req.body;
        if (!plan_code) {
            return res.status(400).json({ error: "plan_code is required" });
        }
        // Trouver le nouveau plan
        const newPlan = await prisma.subscriptionPlan.findUnique({
            where: { code: plan_code },
        });
        if (!newPlan) {
            return res.status(404).json({ error: "Subscription plan not found" });
        }
        // TODO: Vérifier le paiement Stripe ici avant de changer le plan
        // const { payment_id } = req.body;
        // const paymentSuccess = await verifyStripePayment(payment_id);
        // if (!paymentSuccess) {
        //   return res.status(400).json({ error: "Payment verification failed" });
        // }
        // Changer le plan
        await changeSubscriptionPlan(req.user.organizationId, newPlan.id, req.user.id);
        logger.info({
            organizationId: req.user.organizationId,
            userId: req.user.id,
            newPlan: newPlan.code,
        }, "Subscription plan upgraded");
        res.json({
            success: true,
            message: `Plan successfully upgraded to ${newPlan.name}`,
            plan: {
                code: newPlan.code,
                name: newPlan.name,
                price_monthly: newPlan.price_monthly,
            },
        });
    }
    catch (err) {
        logger.error({ err }, "Failed to upgrade subscription");
        res.status(500).json({ error: err.message });
    }
});
export default router;
//# sourceMappingURL=billing.js.map