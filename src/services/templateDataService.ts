/**
 * Service de préparation des données pour les templates de contrat
 * Transforme les données brutes en variables utilisables dans les templates
 */

import type { Contract, Customer, Organization } from "@prisma/client";

/**
 * Format une valeur monétaire en format français
 */
function formatCurrency(value: unknown): string {
  const numeric = Number(value ?? 0);
  if (Number.isNaN(numeric)) return "0,00";
  return numeric.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format une date en format court français (DD/MM/YYYY)
 */
function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("fr-FR");
}

/**
 * Format une date et heure en format français (DD/MM/YYYY HH:mm)
 */
function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format une méthode de paiement
 */
function formatPaymentMethod(method?: string | null): string {
  if (!method) return "-";
  const normalized = method.toLowerCase();
  if (normalized === "card") return "Carte bancaire";
  if (normalized === "cash") return "Espèces";
  if (normalized === "check") return "Chèque";
  if (normalized === "transfer") return "Virement";
  return method;
}

/**
 * Génère les initiales d'un nom et prénom
 */
function generateInitials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.trim().charAt(0).toUpperCase() || "";
  const last = lastName?.trim().charAt(0).toUpperCase() || "";
  if (!first && !last) return "";
  return `${first}${first && last ? ". " : ""}${last}${last ? "." : ""}`;
}

/**
 * Format un prix en string avec 2 décimales (sans symbole €)
 */
function formatPrice(value: unknown): string {
  const numeric = Number(value ?? 0);
  if (Number.isNaN(numeric)) return "0.00";
  return numeric.toFixed(2);
}

/**
 * Prépare les données d'un contrat pour l'injection dans un template
 * Format: snake_case à plat (selon BACKEND_PDF_INSTRUCTIONS.md)
 */
export function prepareContractTemplateData(contract: any): Record<string, any> {
  const customer = contract.customer || {};
  const organization = contract.organization || {};
  const contractType = contract.contract_type || {};

  // ============================
  // ORGANISATION
  // ============================
  const orgCity = organization.city?.trim() || "Asnières-sur-Seine";
  const orgAddress = organization.address?.trim() || "4 avenue Laurent Cély";
  const orgPostalCode = organization.postal_code?.trim() || "92600";

  const managerFirstName = organization.manager_first_name?.trim() || "Hassna";
  const managerLastName = organization.manager_last_name?.trim() || "NAFILI";
  const managerFullName = [managerFirstName, managerLastName].filter(Boolean).join(" ");

  // ============================
  // ROBES
  // ============================
  const dresses = (contract.dresses || []).map((d: any) => {
    const dress = d.dress || {};
    return {
      name: dress.name || "Robe",
      reference: dress.reference || "-",
      type_name: dress.type?.name || null,
      size_name: dress.size?.name || null,
      color_name: dress.color?.name || null,
      condition_name: dress.condition?.name || null,
      price_ht: formatPrice(dress.price_per_day_ht || 0),
      price_ttc: formatPrice(dress.price_per_day_ttc || 0),
    };
  });

  // ============================
  // ADDONS
  // ============================
  const packageAddonIds = new Set(
    (contract.package?.addons ?? [])
      .map((pkgAddon: any) => pkgAddon?.addon_id ?? pkgAddon?.addon?.id)
      .filter(Boolean)
  );

  const addons = (contract.addon_links || [])
    .filter((link: any) => link?.addon)
    .map(({ addon }: any) => ({
      name: addon.name || "-",
      price_ttc: formatPrice(addon.price_ttc || 0),
      included: packageAddonIds.has(addon.id),
    }));

  // ============================
  // DONNÉES FINALES (snake_case à plat)
  // ============================
  return {
    // Informations du contrat
    contract_number: contract.contract_number || "-",
    created_at: formatDate(contract.created_at),
    start_datetime: formatDateTime(contract.start_datetime),
    end_datetime: formatDateTime(contract.end_datetime),
    contract_type_name: contractType.name || "-",
    status: contract.status || "-",
    deposit_payment_method: formatPaymentMethod(contract.deposit_payment_method),

    // Prix (strings avec 2 décimales, sans symbole €)
    total_price_ht: formatPrice(contract.total_price_ht),
    total_price_ttc: formatPrice(contract.total_price_ttc),
    account_ht: formatPrice(contract.account_ht),
    account_ttc: formatPrice(contract.account_ttc),
    account_paid_ht: formatPrice(contract.account_paid_ht),
    account_paid_ttc: formatPrice(contract.account_paid_ttc),
    caution_ht: formatPrice(contract.caution_ht),
    caution_ttc: formatPrice(contract.caution_ttc),
    caution_paid_ht: formatPrice(contract.caution_paid_ht),
    caution_paid_ttc: formatPrice(contract.caution_paid_ttc),

    // Informations client (préfixe customer_)
    customer_firstname: customer.firstname?.trim() || "-",
    customer_lastname: customer.lastname?.trim() || "-",
    customer_email: customer.email || "-",
    customer_phone: customer.phone || "-",
    customer_address: customer.address || "-",
    customer_postal_code: customer.postal_code || "-",
    customer_city: customer.city || "-",
    customer_country: customer.country || "-",
    customer_birthday: customer.birthday ? formatDate(customer.birthday) : null,

    // Organisation (objet imbriqué)
    org: {
      name: organization.name || "VELVENA",
      address: orgAddress,
      city: `${orgCity} ${orgPostalCode}`,
      phone: organization.phone || "-",
      email: organization.email || "-",
      siret: organization.siret || "985 287 880 0014",
      managerFullName: managerFullName,
    },

    // Robes (array avec snake_case)
    dresses,

    // Addons (array)
    addons,
  };
}
