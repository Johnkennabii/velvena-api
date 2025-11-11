import logger from "../../lib/logger.js";
import type { Request, Response } from "express";
import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import multer from "multer";
import { randomUUID } from "crypto";
import type { AuthenticatedRequest } from "../../types/express.js";

export const upload = multer({ storage: multer.memoryStorage() });

const s3 = new S3Client({
  region: "eu-central-1",
  endpoint: "https://hel1.your-objectstorage.com",
  credentials: {
    accessKeyId: process.env.HETZNER_ACCESS_KEY!,
    secretAccessKey: process.env.HETZNER_SECRET_KEY!,
  },
});
logger.info(
  {
    accessKey: process.env.HETZNER_ACCESS_KEY || "MISSING",
    secretKey: process.env.HETZNER_SECRET_KEY ? "***" : "MISSING",
  },
  "🔑 Hetzner credentials loaded"
);

const hetznerBucket = process.env.HETZNER_BUCKET ?? "media-allure-creation";
const DRESSES_FOLDER = "dresses";
const DRESSES_PREFIX = `${DRESSES_FOLDER}/`;
const bucketUrlPrefix = `https://${hetznerBucket}.hel1.your-objectstorage.com/`;

if (!process.env.HETZNER_BUCKET) {
  logger.warn("⚠️ HETZNER_BUCKET not set, defaulting to 'media-allure-creation'");
}

const ensureDressKey = (key: string): string =>
  key.startsWith(DRESSES_PREFIX) ? key : `${DRESSES_PREFIX}${key}`;

const stripDressPrefix = (key: string): string =>
  key.startsWith(DRESSES_PREFIX) ? key.slice(DRESSES_PREFIX.length) : key;

export const listDressImages = async (_req: Request, res: Response) => {
  try {
    logger.info({ bucket: hetznerBucket, prefix: DRESSES_PREFIX }, "📂 Listing images from bucket");
    const command = new ListObjectsV2Command({ Bucket: hetznerBucket, Prefix: DRESSES_PREFIX });
    const response = await s3.send(command) as any;

    const files = response.Contents?.map((obj: any) => ({
      id: stripDressPrefix(obj.Key),
      name: stripDressPrefix(obj.Key),
      url: `${bucketUrlPrefix}${obj.Key}`,
    }));

    res.json({ success: true, files });
  } catch (err: any) {
    logger.error(
      { err: { name: err?.name, message: err?.message, stack: err?.stack, metadata: err?.$metadata } },
      "❌ Failed to list dress images"
    );
    res.status(500).json({ success: false, error: "Impossible de récupérer les images", details: err?.message });
  }
};

// Upload max 5 images pour une robe donnée
export const uploadDressImages = async (req: AuthenticatedRequest, res: Response) => {
  if (!req.files || !(req.files instanceof Array)) {
    return res.status(400).json({ success: false, error: "No files uploaded" });
  }

  try {
    logger.info({ count: req.files.length }, "⬆️ Uploading dress images");
    const uploadedFiles = await Promise.all(
      req.files.slice(0, 5).map(async (file: Express.Multer.File) => {
        const key = ensureDressKey(randomUUID());
        await s3.send(
          new PutObjectCommand({
            Bucket: hetznerBucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
          })
        );
        return `${bucketUrlPrefix}${key}`;
      })
    );

    const files = uploadedFiles.map((url) => ({
      id: randomUUID(),
      name: url.split("/").pop(),
      url,
    }));
    logger.info({ files }, "✅ Images uploaded successfully");
    res.json({ success: true, files });
  } catch (err) {
    logger.error({ err }, "❌ Failed to upload images for dress");
    res.status(500).json({ success: false, error: "Failed to upload images" });
  }
};

// Supprimer une image précise
export const deleteDressImage = async (req: AuthenticatedRequest, res: Response) => {
  const { key } = req.params;
  if (!key) return res.status(400).json({ success: false, error: "Image key is required" });

  try {
    const objectKey = ensureDressKey(key);
    logger.info({ key: objectKey }, "🗑️ Deleting image from bucket");
    await s3.send(new DeleteObjectCommand({ Bucket: hetznerBucket, Key: objectKey }));
    logger.info({ key: objectKey }, "✅ Image deleted from bucket");
    res.json({ success: true, message: "Image deleted" });
  } catch (err) {
    logger.error({ err, key }, "❌ Failed to delete dress image");
    res.status(500).json({ success: false, error: "Failed to delete image" });
  }
};
