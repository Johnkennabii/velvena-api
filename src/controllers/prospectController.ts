// src/controllers/prospectController.ts
import type { Response } from "express";
import type { AuthenticatedRequest } from "../types/express.js";
import prisma from "../lib/prisma.js";
import pino from "../lib/logger.js";
import { emitProspectCreated, emitProspectUpdated, emitProspectDeleted } from "../utils/prospects.js";

// Get all prospects (excluding soft-deleted ones)
export const getProspects = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Parse query params
    const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;
    const status = typeof req.query.status === "string" ? req.query.status.trim() : undefined;
    const page = req.query.page ? Math.max(1, parseInt(String(req.query.page), 10)) : 1;
    const limit = req.query.limit ? Math.max(1, parseInt(String(req.query.limit), 10)) : 20;
    const skip = (page - 1) * limit;

    // Build Prisma where condition - filter by organization
    let where: any = {
      deleted_at: null,
      organization_id: req.user!.organizationId,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      // Case-insensitive contains on firstname, lastname, email, phone
      where = {
        ...where,
        OR: [
          { firstname: { contains: search, mode: "insensitive" } },
          { lastname: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    // Count total for pagination
    const total = await prisma.prospect.count({ where });

    // Fetch paginated data with dress reservations and notes
    const prospects = await prisma.prospect.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
      include: {
        dress_reservations: {
          where: { deleted_at: null },
          include: {
            dress: {
              include: {
                type: true,
                size: true,
                color: true,
                condition: true,
              },
            },
          },
          orderBy: { rental_start_date: "asc" },
        },
        notes_history: {
          where: { deleted_at: null },
          orderBy: { created_at: "desc" },
        },
      },
    });

    // Calculate rental days and estimated cost for each prospect
    const prospectsWithCalculations = prospects.map(prospect => {
      let totalEstimatedCost = 0;
      const reservationsWithCalculations = prospect.dress_reservations.map(reservation => {
        const startDate = new Date(reservation.rental_start_date);
        const endDate = new Date(reservation.rental_end_date);
        const rentalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const pricePerDay = Number(reservation.dress.price_per_day_ttc ?? 0);
        const estimatedCost = rentalDays * pricePerDay;
        totalEstimatedCost += estimatedCost;

        return {
          ...reservation,
          rental_days: rentalDays,
          estimated_cost: estimatedCost,
        };
      });

      return {
        ...prospect,
        dress_reservations: reservationsWithCalculations,
        total_estimated_cost: totalEstimatedCost,
      };
    });

    res.json({
      success: true,
      data: prospectsWithCalculations,
      page,
      limit,
      total,
    });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur récupération prospects");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to fetch prospects",
      details: err.meta || err,
    });
  }
};

// Get one prospect by ID
export const getProspectById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "Prospect ID is required" });
    }
    const prospect = await prisma.prospect.findUnique({
      where: { id: String(id) },
      include: {
        dress_reservations: {
          where: { deleted_at: null },
          include: {
            dress: {
              include: {
                type: true,
                size: true,
                color: true,
                condition: true,
              },
            },
          },
          orderBy: { rental_start_date: "asc" },
        },
        notes_history: {
          where: { deleted_at: null },
          orderBy: { created_at: "desc" },
        },
      },
    });
    if (!prospect || prospect.deleted_at || prospect.organization_id !== req.user!.organizationId) {
      return res.status(404).json({ success: false, error: "Prospect not found" });
    }

    // Calculate rental days and estimated cost for each reservation
    let totalEstimatedCost = 0;
    const reservationsWithCalculations = prospect.dress_reservations.map(reservation => {
      const startDate = new Date(reservation.rental_start_date);
      const endDate = new Date(reservation.rental_end_date);
      const rentalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const pricePerDay = Number(reservation.dress.price_per_day_ttc ?? 0);
      const estimatedCost = rentalDays * pricePerDay;
      totalEstimatedCost += estimatedCost;

      return {
        ...reservation,
        rental_days: rentalDays,
        estimated_cost: estimatedCost,
      };
    });

    const prospectWithCalculations = {
      ...prospect,
      dress_reservations: reservationsWithCalculations,
      total_estimated_cost: totalEstimatedCost,
    };

    res.json({ success: true, data: prospectWithCalculations });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur récupération prospect");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to fetch prospect",
      details: err.meta || err,
    });
  }
};

