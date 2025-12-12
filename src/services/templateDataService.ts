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
 * Prépare les données d'un contrat pour l'injection dans un template
 */
export function prepareContractTemplateData(contract: any): Record<string, any> {
  const customer = contract.customer || {};
  const organization = contract.organization || {};
  const contractType = contract.contract_type || {};

  // ============================
  // CLIENT
  // ============================
  const customerFirstName = customer.firstname?.trim() || "";
  const customerLastName = customer.lastname?.trim() || "";
  const customerFullName =
    customerFirstName || customerLastName
      ? [customerFirstName, customerLastName].filter(Boolean).join(" ")
      : "-";

  // ============================
  // ORGANISATION
  // ============================
  const orgCity = organization.city?.trim() || "Asnières-sur-Seine"; // Fallback
  const orgAddress = organization.address?.trim() || "";
  const orgPostalCode = organization.postal_code?.trim() || "";
  const orgFullAddress = [orgAddress, orgPostalCode, orgCity]
    .filter(Boolean)
    .join(", ");

  const managerGender = organization.manager_gender?.trim() || "";
  const managerFirstName = organization.manager_first_name?.trim() || "";
  const managerLastName = organization.manager_last_name?.trim() || "";
  const managerFullName =
    managerFirstName || managerLastName
      ? [managerFirstName, managerLastName].filter(Boolean).join(" ")
      : "-";
  const managerInitials = generateInitials(managerFirstName, managerLastName);

  // ============================
  // SIGNATURE
  // ============================
  const hasElectronicSignature = !!contract.signed_at && !!contract.signature_ip;

  // ============================
  // ROBES
  // ============================
  const dresses = (contract.dresses || []).map((d: any) => ({
    name: d.dress?.name || "Robe",
    reference: d.dress?.reference || "-",
    pricePerDay: formatCurrency(d.dress?.price_per_day_ttc || 0) + " €",
    pricePerDayRaw: Number(d.dress?.price_per_day_ttc || 0),
  }));

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
    .map(({ addon }: any) => {
      const includedViaPackage = packageAddonIds.has(addon.id);
      const description =
        typeof addon.description === "string" && addon.description.trim().length > 0
          ? addon.description.trim()
          : null;

      return {
        id: addon.id,
        name: addon.name,
        description: description || "",
        price: formatCurrency(addon.price_ttc) + " €",
        priceRaw: Number(addon.price_ttc || 0),
        includedInPackage: includedViaPackage,
      };
    });

  // ============================
  // DONNÉES FINALES
  // ============================
  return {
    // CLIENT
    client: {
      fullName: customerFullName,
      firstName: customerFirstName || "-",
      lastName: customerLastName || "-",
      email: customer.email || "-",
      phone: customer.phone || "-",
      address: customer.address || "-",
      city: customer.city || "-",
      postalCode: customer.postal_code || "-",
      country: customer.country || "-",
    },

    // CONTRAT
    contract: {
      number: contract.contract_number || "-",
      type: contractType.name || "-",
      startDate: formatDate(contract.start_datetime),
      startDateTime: formatDateTime(contract.start_datetime),
      endDate: formatDate(contract.end_datetime),
      endDateTime: formatDateTime(contract.end_datetime),
      createdAt: formatDate(contract.created_at),
      signedAt: contract.signed_at ? formatDateTime(contract.signed_at) : null,
      status: contract.status || "-",

      // Financier
      totalTTC: formatCurrency(contract.total_price_ttc) + " €",
      totalHT: formatCurrency(contract.total_price_ht) + " €",
      accountTTC: formatCurrency(contract.account_ttc) + " €",
      accountHT: formatCurrency(contract.account_ht) + " €",
      accountPaidTTC: formatCurrency(contract.account_paid_ttc) + " €",
      cautionTTC: formatCurrency(contract.caution_ttc) + " €",
      cautionHT: formatCurrency(contract.caution_ht) + " €",
      cautionPaidTTC: formatCurrency(contract.caution_paid_ttc) + " €",
      paymentMethod: formatPaymentMethod(contract.deposit_payment_method),
    },

    // ORGANISATION
    org: {
      name: organization.name || "VELVENA",
      siret: organization.siret || "985 287 880 0014", // Fallback historique
      address: orgAddress || "4 avenue Laurent Cély",
      city: orgCity,
      postalCode: orgPostalCode || "92600",
      country: organization.country || "France",
      fullAddress: orgFullAddress || "4 avenue Laurent Cély, 92600 Asnières-sur-Seine",
      email: organization.email || "-",
      phone: organization.phone || "-",

      // Manager
      managerGender: managerGender || "Madame",
      managerFirstName: managerFirstName || "Hassna",
      managerLastName: managerLastName || "NAFILI",
      managerFullName: managerFullName,
      managerTitle: organization.manager_title?.trim() || "gérante",
      managerInitials: managerInitials || "H. N.",
    },

    // SIGNATURE (si électronique)
    signature: hasElectronicSignature
      ? {
          date: formatDateTime(contract.signed_at),
          ip: contract.signature_ip || "-",
          location: contract.signature_location || "-",
          reference: contract.signature_reference || "-",
        }
      : null,

    // LISTES
    dresses,
    addons,

    // DATES UTILES
    today: formatDate(new Date()),
  };
}
