"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertProspectToCustomer = exports.hardDeleteProspect = exports.softDeleteProspect = exports.updateProspect = exports.createProspect = exports.getProspectById = exports.getProspects = void 0;
var prisma_js_1 = __importDefault(require("../lib/prisma.js"));
var logger_js_1 = __importDefault(require("../lib/logger.js"));
// Get all prospects (excluding soft-deleted ones)
var getProspects = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var search, status_1, page, limit, skip, where, total, prospects, prospectsWithCalculations, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;
                status_1 = typeof req.query.status === "string" ? req.query.status.trim() : undefined;
                page = req.query.page ? Math.max(1, parseInt(String(req.query.page), 10)) : 1;
                limit = req.query.limit ? Math.max(1, parseInt(String(req.query.limit), 10)) : 20;
                skip = (page - 1) * limit;
                where = {
                    deleted_at: null,
                    organization_id: req.user.organizationId,
                };
                if (status_1) {
                    where.status = status_1;
                }
                if (search) {
                    // Case-insensitive contains on firstname, lastname, email, phone
                    where = __assign(__assign({}, where), { OR: [
                            { firstname: { contains: search, mode: "insensitive" } },
                            { lastname: { contains: search, mode: "insensitive" } },
                            { email: { contains: search, mode: "insensitive" } },
                            { phone: { contains: search, mode: "insensitive" } },
                        ] });
                }
                return [4 /*yield*/, prisma_js_1.default.prospect.count({ where: where })];
            case 1:
                total = _a.sent();
                return [4 /*yield*/, prisma_js_1.default.prospect.findMany({
                        where: where,
                        orderBy: { created_at: "desc" },
                        skip: skip,
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
                    })];
            case 2:
                prospects = _a.sent();
                prospectsWithCalculations = prospects.map(function (prospect) {
                    var totalEstimatedCost = 0;
                    var reservationsWithCalculations = prospect.dress_reservations.map(function (reservation) {
                        var _a;
                        var startDate = new Date(reservation.rental_start_date);
                        var endDate = new Date(reservation.rental_end_date);
                        var rentalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                        var pricePerDay = Number((_a = reservation.dress.price_per_day_ttc) !== null && _a !== void 0 ? _a : 0);
                        var estimatedCost = rentalDays * pricePerDay;
                        totalEstimatedCost += estimatedCost;
                        return __assign(__assign({}, reservation), { rental_days: rentalDays, estimated_cost: estimatedCost });
                    });
                    return __assign(__assign({}, prospect), { dress_reservations: reservationsWithCalculations, total_estimated_cost: totalEstimatedCost });
                });
                res.json({
                    success: true,
                    data: prospectsWithCalculations,
                    page: page,
                    limit: limit,
                    total: total,
                });
                return [3 /*break*/, 4];
            case 3:
                err_1 = _a.sent();
                logger_js_1.default.error({ err: err_1 }, "❌ Erreur récupération prospects");
                res.status(500).json({
                    success: false,
                    error: err_1.message || "Failed to fetch prospects",
                    details: err_1.meta || err_1,
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getProspects = getProspects;
// Get one prospect by ID
var getProspectById = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, prospect, totalEstimatedCost_1, reservationsWithCalculations, prospectWithCalculations, err_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = req.params.id;
                if (!id) {
                    return [2 /*return*/, res.status(400).json({ success: false, error: "Prospect ID is required" })];
                }
                return [4 /*yield*/, prisma_js_1.default.prospect.findUnique({
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
                    })];
            case 1:
                prospect = _a.sent();
                if (!prospect || prospect.deleted_at || prospect.organization_id !== req.user.organizationId) {
                    return [2 /*return*/, res.status(404).json({ success: false, error: "Prospect not found" })];
                }
                totalEstimatedCost_1 = 0;
                reservationsWithCalculations = prospect.dress_reservations.map(function (reservation) {
                    var _a;
                    var startDate = new Date(reservation.rental_start_date);
                    var endDate = new Date(reservation.rental_end_date);
                    var rentalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    var pricePerDay = Number((_a = reservation.dress.price_per_day_ttc) !== null && _a !== void 0 ? _a : 0);
                    var estimatedCost = rentalDays * pricePerDay;
                    totalEstimatedCost_1 += estimatedCost;
                    return __assign(__assign({}, reservation), { rental_days: rentalDays, estimated_cost: estimatedCost });
                });
                prospectWithCalculations = __assign(__assign({}, prospect), { dress_reservations: reservationsWithCalculations, total_estimated_cost: totalEstimatedCost_1 });
                res.json({ success: true, data: prospectWithCalculations });
                return [3 /*break*/, 3];
            case 2:
                err_2 = _a.sent();
                logger_js_1.default.error({ err: err_2 }, "❌ Erreur récupération prospect");
                res.status(500).json({
                    success: false,
                    error: err_2.message || "Failed to fetch prospect",
                    details: err_2.meta || err_2,
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getProspectById = getProspectById;
// Create a new prospect
var createProspect = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    // Helper function to generate request number
    function generateRequestNumber(tx) {
        return __awaiter(this, void 0, void 0, function () {
            var date, year, month, day, datePrefix, lastRequest, sequence, parts, lastSequence;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        date = new Date();
                        year = date.getFullYear();
                        month = String(date.getMonth() + 1).padStart(2, "0");
                        day = String(date.getDate()).padStart(2, "0");
                        datePrefix = "REQ-".concat(year).concat(month).concat(day);
                        return [4 /*yield*/, tx.prospectRequest.findFirst({
                                where: {
                                    request_number: {
                                        startsWith: datePrefix,
                                    },
                                },
                                orderBy: {
                                    request_number: "desc",
                                },
                            })];
                    case 1:
                        lastRequest = _a.sent();
                        sequence = 1;
                        if (lastRequest) {
                            parts = lastRequest.request_number.split("-");
                            lastSequence = parseInt(parts[2] || "0", 10);
                            sequence = lastSequence + 1;
                        }
                        return [2 /*return*/, "".concat(datePrefix, "-").concat(String(sequence).padStart(4, "0"))];
                }
            });
        });
    }
    var _a, firstname_1, lastname_1, email_1, phone_1, birthday_1, country_1, city_1, address_1, postal_code_1, status_2, source_1, notes_1, dress_reservations_1, requests_1, result, err_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, firstname_1 = _a.firstname, lastname_1 = _a.lastname, email_1 = _a.email, phone_1 = _a.phone, birthday_1 = _a.birthday, country_1 = _a.country, city_1 = _a.city, address_1 = _a.address, postal_code_1 = _a.postal_code, status_2 = _a.status, source_1 = _a.source, notes_1 = _a.notes, dress_reservations_1 = _a.dress_reservations, requests_1 = _a.requests;
                return [4 /*yield*/, prisma_js_1.default.$transaction(function (tx) { return __awaiter(void 0, void 0, void 0, function () {
                        var existingProspect, prospect, _loop_1, _i, requests_2, requestData, prospectWithDetails, totalEstimatedCost, reservationsWithCalculations;
                        var _a, _b, _c, _d, _e, _f;
                        return __generator(this, function (_g) {
                            switch (_g.label) {
                                case 0: return [4 /*yield*/, tx.prospect.findUnique({
                                        where: {
                                            email_organization_id: {
                                                email: email_1,
                                                organization_id: req.user.organizationId,
                                            },
                                        },
                                    })];
                                case 1:
                                    existingProspect = _g.sent();
                                    if (!existingProspect) return [3 /*break*/, 5];
                                    if (!existingProspect.deleted_at) return [3 /*break*/, 3];
                                    return [4 /*yield*/, tx.prospect.update({
                                            where: { id: existingProspect.id },
                                            data: {
                                                firstname: firstname_1,
                                                lastname: lastname_1,
                                                phone: phone_1,
                                                birthday: birthday_1 ? new Date(birthday_1) : null,
                                                country: country_1,
                                                city: city_1,
                                                address: address_1,
                                                postal_code: postal_code_1,
                                                status: status_2 || existingProspect.status,
                                                source: source_1 || existingProspect.source,
                                                notes: notes_1 || existingProspect.notes,
                                                deleted_at: null,
                                                deleted_by: null,
                                                updated_by: (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null,
                                            },
                                        })];
                                case 2:
                                    // If deleted, restore and update
                                    prospect = _g.sent();
                                    return [3 /*break*/, 4];
                                case 3:
                                    if (existingProspect.converted_at) {
                                        // If already converted to customer, reject
                                        throw new Error("Ce prospect a déjà été converti en client. Utilisez l'API clients pour ajouter des réservations.");
                                    }
                                    else {
                                        // If active prospect exists, just use it (we'll add reservations below)
                                        prospect = existingProspect;
                                        logger_js_1.default.info({ prospectId: prospect.id, email: email_1 }, "📧 Prospect existant trouvé, ajout de nouvelles réservations");
                                    }
                                    _g.label = 4;
                                case 4: return [3 /*break*/, 7];
                                case 5: return [4 /*yield*/, tx.prospect.create({
                                        data: {
                                            firstname: firstname_1,
                                            lastname: lastname_1,
                                            email: email_1,
                                            organization_id: req.user.organizationId,
                                            phone: phone_1,
                                            birthday: birthday_1 ? new Date(birthday_1) : null,
                                            country: country_1,
                                            city: city_1,
                                            address: address_1,
                                            postal_code: postal_code_1,
                                            status: status_2 || "new",
                                            source: source_1,
                                            notes: notes_1,
                                            created_by: (_d = (_c = req.user) === null || _c === void 0 ? void 0 : _c.id) !== null && _d !== void 0 ? _d : null,
                                        },
                                    })];
                                case 6:
                                    // Create new prospect
                                    prospect = _g.sent();
                                    _g.label = 7;
                                case 7:
                                    if (!(dress_reservations_1 && Array.isArray(dress_reservations_1) && dress_reservations_1.length > 0)) return [3 /*break*/, 9];
                                    return [4 /*yield*/, tx.prospectDressReservation.createMany({
                                            data: dress_reservations_1.map(function (reservation) {
                                                var _a, _b;
                                                return ({
                                                    prospect_id: prospect.id,
                                                    dress_id: reservation.dress_id,
                                                    rental_start_date: new Date(reservation.rental_start_date),
                                                    rental_end_date: new Date(reservation.rental_end_date),
                                                    notes: reservation.notes || null,
                                                    created_by: (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null,
                                                });
                                            }),
                                        })];
                                case 8:
                                    _g.sent();
                                    _g.label = 9;
                                case 9:
                                    if (!(requests_1 && Array.isArray(requests_1) && requests_1.length > 0)) return [3 /*break*/, 13];
                                    _loop_1 = function (requestData) {
                                        var dressIds, fetchedDresses, dressMap, totalEstimatedHt, totalEstimatedTtc, dressesWithCalculations, requestNumber;
                                        return __generator(this, function (_h) {
                                            switch (_h.label) {
                                                case 0:
                                                    if (!requestData.dresses || !Array.isArray(requestData.dresses) || requestData.dresses.length === 0) {
                                                        return [2 /*return*/, "continue"];
                                                    }
                                                    dressIds = requestData.dresses.map(function (d) { return d.dress_id; });
                                                    return [4 /*yield*/, tx.dress.findMany({
                                                            where: {
                                                                id: { in: dressIds },
                                                                deleted_at: null,
                                                            },
                                                        })];
                                                case 1:
                                                    fetchedDresses = _h.sent();
                                                    dressMap = new Map(fetchedDresses.map(function (d) { return [d.id, d]; }));
                                                    totalEstimatedHt = 0;
                                                    totalEstimatedTtc = 0;
                                                    dressesWithCalculations = requestData.dresses.map(function (dressData) {
                                                        var dress = dressMap.get(dressData.dress_id);
                                                        if (!dress) {
                                                            throw new Error("Dress ".concat(dressData.dress_id, " not found"));
                                                        }
                                                        var startDate = new Date(dressData.rental_start_date);
                                                        var endDate = new Date(dressData.rental_end_date);
                                                        var rentalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                                                        var pricePerDayHt = Number(dress.price_per_day_ht);
                                                        var pricePerDayTtc = Number(dress.price_per_day_ttc);
                                                        var estimatedPriceHt = rentalDays * pricePerDayHt;
                                                        var estimatedPriceTtc = rentalDays * pricePerDayTtc;
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
                                                    return [4 /*yield*/, generateRequestNumber(tx)];
                                                case 2:
                                                    requestNumber = _h.sent();
                                                    // Create the request with dresses
                                                    return [4 /*yield*/, tx.prospectRequest.create({
                                                            data: {
                                                                request_number: requestNumber,
                                                                prospect_id: prospect.id,
                                                                status: requestData.status || "draft",
                                                                total_estimated_ht: totalEstimatedHt,
                                                                total_estimated_ttc: totalEstimatedTtc,
                                                                notes: requestData.notes || null,
                                                                created_by: (_f = (_e = req.user) === null || _e === void 0 ? void 0 : _e.id) !== null && _f !== void 0 ? _f : null,
                                                                dresses: {
                                                                    create: dressesWithCalculations.map(function (d) {
                                                                        var _a, _b;
                                                                        return ({
                                                                            dress_id: d.dress_id,
                                                                            rental_start_date: d.rental_start_date,
                                                                            rental_end_date: d.rental_end_date,
                                                                            rental_days: d.rental_days,
                                                                            estimated_price_ht: d.estimated_price_ht,
                                                                            estimated_price_ttc: d.estimated_price_ttc,
                                                                            notes: d.notes,
                                                                            created_by: (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null,
                                                                        });
                                                                    }),
                                                                },
                                                            },
                                                        })];
                                                case 3:
                                                    // Create the request with dresses
                                                    _h.sent();
                                                    return [2 /*return*/];
                                            }
                                        });
                                    };
                                    _i = 0, requests_2 = requests_1;
                                    _g.label = 10;
                                case 10:
                                    if (!(_i < requests_2.length)) return [3 /*break*/, 13];
                                    requestData = requests_2[_i];
                                    return [5 /*yield**/, _loop_1(requestData)];
                                case 11:
                                    _g.sent();
                                    _g.label = 12;
                                case 12:
                                    _i++;
                                    return [3 /*break*/, 10];
                                case 13: return [4 /*yield*/, tx.prospect.findUnique({
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
                                    })];
                                case 14:
                                    prospectWithDetails = _g.sent();
                                    totalEstimatedCost = 0;
                                    reservationsWithCalculations = (prospectWithDetails === null || prospectWithDetails === void 0 ? void 0 : prospectWithDetails.dress_reservations.map(function (reservation) {
                                        var _a;
                                        var startDate = new Date(reservation.rental_start_date);
                                        var endDate = new Date(reservation.rental_end_date);
                                        var rentalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                                        var pricePerDay = Number((_a = reservation.dress.price_per_day_ttc) !== null && _a !== void 0 ? _a : 0);
                                        var estimatedCost = rentalDays * pricePerDay;
                                        totalEstimatedCost += estimatedCost;
                                        return __assign(__assign({}, reservation), { rental_days: rentalDays, estimated_cost: estimatedCost });
                                    })) || [];
                                    return [2 /*return*/, __assign(__assign({}, prospectWithDetails), { dress_reservations: reservationsWithCalculations, total_estimated_cost: totalEstimatedCost, requests: (prospectWithDetails === null || prospectWithDetails === void 0 ? void 0 : prospectWithDetails.requests) || [] })];
                            }
                        });
                    }); })];
            case 1:
                result = _b.sent();
                res.status(201).json({ success: true, data: result });
                return [3 /*break*/, 3];
            case 2:
                err_3 = _b.sent();
                logger_js_1.default.error({ err: err_3 }, "❌ Erreur création prospect");
                res.status(500).json({
                    success: false,
                    error: err_3.message || "Failed to create prospect",
                    details: err_3.meta || err_3,
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.createProspect = createProspect;
// Update a prospect
var updateProspect = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, _a, firstname, lastname, email, phone, birthday, country, city, address, postal_code, status_3, source, notes, existing, updated, err_4;
    var _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 3, , 4]);
                id = req.params.id;
                if (!id) {
                    return [2 /*return*/, res.status(400).json({ success: false, error: "Prospect ID is required" })];
                }
                _a = req.body, firstname = _a.firstname, lastname = _a.lastname, email = _a.email, phone = _a.phone, birthday = _a.birthday, country = _a.country, city = _a.city, address = _a.address, postal_code = _a.postal_code, status_3 = _a.status, source = _a.source, notes = _a.notes;
                return [4 /*yield*/, prisma_js_1.default.prospect.findUnique({ where: { id: String(id) } })];
            case 1:
                existing = _d.sent();
                if (!existing || existing.deleted_at || existing.organization_id !== req.user.organizationId) {
                    return [2 /*return*/, res.status(404).json({ success: false, error: "Prospect not found" })];
                }
                // Check if prospect is already converted
                if (existing.converted_at) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            error: "Cannot update a converted prospect"
                        })];
                }
                return [4 /*yield*/, prisma_js_1.default.prospect.update({
                        where: { id: String(id) },
                        data: {
                            firstname: firstname,
                            lastname: lastname,
                            email: email,
                            phone: phone,
                            birthday: birthday,
                            country: country,
                            city: city,
                            address: address,
                            postal_code: postal_code,
                            status: status_3,
                            source: source,
                            notes: notes,
                            updated_at: new Date(),
                            updated_by: (_c = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : null,
                        },
                    })];
            case 2:
                updated = _d.sent();
                res.json({ success: true, data: updated });
                return [3 /*break*/, 4];
            case 3:
                err_4 = _d.sent();
                logger_js_1.default.error({ err: err_4 }, "❌ Erreur update prospect");
                res.status(500).json({
                    success: false,
                    error: err_4.message || "Failed to update prospect",
                    details: err_4.meta || err_4,
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.updateProspect = updateProspect;
// Soft delete a prospect
var softDeleteProspect = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, existing, deleted, err_5;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                id = req.params.id;
                if (!id) {
                    return [2 /*return*/, res.status(400).json({ success: false, error: "Prospect ID is required" })];
                }
                return [4 /*yield*/, prisma_js_1.default.prospect.findUnique({ where: { id: String(id) } })];
            case 1:
                existing = _c.sent();
                if (!existing || existing.deleted_at || existing.organization_id !== req.user.organizationId) {
                    return [2 /*return*/, res.status(404).json({ success: false, error: "Prospect not found" })];
                }
                return [4 /*yield*/, prisma_js_1.default.prospect.update({
                        where: { id: String(id) },
                        data: {
                            deleted_at: new Date(),
                            deleted_by: (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null,
                        },
                    })];
            case 2:
                deleted = _c.sent();
                res.json({ success: true, data: deleted });
                return [3 /*break*/, 4];
            case 3:
                err_5 = _c.sent();
                logger_js_1.default.error({ err: err_5 }, "❌ Erreur soft delete prospect");
                res.status(500).json({
                    success: false,
                    error: err_5.message || "Failed to soft delete prospect",
                    details: err_5.meta || err_5,
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.softDeleteProspect = softDeleteProspect;
// Hard delete a prospect
var hardDeleteProspect = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, existing, err_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                id = req.params.id;
                if (!id) {
                    return [2 /*return*/, res.status(400).json({ success: false, error: "Prospect ID is required" })];
                }
                return [4 /*yield*/, prisma_js_1.default.prospect.findUnique({ where: { id: String(id) } })];
            case 1:
                existing = _a.sent();
                if (!existing || existing.organization_id !== req.user.organizationId) {
                    return [2 /*return*/, res.status(404).json({ success: false, error: "Prospect not found" })];
                }
                return [4 /*yield*/, prisma_js_1.default.prospect.delete({ where: { id: String(id) } })];
            case 2:
                _a.sent();
                res.json({ success: true, message: "Prospect permanently deleted" });
                return [3 /*break*/, 4];
            case 3:
                err_6 = _a.sent();
                logger_js_1.default.error({ err: err_6 }, "❌ Erreur hard delete prospect");
                res.status(500).json({
                    success: false,
                    error: err_6.message || "Failed to hard delete prospect",
                    details: err_6.meta || err_6,
                });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.hardDeleteProspect = hardDeleteProspect;
// Convert prospect to customer
var convertProspectToCustomer = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id_1, prospect_1, existingCustomer, result, err_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                id_1 = req.params.id;
                if (!id_1) {
                    return [2 /*return*/, res.status(400).json({ success: false, error: "Prospect ID is required" })];
                }
                return [4 /*yield*/, prisma_js_1.default.prospect.findUnique({
                        where: { id: String(id_1) },
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
                    })];
            case 1:
                prospect_1 = _a.sent();
                if (!prospect_1 || prospect_1.deleted_at || prospect_1.organization_id !== req.user.organizationId) {
                    return [2 /*return*/, res.status(404).json({ success: false, error: "Prospect not found" })];
                }
                // Check if already converted
                if (prospect_1.converted_at) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            error: "Prospect already converted to customer",
                            customer_id: prospect_1.converted_to
                        })];
                }
                return [4 /*yield*/, prisma_js_1.default.customer.findUnique({
                        where: {
                            email_organization_id: {
                                email: prospect_1.email,
                                organization_id: prospect_1.organization_id,
                            },
                        },
                    })];
            case 2:
                existingCustomer = _a.sent();
                if (existingCustomer) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            error: "A customer with this email already exists",
                            customer_id: existingCustomer.id
                        })];
                }
                return [4 /*yield*/, prisma_js_1.default.$transaction(function (tx) { return __awaiter(void 0, void 0, void 0, function () {
                        var customer, noteContent_1, totalEstimatedCost_2, updatedProspect;
                        var _a, _b, _c, _d, _e, _f, _g, _h;
                        return __generator(this, function (_j) {
                            switch (_j.label) {
                                case 0: return [4 /*yield*/, tx.customer.create({
                                        data: {
                                            firstname: prospect_1.firstname,
                                            lastname: prospect_1.lastname,
                                            email: prospect_1.email,
                                            organization_id: prospect_1.organization_id,
                                            phone: prospect_1.phone,
                                            birthday: prospect_1.birthday,
                                            country: prospect_1.country,
                                            city: prospect_1.city,
                                            address: prospect_1.address,
                                            postal_code: prospect_1.postal_code,
                                            created_by: (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null,
                                        },
                                    })];
                                case 1:
                                    customer = _j.sent();
                                    if (!(prospect_1.dress_reservations.length > 0)) return [3 /*break*/, 3];
                                    noteContent_1 = "📋 Robes sélectionnées lors de la conversion depuis prospect:\n\n";
                                    totalEstimatedCost_2 = 0;
                                    prospect_1.dress_reservations.forEach(function (reservation, index) {
                                        var _a, _b, _c, _d;
                                        var startDate = new Date(reservation.rental_start_date);
                                        var endDate = new Date(reservation.rental_end_date);
                                        var rentalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                                        var pricePerDay = Number((_a = reservation.dress.price_per_day_ttc) !== null && _a !== void 0 ? _a : 0);
                                        var estimatedCost = rentalDays * pricePerDay;
                                        totalEstimatedCost_2 += estimatedCost;
                                        noteContent_1 += "".concat(index + 1, ". ").concat(reservation.dress.name, "\n");
                                        noteContent_1 += "   \u2022 R\u00E9f\u00E9rence: ".concat(reservation.dress.reference || "N/A", "\n");
                                        noteContent_1 += "   \u2022 Type: ".concat(((_b = reservation.dress.type) === null || _b === void 0 ? void 0 : _b.name) || "N/A", "\n");
                                        noteContent_1 += "   \u2022 Taille: ".concat(((_c = reservation.dress.size) === null || _c === void 0 ? void 0 : _c.name) || "N/A", "\n");
                                        noteContent_1 += "   \u2022 Couleur: ".concat(((_d = reservation.dress.color) === null || _d === void 0 ? void 0 : _d.name) || "N/A", "\n");
                                        noteContent_1 += "   \u2022 P\u00E9riode: ".concat(startDate.toLocaleDateString("fr-FR"), " au ").concat(endDate.toLocaleDateString("fr-FR"), "\n");
                                        noteContent_1 += "   \u2022 Nombre de jours: ".concat(rentalDays, " jour(s)\n");
                                        noteContent_1 += "   \u2022 Prix/jour TTC: ".concat(pricePerDay.toFixed(2), "\u20AC\n");
                                        noteContent_1 += "   \u2022 Co\u00FBt estim\u00E9: ".concat(estimatedCost.toFixed(2), "\u20AC\n");
                                        if (reservation.notes) {
                                            noteContent_1 += "   \u2022 Notes: ".concat(reservation.notes, "\n");
                                        }
                                        noteContent_1 += "\n";
                                    });
                                    noteContent_1 += "\uD83D\uDCB0 Co\u00FBt total estim\u00E9: ".concat(totalEstimatedCost_2.toFixed(2), "\u20AC");
                                    // Create customer note
                                    return [4 /*yield*/, tx.customerNote.create({
                                            data: {
                                                customer_id: customer.id,
                                                content: noteContent_1,
                                                created_by: (_d = (_c = req.user) === null || _c === void 0 ? void 0 : _c.id) !== null && _d !== void 0 ? _d : null,
                                            },
                                        })];
                                case 2:
                                    // Create customer note
                                    _j.sent();
                                    _j.label = 3;
                                case 3: return [4 /*yield*/, tx.prospect.update({
                                        where: { id: String(id_1) },
                                        data: {
                                            converted_at: new Date(),
                                            converted_by: (_f = (_e = req.user) === null || _e === void 0 ? void 0 : _e.id) !== null && _f !== void 0 ? _f : null,
                                            converted_to: customer.id,
                                            status: "converted",
                                            updated_at: new Date(),
                                            updated_by: (_h = (_g = req.user) === null || _g === void 0 ? void 0 : _g.id) !== null && _h !== void 0 ? _h : null,
                                        },
                                    })];
                                case 4:
                                    updatedProspect = _j.sent();
                                    return [2 /*return*/, {
                                            prospect: updatedProspect,
                                            customer: customer,
                                        }];
                            }
                        });
                    }); })];
            case 3:
                result = _a.sent();
                res.json({
                    success: true,
                    data: result,
                    message: "Prospect successfully converted to customer"
                });
                return [3 /*break*/, 5];
            case 4:
                err_7 = _a.sent();
                logger_js_1.default.error({ err: err_7 }, "❌ Erreur conversion prospect vers customer");
                res.status(500).json({
                    success: false,
                    error: err_7.message || "Failed to convert prospect to customer",
                    details: err_7.meta || err_7,
                });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.convertProspectToCustomer = convertProspectToCustomer;
