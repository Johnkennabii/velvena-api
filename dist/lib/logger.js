import pino from "pino";
const isDev = process.env.NODE_ENV === "development";
const transport = isDev
    ? {
        target: "pino-pretty",
        options: { colorize: true },
    }
    : undefined;
const logger = pino({
    level: process.env.LOG_LEVEL || "info",
    ...(transport ? { transport } : {}),
});
export default logger;
//# sourceMappingURL=logger.js.map