import type { Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma.js";
import type { AuthenticatedRequest } from "../../types/express.js";
import pino from "../../lib/logger.js";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { emitAndStoreNotification } from "../../utils/notifications.js";
import { buildStoragePath, buildPublicUrl, extractPathFromUrl } from "../../utils/storageHelper.js";
import { requireOrganizationContext } from "../../utils/organizationHelper.js";

const s3 = new S3Client({
  region: "eu-central-1",
  endpoint: "https://hel1.your-objectstorage.com",
  credentials: {
    accessKeyId: process.env.HETZNER_ACCESS_KEY!,
    secretAccessKey: process.env.HETZNER_SECRET_KEY!,
  },
});
const hetznerBucket = process.env.HETZNER_BUCKET ?? "velvena-medias";
const bucketUrlPrefix = `https://${hetznerBucket}.hel1.your-objectstorage.com/`;
const legacyDressBucketUrlPrefix = "https://dresses.hel1.your-objectstorage.com/";

if (!process.env.HETZNER_BUCKET) {
  pino.warn("⚠️ HETZNER_BUCKET not set, defaulting to 'velvena-medias'");
}

// Helper functions for multi-tenant storage
const buildDressKey = (organizationId: string): string =>
  buildStoragePath(organizationId, 'dresses', randomUUID());

const buildDressUrl = (key: string): string => buildPublicUrl(bucketUrlPrefix, key);

// GET all dresses
export const getDresses = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // ✅ Supports SUPER_ADMIN with X-Organization-Slug header
    const organizationId = requireOrganizationContext(req, res);
    if (!organizationId) return; // Error response already sent

    const {
      limit,
      offset,
      type,
      size,
      color,
      type_id: typeId,
      size_id: sizeId,
      color_id: colorId,
    } = req.query;

    const toStringArray = (value: unknown): string[] => {
      if (!value) return [];
      const raw = Array.isArray(value) ? value : String(value).split(",");
      return Array.from(
        new Set(
          raw
            .map((entry) => String(entry).trim())
            .filter((entry) => entry.length > 0)
        )
      );
    };

    const typeNames = toStringArray(type);
    const sizeNames = toStringArray(size);
    const colorNames = toStringArray(color);
    const typeIds = toStringArray(typeId);
    const sizeIds = toStringArray(sizeId);
    const colorIds = toStringArray(colorId);

    const filters: Prisma.DressWhereInput[] = [
      { deleted_at: null },
      { organization_id: organizationId }, // ✅ Multi-tenant isolation (works with SUPER_ADMIN context)
    ];

    if (typeNames.length > 0) {
      filters.push({
        type: {
          name: {
            in: typeNames,
            mode: "insensitive",
          },
        },
      });
    }

    if (sizeNames.length > 0) {
      filters.push({
        size: {
          name: {
            in: sizeNames,
            mode: "insensitive",
          },
        },
      });
    }

    if (colorNames.length > 0) {
      filters.push({
        color: {
          name: {
            in: colorNames,
            mode: "insensitive",
          },
        },
      });
    }

    if (typeIds.length > 0) {
      filters.push({ type_id: { in: typeIds } });
    }

    if (sizeIds.length > 0) {
      filters.push({ size_id: { in: sizeIds } });
    }

    if (colorIds.length > 0) {
      filters.push({ color_id: { in: colorIds } });
    }

    const where: Prisma.DressWhereInput = filters.length > 1 ? { AND: filters } : filters[0]!;

    const parseOptionalInt = (value: unknown): number | undefined => {
      if (value === undefined || value === null) return undefined;
      const raw = Array.isArray(value) ? value[0] : value;
      const parsed = Number.parseInt(String(raw), 10);
      return Number.isNaN(parsed) ? undefined : parsed;
    };

    const take = parseOptionalInt(limit);
    const skip = parseOptionalInt(offset);

    const queryOptions: Prisma.DressFindManyArgs = {
      where,
      orderBy: { created_at: "desc" },
      include: {
        type: true,
        size: true,
        condition: true,
        color: true,
      },
    };

    if (take !== undefined && take > 0) {
      queryOptions.take = take;
    }

    if (skip !== undefined && skip >= 0) {
      queryOptions.skip = skip;
    }

    const dresses = await prisma.dress.findMany(queryOptions);

    const shouldCount = (take !== undefined && take > 0) || (skip !== undefined && skip >= 0);
    const total = shouldCount ? await prisma.dress.count({ where }) : undefined;

    // Add rental count for each dress
    const dressesWithRentalCount = await Promise.all(
      dresses.map(async (dress) => {
        const rentalCount = await prisma.contractDress.count({
          where: {
            dress_id: dress.id,
            contract: {
              organization_id: organizationId,
              deleted_at: null,
            },
          },
        });
        return {
          ...dress,
          rental_count: rentalCount,
        };
      })
    );

    pino.info(
      {
        count: dresses.length,
        filters: {
          typeNames,
          sizeNames,
          colorNames,
          typeIds,
          sizeIds,
          colorIds,
          limit: take !== undefined && take > 0 ? take : undefined,
          offset: skip !== undefined && skip >= 0 ? skip : undefined,
        },
      },
      "📌 Récupération des robes"
    );

    res.json({
      success: true,
      data: dressesWithRentalCount,
      ...(shouldCount ? { total } : {}),
    });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur récupération robes");
    res.status(500).json({ success: false, error: "Failed to fetch dresses" });
  }
};