// Create a new prospect
export const createProspect = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      firstname,
      lastname,
      email,
      phone,
      birthday,
      country,
      city,
      address,
      postal_code,
      status,
      source,
      notes,
      dress_reservations,
      requests
    } = req.body;

    // Helper function to generate request number
    async function generateRequestNumber(tx: any): Promise<string> {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const datePrefix = `REQ-${year}${month}${day}`;

      const lastRequest = await tx.prospectRequest.findFirst({
        where: {
          request_number: {
            startsWith: datePrefix,
          },
        },
        orderBy: {
          request_number: "desc",
        },
      });

      let sequence = 1;
      if (lastRequest) {
        const parts = lastRequest.request_number.split("-");
        const lastSequence = parseInt(parts[2] || "0", 10);
        sequence = lastSequence + 1;
      }

      return `${datePrefix}-${String(sequence).padStart(4, "0")}`;
    }

    // Create prospect with dress reservations and requests in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check if prospect with this email already exists in this organization
      const existingProspect = await tx.prospect.findUnique({
        where: {
          email_organization_id: {
            email,
            organization_id: req.user!.organizationId,
          },
        },
      });

      let prospect;

      if (existingProspect) {
        // If prospect already exists
        if (existingProspect.deleted_at) {
          // If deleted, restore and update
          prospect = await tx.prospect.update({
            where: { id: existingProspect.id },
            data: {
              firstname,
              lastname,
              phone,
              birthday: birthday ? new Date(birthday) : null,
              country,
              city,
              address,
              postal_code,
              status: status || existingProspect.status,
              source: source || existingProspect.source,
              notes: notes || existingProspect.notes,
              deleted_at: null,
              deleted_by: null,
              updated_by: req.user?.id ?? null,
            },
          });
        } else if (existingProspect.converted_at) {
          // If already converted to customer, reject
          throw new Error("Ce prospect a déjà été converti en client. Utilisez l'API clients pour ajouter des réservations.");
        } else {
          // If active prospect exists, just use it (we'll add reservations below)
          prospect = existingProspect;
          pino.info({ prospectId: prospect.id, email }, "📧 Prospect existant trouvé, ajout de nouvelles réservations");
        }
      } else {
        // Create new prospect
        prospect = await tx.prospect.create({
          data: {
            firstname,
            lastname,
            email,
            organization_id: req.user!.organizationId,
            phone,
            birthday: birthday ? new Date(birthday) : null,
            country,
            city,
            address,
            postal_code,
            status: status || "new",
            source,
            notes,
            created_by: req.user?.id ?? null,
          },
        });
      }

      // Create dress reservations if provided
      if (dress_reservations && Array.isArray(dress_reservations) && dress_reservations.length > 0) {
        await tx.prospectDressReservation.createMany({
          data: dress_reservations.map((reservation: any) => ({
            prospect_id: prospect.id,
            dress_id: reservation.dress_id,
            rental_start_date: new Date(reservation.rental_start_date),
            rental_end_date: new Date(reservation.rental_end_date),
            notes: reservation.notes || null,
            created_by: req.user?.id ?? null,
          })),
        });
      }

      // Create requests if provided
      if (requests && Array.isArray(requests) && requests.length > 0) {
        for (const requestData of requests) {
          if (!requestData.dresses || !Array.isArray(requestData.dresses) || requestData.dresses.length === 0) {
            continue; // Skip requests without dresses
          }

          // Fetch dress details for calculation
          const dressIds = requestData.dresses.map((d: any) => d.dress_id);
          const fetchedDresses = await tx.dress.findMany({
            where: {
              id: { in: dressIds },
              deleted_at: null,
            },
          });

          const dressMap = new Map(fetchedDresses.map(d => [d.id, d]));

          // Calculate totals
          let totalEstimatedHt = 0;
          let totalEstimatedTtc = 0;

          const dressesWithCalculations = requestData.dresses.map((dressData: any) => {
            const dress = dressMap.get(dressData.dress_id);
            if (!dress) {
              throw new Error(`Dress ${dressData.dress_id} not found`);
            }

            const startDate = new Date(dressData.rental_start_date);
            const endDate = new Date(dressData.rental_end_date);
            const rentalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

            const pricePerDayHt = Number(dress.price_per_day_ht);
            const pricePerDayTtc = Number(dress.price_per_day_ttc);

            const estimatedPriceHt = rentalDays * pricePerDayHt;
            const estimatedPriceTtc = rentalDays * pricePerDayTtc;

            totalEstimatedHt += estimatedPriceHt;
            totalEstimatedTtc += estimatedPriceTtc;

            return {
              dress_id: dressData.dress_id,
              rental_start_date: startDate,
              rental_end_date: endDate,
              rental_days: rentalDays,
              estimated_price_ht: estimatedPriceHt,
              estimated_price_ttc: estimatedPriceTtc,
              notes: dressData.notes || null,
            };
          });

          // Generate unique request number
          const requestNumber = await generateRequestNumber(tx);

          // Create the request with dresses
          await tx.prospectRequest.create({
            data: {
              request_number: requestNumber,
              prospect_id: prospect.id,
              status: requestData.status || "draft",
              total_estimated_ht: totalEstimatedHt,
              total_estimated_ttc: totalEstimatedTtc,
              notes: requestData.notes || null,
              created_by: req.user?.id ?? null,
              dresses: {
                create: dressesWithCalculations.map((d: any) => ({
                  dress_id: d.dress_id,
                  rental_start_date: d.rental_start_date,
                  rental_end_date: d.rental_end_date,
                  rental_days: d.rental_days,
                  estimated_price_ht: d.estimated_price_ht,
                  estimated_price_ttc: d.estimated_price_ttc,
                  notes: d.notes,
                  created_by: req.user?.id ?? null,
                })),
              },
            },
          });
        }
      }

      // Fetch the complete prospect with dress reservations, requests and calculated fields
      const prospectWithDetails = await tx.prospect.findUnique({
        where: { id: prospect.id },
        include: {
          dress_reservations: {
            where: { deleted_at: null },
            include: {
              dress: {
                include: {
                  type: true,
                  size: true,
                  color: true,
                  condition: true,
                },
              },
            },
            orderBy: { rental_start_date: "asc" },
          },
          requests: {
            where: { deleted_at: null },
            include: {
              dresses: {
                where: { deleted_at: null },
                include: {
                  dress: {
                    include: {
                      type: true,
                      size: true,
                      color: true,
                      condition: true,
                    },
                  },
                },
                orderBy: { rental_start_date: "asc" },
              },
            },
            orderBy: { created_at: "desc" },
          },
        },
      });

      // Calculate rental days and estimated cost for each reservation
      let totalEstimatedCost = 0;
      const reservationsWithCalculations = prospectWithDetails?.dress_reservations.map(reservation => {
        const startDate = new Date(reservation.rental_start_date);
        const endDate = new Date(reservation.rental_end_date);
        const rentalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const pricePerDay = Number(reservation.dress.price_per_day_ttc ?? 0);
        const estimatedCost = rentalDays * pricePerDay;
        totalEstimatedCost += estimatedCost;

        return {
          ...reservation,
          rental_days: rentalDays,
          estimated_cost: estimatedCost,
        };
      }) || [];

      return {
        ...prospectWithDetails,
        dress_reservations: reservationsWithCalculations,
        total_estimated_cost: totalEstimatedCost,
        requests: prospectWithDetails?.requests || [],
      };
    });

    // Emit Socket.IO event for new prospect
    emitProspectCreated(req.user!.organizationId, result);

    res.status(201).json({ success: true, data: result });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur création prospect");

    // Handle unique constraint violation
    if (err.code === "P2002") {
      return res.status(409).json({
        success: false,
        error: `Un prospect avec l'email '${req.body.email}' existe déjà dans votre organisation.`,
        code: "DUPLICATE_EMAIL"
      });
    }

    res.status(500).json({
      success: false,
      error: err.message || "Failed to create prospect",
      details: err.meta || err,
    });
  }
};

