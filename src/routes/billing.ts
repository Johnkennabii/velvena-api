// src/routes/billing.ts
import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getSubscriptionStatus,
  changeSubscriptionPlan,
  checkQuotas,
  checkFeatures,
} from "../utils/subscriptionManager.js";
import {
  createCheckoutSession,
  createPortalSession,
  cancelSubscription,
  getInvoices,
} from "../services/stripeService.js";
import { stripeConfig } from "../lib/stripe.js";
import prisma from "../lib/prisma.js";
import logger from "../lib/logger.js";
import type { AuthenticatedRequest } from "../types/express.js";
import type { Response } from "express";
import type { BillingInterval } from "../types/stripe.js";

const router = Router();

/**
 * GET /api/billing/status
 * Récupérer le statut de souscription de l'organisation
 */
router.get("/status", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(401).json({ error: "Organization context required" });
    }

    const status = await getSubscriptionStatus(req.user.organizationId);
    res.json(status);
  } catch (err: any) {
    logger.error({ err }, "Failed to get subscription status");
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/billing/plans
 * Lister tous les plans de souscription disponibles (public)
 */
router.get("/plans", async (_req, res: Response) => {
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
  } catch (err: any) {
    logger.error({ err }, "Failed to list subscription plans");
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/billing/quotas
 * Récupérer l'état des quotas de l'organisation
 */
router.get("/quotas", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
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
  } catch (err: any) {
    logger.error({ err }, "Failed to get quotas");
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/billing/features
 * Récupérer l'état des features de l'organisation
 */
router.get("/features", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(401).json({ error: "Organization context required" });
    }

    const features = await checkFeatures(req.user.organizationId, [
      "planning",
      "dashboard",
      "export_data",
      "customer_portal",
      "notification_push",
      "contract_generation",
      "prospect_management",
      "electronic_signature",
      "inventory_management",
      "contract_builder",
    ]);

    res.json(features);
  } catch (err: any) {
    logger.error({ err }, "Failed to get features");
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/billing/dashboard
 * Récupérer quotas + features + subscription status (tout en un)
 */
router.get("/dashboard", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(401).json({ error: "Organization context required" });
    }

    const orgId = req.user.organizationId;

    // Paralléliser les requêtes
    const [quotas, features, subscription] = await Promise.all([
      checkQuotas(orgId, ["users", "dresses", "customers", "prospects", "contracts"]),
      checkFeatures(orgId, [
        "planning",
        "dashboard",
        "export_data",
        "customer_portal",
        "notification_push",
        "contract_generation",
        "prospect_management",
        "electronic_signature",
        "inventory_management",
        "contract_builder",
      ]),
      getSubscriptionStatus(orgId),
    ]);

    res.json({
      quotas,
      features,
      subscription,
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to get billing dashboard");
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/billing/upgrade
 * Changer de plan de souscription (après paiement)
 */
router.post("/upgrade", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
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
    await changeSubscriptionPlan(
      req.user.organizationId,
      newPlan.id,
      req.user.id
    );

    logger.info(
      {
        organizationId: req.user.organizationId,
        userId: req.user.id,
        newPlan: newPlan.code,
      },
      "Subscription plan upgraded"
    );

    res.json({
      success: true,
      message: `Plan successfully upgraded to ${newPlan.name}`,
      plan: {
        code: newPlan.code,
        name: newPlan.name,
        price_monthly: newPlan.price_monthly,
      },
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to upgrade subscription");
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/billing/create-checkout-session
 * Create a Stripe Checkout session for subscribing to a plan
 */
router.post(
  "/create-checkout-session",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.organizationId) {
        return res.status(401).json({ error: "Organization context required" });
      }

      const { plan_code, billing_interval, success_url, cancel_url } = req.body;

      if (!plan_code) {
        return res.status(400).json({ error: "plan_code is required" });
      }

      if (!billing_interval || !["month", "year"].includes(billing_interval)) {
        return res.status(400).json({
          error: "billing_interval is required and must be 'month' or 'year'",
        });
      }

      // Create checkout session
      const sessionParams: any = {
        organizationId: req.user.organizationId,
        planCode: plan_code,
        billingInterval: billing_interval as BillingInterval,
      };

      if (req.user.email) {
        sessionParams.customerEmail = req.user.email;
      }

      if (success_url) {
        sessionParams.successUrl = success_url;
      }

      if (cancel_url) {
        sessionParams.cancelUrl = cancel_url;
      }

      const session = await createCheckoutSession(sessionParams);

      logger.info(
        {
          organizationId: req.user.organizationId,
          planCode: plan_code,
          billingInterval: billing_interval,
          sessionId: session.id,
        },
        "Created checkout session"
      );

      res.json({
        sessionId: session.id,
        url: session.url,
        publishableKey: stripeConfig.publishableKey,
      });
    } catch (err: any) {
      logger.error({ err }, "Failed to create checkout session");
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/billing/create-portal-session
 * Create a Stripe Customer Portal session for managing subscription
 */
router.post(
  "/create-portal-session",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.organizationId) {
        return res.status(401).json({ error: "Organization context required" });
      }

      const { return_url } = req.body;

      // Create portal session
      const session = await createPortalSession({
        organizationId: req.user.organizationId,
        returnUrl: return_url,
      });

      logger.info(
        {
          organizationId: req.user.organizationId,
          sessionId: session.id,
        },
        "Created customer portal session"
      );

      res.json({
        url: session.url,
      });
    } catch (err: any) {
      logger.error({ err }, "Failed to create portal session");
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * POST /api/billing/cancel-subscription
 * Cancel the current subscription
 */
router.post(
  "/cancel-subscription",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user?.organizationId) {
        return res.status(401).json({ error: "Organization context required" });
      }

      const { immediately } = req.body;

      await cancelSubscription(req.user.organizationId, immediately === true);

      logger.info(
        {
          organizationId: req.user.organizationId,
          immediately,
        },
        "Cancelled subscription"
      );

      res.json({
        success: true,
        message: immediately
          ? "Subscription cancelled immediately"
          : "Subscription will be cancelled at period end",
      });
    } catch (err: any) {
      logger.error({ err }, "Failed to cancel subscription");
      res.status(500).json({ error: err.message });
    }
  }
);

/**
 * GET /api/billing/config
 * Get Stripe publishable key and other public config
 */
router.get("/config", async (_req, res: Response) => {
  res.json({
    publishableKey: stripeConfig.publishableKey,
    successUrl: stripeConfig.successUrl,
    cancelUrl: stripeConfig.cancelUrl,
  });
});

/**
 * GET /api/billing/invoices
 * Get invoice history for the organization
 */
router.get("/invoices", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(401).json({ error: "Organization context required" });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

    const result = await getInvoices(req.user.organizationId, limit);

    logger.info(
      {
        organizationId: req.user.organizationId,
        count: result.data.length,
      },
      "Retrieved invoice history"
    );

    res.json({
      success: true,
      has_more: result.has_more,
      count: result.data.length,
      invoices: result.data,
    });
  } catch (err: any) {
    logger.error({ err }, "Failed to retrieve invoices");
    res.status(500).json({ error: err.message });
  }
});

export default router;