// GET a dress by ID
export const getDressById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "ID is required" });
    }

    // ✅ Supports SUPER_ADMIN with X-Organization-Slug header
    const organizationId = requireOrganizationContext(req, res);
    if (!organizationId) return; // Error response already sent

    const [dress, rentalCount] = await Promise.all([
      prisma.dress.findFirst({
        where: {
          id: id as string,
          organization_id: organizationId, // ✅ Multi-tenant isolation (works with SUPER_ADMIN context)
        },
        include: {
          type: true,
          size: true,
          condition: true,
          color: true,
        },
      }),
      prisma.contractDress.count({
        where: {
          dress_id: id as string,
          contract: {
            organization_id: organizationId,
            deleted_at: null,
          },
        },
      }),
    ]);

    if (!dress || dress.deleted_at) {
      return res.status(404).json({ success: false, error: "Dress not found" });
    }

    res.status(200).json({
      success: true,
      data: {
        ...dress,
        rental_count: rentalCount,
      }
    });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur récupération robe par ID");
    res.status(500).json({ success: false, error: "Failed to fetch dress by ID" });
  }
};

// CREATE
export const createDress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // ✅ Supports SUPER_ADMIN with X-Organization-Slug header
    const organizationId = requireOrganizationContext(req, res);
    if (!organizationId) return; // Error response already sent

    const {
      name,
      reference,
      price_ht,
      price_ttc,
      price_per_day_ht,
      price_per_day_ttc,
      type_id,
      size_id,
      condition_id,
      color_id,
      is_for_sale,
      stock_quantity,
    } = req.body;

    // Log the received body values
    pino.info(
      {
        body: {
          name,
          reference,
          price_ht,
          price_ttc,
          price_per_day_ht,
          price_per_day_ttc,
          type_id,
          size_id,
          condition_id,
          color_id,
          is_for_sale,
          stock_quantity,
        },
      },
      "📥 Données reçues pour createDress"
    );

    if (!name || !reference) {
      return res.status(400).json({ success: false, error: "Name and reference are required" });
    }
    if (price_per_day_ht === undefined || price_per_day_ht === null) {
      return res.status(400).json({ success: false, error: "price_per_day_ht is required" });
    }
    if (price_per_day_ttc === undefined || price_per_day_ttc === null) {
      return res.status(400).json({ success: false, error: "price_per_day_ttc is required" });
    }

    // Check reference uniqueness per organization
    const existing = await prisma.dress.findFirst({
      where: {
        reference,
        organization_id: organizationId,
      },
    });
    if (existing) {
      return res.status(400).json({ success: false, error: "Reference already exists" });
    }

    // gestion des fichiers uploadés
    let uploadedFiles: string[] = [];
    const files = (req.files as Express.Multer.File[]) || [];
    // Log uploaded files info
    if (Array.isArray(files) && files.length > 0) {
      pino.info(
        {
          files: files.map(f => ({
            originalname: f.originalname,
            mimetype: f.mimetype,
            size: f.size,
          })),
        },
        "ℹ️ Uploaded files info (createDress)"
      );
      uploadedFiles = await Promise.all(
        files.slice(0, 5).map(async (file) => {
          const key = buildDressKey(organizationId);
          await s3.send(
            new PutObjectCommand({
              Bucket: hetznerBucket,
              Key: key,
              Body: file.buffer,
              ContentType: file.mimetype,
            })
          );
          return buildDressUrl(key);
        })
      );
    } else {
      pino.info({ filesCount: files.length }, "ℹ️ No files uploaded (createDress)");
    }

    // Ajout des URLs envoyées dans req.body.images (si array)
    let finalImages: string[] = uploadedFiles;
    if (Array.isArray(req.body.images) && req.body.images.length > 0) {
      finalImages = [...uploadedFiles, ...req.body.images];
    }
    // Supprimer doublons
    finalImages = [...new Set(finalImages)];

    const data = {
      name,
      reference,
      organization_id: organizationId, // ✅ Multi-tenant isolation (works with SUPER_ADMIN context)
      price_ht: parseFloat(price_ht),
      price_ttc: parseFloat(price_ttc),
      price_per_day_ht: parseFloat(price_per_day_ht),
      price_per_day_ttc: parseFloat(price_per_day_ttc),
      images: finalImages, // toujours [] si pas d'images
      type_id,
      size_id,
      condition_id,
      color_id,
      created_by: req.user?.id ?? null,
      ...(is_for_sale !== undefined && { is_for_sale: Boolean(is_for_sale) }),
      ...(stock_quantity !== undefined && { stock_quantity: parseInt(String(stock_quantity), 10) }),
    };
    // Log the final uploadedFiles and data object
    pino.info({ uploadedFiles, data }, "ℹ️ Prepared data for prisma.dress.create");

    const newDress = await prisma.dress.create({
      data,
    });

    let creatorProfile: { firstName: string | null; lastName: string | null } | null = null;
    if (req.user?.id) {
      creatorProfile = await prisma.profile.findUnique({
        where: { userId: req.user.id },
        select: {
          firstName: true,
          lastName: true,
        },
      });
    }
    const creatorFirstName = creatorProfile?.firstName?.trim() || null;
    const creatorLastName = creatorProfile?.lastName?.trim() || null;
    const creatorFullName =
      creatorFirstName || creatorLastName
        ? [creatorFirstName, creatorLastName].filter((value): value is string => Boolean(value)).join(" ")
        : null;