// Update a prospect
export const updateProspect = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "Prospect ID is required" });
    }

    const {
      firstname,
      lastname,
      email,
      phone,
      birthday,
      country,
      city,
      address,
      postal_code,
      status,
      source,
      notes
    } = req.body;

    const existing = await prisma.prospect.findUnique({ where: { id: String(id) } });
    if (!existing || existing.deleted_at || existing.organization_id !== req.user!.organizationId) {
      return res.status(404).json({ success: false, error: "Prospect not found" });
    }

    // Check if prospect is already converted
    if (existing.converted_at) {
      return res.status(400).json({
        success: false,
        error: "Cannot update a converted prospect"
      });
    }

    const updated = await prisma.prospect.update({
      where: { id: String(id) },
      data: {
        firstname,
        lastname,
        email,
        phone,
        ...(birthday && { birthday: new Date(birthday) }),
        country,
        city,
        address,
        postal_code,
        status,
        source,
        notes,
        updated_at: new Date(),
        updated_by: req.user?.id ?? null,
      },
    });

    // Emit Socket.IO event for prospect update
    emitProspectUpdated(req.user!.organizationId, updated);

    res.json({ success: true, data: updated });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur update prospect");

    // Handle unique constraint violation
    if (err.code === "P2002") {
      return res.status(409).json({
        success: false,
        error: `Un prospect avec l'email '${req.body.email}' existe déjà dans votre organisation.`,
        code: "DUPLICATE_EMAIL"
      });
    }

    res.status(500).json({
      success: false,
      error: err.message || "Failed to update prospect",
      details: err.meta || err,
    });
  }
};

