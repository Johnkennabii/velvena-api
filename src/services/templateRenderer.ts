/**
 * Template Renderer Service
 * Service de rendu des templates avec Handlebars
 */

import Handlebars from "handlebars";
import { prepareContractTemplateData } from "./templateDataService.js";
import logger from "../lib/logger.js";

// ============================
// Helpers Handlebars personnalisés
// ============================

/**
 * Helper pour formater une devise
 * Usage: {{currency value}}
 */
Handlebars.registerHelper("currency", function (value: any) {
  const numeric = Number(value ?? 0);
  if (Number.isNaN(numeric)) return "0,00 €";
  return (
    numeric.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " €"
  );
});

/**
 * Helper pour formater une date
 * Usage: {{date value}}
 */
Handlebars.registerHelper("date", function (value: any) {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("fr-FR");
});

/**
 * Helper pour formater une date avec heure
 * Usage: {{datetime value}}
 */
Handlebars.registerHelper("datetime", function (value: any) {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
});

/**
 * Helper pour conditionnel égalité
 * Usage: {{#ifEquals value1 value2}}...{{/ifEquals}}
 */
Handlebars.registerHelper("ifEquals", function (this: any, arg1: any, arg2: any, options: any) {
  return arg1 === arg2 ? options.fn(this) : options.inverse(this);
});

/**
 * Helper pour conditionnel différent
 * Usage: {{#ifNotEquals value1 value2}}...{{/ifNotEquals}}
 */
Handlebars.registerHelper("ifNotEquals", function (this: any, arg1: any, arg2: any, options: any) {
  return arg1 !== arg2 ? options.fn(this) : options.inverse(this);
});

/**
 * Compile un template Handlebars
 */
export function compileTemplate(templateContent: string): HandlebarsTemplateDelegate {
  try {
    return Handlebars.compile(templateContent);
  } catch (error) {
    logger.error({ error }, "Failed to compile template");
    throw new Error("Invalid template syntax");
  }
}

/**
 * Rend un template avec les données d'un contrat
 */
export function renderContractTemplate(templateContent: string, contract: any): string {
  try {
    // Préparer les données du contrat
    const templateData = prepareContractTemplateData(contract);

    // Compiler le template
    const compiled = compileTemplate(templateContent);

    // Rendre le template avec les données
    const rendered = compiled(templateData);

    return rendered;
  } catch (error) {
    logger.error({ error }, "Failed to render template");
    throw new Error("Failed to render template");
  }
}

/**
 * Valide qu'un template est syntaxiquement correct
 */
export function validateTemplate(templateContent: string): { valid: boolean; error?: string } {
  try {
    compileTemplate(templateContent);
    return { valid: true };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message || "Invalid template syntax",
    };
  }
}
