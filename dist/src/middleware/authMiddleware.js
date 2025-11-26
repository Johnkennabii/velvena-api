import pino from "../lib/logger.js";
import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        pino.warn("❌ Missing authorization header");
        return res.status(401).json({ message: "Missing authorization header" });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        pino.warn({ authHeader }, "❌ Missing token after split");
        return res.status(401).json({ message: "Missing token" });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        pino.info({ decoded }, "✅ Token valid");
        req.user = {
            id: decoded.id,
            email: decoded.email ?? null,
            role: decoded.role ?? null,
        };
        next();
    }
    catch (err) {
        pino.error({ err }, "❌ Invalid token");
        return res.status(401).json({ message: "Invalid token" });
    }
};
export default authMiddleware;
//# sourceMappingURL=authMiddleware.js.map