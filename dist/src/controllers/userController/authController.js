import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../../lib/prisma.js";
import logger from "../../lib/logger.js";
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
export const register = async (req, res) => {
    try {
        const { email, password, roleName } = req.body;
        logger.info({ email, userId: req.user?.id }, "Attempting to register user");
        if (!req.user?.id) {
            return res.status(401).json({ error: "Unauthorized: only authenticated users can create accounts" });
        }
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: "User with this email already exists" });
        }
        const role = await prisma.role.findFirst({ where: { name: roleName } });
        if (!role)
            return res.status(400).json({ error: "Role not found" });
        const hashedPassword = await bcrypt.hash(password, 10);
        const now = new Date();
        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                created_at: now,
                created_by: req.user.id,
                profile: {
                    create: {
                        role_id: role.id,
                        created_at: now,
                        created_by: req.user.id,
                        firstName: req.body.firstName || null,
                        lastName: req.body.lastName || null,
                    },
                },
            },
            include: { profile: true },
        });
        res.status(201).json({ id: newUser.id, email: newUser.email, role: role.name, profile: newUser.profile });
    }
    catch (err) {
        logger.error({ err }, "Failed to register user");
        res.status(400).json({ error: err.message });
    }
};
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        logger.info({ email }, "Attempting to login user");
        const user = await prisma.user.findUnique({
            where: { email },
            include: { profile: { include: { role: true } } },
        });
        if (!user)
            return res.status(401).json({ error: "User not found" });
        const valid = await bcrypt.compare(password, user.password);
        if (!valid)
            return res.status(401).json({ error: "Invalid password" });
        await prisma.user.update({ where: { id: user.id }, data: { last_signin_at: new Date() } });
        const roleName = user.profile?.role?.name ?? null;
        const token = jwt.sign({ id: user.id, email: user.email, role: roleName }, JWT_SECRET, { expiresIn: "6h" });
        logger.info({ userId: user.id, email: user.email, role: roleName, token }, "User logged in with token");
        res.json({ token, id: user.id, email: user.email, role: roleName });
    }
    catch (err) {
        logger.error({ err }, "Failed to login user");
        res.status(400).json({ error: err.message });
    }
};
export const me = async (req, res) => {
    if (!req.user?.id) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    try {
        logger.info({ userId: req.user.id }, "Fetching current user info");
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { profile: { include: { role: true } } },
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const roleName = user.profile?.role?.name ?? null;
        const token = jwt.sign({ id: user.id, email: user.email, role: roleName }, JWT_SECRET, { expiresIn: "6h" });
        logger.info({ userId: user.id, email: user.email, role: roleName }, "Current user info fetched");
        res.json({
            token,
            id: user.id,
            email: user.email,
            role: roleName,
            profile: user.profile,
        });
    }
    catch (err) {
        logger.error({ err }, "Failed to fetch current user info");
        res.status(400).json({ error: err.message });
    }
};
export const refresh = async (req, res) => {
    if (!req.user?.id) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    try {
        // Récupération de l’utilisateur depuis la DB pour vérifier qu’il existe toujours
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { profile: { include: { role: true } } },
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const roleName = user.profile?.role?.name ?? null;
        // Génération d’un nouveau JWT
        const token = jwt.sign({ id: user.id, email: user.email, role: roleName }, JWT_SECRET, { expiresIn: "6h" });
        res.json({
            token,
            id: user.id,
            email: user.email,
            role: roleName,
            profile: user.profile,
        });
    }
    catch (err) {
        logger.error({ err }, "Failed to refresh token");
        res.status(400).json({ error: err.message });
    }
};
//# sourceMappingURL=authController.js.map