// Soft delete a prospect
export const softDeleteProspect = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "Prospect ID is required" });
    }
    const existing = await prisma.prospect.findUnique({ where: { id: String(id) } });
    if (!existing || existing.deleted_at || existing.organization_id !== req.user!.organizationId) {
      return res.status(404).json({ success: false, error: "Prospect not found" });
    }

    const deleted = await prisma.prospect.update({
      where: { id: String(id) },
      data: {
        deleted_at: new Date(),
        deleted_by: req.user?.id ?? null,
      },
    });

    // Emit Socket.IO event for prospect deletion
    emitProspectDeleted(req.user!.organizationId, String(id));

    res.json({ success: true, data: deleted });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur soft delete prospect");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to soft delete prospect",
      details: err.meta || err,
    });
  }
};

// Hard delete a prospect
export const hardDeleteProspect = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "Prospect ID is required" });
    }
    const existing = await prisma.prospect.findUnique({ where: { id: String(id) } });
    if (!existing || existing.organization_id !== req.user!.organizationId) {
      return res.status(404).json({ success: false, error: "Prospect not found" });
    }

    await prisma.prospect.delete({ where: { id: String(id) } });
    res.json({ success: true, message: "Prospect permanently deleted" });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur hard delete prospect");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to hard delete prospect",
      details: err.meta || err,
    });
  }
};

