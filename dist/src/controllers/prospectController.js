import prisma from "../lib/prisma.js";
import pino from "../lib/logger.js";
// Get all prospects (excluding soft-deleted ones)
export const getProspects = async (req, res) => {
    try {
        // Parse query params
        const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;
        const status = typeof req.query.status === "string" ? req.query.status.trim() : undefined;
        const page = req.query.page ? Math.max(1, parseInt(String(req.query.page), 10)) : 1;
        const limit = req.query.limit ? Math.max(1, parseInt(String(req.query.limit), 10)) : 20;
        const skip = (page - 1) * limit;
        // Build Prisma where condition
        let where = { deleted_at: null };
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
        // Fetch paginated data with dress reservations
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
    }
    catch (err) {
        pino.error({ err }, "❌ Erreur récupération prospects");
        res.status(500).json({
            success: false,
            error: err.message || "Failed to fetch prospects",
            details: err.meta || err,
        });
    }
};
// Get one prospect by ID
export const getProspectById = async (req, res) => {
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
            },
        });
        if (!prospect || prospect.deleted_at) {
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
    }
    catch (err) {
        pino.error({ err }, "❌ Erreur récupération prospect");
        res.status(500).json({
            success: false,
            error: err.message || "Failed to fetch prospect",
            details: err.meta || err,
        });
    }
};
// Create a new prospect
export const createProspect = async (req, res) => {
    try {
        const { firstname, lastname, email, phone, birthday, country, city, address, postal_code, status, source, notes, dress_reservations } = req.body;
        // Create prospect with dress reservations in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Check if prospect with this email already exists
            const existingProspect = await tx.prospect.findUnique({
                where: { email },
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
                }
                else if (existingProspect.converted_at) {
                    // If already converted to customer, reject
                    throw new Error("Ce prospect a déjà été converti en client. Utilisez l'API clients pour ajouter des réservations.");
                }
                else {
                    // If active prospect exists, just use it (we'll add reservations below)
                    prospect = existingProspect;
                    pino.info({ prospectId: prospect.id, email }, "📧 Prospect existant trouvé, ajout de nouvelles réservations");
                }
            }
            else {
                // Create new prospect
                prospect = await tx.prospect.create({
                    data: {
                        firstname,
                        lastname,
                        email,
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
                    data: dress_reservations.map((reservation) => ({
                        prospect_id: prospect.id,
                        dress_id: reservation.dress_id,
                        rental_start_date: new Date(reservation.rental_start_date),
                        rental_end_date: new Date(reservation.rental_end_date),
                        notes: reservation.notes || null,
                        created_by: req.user?.id ?? null,
                    })),
                });
            }
            // Fetch the complete prospect with dress reservations and calculated fields
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
            };
        });
        res.status(201).json({ success: true, data: result });
    }
    catch (err) {
        pino.error({ err }, "❌ Erreur création prospect");
        res.status(500).json({
            success: false,
            error: err.message || "Failed to create prospect",
            details: err.meta || err,
        });
    }
};
// Update a prospect
export const updateProspect = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, error: "Prospect ID is required" });
        }
        const { firstname, lastname, email, phone, birthday, country, city, address, postal_code, status, source, notes } = req.body;
        const existing = await prisma.prospect.findUnique({ where: { id: String(id) } });
        if (!existing || existing.deleted_at) {
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
                birthday,
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
        res.json({ success: true, data: updated });
    }
    catch (err) {
        pino.error({ err }, "❌ Erreur update prospect");
        res.status(500).json({
            success: false,
            error: err.message || "Failed to update prospect",
            details: err.meta || err,
        });
    }
};
// Soft delete a prospect
export const softDeleteProspect = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, error: "Prospect ID is required" });
        }
        const existing = await prisma.prospect.findUnique({ where: { id: String(id) } });
        if (!existing || existing.deleted_at) {
            return res.status(404).json({ success: false, error: "Prospect not found" });
        }
        const deleted = await prisma.prospect.update({
            where: { id: String(id) },
            data: {
                deleted_at: new Date(),
                deleted_by: req.user?.id ?? null,
            },
        });
        res.json({ success: true, data: deleted });
    }
    catch (err) {
        pino.error({ err }, "❌ Erreur soft delete prospect");
        res.status(500).json({
            success: false,
            error: err.message || "Failed to soft delete prospect",
            details: err.meta || err,
        });
    }
};
// Hard delete a prospect
export const hardDeleteProspect = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, error: "Prospect ID is required" });
        }
        const existing = await prisma.prospect.findUnique({ where: { id: String(id) } });
        if (!existing) {
            return res.status(404).json({ success: false, error: "Prospect not found" });
        }
        await prisma.prospect.delete({ where: { id: String(id) } });
        res.json({ success: true, message: "Prospect permanently deleted" });
    }
    catch (err) {
        pino.error({ err }, "❌ Erreur hard delete prospect");
        res.status(500).json({
            success: false,
            error: err.message || "Failed to hard delete prospect",
            details: err.meta || err,
        });
    }
};
// Convert prospect to customer
export const convertProspectToCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, error: "Prospect ID is required" });
        }
        // Fetch prospect with dress reservations
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
            },
        });
        if (!prospect || prospect.deleted_at) {
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
        // Check if email already exists in customers
        const existingCustomer = await prisma.customer.findUnique({
            where: { email: prospect.email }
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
                    phone: prospect.phone,
                    birthday: prospect.birthday,
                    country: prospect.country,
                    city: prospect.city,
                    address: prospect.address,
                    postal_code: prospect.postal_code,
                    created_by: req.user?.id ?? null,
                },
            });
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
    }
    catch (err) {
        pino.error({ err }, "❌ Erreur conversion prospect vers customer");
        res.status(500).json({
            success: false,
            error: err.message || "Failed to convert prospect to customer",
            details: err.meta || err,
        });
    }
};
//# sourceMappingURL=prospectController.js.map