import logger from "../../lib/logger.js";
import type { Request, Response } from "express";
import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import multer from "multer";
import { randomUUID } from "crypto";
import type { AuthenticatedRequest } from "../../types/express.js";
import { buildStoragePath, buildPublicUrl, extractPathFromUrl, buildListPrefix } from "../../utils/storageHelper.js";

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

const hetznerBucket = process.env.HETZNER_BUCKET ?? "velvena-medias";
const bucketUrlPrefix = `https://${hetznerBucket}.hel1.your-objectstorage.com/`;

if (!process.env.HETZNER_BUCKET) {
  logger.warn("⚠️ HETZNER_BUCKET not set, defaulting to 'velvena-medias'");
}

export const listDressImages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.organizationId) {
      return res.status(403).json({
        success: false,
        error: "Organization context required",
      });
    }

    const prefix = buildListPrefix(req.user.organizationId, 'dresses');
    logger.info({ bucket: hetznerBucket, prefix, organizationId: req.user.organizationId }, "📂 Listing images from bucket");

    const command = new ListObjectsV2Command({ Bucket: hetznerBucket, Prefix: prefix });
    const response = await s3.send(command) as any;

    const files = response.Contents?.map((obj: any) => ({
      id: obj.Key.split('/').pop() || obj.Key,
      name: obj.Key.split('/').pop() || obj.Key,
      url: buildPublicUrl(bucketUrlPrefix, obj.Key),
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

  if (!req.user?.organizationId) {
    return res.status(403).json({
      success: false,
      error: "Organization context required",
    });
  }

  try {
    logger.info({ count: req.files.length, organizationId: req.user.organizationId }, "⬆️ Uploading dress images");

    const uploadedFiles = await Promise.all(
      req.files.slice(0, 5).map(async (file: Express.Multer.File) => {
        // Extract file extension from original filename
        const ext = file.originalname.split('.').pop() || 'jpg';
        const filename = `${randomUUID()}.${ext}`;
        const key = buildStoragePath(req.user!.organizationId, 'dresses', filename);

        await s3.send(
          new PutObjectCommand({
            Bucket: hetznerBucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
          })
        );

        return buildPublicUrl(bucketUrlPrefix, key);
      })
    );

    const files = uploadedFiles.map((url) => ({
      id: randomUUID(),
      name: url.split("/").pop(),
      url,
    }));
    logger.info({ files, organizationId: req.user.organizationId }, "✅ Images uploaded successfully");
    res.json({ success: true, files });
  } catch (err: any) {
    logger.error({
      error: err?.message,
      stack: err?.stack,
      name: err?.name,
      code: err?.Code,
      statusCode: err?.$metadata?.httpStatusCode,
      requestId: err?.$metadata?.requestId
    }, "❌ Failed to upload images for dress");
    res.status(500).json({
      success: false,
      error: "Failed to upload images",
      details: err?.message,
      code: err?.Code || err?.name
    });
  }
};

// Supprimer une image précise
export const deleteDressImage = async (req: AuthenticatedRequest, res: Response) => {
  const { key } = req.params;
  if (!key) return res.status(400).json({ success: false, error: "Image key is required" });

  if (!req.user?.organizationId) {
    return res.status(403).json({
      success: false,
      error: "Organization context required",
    });
  }

  try {
    // Construire le path complet avec organization
    const objectKey = buildStoragePath(req.user.organizationId, 'dresses', key);

    logger.info({ key: objectKey, organizationId: req.user.organizationId }, "🗑️ Deleting image from bucket");
    await s3.send(new DeleteObjectCommand({ Bucket: hetznerBucket, Key: objectKey }));
    logger.info({ key: objectKey, organizationId: req.user.organizationId }, "✅ Image deleted from bucket");
    res.json({ success: true, message: "Image deleted" });
  } catch (err) {
    logger.error({ err, key }, "❌ Failed to delete dress image");
    res.status(500).json({ success: false, error: "Failed to delete image" });
  }
};