await emitAndStoreNotification({
  type: "DRESS_CREATED",
  title: "Nouvelle robe ajoutée",
  message: `La robe "${newDress.name}" (ref: ${newDress.reference}) a été ajoutée au catalogue par ${creatorFullName ?? "un utilisateur"}.`,
  organization_id: req.user!.organizationId,
  reference: newDress.reference,
  creator: {
    id: req.user?.id ?? null,
    firstName: creatorFirstName,
    lastName: creatorLastName,
  },
});

    pino.info({ id: newDress.id }, "✅ Robe créée avec images");
    res.status(201).json({ success: true, data: newDress });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur création robe");

    // Handle unique constraint violation
    if (err.code === "P2002") {
      return res.status(409).json({
        success: false,
        error: `Une robe avec la référence '${req.body.reference}' existe déjà dans votre organisation.`,
        code: "DUPLICATE_REFERENCE"
      });
    }

    res.status(500).json({ success: false, error: "Failed to create dress" });
  }
};

// UPDATE
export const updateDress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "ID is required" });
    }

    // ✅ Supports SUPER_ADMIN with X-Organization-Slug header
    const organizationId = requireOrganizationContext(req, res);
    if (!organizationId) return; // Error response already sent

    // Vérifier si la robe existe ET appartient à l'organisation
    const existing = await prisma.dress.findFirst({
      where: {
        id,
        organization_id: organizationId, // ✅ Multi-tenant isolation (works with SUPER_ADMIN context)
      },
    });
    pino.info({ existing }, "ℹ️ Existing dress record found");
    if (!existing || existing.deleted_at) {
      return res.status(404).json({ success: false, error: "Dress not found" });
    }

    // Parse body if req.body.data exists, otherwise use req.body
    let body: any;
    if (req.body && typeof req.body.data === "string") {
      try {
        body = JSON.parse(req.body.data);
      } catch (parseErr) {
        pino.error({ parseErr, data: req.body.data }, "❌ Failed to parse req.body.data for updateDress");
        return res.status(400).json({ success: false, error: "Invalid JSON in body.data" });
      }
    } else {
      body = req.body;
    }

    const {
      name,
      reference,
      price_ht,
      price_ttc,
      price_per_day_ht,
      price_per_day_ttc,
      type_id,
      size_id,
      condition_id,
      color_id,
      published_post,
      is_for_sale,
      stock_quantity,
    } = body;
    pino.info({ id, body }, "📥 Données reçues pour updateDress");

    // Vérif prix
    if (price_per_day_ht === undefined || price_per_day_ht === null) {
      return res.status(400).json({ success: false, error: "price_per_day_ht is required" });
    }
    if (price_per_day_ttc === undefined || price_per_day_ttc === null) {
      return res.status(400).json({ success: false, error: "price_per_day_ttc is required" });
    }

    // ⚡ Gestion upload fichiers (si envoyés)
    const files = (req.files as Express.Multer.File[]) || [];
    pino.info(
      { files: files.map(f => ({ originalname: f.originalname, mimetype: f.mimetype, size: f.size })) },
      "ℹ️ Uploaded files info"
    );
    let uploadedFiles: string[] = existing.images ?? [];

    if (Array.isArray(files) && files.length > 0) {
      const newFiles = await Promise.all(
        files.slice(0, 5).map(async (file) => {
          const key = buildDressKey(organizationId);
          await s3.send(
            new PutObjectCommand({
              Bucket: hetznerBucket,
              Key: key,
              Body: file.buffer,
              ContentType: file.mimetype,
            })
          );
          return buildDressUrl(key);
        })
      );
      uploadedFiles = [...uploadedFiles, ...newFiles];
    }

    // Ajout des URLs envoyées dans body.images
    if (Array.isArray(body.images) && body.images.length > 0) {
      uploadedFiles = [...uploadedFiles, ...body.images];
    }

    // Supprimer doublons
    uploadedFiles = [...new Set(uploadedFiles)];

    // Gestion de la publication
    let publishedData: { published_post?: boolean; published_at?: Date | null; published_by?: string | null } = {};
    if (published_post === true) {
      publishedData = {
        published_post: true,
        published_at: new Date(),
        published_by: req.user?.id ?? null,
      };
      pino.info({ userId: req.user?.id }, "✅ Robe marquée comme publiée");
    } else if (published_post === false) {
      publishedData = {
        published_post: false,
        published_at: null,
        published_by: null,
      };
      pino.info("❌ Robe marquée comme non publiée");
    }

    const updateData = {
      name,
      reference,
      price_ht: price_ht ? parseFloat(price_ht) : 0,
      price_ttc: price_ttc ? parseFloat(price_ttc) : 0,
      price_per_day_ht: price_per_day_ht ? parseFloat(price_per_day_ht) : 0,
      price_per_day_ttc: price_per_day_ttc ? parseFloat(price_per_day_ttc) : 0,
      images: uploadedFiles,
      type_id,
      size_id,
      condition_id,
      color_id,
      updated_by: req.user?.id ?? null,
      ...(is_for_sale !== undefined && { is_for_sale: Boolean(is_for_sale) }),
      ...(stock_quantity !== undefined && { stock_quantity: parseInt(String(stock_quantity), 10) }),
      ...publishedData,
    };
    pino.info({ uploadedFiles, updateData }, "ℹ️ Prepared data for prisma.dress.update");

    const updated = await prisma.dress.update({
      where: { id },
      data: updateData,
    });

    pino.info({ id }, "✏️ Robe mise à jour");
    res.json({ success: true, data: updated });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur mise à jour robe");

    // Handle unique constraint violation
    if (err.code === "P2002") {
      const reference = typeof req.body.data === "string" ? JSON.parse(req.body.data).reference : req.body.reference;
      return res.status(409).json({
        success: false,
        error: `Une robe avec la référence '${reference}' existe déjà dans votre organisation.`,
        code: "DUPLICATE_REFERENCE"
      });
    }

    res.status(500).json({ success: false, error: "Failed to update dress" });
  }
};

