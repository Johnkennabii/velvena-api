//src/controller/contractController/contractController.ts

import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma.js";
import { v4 as uuidv4 } from "uuid";
import pino from "pino";
import { sendMail } from "../../lib/mailer.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import multer from "multer";
import { generateContractPDF } from "../../lib/generateContractPDF.js";
import { io } from "../../server.js";
import { emitAndStoreNotification } from "../../utils/notifications.js";
const logger = pino({ level: process.env.LOG_LEVEL || "info" });

const s3 = new S3Client({
  region: "eu-central-1",
  endpoint: "https://hel1.your-objectstorage.com",
  credentials: {
    accessKeyId: process.env.HETZNER_ACCESS_KEY!,
    secretAccessKey: process.env.HETZNER_SECRET_KEY!,
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
export const getAllContracts = async (req: Request, res: Response) => {
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
  } catch (error) {
    logger.error(error, "Failed to fetch contracts");
    res.status(500).json({ success: false, error: "Failed to fetch contracts" });
  }
};

// 📌 Get contract by ID
export const getContractById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    logger.info({ id }, "Fetching contract by ID");
    const contract = await prisma.contract.findUnique({
      where: { id: id as string },
      include: {
        customer: true,
        contract_type: true,
        package: true,
        addon_links: { include: { addon: true } },
        dresses: { include: { dress: true } },
        sign_link: true,
      },
    });
    if (!contract ) {
      return res.status(404).json({ success: false, error: "Contract not found" });
    }
    res.json({ success: true, data: contract });
  } catch (error) {
    logger.error(error, "Failed to fetch contract");
    res.status(500).json({ success: false, error: "Failed to fetch contract" });
  }
};

// 📌 Create contract
export const createContract = async (req: Request, res: Response) => {
  try {
    logger.info({ body: req.body }, "Creating contract");
    const {
      contract_number,
      customer_id,
      start_datetime,
      end_datetime,
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
      contract_type_id,
      package_id,
      addons, // tableau d’addons [{ addon_id: "xxx" }, ...]
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
        created_by: (req as any).user?.id || null,

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
            create: addons.map((a: any) => ({
              addon_id: a.addon_id,
            })),
          },
        }),

        ...(dresses && dresses.length > 0 && {
          dresses: {
            create: dresses.map((d: any) => ({
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
  } catch (error) {
    logger.error(error, "Failed to create contract");
    res.status(500).json({ success: false, error: "Failed to create contract" });
  }
};

// 📌 Update contract
export const updateContract = async (req: Request, res: Response) => {
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
        updated_by: (req as any).user?.id || null,
      },
    });

    // 2️⃣ Si des addons sont fournis, on les remplace
    if (Array.isArray(addons)) {
      logger.info({ contractId, addonsCount: addons.length }, "🔄 Updating contract addons");

      await prisma.$transaction([
        prisma.contractAddonLink.deleteMany({ where: { contract_id: contractId } }),
        prisma.contractAddonLink.createMany({
          data: addons.map((a: any) => ({
            contract_id: contractId,
            addon_id: a.addon_id,
          })),
        }),
      ]);

      logger.info("✅ Addons updated successfully");
    }

    // 3️⃣ Réponse finale
    res.json({ success: true, data: updatedContract });
  } catch (error: any) {
    logger.error(
      {
        message: error.message,
        stack: error.stack,
        code: error.code,
        meta: error.meta,
      },
      "❌ Failed to update contract (details)"
    );
    res.status(500).json({ success: false, error: error.message });
  }
};
// 📌 Soft delete
export const softDeleteContract = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    logger.info({ id }, "Soft deleting contract");

    await prisma.contract.update({
      where: { id: id as string },
      data: { deleted_at: new Date(), deleted_by: (req as any).user?.id || null },
    });

    res.json({ success: true, message: "Contract soft deleted" });
  } catch (error) {
    logger.error(error, "Failed to soft delete contract");
    res.status(500).json({ success: false, error: "Failed to soft delete contract" });
  }
};

// 📌 Restore (remove soft delete markers)
export const restoreContract = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    logger.info({ id }, "Restoring contract");

    await prisma.contract.update({
      where: { id: id as string },
      data: { deleted_at: null, deleted_by: null },
    });

    res.json({ success: true, message: "Contract restored" });
  } catch (error) {
    logger.error(error, "Failed to restore contract");
    res.status(500).json({ success: false, error: "Failed to restore contract" });
  }
};

// 📌 Hard delete
export const hardDeleteContract = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    logger.info({ id }, "Hard deleting contract");

    await prisma.contract.delete({ where: { id: id as string } });

    res.json({ success: true, message: "Contract permanently deleted" });
  } catch (error) {
    logger.error(error, "Failed to hard delete contract");
    res.status(500).json({ success: false, error: "Failed to hard delete contract" });
  }
};

// 📌 Get all contracts (full view)
export const getContractsFullView = async (req: Request, res: Response) => {
  try {
    const { customer_id, search } = req.query;
    const filters: Prisma.Sql[] = [];

    if (customer_id) {
      filters.push(Prisma.sql`customer_id = ${customer_id}`);
    }

    if (search) {
      const keyword = `%${(search as string).trim()}%`;
      filters.push(
        Prisma.sql`(
          contract_number ILIKE ${keyword}
          OR customer_firstname ILIKE ${keyword}
          OR customer_lastname ILIKE ${keyword}
          OR customer_email ILIKE ${keyword}
        )`
      );
    }

    const contracts = await prisma.$queryRaw<any[]>(
      Prisma.sql`
        SELECT * FROM contracts_full_view
        ${filters.length ? Prisma.sql`WHERE ${Prisma.join(filters, " AND ")}` : Prisma.empty}
        ORDER BY created_at DESC
      `
    );

    res.json({ success: true, data: contracts });
  } catch (error) {
    logger.error(error, "Failed to fetch contracts_full_view");
    res.status(500).json({ success: false, error: "Failed to fetch contracts_full_view" });
  }
};