// Convert prospect to customer
export const convertProspectToCustomer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: "Prospect ID is required" });
    }

    // Fetch prospect with dress reservations and notes
    const prospect = await prisma.prospect.findUnique({
      where: { id: String(id) },
      include: {
        dress_reservations: {
          where: { deleted_at: null },
          include: {
            dress: {
              include: {
                type: true,
                size: true,
                color: true,
                condition: true,
              },
            },
          },
          orderBy: { rental_start_date: "asc" },
        },
        notes_history: {
          where: { deleted_at: null },
          orderBy: { created_at: "desc" },
        },
      },
    });

    if (!prospect || prospect.deleted_at || prospect.organization_id !== req.user!.organizationId) {
      return res.status(404).json({ success: false, error: "Prospect not found" });
    }

    // Check if already converted
    if (prospect.converted_at) {
      return res.status(400).json({
        success: false,
        error: "Prospect already converted to customer",
        customer_id: prospect.converted_to
      });
    }

    // Check if email already exists in customers for this organization
    const existingCustomer = await prisma.customer.findUnique({
      where: {
        email_organization_id: {
          email: prospect.email,
          organization_id: prospect.organization_id,
        },
      },
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        error: "A customer with this email already exists",
        customer_id: existingCustomer.id
      });
    }

    // Convert in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create customer from prospect data
      const customer = await tx.customer.create({
        data: {
          firstname: prospect.firstname,
          lastname: prospect.lastname,
          email: prospect.email,
          organization_id: prospect.organization_id,
          phone: prospect.phone,
          birthday: prospect.birthday,
          country: prospect.country,
          city: prospect.city,
          address: prospect.address,
          postal_code: prospect.postal_code,
          created_by: req.user?.id ?? null,
        },
      });

      // Create customer notes from prospect history
      if (prospect.notes_history && prospect.notes_history.length > 0) {
        // Copy each prospect note to customer notes
        for (const prospectNote of prospect.notes_history) {
          await tx.customerNote.create({
            data: {
              customer_id: customer.id,
              content: prospectNote.content,
              created_by: req.user?.id ?? null,
            },
          });
        }
      }

      // Create a customer note with dress reservations info if any exist
      if (prospect.dress_reservations.length > 0) {
        // Format dress reservations into a note
        let noteContent = "📋 Robes sélectionnées lors de la conversion depuis prospect:\n\n";
        let totalEstimatedCost = 0;

        prospect.dress_reservations.forEach((reservation, index) => {
          const startDate = new Date(reservation.rental_start_date);
          const endDate = new Date(reservation.rental_end_date);
          const rentalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const pricePerDay = Number(reservation.dress.price_per_day_ttc ?? 0);
          const estimatedCost = rentalDays * pricePerDay;
          totalEstimatedCost += estimatedCost;

          noteContent += `${index + 1}. ${reservation.dress.name}\n`;
          noteContent += `   • Référence: ${reservation.dress.reference || "N/A"}\n`;
          noteContent += `   • Type: ${reservation.dress.type?.name || "N/A"}\n`;
          noteContent += `   • Taille: ${reservation.dress.size?.name || "N/A"}\n`;
          noteContent += `   • Couleur: ${reservation.dress.color?.name || "N/A"}\n`;
          noteContent += `   • Période: ${startDate.toLocaleDateString("fr-FR")} au ${endDate.toLocaleDateString("fr-FR")}\n`;
          noteContent += `   • Nombre de jours: ${rentalDays} jour(s)\n`;
          noteContent += `   • Prix/jour TTC: ${pricePerDay.toFixed(2)}€\n`;
          noteContent += `   • Coût estimé: ${estimatedCost.toFixed(2)}€\n`;
          if (reservation.notes) {
            noteContent += `   • Notes: ${reservation.notes}\n`;
          }
          noteContent += `\n`;
        });

        noteContent += `💰 Coût total estimé: ${totalEstimatedCost.toFixed(2)}€`;

        // Create customer note
        await tx.customerNote.create({
          data: {
            customer_id: customer.id,
            content: noteContent,
            created_by: req.user?.id ?? null,
          },
        });
      }

      // Update prospect to mark as converted
      const updatedProspect = await tx.prospect.update({
        where: { id: String(id) },
        data: {
          converted_at: new Date(),
          converted_by: req.user?.id ?? null,
          converted_to: customer.id,
          status: "converted",
          updated_at: new Date(),
          updated_by: req.user?.id ?? null,
        },
      });

      return {
        prospect: updatedProspect,
        customer: customer,
      };
    });

    res.json({
      success: true,
      data: result,
      message: "Prospect successfully converted to customer"
    });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur conversion prospect vers customer");

    // Handle unique constraint violation
    if (err.code === "P2002") {
      return res.status(409).json({
        success: false,
        error: "Un client avec cet email existe déjà dans votre organisation.",
        code: "DUPLICATE_EMAIL"
      });
    }

    res.status(500).json({
      success: false,
      error: err.message || "Failed to convert prospect to customer",
      details: err.meta || err,
    });
  }
};