// PUBLISH DRESS
export const publishDress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "ID is required" });
    }

    // ✅ Supports SUPER_ADMIN with X-Organization-Slug header
    const organizationId = requireOrganizationContext(req, res);
    if (!organizationId) return; // Error response already sent

    const existing = await prisma.dress.findFirst({
      where: {
        id,
        organization_id: organizationId, // ✅ Multi-tenant isolation (works with SUPER_ADMIN context)
      },
    });
    if (!existing || existing.deleted_at) {
      return res.status(404).json({ success: false, error: "Dress not found" });
    }

    const updated = await prisma.dress.update({
      where: { id },
      data: {
        published_post: true,
        published_at: new Date(),
        published_by: req.user?.id ?? null,
        updated_by: req.user?.id ?? null,
      },
    });

    pino.info({ id, userId: req.user?.id }, "✅ Robe publiée");
    res.json({ success: true, data: updated });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur publication robe");
    res.status(500).json({ success: false, error: "Failed to publish dress" });
  }
};

// UNPUBLISH DRESS
export const unpublishDress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "ID is required" });
    }

    // ✅ Supports SUPER_ADMIN with X-Organization-Slug header
    const organizationId = requireOrganizationContext(req, res);
    if (!organizationId) return; // Error response already sent

    const existing = await prisma.dress.findFirst({
      where: {
        id,
        organization_id: organizationId, // ✅ Multi-tenant isolation (works with SUPER_ADMIN context)
      },
    });
    if (!existing || existing.deleted_at) {
      return res.status(404).json({ success: false, error: "Dress not found" });
    }

    const updated = await prisma.dress.update({
      where: { id },
      data: {
        published_post: false,
        published_at: null,
        published_by: null,
        updated_by: req.user?.id ?? null,
      },
    });

    pino.info({ id, userId: req.user?.id }, "❌ Robe dépubliée");
    res.json({ success: true, data: updated });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur dépublication robe");
    res.status(500).json({ success: false, error: "Failed to unpublish dress" });
  }
};

