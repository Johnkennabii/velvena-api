// src/controllers/maintenanceController.ts
import pino from "pino";
const logger = pino({ level: process.env.LOG_LEVEL || "info" });
const MAINTENANCE_SECRET = process.env.SITE_MAINTENANCE_SECRET;
const SITE_URL = process.env.SITE_URL || "https://www.allure-creation.fr";
/**
 * POST /api/webhook/maintenance
 * Active ou désactive le mode maintenance du site e-commerce
 */
export const toggleMaintenance = async (req, res) => {
    try {
        const { enabled } = req.body;
        const secret = req.headers["x-maintenance-secret"];
        // 🔐 Vérification du secret
        if (!secret || secret !== MAINTENANCE_SECRET) {
            logger.warn("❌ Tentative d'accès au webhook maintenance avec un secret invalide");
            return res.status(403).json({
                success: false,
                error: "Secret invalide",
            });
        }
        // ✅ Validation du paramètre enabled
        if (typeof enabled !== "boolean") {
            logger.warn("⚠️ Paramètre 'enabled' manquant ou invalide");
            return res.status(400).json({
                success: false,
                error: "Le paramètre 'enabled' est requis (boolean)",
            });
        }
        logger.info({ enabled }, "🔧 Changement du mode maintenance");
        // 🌐 Appel au site e-commerce pour activer/désactiver la maintenance
        const maintenanceUrl = `${SITE_URL}/api/webhook/maintenance`;
        logger.info({ url: maintenanceUrl, enabled }, "📤 Envoi de la requête de maintenance au site");
        const response = await fetch(maintenanceUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Webhook-Secret": MAINTENANCE_SECRET,
            },
            body: JSON.stringify({ enabled }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            logger.error({ status: response.status, error: errorText }, "❌ Erreur lors de l'appel au site e-commerce");
            return res.status(response.status).json({
                success: false,
                error: `Erreur du site e-commerce: ${errorText}`,
            });
        }
        const result = await response.json();
        logger.info({ result }, "✅ Mode maintenance mis à jour avec succès");
        res.status(204).send(); // No Content - succès sans corps de réponse
    }
    catch (error) {
        logger.error({ error }, "🔥 Erreur lors du changement de mode maintenance");
        res.status(500).json({
            success: false,
            error: "Erreur interne lors du changement de mode maintenance",
        });
    }
};
//# sourceMappingURL=maintenanceController.js.map