// Check if an email exists as a customer
export const checkExistingClient = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email } = req.query;

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        error: "Email is required"
      });
    }

    // Search for customer with this email in the organization
    const customer = await prisma.customer.findUnique({
      where: {
        email_organization_id: {
          email: email.trim().toLowerCase(),
          organization_id: req.user!.organizationId,
        },
      },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        created_at: true,
        deleted_at: true,
      },
    });

    if (customer && !customer.deleted_at) {
      // Remove deleted_at from response
      const { deleted_at, ...clientData } = customer;
      return res.json({
        success: true,
        data: {
          exists: true,
          client: clientData,
        },
      });
    }

    res.json({
      success: true,
      data: {
        exists: false,
      },
    });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur vérification client existant");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to check existing client",
      details: err.meta || err,
    });
  }
};

// Get merge preview (count notes and reservations)
export const getMergePreview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prospectId } = req.params;
    const { client_id } = req.query;

    if (!prospectId) {
      return res.status(400).json({ success: false, error: "Prospect ID is required" });
    }

    if (!client_id || typeof client_id !== "string") {
      return res.status(400).json({ success: false, error: "Client ID is required" });
    }

    // Verify prospect exists and belongs to organization
    const prospect = await prisma.prospect.findUnique({
      where: { id: String(prospectId) },
    });

    if (!prospect || prospect.deleted_at || prospect.organization_id !== req.user!.organizationId) {
      return res.status(404).json({ success: false, error: "Prospect not found" });
    }

    // Verify client exists and belongs to organization
    const client = await prisma.customer.findUnique({
      where: { id: String(client_id) },
    });

    if (!client || client.deleted_at || client.organization_id !== req.user!.organizationId) {
      return res.status(404).json({ success: false, error: "Client not found" });
    }

    // Count notes
    const notesCount = await prisma.prospectNote.count({
      where: {
        prospect_id: String(prospectId),
        deleted_at: null,
      },
    });

    // Count reservations
    const reservationsCount = await prisma.prospectDressReservation.count({
      where: {
        prospect_id: String(prospectId),
        deleted_at: null,
      },
    });

    res.json({
      success: true,
      data: {
        notes_count: notesCount,
        reservations_count: reservationsCount,
      },
    });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur aperçu fusion");
    res.status(500).json({
      success: false,
      error: err.message || "Failed to get merge preview",
      details: err.meta || err,
    });
  }
};