// SOFT DELETE
export const softDeleteDress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // ✅ Supports SUPER_ADMIN with X-Organization-Slug header
    const organizationId = requireOrganizationContext(req, res);
    if (!organizationId) return; // Error response already sent

    const existing = await prisma.dress.findFirst({
      where: {
        id: id as string,
        organization_id: organizationId, // ✅ Multi-tenant isolation (works with SUPER_ADMIN context)
      },
    });
    if (!existing || existing.deleted_at) {
      return res.status(404).json({ success: false, error: "Dress not found" });
    }

    const deleted = await prisma.dress.update({
      where: { id: id as string },
      data: { deleted_at: new Date(), deleted_by: req.user?.id ?? null },
    });
    pino.warn({ id }, "🗑 Robe soft supprimée");
    res.json({ success: true, data: deleted });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur soft delete robe");
    res.status(500).json({ success: false, error: "Failed to soft delete dress" });
  }
};

// HARD DELETE
export const hardDeleteDress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // ✅ Supports SUPER_ADMIN with X-Organization-Slug header
    const organizationId = requireOrganizationContext(req, res);
    if (!organizationId) return; // Error response already sent

    const existing = await prisma.dress.findFirst({
      where: {
        id: id as string,
        organization_id: organizationId, // ✅ Multi-tenant isolation (works with SUPER_ADMIN context)
      },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: "Dress not found" });
    }

    await prisma.dress.delete({ where: { id: id as string } });
    pino.warn({ id }, "🔥 Robe hard supprimée");
    res.json({ success: true, message: "Dress permanently deleted" });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur hard delete robe");
    res.status(500).json({ success: false, error: "Failed to hard delete dress" });
  }
};
// GET dresses with details
export const getDressesWithDetails = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // ✅ Supports SUPER_ADMIN with X-Organization-Slug header
    const organizationId = requireOrganizationContext(req, res);
    if (!organizationId) return; // Error response already sent

    const {
      page = "1",
      limit = "10",
      sizes,
      types,
      colors,
      priceMax,
      pricePerDayMax,
      startDate,
      endDate,
      id,
      search,
      is_for_sale,
      stock_quantity,
      in_stock,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.DressWhereInput = {
      deleted_at: null,
      organization_id: organizationId, // ✅ Multi-tenant isolation (works with SUPER_ADMIN context)
    };

    if (id) {
      where.id = String(id);
    }

    if (sizes) {
      const sizeArray = String(sizes).split(",");
      where.size_id = { in: sizeArray };
    }

    if (types) {
      const typeArray = String(types).split(",");
      where.type_id = { in: typeArray };
    }

    if (colors) {
      const colorArray = String(colors).split(",");
      where.color_id = { in: colorArray };
    }

    if (priceMax) {
      where.price_ttc = { lte: parseFloat(String(priceMax)) };
    }

    if (pricePerDayMax) {
      where.price_per_day_ttc = { lte: parseFloat(String(pricePerDayMax)) };
    }

    if (startDate) {
      where.created_at = { ...where.created_at as any, gte: new Date(String(startDate)) };
    }

    if (endDate) {
      where.created_at = { ...where.created_at as any, lte: new Date(String(endDate)) };
    }

    if (search) {
      const keyword = String(search).trim();
      where.OR = [
        { name: { contains: keyword, mode: "insensitive" } },
        { reference: { contains: keyword, mode: "insensitive" } },
      ];
    }

    // ✅ Filter by is_for_sale (true/false)
    if (is_for_sale !== undefined) {
      where.is_for_sale = String(is_for_sale) === "true";
    }

    // ✅ Filter by exact stock_quantity
    if (stock_quantity !== undefined) {
      where.stock_quantity = parseInt(String(stock_quantity), 10);
    }

    // ✅ Filter by in_stock (stock > 0)
    if (in_stock !== undefined) {
      const inStockBool = String(in_stock) === "true";
      if (inStockBool) {
        where.stock_quantity = { gt: 0 };
      } else {
        where.stock_quantity = { lte: 0 };
      }
    }

    const [total, results] = await Promise.all([
      prisma.dress.count({ where }),
      prisma.dress.findMany({
        where,
        include: {
          type: true,
          size: true,
          color: true,
          condition: true,
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limitNum,
      }),
    ]);

    // Optimize rental counts with a single grouped query instead of N+1
    const rentalCounts = await prisma.contractDress.groupBy({
      by: ['dress_id'],
      where: {
        dress_id: { in: results.map(d => d.id) },
        contract: {
          organization_id: organizationId,
          deleted_at: null,
        }
      },
      _count: {
        dress_id: true
      }
    });

    // Create a map for O(1) lookup
    const rentalCountMap = new Map(
      rentalCounts.map(rc => [rc.dress_id, rc._count.dress_id])
    );

    // Add rental counts without additional queries
    const resultsWithRentalCount = results.map(dress => ({
      ...dress,
      rental_count: rentalCountMap.get(dress.id) ?? 0,
    }));

    // ✨ Fetch filter metadata (available filters with counts)
    // Use the base where clause without applied filters to show all available options
    const baseWhere: Prisma.DressWhereInput = {
      deleted_at: null,
      organization_id: organizationId,
    };

    const [
      typesWithCount,
      sizesWithCount,
      colorsWithCount,
      conditionsWithCount,
      priceStats,
      stockStats
    ] = await Promise.all([
      // Types with dress count
      prisma.dress.groupBy({
        by: ['type_id'],
        where: baseWhere,
        _count: { type_id: true },
      }).then(async (groups) => {
        const typeIds = groups.map(g => g.type_id).filter((id): id is string => id !== null);
        const types = await prisma.dressType.findMany({
          where: { id: { in: typeIds }, deleted_at: null },
          select: { id: true, name: true },
          orderBy: { name: 'asc' }
        });
        return types.map(type => ({
          ...type,
          count: groups.find(g => g.type_id === type.id)?._count.type_id ?? 0
        }));
      }),

      // Sizes with dress count
      prisma.dress.groupBy({
        by: ['size_id'],
        where: baseWhere,
        _count: { size_id: true },
      }).then(async (groups) => {
        const sizeIds = groups.map(g => g.size_id).filter((id): id is string => id !== null);
        const sizes = await prisma.dressSize.findMany({
          where: { id: { in: sizeIds }, deleted_at: null },
          select: { id: true, name: true },
          orderBy: { name: 'asc' }
        });
        return sizes.map(size => ({
          ...size,
          count: groups.find(g => g.size_id === size.id)?._count.size_id ?? 0
        }));
      }),

      // Colors with dress count
      prisma.dress.groupBy({
        by: ['color_id'],
        where: baseWhere,
        _count: { color_id: true },
      }).then(async (groups) => {
        const colorIds = groups.map(g => g.color_id).filter((id): id is string => id !== null);
        const colors = await prisma.dressColor.findMany({
          where: { id: { in: colorIds }, deleted_at: null },
          select: { id: true, name: true, hex_code: true },
          orderBy: { name: 'asc' }
        });
        return colors.map(color => ({
          ...color,
          count: groups.find(g => g.color_id === color.id)?._count.color_id ?? 0
        }));
      }),

      // Conditions with dress count
      prisma.dress.groupBy({
        by: ['condition_id'],
        where: baseWhere,
        _count: { condition_id: true },
      }).then(async (groups) => {
        const conditionIds = groups.map(g => g.condition_id).filter((id): id is string => id !== null);
        const conditions = await prisma.dressCondition.findMany({
          where: { id: { in: conditionIds }, deleted_at: null },
          select: { id: true, name: true },
          orderBy: { name: 'asc' }
        });
        return conditions.map(condition => ({
          ...condition,
          count: groups.find(g => g.condition_id === condition.id)?._count.condition_id ?? 0
        }));
      }),

      // Price statistics
      prisma.dress.aggregate({
        where: baseWhere,
        _min: {
          price_ttc: true,
          price_per_day_ttc: true,
        },
        _max: {
          price_ttc: true,
          price_per_day_ttc: true,
        },
      }),

      // Stock statistics
      prisma.dress.groupBy({
        by: ['is_for_sale'],
        where: baseWhere,
        _count: { id: true },
        _sum: { stock_quantity: true },
      }),
    ]);

    // Calculate stock info
    const totalInStock = await prisma.dress.count({
      where: { ...baseWhere, stock_quantity: { gt: 0 } }
    });
    const totalSoldOut = await prisma.dress.count({
      where: { ...baseWhere, stock_quantity: { lte: 0 } }
    });
    const totalForSale = stockStats.find(s => s.is_for_sale === true)?._count.id ?? 0;

    res.json({
      success: true,
      total,
      page: pageNum,
      limit: limitNum,
      data: resultsWithRentalCount,
      // ✨ Filter metadata
      filters: {
        types: typesWithCount,
        sizes: sizesWithCount,
        colors: colorsWithCount,
        conditions: conditionsWithCount,
        priceRange: {
          min_ttc: priceStats._min.price_ttc ?? 0,
          max_ttc: priceStats._max.price_ttc ?? 0,
          min_per_day_ttc: priceStats._min.price_per_day_ttc ?? 0,
          max_per_day_ttc: priceStats._max.price_per_day_ttc ?? 0,
        },
        stockInfo: {
          total_in_stock: totalInStock,
          total_sold_out: totalSoldOut,
          total_for_sale: totalForSale,
        }
      }
    });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur récupération robes avec détails");
    res.status(500).json({ success: false, error: "Failed to fetch dresses with details" });
  }
};


