import archiver from "archiver";
import fs from "fs";
import path from "path";
import { Readable } from "stream";
import prisma from "../lib/prisma.js";
import pino from "../lib/logger.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-11-17.clover",
});

interface ExportResult {
  success: boolean;
  zipPath?: string;
  error?: string;
  stats?: {
    contracts: number;
    invoices: number;
    clients: number;
    prospects: number;
    totalSize: number;
  };
}

/**
 * Export all organization data as a ZIP file
 * Includes: signed contracts (PDFs), Stripe invoices (PDFs), clients (JSON), prospects (JSON)
 */
export async function exportOrganizationData(
  organizationId: string
): Promise<ExportResult> {
  const timestamp = Date.now();
  const tempDir = path.join(process.cwd(), "temp", "exports");
  const zipFileName = `organization_${organizationId}_${timestamp}.zip`;
  const zipPath = path.join(tempDir, zipFileName);

  try {
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    pino.info(
      { organizationId, zipPath },
      "🗜️ Starting data export for organization"
    );

    // Verify organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        stripe_customer_id: true,
      },
    });

    if (!organization) {
      throw new Error(`Organization ${organizationId} not found`);
    }

    // Create ZIP archive
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Maximum compression
    });

    // Handle archive events
    output.on("close", () => {
      pino.info(
        { totalBytes: archive.pointer() },
        "✅ Archive created successfully"
      );
    });

    archive.on("error", (err) => {
      throw err;
    });

    archive.pipe(output);

    // Stats
    const stats = {
      contracts: 0,
      invoices: 0,
      clients: 0,
      prospects: 0,
      totalSize: 0,
    };

    // ========================================
    // 1. EXPORT SIGNED CONTRACTS (PDFs)
    // ========================================
    pino.info("📄 Exporting signed contracts...");

    const signedContracts = await prisma.contract.findMany({
      where: {
        organization_id: organizationId,
        status: "SIGNED",
        signed_pdf_url: { not: null },
      },
      select: {
        id: true,
        contract_number: true,
        signed_pdf_url: true,
        signed_at: true,
      },
    });

    stats.contracts = signedContracts.length;

    for (const contract of signedContracts) {
      if (contract.signed_pdf_url) {
        try {
          // Download PDF from object storage
          const response = await fetch(contract.signed_pdf_url);
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            const fileName = `contract_${contract.contract_number}_${contract.signed_at?.toISOString().split("T")[0] || "unknown"}.pdf`;

            archive.append(Buffer.from(buffer), {
              name: `contracts/${fileName}`,
            });

            pino.debug(
              { contractId: contract.id, fileName },
              "✓ Contract PDF added to archive"
            );
          } else {
            pino.warn(
              { contractId: contract.id, url: contract.signed_pdf_url },
              "⚠️ Failed to download contract PDF"
            );
          }
        } catch (error) {
          pino.error(
            { contractId: contract.id, error },
            "❌ Error downloading contract PDF"
          );
        }
      }
    }

    // ========================================
    // 2. EXPORT STRIPE INVOICES (PDFs)
    // ========================================
    pino.info("💳 Exporting Stripe invoices...");

    if (organization.stripe_customer_id) {
      try {
        const invoices = await stripe.invoices.list({
          customer: organization.stripe_customer_id,
          limit: 100,
        });

        stats.invoices = invoices.data.length;

        for (const invoice of invoices.data) {
          if (invoice.invoice_pdf) {
            try {
              const response = await fetch(invoice.invoice_pdf);
              if (response.ok) {
                const buffer = await response.arrayBuffer();
                const fileName = `invoice_${invoice.number || invoice.id}_${new Date(invoice.created * 1000).toISOString().split("T")[0]}.pdf`;

                archive.append(Buffer.from(buffer), {
                  name: `invoices/${fileName}`,
                });

                pino.debug({ invoiceId: invoice.id }, "✓ Invoice PDF added");
              }
            } catch (error) {
              pino.error(
                { invoiceId: invoice.id, error },
                "❌ Error downloading invoice PDF"
              );
            }
          }
        }

        // Also export invoices metadata as JSON
        const invoicesMetadata = invoices.data.map((inv) => ({
          id: inv.id,
          number: inv.number,
          amount_due: inv.amount_due,
          amount_paid: inv.amount_paid,
          currency: inv.currency,
          status: inv.status,
          created: new Date(inv.created * 1000).toISOString(),
          due_date: inv.due_date
            ? new Date(inv.due_date * 1000).toISOString()
            : null,
          pdf_url: inv.invoice_pdf,
        }));

        archive.append(JSON.stringify(invoicesMetadata, null, 2), {
          name: "invoices/invoices_metadata.json",
        });
      } catch (error) {
        pino.error(
          { error },
          "❌ Error fetching Stripe invoices"
        );
      }
    } else {
      pino.info("ℹ️ No Stripe customer ID, skipping invoices export");
    }

    // ========================================
    // 3. EXPORT CLIENTS (JSON)
    // ========================================
    pino.info("👥 Exporting clients...");

    const clients = await prisma.customer.findMany({
      where: { organization_id: organizationId },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        country: true,
        postal_code: true,
        created_at: true,
        updated_at: true,
      },
    });

    stats.clients = clients.length;

    if (clients.length > 0) {
      archive.append(JSON.stringify(clients, null, 2), {
        name: "clients/clients.json",
      });

      // Also create CSV for easy spreadsheet import
      const csvHeader =
        "ID,First Name,Last Name,Email,Phone,Address,City,Postal Code,Country,Created At\n";
      const csvRows = clients
        .map(
          (c: any) =>
            `"${c.id}","${c.firstname || ""}","${c.lastname || ""}","${c.email || ""}","${c.phone || ""}","${c.address || ""}","${c.city || ""}","${c.postal_code || ""}","${c.country || ""}","${c.created_at?.toISOString() || ""}"`
        )
        .join("\n");

      archive.append(csvHeader + csvRows, {
        name: "clients/clients.csv",
      });
    }

    // ========================================
    // 4. EXPORT PROSPECTS (JSON)
    // ========================================
    pino.info("🔍 Exporting prospects...");

    const prospects = await prisma.prospect.findMany({
      where: { organization_id: organizationId },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        phone: true,
        status: true,
        source: true,
        notes: true,
        created_at: true,
        updated_at: true,
      },
    });

    stats.prospects = prospects.length;

    if (prospects.length > 0) {
      archive.append(JSON.stringify(prospects, null, 2), {
        name: "prospects/prospects.json",
      });

      // CSV export
      const csvHeader =
        "ID,First Name,Last Name,Email,Phone,Status,Source,Notes,Created At\n";
      const csvRows = prospects
        .map(
          (p: any) =>
            `"${p.id}","${p.firstname || ""}","${p.lastname || ""}","${p.email || ""}","${p.phone || ""}","${p.status || ""}","${p.source || ""}","${p.notes || ""}","${p.created_at?.toISOString() || ""}"`
        )
        .join("\n");

      archive.append(csvHeader + csvRows, {
        name: "prospects/prospects.csv",
      });
    }

    // ========================================
    // 5. ADD MANIFEST FILE
    // ========================================
    const manifest = {
      organization: {
        id: organization.id,
        name: organization.name,
      },
      export_date: new Date().toISOString(),
      stats,
      contents: {
        contracts: `${stats.contracts} signed contracts (PDFs)`,
        invoices: `${stats.invoices} Stripe invoices (PDFs + JSON metadata)`,
        clients: `${stats.clients} clients (JSON + CSV)`,
        prospects: `${stats.prospects} prospects (JSON + CSV)`,
      },
      notes:
        "This archive contains all your data in compliance with GDPR data portability requirements.",
    };

    archive.append(JSON.stringify(manifest, null, 2), {
      name: "MANIFEST.json",
    });

    // Finalize the archive
    await archive.finalize();

    // Wait for the output stream to finish
    await new Promise<void>((resolve, reject) => {
      output.on("close", () => resolve());
      output.on("error", reject);
    });

    stats.totalSize = archive.pointer();

    pino.info(
      { stats, zipPath },
      "✅ Organization data export completed successfully"
    );

    return {
      success: true,
      zipPath,
      stats,
    };
  } catch (error) {
    pino.error(
      { organizationId, error },
      "❌ Failed to export organization data"
    );

    // Clean up partial ZIP file if it exists
    if (fs.existsSync(zipPath)) {
      try {
        fs.unlinkSync(zipPath);
      } catch (unlinkError) {
        pino.error({ unlinkError }, "Failed to clean up partial ZIP file");
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Clean up old export files (older than 24 hours)
 */
export async function cleanupOldExports(): Promise<void> {
  const tempDir = path.join(process.cwd(), "temp", "exports");

  if (!fs.existsSync(tempDir)) {
    return;
  }

  const files = fs.readdirSync(tempDir);
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours

  for (const file of files) {
    const filePath = path.join(tempDir, file);
    const stats = fs.statSync(filePath);

    if (now - stats.mtimeMs > maxAge) {
      try {
        fs.unlinkSync(filePath);
        pino.info({ file }, "🗑️ Cleaned up old export file");
      } catch (error) {
        pino.error({ file, error }, "Failed to delete old export file");
      }
    }
  }
}