// Merge prospect with existing client
export const mergeWithClient = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prospectId } = req.params;
    const { client_id } = req.body;

    if (!prospectId) {
      return res.status(400).json({ success: false, error: "Prospect ID is required" });
    }

    if (!client_id) {
      return res.status(400).json({ success: false, error: "Client ID is required" });
    }

    // Perform merge in a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Verify prospect exists and belongs to organization
      const prospect = await tx.prospect.findUnique({
        where: { id: String(prospectId) },
        include: {
          notes_history: {
            where: { deleted_at: null },
          },
          dress_reservations: {
            where: { deleted_at: null },
          },
        },
      });

      if (!prospect || prospect.deleted_at || prospect.organization_id !== req.user!.organizationId) {
        throw new Error("Prospect not found");
      }

      // 2. Verify client exists and belongs to organization
      const client = await tx.customer.findUnique({
        where: { id: String(client_id) },
      });

      if (!client || client.deleted_at || client.organization_id !== req.user!.organizationId) {
        throw new Error("Client not found");
      }

      // 3. Verify emails match
      if (prospect.email.toLowerCase() !== client.email.toLowerCase()) {
        throw new Error("Email addresses do not match");
      }

      // 4. Check if prospect is already converted
      if (prospect.converted_at) {
        throw new Error("Prospect already converted to customer");
      }

      // 5. Transfer prospect notes to customer notes
      for (const note of prospect.notes_history) {
        await tx.customerNote.create({
          data: {
            customer_id: client.id,
            content: note.content,
            created_by: note.created_by,
            created_at: note.created_at,
          },
        });
      }

      // 6. Create a summary note about dress reservations if any exist
      if (prospect.dress_reservations.length > 0) {
        let noteContent = "📋 Réservations transférées depuis prospect (fusion):\n\n";

        for (const reservation of prospect.dress_reservations) {
          const dress = await tx.dress.findUnique({
            where: { id: reservation.dress_id },
            include: {
              type: true,
              size: true,
              color: true,
              condition: true,
            },
          });

          if (dress) {
            const startDate = new Date(reservation.rental_start_date);
            const endDate = new Date(reservation.rental_end_date);
            const rentalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

            noteContent += `• ${dress.name}\n`;
            noteContent += `  Période: ${startDate.toLocaleDateString("fr-FR")} au ${endDate.toLocaleDateString("fr-FR")} (${rentalDays} jours)\n`;
            if (reservation.notes) {
              noteContent += `  Notes: ${reservation.notes}\n`;
            }
            noteContent += `\n`;
          }
        }

        await tx.customerNote.create({
          data: {
            customer_id: client.id,
            content: noteContent,
            created_by: req.user?.id ?? null,
          },
        });
      }

      // 7. Soft delete prospect notes (they're now transferred)
      await tx.prospectNote.updateMany({
        where: {
          prospect_id: String(prospectId),
          deleted_at: null,
        },
        data: {
          deleted_at: new Date(),
          deleted_by: req.user?.id ?? null,
        },
      });

      // 8. Soft delete prospect reservations (info now in customer notes)
      await tx.prospectDressReservation.updateMany({
        where: {
          prospect_id: String(prospectId),
          deleted_at: null,
        },
        data: {
          deleted_at: new Date(),
          deleted_by: req.user?.id ?? null,
        },
      });

      // 9. Mark prospect as converted and soft-deleted
      await tx.prospect.update({
        where: { id: String(prospectId) },
        data: {
          status: "converted",
          converted_at: new Date(),
          converted_by: req.user?.id ?? null,
          converted_to: client.id,
          deleted_at: new Date(),
          deleted_by: req.user?.id ?? null,
          updated_at: new Date(),
          updated_by: req.user?.id ?? null,
        },
      });

      pino.info(
        {
          prospectId: String(prospectId),
          clientId: client.id,
          notesTransferred: prospect.notes_history.length,
          reservationsTransferred: prospect.dress_reservations.length,
        },
        "✅ Prospect fusionné avec client existant"
      );
    });

    res.json({
      success: true,
      message: "Prospect fusionné avec succès",
    });
  } catch (err: any) {
    pino.error({ err }, "❌ Erreur fusion prospect avec client");

    // Handle specific errors
    if (err.message === "Prospect not found" || err.message === "Client not found") {
      return res.status(404).json({
        success: false,
        error: err.message,
      });
    }

    if (err.message === "Email addresses do not match") {
      return res.status(400).json({
        success: false,
        error: "L'email du prospect ne correspond pas à celui du client",
      });
    }

    if (err.message === "Prospect already converted to customer") {
      return res.status(409).json({
        success: false,
        error: "Ce prospect a déjà été converti en client",
      });
    }

    res.status(500).json({
      success: false,
      error: err.message || "Failed to merge prospect with client",
      details: err.meta || err,
    });
  }
};