// POST /dresses/:id/images
export const addDressImages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: "Dress ID is required" });

    // ✅ Supports SUPER_ADMIN with X-Organization-Slug header
    const organizationId = requireOrganizationContext(req, res);
    if (!organizationId) return; // Error response already sent

    const dress = await prisma.dress.findFirst({
      where: {
        id,
        organization_id: organizationId, // ✅ Multi-tenant isolation (works with SUPER_ADMIN context)
      },
    });
    if (!dress) return res.status(404).json({ success: false, error: "Dress not found" });

    if (!req.files || !(req.files instanceof Array)) {
      return res.status(400).json({ success: false, error: "No files uploaded" });
    }

    // Upload max 5 images
    const uploadedFiles = await Promise.all(
      req.files.slice(0, 5).map(async (file: Express.Multer.File) => {
        const key = buildDressKey(organizationId);
        await s3.send(
          new PutObjectCommand({
            Bucket: hetznerBucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
          })
        );
        return buildDressUrl(key);
      })
    );

    // Fusionner les nouvelles images avec celles déjà présentes
    const updatedImages = [...(dress.images ?? []), ...uploadedFiles];

    const updated = await prisma.dress.update({
      where: { id },
      data: { images: updatedImages, updated_by: req.user?.id ?? null },
    });

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to add dress images" });
  }
};

