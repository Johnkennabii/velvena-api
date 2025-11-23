//src/controller/contractController/contractController.ts
import { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma.js";
import { v4 as uuidv4 } from "uuid";
import pino from "pino";
import { sendMail } from "../../lib/mailer.js";
import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import multer from "multer";
import { generateContractPDF } from "../../lib/generateContractPDF.js";
import { compressPdfBuffer } from "../../lib/pdfCompression.js";
import { io } from "../../server.js";
import { emitAndStoreNotification } from "../../utils/notifications.js";
const logger = pino({ level: process.env.LOG_LEVEL || "info" });
const s3 = new S3Client({
    region: "eu-central-1",
    endpoint: "https://hel1.your-objectstorage.com",
    credentials: {
        accessKeyId: process.env.HETZNER_ACCESS_KEY,
        secretAccessKey: process.env.HETZNER_SECRET_KEY,
    },
});
const hetznerBucket = process.env.HETZNER_BUCKET ?? "media-allure-creation";
const CONTRACTS_FOLDER = "contracts";
const bucketUrlPrefix = `https://${hetznerBucket}.hel1.your-objectstorage.com/`;
if (!process.env.HETZNER_BUCKET) {
    logger.warn("⚠️ HETZNER_BUCKET not set, defaulting to 'media-allure-creation'");
}
const signedPdfUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });
export const uploadSignedPdfMiddleware = signedPdfUpload.single("file");
// 📌 Get all contracts
export const getAllContracts = async (req, res) => {
    try {
        logger.info("Fetching all contracts");
        const contracts = await prisma.contract.findMany({
            include: {
                customer: true,
                contract_type: true,
                package: true,
                addon_links: { include: { addon: true } },
                dresses: { include: { dress: true } },
                sign_link: true,
            },
        });
        res.json({ success: true, data: contracts });
    }
    catch (error) {
        logger.error(error, "Failed to fetch contracts");
        res.status(500).json({ success: false, error: "Failed to fetch contracts" });
    }
};
// 📌 Get contract by ID
export const getContractById = async (req, res) => {
    try {
        const { id } = req.params;
        logger.info({ id }, "Fetching contract by ID");
        const contract = await prisma.contract.findUnique({
            where: { id: id },
            include: {
                customer: true,
                contract_type: true,
                package: true,
                addon_links: { include: { addon: true } },
                dresses: { include: { dress: true } },
                sign_link: true,
            },
        });
        if (!contract) {
            return res.status(404).json({ success: false, error: "Contract not found" });
        }
        res.json({ success: true, data: contract });
    }
    catch (error) {
        logger.error(error, "Failed to fetch contract");
        res.status(500).json({ success: false, error: "Failed to fetch contract" });
    }
};
// 📌 Create contract
export const createContract = async (req, res) => {
    try {
        logger.info({ body: req.body }, "Creating contract");
        const { contract_number, customer_id, start_datetime, end_datetime, account_ht, account_ttc, account_paid_ht, account_paid_ttc, caution_ht, caution_ttc, caution_paid_ht, caution_paid_ttc, total_price_ht, total_price_ttc, deposit_payment_method, status, contract_type_id, package_id, addons, // tableau d’addons [{ addon_id: "xxx" }, ...]
        dresses, // ajout des robes
         } = req.body;
        const now = new Date();
        const contract = await prisma.contract.create({
            data: {
                id: uuidv4(),
                contract_number,
                start_datetime: new Date(start_datetime),
                end_datetime: new Date(end_datetime),
                account_ht,
                account_ttc,
                account_paid_ht,
                account_paid_ttc,
                caution_ht,
                caution_ttc,
                caution_paid_ht,
                caution_paid_ttc,
                total_price_ht,
                total_price_ttc,
                deposit_payment_method,
                status,
                created_at: now,
                created_by: req.user?.id || null,
                customer_id,
                contract_type_id,
                ...(package_id && { package_id }),
                sign_link: {
                    create: {
                        id: uuidv4(),
                        customer_id,
                        token: uuidv4(),
                        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    },
                },
                ...(addons && addons.length > 0 && {
                    addon_links: {
                        create: addons.map((a) => ({
                            addon_id: a.addon_id,
                        })),
                    },
                }),
                ...(dresses && dresses.length > 0 && {
                    dresses: {
                        create: dresses.map((d) => ({
                            dress_id: d.dress_id,
                        })),
                    },
                }),
            },
            include: {
                sign_link: true,
                addon_links: { include: { addon: true } },
                dresses: { include: { dress: true } },
            },
        });
        res.status(201).json({ success: true, data: contract });
    }
    catch (error) {
        logger.error(error, "Failed to create contract");
        res.status(500).json({ success: false, error: "Failed to create contract" });
    }
};
// 📌 Update contract
export const updateContract = async (req, res) => {
    try {
        const { id } = req.params;
        const { addons, ...contractFields } = req.body;
        logger.info({ id, body: req.body }, "🛠 Updating contract with addons");
        if (!id) {
            logger.warn("❗ Contract ID is required to update a contract");
            return res.status(400).json({ success: false, error: "Contract ID is required" });
        }
        const contractId = id;
        // 1️⃣ Mise à jour du contrat
        const updatedContract = await prisma.contract.update({
            where: { id: contractId },
            data: {
                ...contractFields,
                updated_at: new Date(),
                updated_by: req.user?.id || null,
            },
        });
        // 2️⃣ Si des addons sont fournis, on les remplace
        if (Array.isArray(addons)) {
            logger.info({ contractId, addonsCount: addons.length }, "🔄 Updating contract addons");
            await prisma.$transaction([
                prisma.contractAddonLink.deleteMany({ where: { contract_id: contractId } }),
                prisma.contractAddonLink.createMany({
                    data: addons.map((a) => ({
                        contract_id: contractId,
                        addon_id: a.addon_id,
                    })),
                }),
            ]);
            logger.info("✅ Addons updated successfully");
        }
        // 3️⃣ Réponse finale
        res.json({ success: true, data: updatedContract });
    }
    catch (error) {
        logger.error({
            message: error.message,
            stack: error.stack,
            code: error.code,
            meta: error.meta,
        }, "❌ Failed to update contract (details)");
        res.status(500).json({ success: false, error: error.message });
    }
};
// 📌 Soft delete
export const softDeleteContract = async (req, res) => {
    try {
        const { id } = req.params;
        logger.info({ id }, "Soft deleting contract");
        await prisma.contract.update({
            where: { id: id },
            data: { deleted_at: new Date(), deleted_by: req.user?.id || null },
        });
        res.json({ success: true, message: "Contract soft deleted" });
    }
    catch (error) {
        logger.error(error, "Failed to soft delete contract");
        res.status(500).json({ success: false, error: "Failed to soft delete contract" });
    }
};
// 📌 Restore (remove soft delete markers)
export const restoreContract = async (req, res) => {
    try {
        const { id } = req.params;
        logger.info({ id }, "Restoring contract");
        await prisma.contract.update({
            where: { id: id },
            data: { deleted_at: null, deleted_by: null },
        });
        res.json({ success: true, message: "Contract restored" });
    }
    catch (error) {
        logger.error(error, "Failed to restore contract");
        res.status(500).json({ success: false, error: "Failed to restore contract" });
    }
};
// 📌 Hard delete
export const hardDeleteContract = async (req, res) => {
    try {
        const { id } = req.params;
        logger.info({ id }, "Hard deleting contract");
        await prisma.contract.delete({ where: { id: id } });
        res.json({ success: true, message: "Contract permanently deleted" });
    }
    catch (error) {
        logger.error(error, "Failed to hard delete contract");
        res.status(500).json({ success: false, error: "Failed to hard delete contract" });
    }
};
// 📌 Get all contracts (full view)
export const getContractsFullView = async (req, res) => {
    try {
        const { customer_id, search } = req.query;
        const filters = [];
        if (customer_id) {
            filters.push(Prisma.sql `customer_id = ${customer_id}`);
        }
        if (search) {
            const keyword = `%${search.trim()}%`;
            filters.push(Prisma.sql `(
          contract_number ILIKE ${keyword}
          OR customer_firstname ILIKE ${keyword}
          OR customer_lastname ILIKE ${keyword}
          OR customer_email ILIKE ${keyword}
        )`);
        }
        const contracts = await prisma.$queryRaw(Prisma.sql `
        SELECT * FROM contracts_full_view
        ${filters.length ? Prisma.sql `WHERE ${Prisma.join(filters, " AND ")}` : Prisma.empty}
        ORDER BY created_at DESC
      `);
        res.json({ success: true, data: contracts });
    }
    catch (error) {
        logger.error(error, "Failed to fetch contracts_full_view");
        res.status(500).json({ success: false, error: "Failed to fetch contracts_full_view" });
    }
};
// 📌 Generate signature link and send email
export const generateSignatureLink = async (req, res) => {
    try {
        const { id } = req.params;
        logger.info({ contractId: id }, "📩 Requête reçue pour générer un lien de signature");
        if (!id) {
            logger.warn("⚠️ Aucun ID de contrat fourni");
            return res.status(400).json({ success: false, error: "Contract ID is required" });
        }
        // 🔍 Récupération du contrat avec son client
        const contract = await prisma.contract.findUnique({
            where: { id },
            include: { customer: true },
        });
        if (!contract) {
            logger.warn({ contractId: id }, "❌ Contrat introuvable");
            return res.status(404).json({ success: false, error: "Contract not found" });
        }
        // 🧾 Extraction des infos client
        const customerId = contract.customer_id;
        const email = contract.customer?.email;
        logger.info({ customerId, email }, "👤 Informations client récupérées");
        if (!customerId || !email) {
            logger.error({ contractId: id }, "❌ Informations client manquantes (customer_id ou email)");
            return res.status(400).json({ success: false, error: "Missing customer information" });
        }
        // 🧹 Suppression des anciens liens de signature
        const deleteResult = await prisma.contractSignLink.deleteMany({ where: { contract_id: id } });
        logger.info({ deletedCount: deleteResult.count }, "🧽 Anciens liens de signature supprimés");
        // 🆕 Création d’un nouveau lien de signature
        const signLink = await prisma.contractSignLink.create({
            data: {
                id: uuidv4(),
                contract_id: id,
                customer_id: customerId,
                token: uuidv4(),
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
            },
        });
        const updatedContract = await prisma.contract.update({
            where: { id },
            data: { status: "PENDING_SIGNATURE" },
        });
        logger.info({ contractId: id, previousStatus: contract.status, newStatus: updatedContract.status }, "📝 Statut du contrat mis à jour en attente de signature");
        const baseUrl = "https://app.allure-creation.fr";
        const url = new URL(`/sign-links/${signLink.token}`, baseUrl).toString();
        const expiresAtFormatted = signLink.expires_at.toLocaleString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
        logger.info({
            signLinkId: signLink.id,
            token: signLink.token,
            link: url,
            expires: expiresAtFormatted,
        }, "🔗 Lien de signature généré avec succès");
        // ✉️ Préparation de l'email
        const customerFirstName = contract.customer?.firstname?.trim() || "";
        const customerLastName = contract.customer?.lastname?.trim() || "";
        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: email,
            subject: "Signature électronique de votre contrat – Allure Création",
            html: `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f7; padding:40px 0; font-family:Arial, sans-serif;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:white; padding:32px; border-radius:12px; box-shadow:0 2px 8px rgba(0,0,0,0.05);">

          <!-- HEADER -->
          <tr>
            <td style="text-align:center; padding-bottom:20px;">
              <h2 style="margin:0; font-size:22px; color:#111827;">
                Signature électronique – Allure Création
              </h2>
              <p style="margin:6px 0 0; color:#6b7280; font-size:14px;">
                Contrat à signer en ligne
              </p>
            </td>
          </tr>

          <!-- INTRO -->
          <tr>
            <td style="font-size:15px; color:#374151; line-height:1.6;">
              Bonjour ${customerLastName || ""} ${customerFirstName || ""},<br><br>
              Votre contrat Allure Création est prêt. Vous pouvez désormais procéder à sa
              <strong>signature électronique</strong> en suivant les étapes ci-dessous.
            </td>
          </tr>

          <!-- STEPS -->
          <tr>
            <td style="padding:20px 0;">
              <div style="background:#f3f4f6; padding:16px; border-radius:8px; color:#374151; font-size:14px; line-height:1.6;">
                <strong>Étapes à suivre :</strong>
                <ol style="margin:12px 0 0 18px; padding:0;">
                  <li>Cliquez sur le lien ou le bouton ci-dessous.</li>
                  <li>Vérifiez attentivement les informations du contrat.</li>
                  <li>Cochez la case de validation pour confirmer votre accord.</li>
                  <li>Validez votre signature électronique.</li>
                </ol>
              </div>
            </td>
          </tr>

          <!-- BUTTON -->
          <tr>
            <td style="text-align:center; padding:20px 0;">
              <a href="${url}"
                 style="
                   display:inline-block;
                   padding:12px 24px;
                   background:#111827;
                   color:white;
                   text-decoration:none;
                   border-radius:6px;
                   font-size:15px;
                   font-weight:bold;
                 "
                 target="_blank"
              >
                Signer mon contrat
              </a>
            </td>
          </tr>

          <!-- RAW URL -->
          <tr>
            <td style="font-size:13px; color:#6b7280; text-align:center; padding-bottom:20px;">
              Si le bouton ne fonctionne pas, utilisez ce lien :<br>
              <a href="${url}" style="color:#2563eb;">${url}</a>
            </td>
          </tr>

          <!-- EXPIRATION -->
          <tr>
            <td>
              <div style="background:#fff7ed; border:1px solid #fed7aa; padding:16px; border-radius:8px; font-size:14px; color:#9a3412;">
                ⚠️ <strong>Important :</strong> ce lien expirera le <strong>${expiresAtFormatted}</strong>.<br>
                Au-delà de cette date, un nouveau lien devra être généré.
              </div>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding-top:28px; font-size:14px; color:#374151; line-height:1.6;">
              Si vous avez la moindre question ou rencontrez une difficulté, 
              vous pouvez répondre directement par voie téléphonique.<br><br>
              Merci de votre confiance,<br>
              <strong>L'équipe Allure Création</strong>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
  `,
        };
        logger.info({ to: email }, "📤 Envoi de l’e-mail de signature en cours...");
        // ✅ Réponse immédiate à l’API
        res.json({
            success: true,
            data: signLink,
            link: url,
            emailSentTo: email,
        });
        // 📨 Envoi de l’e-mail (async)
        void sendMail(mailOptions)
            .then(() => {
            logger.info({ to: email }, "✅ E-mail de signature envoyé avec succès !");
        })
            .catch((err) => {
            logger.error({ err, to: email }, "❌ Erreur lors de l’envoi de l’e-mail de signature");
        });
    }
    catch (error) {
        logger.error({ err: error }, "🔥 Erreur interne lors de la génération du lien de signature");
        res.status(500).json({ success: false, error: "Failed to generate sign link" });
    }
};
// ✅ GET /sign-links/:token
export const getContractSignLink = async (req, res) => {
    try {
        const token = req.params.token; // 👈 force en string
        logger.info({ token }, "🔍 Vérification du lien de signature");
        const signLink = await prisma.contractSignLink.findUnique({
            where: { token }, // ✅ token est bien @unique dans ton modèle
            include: {
                contract: {
                    include: {
                        customer: true,
                        contract_type: true,
                        package: {
                            include: {
                                addons: { include: { addon: true } },
                            },
                        },
                        dresses: { include: { dress: true } },
                        addon_links: { include: { addon: true } },
                    },
                },
            },
        });
        if (!signLink) {
            return res.status(404).json({ success: false, error: "Lien introuvable" });
        }
        if (new Date(signLink.expires_at) < new Date()) {
            return res.status(410).json({ success: false, error: "Lien expiré" });
        }
        res.json({ success: true, data: signLink });
    }
    catch (error) {
        logger.error({ error }, "🔥 Erreur interne - getContractSignLink");
        res.status(500).json({ success: false, error: "Erreur interne serveur" });
    }
};
// ✅ POST /sign-links/:token/sign
export const signContractViaLink = async (req, res) => {
    try {
        const token = req.params.token;
        // 🔍 1️⃣ Récupération du lien et du contrat associé
        const link = await prisma.contractSignLink.findUnique({
            where: { token },
            include: {
                contract: {
                    include: {
                        customer: true,
                        contract_type: true,
                        package: {
                            include: {
                                addons: { include: { addon: true } },
                            },
                        },
                        dresses: { include: { dress: true } },
                        addon_links: { include: { addon: true } },
                    },
                },
            },
        });
        if (!link)
            return res.status(404).json({ success: false, error: "Lien invalide" });
        if (new Date(link.expires_at) < new Date())
            return res.status(410).json({ success: false, error: "Lien expiré" });
        const contract = link.contract;
        if (!contract)
            return res.status(404).json({ success: false, error: "Contrat introuvable" });
        const now = new Date();
        // 🌍 Capture de l'IP et de la localisation
        const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
            req.socket.remoteAddress ||
            'IP inconnue';
        let location = 'Localisation inconnue';
        try {
            // Utilisation de l'API ip-api.com (gratuite, 45 req/min)
            const geoResponse = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,country,city,lat,lon`);
            if (geoResponse.ok) {
                const geoData = await geoResponse.json();
                if (geoData.status === 'success') {
                    location = `${geoData.city || 'Ville inconnue'}, ${geoData.country || 'Pays inconnu'} (${geoData.lat}, ${geoData.lon})`;
                }
            }
        }
        catch (error) {
            logger.warn({ error, ipAddress }, "⚠️ Impossible de récupérer la localisation");
        }
        logger.info({
            token,
            ipAddress,
            location,
            contractId: contract.id
        }, "📍 Signature électronique avec métadonnées");
        // ✍️ 2️⃣ Mise à jour du contrat comme signé
        const updatedContract = await prisma.contract.update({
            where: { id: contract.id },
            data: {
                status: "SIGNED_ELECTRONICALLY",
                signed_at: now,
                updated_at: now,
                signature_ip: ipAddress,
                signature_location: location,
                signature_reference: token,
            },
            include: {
                customer: true,
                contract_type: true,
                package: {
                    include: {
                        addons: { include: { addon: true } },
                    },
                },
                dresses: { include: { dress: true } },
                addon_links: { include: { addon: true } },
            },
        });
        const customerFirstName = updatedContract.customer?.firstname?.trim() || null;
        const customerLastName = updatedContract.customer?.lastname?.trim() || null;
        const customerFullName = customerFirstName || customerLastName
            ? [customerFirstName, customerLastName].filter((value) => Boolean(value)).join(" ")
            : null;
        await emitAndStoreNotification({
            type: "CONTRACT_SIGNED",
            title: "Contrat signé électroniquement",
            message: `Le contrat ${updatedContract.contract_number} a été signé par ${customerFullName ?? "le client"}.`,
            contractNumber: updatedContract.contract_number,
            customer: {
                id: updatedContract.customer?.id ?? null,
                firstName: customerFirstName,
                lastName: customerLastName,
                fullName: customerFullName,
            },
            timestamp: new Date().toISOString(),
        });
        // 📄 3️⃣ Génération du PDF complet (fonction dédiée)
        const signedPdfUrl = await generateContractPDF(token, contract.id, updatedContract);
        // 💾 4️⃣ Sauvegarde du lien PDF
        await prisma.contract.update({
            where: { id: contract.id },
            data: { signed_pdf_url: signedPdfUrl },
        });
        // 🧹 5️⃣ Suppression du lien de signature pour éviter la réutilisation
        await prisma.contractSignLink.delete({ where: { token } });
        // 🚀 6️⃣ Réponse finale
        res.json({
            success: true,
            message: "Contrat signé électroniquement et PDF sauvegardé",
            data: { ...updatedContract, signed_pdf_url: signedPdfUrl },
        });
    }
    catch (error) {
        console.error("🔥 Erreur lors de la signature électronique :", error);
        res.status(500).json({
            success: false,
            error: "Erreur interne lors de la signature électronique",
        });
    }
};
// ✅ POST /contracts/:id/generate-pdf (signature manuelle)
export const generateContractPdfManually = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, error: "Contract ID is required" });
        }
        const contract = await prisma.contract.findUnique({
            where: { id },
            include: {
                customer: true,
                contract_type: true,
                package: {
                    include: { addons: { include: { addon: true } } },
                },
                dresses: { include: { dress: true } },
                addon_links: { include: { addon: true } },
            },
        });
        if (!contract) {
            return res.status(404).json({ success: false, error: "Contrat introuvable" });
        }
        const pdfUrl = await generateContractPDF(null, contract.id, contract, { includeSignatureBlock: true });
        await prisma.contract.update({
            where: { id },
            data: {
                status: "PENDING",
            },
        });
        res.json({ link: pdfUrl });
    }
    catch (error) {
        logger.error({ error }, "🔥 Erreur génération PDF manuel");
        res.status(500).json({ success: false, error: "Erreur interne lors de la génération du PDF" });
    }
};
// ✅ POST /contracts/:id/upload-signed-pdf
export const uploadSignedContractPdf = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, error: "Contract ID is required" });
        }
        const contract = await prisma.contract.findUnique({ where: { id } });
        if (!contract) {
            return res.status(404).json({ success: false, error: "Contrat introuvable" });
        }
        // 🧹 Suppression de TOUS les PDFs automatiques (signed_*.pdf non-upload) du dossier
        try {
            const contractFolder = `${CONTRACTS_FOLDER}/${id}/`;
            const listCommand = new ListObjectsV2Command({
                Bucket: hetznerBucket,
                Prefix: contractFolder,
            });
            const listResponse = await s3.send(listCommand);
            const filesToDelete = listResponse.Contents?.filter(obj => {
                const key = obj.Key || "";
                return key.includes("/signed_") && !key.includes("/signed_upload_");
            }) || [];
            if (filesToDelete.length > 0) {
                logger.info({ count: filesToDelete.length, files: filesToDelete.map(f => f.Key) }, "🗑️ Suppression des PDFs automatiques");
                for (const file of filesToDelete) {
                    try {
                        await s3.send(new DeleteObjectCommand({
                            Bucket: hetznerBucket,
                            Key: file.Key,
                        }));
                        logger.info({ key: file.Key }, "✅ PDF automatique supprimé");
                    }
                    catch (deleteError) {
                        logger.warn({ deleteError, key: file.Key }, "⚠️ Impossible de supprimer un PDF automatique");
                    }
                }
            }
        }
        catch (listError) {
            logger.warn({ listError, contractId: id }, "⚠️ Impossible de lister les fichiers du dossier contrat");
        }
        const file = req.file;
        if (!file) {
            return res.status(400).json({ success: false, error: "Aucun fichier transmis" });
        }
        if (file.mimetype !== "application/pdf") {
            return res.status(400).json({ success: false, error: "Le fichier doit être un PDF" });
        }
        const { buffer: payload, encoding } = await compressPdfBuffer(file.buffer);
        const key = `${CONTRACTS_FOLDER}/${id}/signed_upload_${Date.now()}.pdf`;
        await s3.send(new PutObjectCommand({
            Bucket: hetznerBucket,
            Key: key,
            Body: payload,
            ContentType: "application/pdf",
            ContentEncoding: encoding,
        }));
        const pdfUrl = `${bucketUrlPrefix}${key}`;
        const updated = await prisma.contract.update({
            where: { id },
            data: {
                signed_pdf_url: pdfUrl,
                status: "SIGNED",
                signed_at: new Date(),
                updated_at: new Date(),
                updated_by: req.user?.id ?? null,
            },
        });
        res.json({ success: true, link: pdfUrl, data: updated });
    }
    catch (error) {
        logger.error({ error }, "🔥 Erreur upload PDF signé");
        res.status(500).json({ success: false, error: "Erreur interne lors du stockage du PDF" });
    }
};
// ✅ GET /contracts/download/:contractId/:token (PUBLIC - téléchargement du PDF signé)
export const downloadSignedContract = async (req, res) => {
    try {
        const { contractId, token } = req.params;
        logger.info({ contractId, token }, "📥 [DOWNLOAD] Requête de téléchargement du contrat signé");
        console.log("📥 [DOWNLOAD] Requête reçue:", { contractId, token });
        if (!contractId || !token) {
            logger.warn("⚠️ [DOWNLOAD] Paramètres manquants");
            console.log("⚠️ [DOWNLOAD] Paramètres manquants:", { contractId, token });
            return res.status(400).json({
                success: false,
                error: "Contract ID et token sont requis"
            });
        }
        // 🔍 Récupération du contrat
        logger.info({ contractId }, "🔍 [DOWNLOAD] Recherche du contrat dans la base de données");
        console.log("🔍 [DOWNLOAD] Recherche du contrat:", contractId);
        const contract = await prisma.contract.findUnique({
            where: { id: contractId },
            select: {
                id: true,
                contract_number: true,
                signed_pdf_url: true,
                signature_reference: true,
                status: true,
            },
        });
        if (!contract) {
            logger.warn({ contractId }, "❌ [DOWNLOAD] Contrat introuvable");
            console.log("❌ [DOWNLOAD] Contrat introuvable:", contractId);
            return res.status(404).json({
                success: false,
                error: "Contrat introuvable"
            });
        }
        logger.info({
            contractId,
            contractNumber: contract.contract_number,
            status: contract.status,
            hasSignatureRef: !!contract.signature_reference,
            hasPdf: !!contract.signed_pdf_url
        }, "✅ [DOWNLOAD] Contrat trouvé");
        console.log("✅ [DOWNLOAD] Contrat trouvé:", {
            id: contract.id,
            number: contract.contract_number,
            status: contract.status,
            signature_reference: contract.signature_reference,
            signed_pdf_url: contract.signed_pdf_url
        });
        // 🔐 Vérification du token
        logger.info({
            providedToken: token,
            storedToken: contract.signature_reference,
            match: contract.signature_reference === token
        }, "🔐 [DOWNLOAD] Comparaison des tokens");
        console.log("🔐 [DOWNLOAD] Comparaison des tokens:", {
            providedToken: token,
            storedToken: contract.signature_reference,
            match: contract.signature_reference === token,
            providedTokenType: typeof token,
            storedTokenType: typeof contract.signature_reference
        });
        if (contract.signature_reference !== token) {
            logger.warn({
                contractId,
                providedToken: token,
                expectedToken: contract.signature_reference
            }, "⚠️ [DOWNLOAD] Token invalide");
            console.log("⚠️ [DOWNLOAD] Token invalide - Comparaison détaillée:");
            console.log("  - Token fourni:", token);
            console.log("  - Token attendu:", contract.signature_reference);
            console.log("  - Match:", contract.signature_reference === token);
            return res.status(403).json({
                success: false,
                error: "Token invalide"
            });
        }
        // 📄 Vérification de l'existence du PDF signé
        if (!contract.signed_pdf_url) {
            logger.warn({ contractId }, "⚠️ [DOWNLOAD] Aucun PDF signé disponible");
            console.log("⚠️ [DOWNLOAD] Aucun PDF signé disponible pour:", contractId);
            return res.status(404).json({
                success: false,
                error: "Aucun PDF signé disponible pour ce contrat"
            });
        }
        logger.info({
            contractId,
            contractNumber: contract.contract_number,
            pdfUrl: contract.signed_pdf_url
        }, "✅ [DOWNLOAD] Téléchargement du PDF depuis Hetzner");
        console.log("✅ [DOWNLOAD] Téléchargement du PDF:", contract.signed_pdf_url);
        // 📥 Téléchargement du PDF depuis Hetzner et proxy vers le client
        try {
            const response = await fetch(contract.signed_pdf_url);
            if (!response.ok) {
                logger.error({
                    status: response.status,
                    statusText: response.statusText,
                    url: contract.signed_pdf_url
                }, "❌ [DOWNLOAD] Erreur lors du téléchargement du PDF depuis Hetzner");
                console.error("❌ [DOWNLOAD] Erreur Hetzner:", response.status, response.statusText);
                return res.status(response.status).json({
                    success: false,
                    error: "Erreur lors du téléchargement du PDF"
                });
            }
            // Récupération du buffer du PDF
            const pdfBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(pdfBuffer);
            logger.info({
                contractId,
                pdfSize: buffer.length
            }, "✅ [DOWNLOAD] PDF récupéré, envoi au client");
            console.log("✅ [DOWNLOAD] PDF récupéré, taille:", buffer.length, "octets");
            // Configuration des headers pour le téléchargement
            const filename = `contrat_${contract.contract_number}_signe.pdf`;
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', buffer.length);
            res.setHeader('Cache-Control', 'private, max-age=3600');
            // Envoi du PDF
            res.send(buffer);
            logger.info({ contractId, filename }, "✅ [DOWNLOAD] PDF envoyé avec succès");
            console.log("✅ [DOWNLOAD] PDF envoyé avec succès:", filename);
        }
        catch (fetchError) {
            logger.error({
                error: fetchError,
                url: contract.signed_pdf_url
            }, "🔥 [DOWNLOAD] Erreur lors de la récupération du PDF depuis Hetzner");
            console.error("🔥 [DOWNLOAD] Erreur fetch:", fetchError);
            return res.status(500).json({
                success: false,
                error: "Erreur lors de la récupération du PDF"
            });
        }
    }
    catch (error) {
        logger.error({ error }, "🔥 [DOWNLOAD] Erreur lors du téléchargement du contrat signé");
        console.error("🔥 [DOWNLOAD] Erreur:", error);
        res.status(500).json({
            success: false,
            error: "Erreur interne lors du téléchargement du contrat"
        });
    }
};
//# sourceMappingURL=contractController.js.map