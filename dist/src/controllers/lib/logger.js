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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var pino_1 = __importDefault(require("pino"));
var isDev = process.env.NODE_ENV === "development";
var transport = isDev
    ? {
        target: "pino-pretty",
        options: { colorize: true },
    }
    : undefined;
var logger = (0, pino_1.default)(__assign({ level: process.env.LOG_LEVEL || "info" }, (transport ? { transport: transport } : {})));
exports.default = logger;
