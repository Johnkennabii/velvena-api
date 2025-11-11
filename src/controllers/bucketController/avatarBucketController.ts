import logger from "../../lib/logger.js"; // add this at the top with other imports
import type { Request, Response } from "express";
import { S3Client, ListObjectsV2Command, HeadObjectCommand, DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import multer from "multer";
import { randomUUID } from "crypto";

export const upload = multer({ storage: multer.memoryStorage() });

const s3 = new S3Client({
  region: "eu-central-1", // Hetzner Object Storage
  endpoint: "https://hel1.your-objectstorage.com", 
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.HETZNER_ACCESS_KEY || "2H0ESYFBWSWPLABFLV66",
    secretAccessKey: process.env.HETZNER_SECRET_KEY || "4tddvR12qEic2Qnxvjc0xktT4UMkzeEtdnSWjE5P", // ⚠️ Mets la vraie clé secrète ici
  },
});

export const listAvatars = async (_req: Request, res: Response) => {
  try {
    const bucketName = "avatar";
    const command = new ListObjectsV2Command({ Bucket: bucketName });
    logger.info({ bucket: bucketName }, "📂 Listing avatars from bucket");

    const response = await s3.send(command);
    logger.debug({ rawResponse: response }, "🧾 Raw S3 List response");

    const files = response.Contents?.map(obj => ({
      id: obj.Key,
      name: obj.Key,
      url: `https://${bucketName}.hel1.your-objectstorage.com/${obj.Key}`,
    }));

    logger.info({ count: files?.length || 0 }, "✅ Avatars retrieved");
    res.json({ success: true, files });
  } catch (err: any) {
    logger.error({ err, stack: err.stack }, "❌ Failed to list avatars");
    res.status(500).json({
      success: false,
      error: "Impossible de récupérer les avatars",
      details: err.message,
    });
  }
};

export const getAvatarById = async (req: Request, res: Response) => {
  const bucketName = "avatar";
  const { id } = req.params;
  const key = id;
  const url = `https://${bucketName}.hel1.your-objectstorage.com/${key}`;
  try {
    logger.info({ key }, "🔍 Checking avatar existence in bucket");
    await s3.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }));
    logger.info({ key }, "✅ Avatar found");
    res.json({ success: true, file: { id: key, name: key, url } });
  } catch (err: any) {
    if (err?.$metadata?.httpStatusCode === 404) {
      logger.warn({ key }, "❌ Avatar not found");
      res.status(404).json({ success: false, error: "Avatar not found" });
    } else {
      logger.error({ err, key }, "❌ Error checking avatar");
      res.status(500).json({ success: false, error: "Error retrieving avatar" });
    }
  }
};

export const deleteAvatarById = async (req: Request, res: Response) => {
  const bucketName = "avatar";
  const { id } = req.params;
  const key = id;
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
    logger.info({ key }, "🗑️ Avatar deleted");
    res.json({ success: true, message: "Avatar deleted" });
  } catch (err) {
    logger.error({ err, key }, "❌ Failed to delete avatar");
    res.status(500).json({ success: false, error: "Failed to delete avatar" });
  }
};

export const uploadAvatar = async (req: Request, res: Response) => {
  const bucketName = "avatar";
  if (!req.file) {
    return res.status(400).json({ success: false, error: "No file uploaded" });
  }
  const id = randomUUID();
  const key = id;
  const fileBuffer = req.file.buffer;
  const contentType = req.file.mimetype;

  try {
    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    });
    await s3.send(putCommand);
    const url = `https://${bucketName}.hel1.your-objectstorage.com/${key}`;
    logger.info({ key }, "✅ Avatar uploaded");
    res.json({ success: true, file: { id, name: key, url } });
  } catch (err) {
    logger.error({ err, key }, "❌ Failed to upload avatar");
    res.status(500).json({ success: false, error: "Failed to upload avatar" });
  }
};