export const removeDressImage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const collectKeys = (): string[] => {
      const raw: string[] = [];

      const addValue = (value: unknown, splitComma = false) => {
        if (value === null || value === undefined) return;
        if (Array.isArray(value)) {
          value.forEach((entry) => addValue(entry, splitComma));
          return;
        }
        if (typeof value === "object") {
          return;
        }
        const normalized = String(value).trim();
        if (!normalized) return;
        if (splitComma && normalized.includes(",")) {
          normalized.split(",").forEach((chunk) => addValue(chunk, false));
          return;
        }
        raw.push(normalized);
      };

      addValue(req.body?.key);
      addValue(req.body?.keys, true);
      addValue(req.query?.key);
      addValue(req.query?.keys, true);
      addValue((req.params as Record<string, unknown>)?.key);
      addValue((req.params as Record<string, unknown>)?.keys, true);

      return Array.from(new Set(raw));
    };

    const keys = collectKeys();

    if (!id || keys.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Dress ID and at least one image key are required",
      });
    }

    // ✅ Supports SUPER_ADMIN with X-Organization-Slug header
    const organizationId = requireOrganizationContext(req, res);
    if (!organizationId) return; // Error response already sent

    // Vérifier que la robe appartient à l'organisation
    const dress = await prisma.dress.findFirst({
      where: {
        id,
        organization_id: organizationId, // ✅ Multi-tenant isolation (works with SUPER_ADMIN context)
      },
    });

    if (!dress) {
      return res.status(404).json({ success: false, error: "Dress not found" });
    }

    const existingImages = new Set(dress.images ?? []);
    const keysFound: Array<{ filename: string; s3Key: string; urls: string[] }> = [];
    const keysNotFound: string[] = [];

    // Pour chaque clé fournie, vérifier si elle existe dans les images du dress
    keys.forEach((filename) => {
      // Construire le path S3 multi-tenant
      const s3Key = buildStoragePath(organizationId, 'dresses', filename);
      const fullUrl = buildPublicUrl(bucketUrlPrefix, s3Key);

      // Vérifier si cette URL existe dans les images du dress
      const matchingUrls: string[] = [];

      if (existingImages.has(fullUrl)) {
        matchingUrls.push(fullUrl);
      }

      // Support ancien format (migration) - pour compatibilité temporaire
      const legacyUrl = `${legacyDressBucketUrlPrefix}${filename}`;
      if (existingImages.has(legacyUrl)) {
        matchingUrls.push(legacyUrl);
      }

      // Support ancien format sans org (migration)
      const oldFormatUrl = `${bucketUrlPrefix}dresses/${filename}`;
      if (existingImages.has(oldFormatUrl)) {
        matchingUrls.push(oldFormatUrl);
      }

      if (matchingUrls.length > 0) {
        keysFound.push({ filename, s3Key, urls: matchingUrls });
      } else {
        keysNotFound.push(filename);
      }
    });

    if (keysFound.length === 0) {
      return res.status(404).json({
        success: false,
        error: "None of the provided image keys belong to this dress",
        details: { keysNotFound },
      });
    }

    // Supprimer les images du bucket S3
    await Promise.all(
      keysFound.map(({ s3Key }) =>
        s3.send(
          new DeleteObjectCommand({
            Bucket: hetznerBucket,
            Key: s3Key,
          })
        ).catch((err) => {
          // Si l'image n'existe pas dans le nouveau path, essayer l'ancien
          pino.warn({ s3Key, err: err.message }, "Failed to delete with new path, trying legacy");
          const legacyKey = s3Key.replace(`${organizationId}/dresses/`, 'dresses/');
          return s3.send(
            new DeleteObjectCommand({
              Bucket: hetznerBucket,
              Key: legacyKey,
            })
          );
        })
      )
    );

    // Mettre à jour la base de données
    const urlsToDelete = new Set(keysFound.flatMap(({ urls }) => urls));
    const updatedImages = (dress.images ?? []).filter((img) => !urlsToDelete.has(img));

    const updated = await prisma.dress.update({
      where: { id },
      data: { images: updatedImages, updated_by: req.user?.id ?? null },
    });

    pino.info(
      {
        dressId: id,
        organizationId,
        deletedCount: keysFound.length,
        keysNotFound: keysNotFound.length > 0 ? keysNotFound : undefined,
      },
      "✅ Images supprimées"
    );

    res.json({
      success: true,
      data: updated,
      deleted: keysFound.map(({ filename }) => filename),
      notFound: keysNotFound.length > 0 ? keysNotFound : undefined,
    });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur suppression image robe");
    res.status(500).json({ success: false, error: "Failed to remove dress image" });
  }
};