// 📌 Generate signature link and send email

export const generateSignatureLink = async (req: Request, res: Response) => {
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

    const baseUrl =  "https://app.allure-creation.fr";
    const url = new URL(`/sign/${signLink.token}`, baseUrl).toString();

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

    // ✉️ Préparation de l’email
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Signature électronique de votre contrat Allure-Création",
      html: `
        <p>Bonjour,</p>
        <p>Vous pouvez signer électroniquement votre contrat Allure-Création en cliquant sur le lien ci-dessous :</p>
        <p><a href="${url}">${url}</a></p>
        <p>Ce lien expirera le <strong>${expiresAtFormatted}</strong>.</p>
        <p>Merci de votre confiance,<br/>L'équipe Allure-Création</p>
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

  } catch (error) {
    logger.error({ err: error }, "🔥 Erreur interne lors de la génération du lien de signature");
    res.status(500).json({ success: false, error: "Failed to generate sign link" });
  }
};

// ✅ GET /sign-links/:token
export const getContractSignLink = async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string; // 👈 force en string

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
  } catch (error) {
    logger.error({ error }, "🔥 Erreur interne - getContractSignLink");
    res.status(500).json({ success: false, error: "Erreur interne serveur" });
  }
};

// ✅ POST /sign-links/:token/sign
export const signContractViaLink = async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string;

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

    if (!link) return res.status(404).json({ success: false, error: "Lien invalide" });
    if (new Date(link.expires_at) < new Date())
      return res.status(410).json({ success: false, error: "Lien expiré" });

    const contract = link.contract;
    if (!contract) return res.status(404).json({ success: false, error: "Contrat introuvable" });

    const now = new Date();

    // ✍️ 2️⃣ Mise à jour du contrat comme signé
    const updatedContract = await prisma.contract.update({
      where: { id: contract.id },
      data: {
        status: "SIGNED_ELECTRONICALLY",
        signed_at: now,
        updated_at: now,
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
    const customerFullName =
      customerFirstName || customerLastName
        ? [customerFirstName, customerLastName].filter((value): value is string => Boolean(value)).join(" ")
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
      data: { signed_pdf_url: signedPdfUrl } as Prisma.ContractUncheckedUpdateInput,
    });

    // 🧹 5️⃣ Suppression du lien de signature pour éviter la réutilisation
    await prisma.contractSignLink.delete({ where: { token } });

    // 🚀 6️⃣ Réponse finale
    res.json({
      success: true,
      message: "Contrat signé électroniquement et PDF sauvegardé",
      data: { ...updatedContract, signed_pdf_url: signedPdfUrl },
    });
  } catch (error) {
    console.error("🔥 Erreur lors de la signature électronique :", error);
    res.status(500).json({
      success: false,
      error: "Erreur interne lors de la signature électronique",
    });
  }
};

// ✅ POST /contracts/:id/generate-pdf (signature manuelle)
export const generateContractPdfManually = async (req: Request, res: Response) => {
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
        signed_pdf_url: pdfUrl,
        status: "SIGNED",
        signed_at: new Date(),
        updated_at: new Date(),
        updated_by: (req as any).user?.id ?? null,
      },
    });

    res.json({ link: pdfUrl });
  } catch (error) {
    logger.error({ error }, "🔥 Erreur génération PDF manuel");
    res.status(500).json({ success: false, error: "Erreur interne lors de la génération du PDF" });
  }
};

// ✅ POST /contracts/:id/upload-signed-pdf
export const uploadSignedContractPdf = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "Contract ID is required" });
    }

    const contract = await prisma.contract.findUnique({ where: { id } });
    if (!contract) {
      return res.status(404).json({ success: false, error: "Contrat introuvable" });
    }

    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (!file) {
      return res.status(400).json({ success: false, error: "Aucun fichier transmis" });
    }
    if (file.mimetype !== "application/pdf") {
      return res.status(400).json({ success: false, error: "Le fichier doit être un PDF" });
    }

    const key = `${CONTRACTS_FOLDER}/${id}/signed_upload_${Date.now()}.pdf`;
    await s3.send(
      new PutObjectCommand({
        Bucket: hetznerBucket,
        Key: key,
        Body: file.buffer,
        ContentType: "application/pdf",
      })
    );

    const pdfUrl = `${bucketUrlPrefix}${key}`;
    const updated = await prisma.contract.update({
      where: { id },
      data: {
        signed_pdf_url: pdfUrl,
        status: "SIGNED",
        signed_at: new Date(),
        updated_at: new Date(),
        updated_by: (req as any).user?.id ?? null,
      },
    });

    res.json({ success: true, link: pdfUrl, data: updated });
  } catch (error) {
    logger.error({ error }, "🔥 Erreur upload PDF signé");
    res.status(500).json({ success: false, error: "Erreur interne lors du stockage du PDF" });
  }
};