export const getDressesAvailability = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // ✅ Supports SUPER_ADMIN with X-Organization-Slug header
    const organizationId = requireOrganizationContext(req, res);
    if (!organizationId) return; // Error response already sent

    const { start, end } = req.query;

    const startDate = start ? new Date(String(start)) : null;
    const endDate = end ? new Date(String(end)) : null;

    if ((start && isNaN(startDate!.getTime())) || (end && isNaN(endDate!.getTime()))) {
      return res.status(400).json({
        success: false,
        error: "Invalid start or end date",
      });
    }

    const now = new Date();
    const effectiveStart = startDate ?? now;
    const effectiveEnd = endDate ?? null;

    const activeStatuses = ["DRAFT", "PENDING", "PENDING_SIGNATURE", "SIGNED", "SIGNED_ELECTRONICALLY"];

    // Find occupied dresses using Prisma with multi-tenant isolation
    const occupiedContracts = await prisma.contract.findMany({
      where: {
        organization_id: organizationId, // ✅ Multi-tenant isolation (works with SUPER_ADMIN context)
        deleted_at: null,
        status: { in: activeStatuses },
        end_datetime: { gte: effectiveStart },
        ...(effectiveEnd ? { start_datetime: { lte: effectiveEnd } } : {}),
      },
      select: {
        id: true,
        start_datetime: true,
        end_datetime: true,
        dresses: {
          select: {
            dress_id: true,
          },
        },
      },
    });

    console.log("🔍 Found occupied contracts:", occupiedContracts.length);

    // Build occupiedById map
    const occupiedById: Record<string, { first_start: Date; last_end: Date }> = {};

    for (const contract of occupiedContracts) {
      for (const dress of contract.dresses) {
        const dressId = dress.dress_id;

        if (!occupiedById[dressId]) {
          occupiedById[dressId] = {
            first_start: contract.start_datetime,
            last_end: contract.end_datetime,
          };
        } else {
          if (contract.start_datetime < occupiedById[dressId].first_start) {
            occupiedById[dressId].first_start = contract.start_datetime;
          }
          if (contract.end_datetime > occupiedById[dressId].last_end) {
            occupiedById[dressId].last_end = contract.end_datetime;
          }
        }
      }
    }

    pino.info(
      {
        occupiedByIdKeys: Object.keys(occupiedById),
        occupiedByIdCount: Object.keys(occupiedById).length
      },
      "🗝️ Occupied dresses by ID map"
    );

    const allDresses = await prisma.dress.findMany({
      where: {
        deleted_at: null,
        organization_id: organizationId, // ✅ Multi-tenant isolation (works with SUPER_ADMIN context)
        stock_quantity: { gt: 0 }, // ✅ Exclude sold-out dresses
      },
      select: {
        id: true,
        name: true,
        reference: true,
        price_ht: true,
        price_ttc: true,
        price_per_day_ht: true,
        price_per_day_ttc: true,
        stock_quantity: true,
        is_for_sale: true,
        images: true,
      },
    });

    const result = allDresses.map((dress) => {
      const occ = occupiedById[dress.id];
      const isAvailable = !occ;

      return {
        ...dress,
        isAvailable,
        current_contract: occ
          ? {
              start_datetime: occ.first_start,
              end_datetime: occ.last_end,
            }
          : null,
      };
    });

    pino.info(
      {
        count: result.length,
        startDate: effectiveStart,
        endDate: effectiveEnd,
      },
      "📦 Disponibilité robes calculée"
    );

    res.json({
      success: true,
      count: result.length,
      filters: {
        start: effectiveStart,
        end: effectiveEnd,
      },
      data: result,
    });
  } catch (error: any) {
    pino.error(
      { message: error.message, stack: error.stack },
      "❌ Failed to fetch dress availability"
    );
    res.status(500).json({
      success: false,
      error: "Failed to fetch dress availability",
    });
  }
};
