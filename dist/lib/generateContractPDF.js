import puppeteer from "puppeteer";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3, hetznerBucket } from "./hetzner.js";
import logger from "./logger.js";
import { generateContractPDFWithPdfLib } from "./pdfGenerator.js";
export async function generateContractPDF(token, contractId, existingContract, options = {}) {
    // 🔹 Récupère les données depuis ton API si aucun contrat n'est fourni
    let contractPayload = existingContract;
    if (!contractPayload) {
        if (!token) {
            throw new Error("Token de signature manquant pour la génération du PDF");
        }
        const apiUrl = `https://api.allure-creation.fr/sign-links/${token}`;
        const response = await fetch(apiUrl);
        const json = await response.json();
        if (!json.success || !json.data?.contract) {
            throw new Error("Impossible de récupérer le contrat pour la génération du PDF");
        }
        contractPayload = json.data.contract;
    }
    const contract = contractPayload;
    const includeSignatureBlock = options.includeSignatureBlock ?? false;
    const customer = contract.customer || {};
    const customerFullName = [customer.firstname, customer.lastname]
        .map((value) => value?.trim())
        .filter((value) => Boolean(value && value.length > 0))
        .join(" ");
    const customerInfoEntries = [
        { label: "Nom complet", value: customerFullName || "-" },
        { label: "Email", value: customer.email ?? "-" },
        { label: "Téléphone", value: customer.phone ?? "-" },
        { label: "Adresse", value: customer.address ?? "-" },
        { label: "Ville", value: customer.city ?? "-" },
        { label: "Pays", value: customer.country ?? "-" },
    ];
    const customerInfoRows = [];
    for (let i = 0; i < customerInfoEntries.length; i += 2) {
        customerInfoRows.push(customerInfoEntries.slice(i, i + 2));
    }
    const dresses = contract.dresses || [];
    const addonLinks = Array.isArray(contract.addon_links) ? contract.addon_links.filter((link) => link?.addon) : [];
    const packageAddonIds = new Set((contract.package?.addons ?? [])
        .map((pkgAddon) => pkgAddon?.addon_id ?? pkgAddon?.addon?.id)
        .filter(Boolean));
    const normalizeTypeName = (value) => value ? value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
    const typeName = normalizeTypeName(contract.contract_type?.name);
    const isNegafa = typeName.includes("negafa");
    const isForfait = typeName.includes("forfait");
    const isJournalier = typeName.includes("location par jour");
    const isForfaitService = isNegafa || (isForfait && !isJournalier);
    const isForfaitJournalier = isForfait && isJournalier;
    logger.info({
        contractId,
        contractTypeName: contract.contract_type?.name,
        typeName,
        isNegafa,
        isForfait,
        isJournalier,
        isForfaitService,
        isForfaitJournalier,
        selectedClausesType: isForfaitJournalier ? 'Location par jour' : isForfaitService ? 'Forfait' : 'default'
    }, "📋 Détection du type de clauses pour le PDF");
    const formatCurrency = (value) => {
        const numeric = Number(value ?? 0);
        if (Number.isNaN(numeric))
            return "0,00";
        return numeric.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };
    const formatPaymentMethod = (method) => {
        if (!method)
            return "-";
        const normalized = method.toLowerCase();
        if (normalized === "card")
            return "Carte bancaire";
        if (normalized === "cash")
            return "Espèces";
        return method;
    };
    const addonDetails = addonLinks.map(({ addon }) => {
        const includedViaPackage = packageAddonIds.has(addon.id) && (isForfaitService || isForfaitJournalier);
        const addonDescription = typeof addon.description === "string" && addon.description.trim().length > 0 ? addon.description.trim() : null;
        return {
            id: addon.id,
            name: addon.name,
            description: addonDescription,
            priceTtc: formatCurrency(addon.price_ttc),
            includedViaPackage,
        };
    });
    const addonsSection = addonDetails.length
        ? `
    <div class="section">
      <h2>Options</h2>
      <div class="addon-list">
        ${addonDetails
            .map(({ name, description, priceTtc, includedViaPackage }) => `
          <div class="addon-item">
            <div>
              <div class="value"><strong>${name}</strong></div>
              ${description ? `<div class="label">${description}</div>` : ""}
            </div>
            <div class="value addon-price">
              ${includedViaPackage
            ? `<span class="striked">${priceTtc} € TTC</span><span class="tag tag-success">Inclus au forfait</span>`
            : `${priceTtc} € TTC`}
            </div>
          </div>`)
            .join("")}
      </div>
    </div>`
        : "";
    const formattedContractCreatedDate = contract.created_at
        ? new Date(contract.created_at).toLocaleDateString("fr-FR")
        : "…………………………..";
    const signatureBlock = includeSignatureBlock
        ? `
    <div class="signatures">
      <p>Fait à Asnières-sur-Seine le ${formattedContractCreatedDate}.</p>
      <div class="signature-grid">
        <div>
          <div class="label">Signature client</div>
          <div class="value">« Lu & approuvé »</div>
        </div>
        <div>
          <div class="label">Signature prestataire</div>
          <div class="value">« Lu & approuvé »</div>
          <p>H. N.</p>
        </div>
      </div>
    </div>`
        : "";
    const forfaitClauses = `
    <div class="section contract-clauses">
      <h2>Clauses contractuelles – Prestation Négafa</h2>
      <p><strong>Entre les soussignés :</strong></p>
      <p>La société ALLURE CRÉATION, SAS immatriculée sous le n° 985&nbsp;287&nbsp;880&nbsp;0014, sise 4 avenue Laurent Cély, 92600 Asnières-sur-Seine, représentée par Madame Hassna NAFILI en qualité de gérante, ci-après dénommée « le Prestataire »,</p>
      <p>Et le Client, ci-après dénommé « la Cliente », identifié(e) dans le présent contrat.</p>
      <div class="article">
        <h3>Article 1 – Objet du contrat</h3>
        <p>Le contrat encadre une prestation de préparation, habillage, accompagnement et location de tenues traditionnelles fournie pour un événement personnel (mariage, fiançailles, cérémonie).</p>
      </div>
      <div class="article">
        <h3>Article 2 – Description de la prestation</h3>
        <ol>
          <li>Essayage et sélection des tenues au showroom ALLURE CRÉATION.</li>
          <li>Location des tenues traditionnelles, accessoires et parures.</li>
          <li>Habillage et préparation de la mariée sur place le jour J.</li>
          <li>Accompagnement, changements de tenues et présence continue dans la limite définie ci-après.</li>
        </ol>
      </div>
      <div class="article">
        <h3>Article 3 – Durée de la prestation</h3>
        <p>La prestation est limitée à sept (7) heures consécutives (ex. 19h00 – 2h00). Toute heure supplémentaire entamée est facturée 150&nbsp;€ TTC.</p>
      </div>
      <div class="article">
        <h3>Article 4 – Mise à disposition d’un espace sécurisé</h3>
        <p>La Cliente fournit une loge ou un local sécurisé, fermé par clé ou code, dédié au stockage du matériel et aux préparatifs.</p>
        <ol>
          <li>Aucun objet personnel ou de valeur de la Cliente/invités ne doit y être déposé.</li>
          <li>ALLURE CRÉATION décline toute responsabilité en cas de perte, vol ou détérioration de biens tiers.</li>
          <li>Seule la négafa dispose de la clé ou du dispositif d’ouverture durant la prestation.</li>
          <li>La loge est strictement réservée à la Mariée et à la Prestataire.</li>
          <li>Le repas de la négafa est à la charge de la Cliente.</li>
        </ol>
      </div>
      <div class="article">
        <h3>Article 5 – Conditions financières</h3>
        <ul>
          <li>Les tarifs appliqués correspondent au forfait sélectionné par la Cliente.</li>
          <li>Un acompte de 50&nbsp;% est exigé à la signature du contrat.</li>
          <li>Le solde est payable à la remise des tenues.</li>
        </ul>
        <p>Tout retard de paiement peut entraîner suspension ou annulation de la prestation, sans indemnité.</p>
      </div>
      <div class="article">
        <h3>Article 6 – Caution</h3>
        <p>Une caution est obligatoire pour toute location. Elle est restituée après vérification de l’état du matériel. Toute perte, détérioration, brûlure, tâche irréversible ou dommage est déduite de la caution, sans préjudice d’une facturation complémentaire.</p>
      </div>
      <div class="article">
        <h3>Article 7 – Substitution</h3>
        <p>En cas d’impossibilité de fournir le bien réservé pour une raison indépendante de la volonté du Prestataire, un bien de catégorie équivalente ou supérieure est proposé sans frais additionnels. Cette substitution n’est pas un manquement contractuel.</p>
      </div>
      <div class="article">
        <h3>Article 8 – Annulation</h3>
        <p>En cas d’annulation par la Cliente, l’acompte demeure acquis, sauf cas de force majeure dûment justifié. Toute demande doit être formulée par écrit.</p>
      </div>
      <div class="article">
        <h3>Article 9 – Engagement et signature</h3>
        <ul>
          <li>La Cliente atteste avoir lu et accepté les conditions générales et particulières.</li>
          <li>L’acceptation électronique vaut signature manuscrite conformément à l’article 1367 du Code civil.</li>
        </ul>
      </div>
      ${signatureBlock}
    </div>
  `;
    const forfaitJournalierClauses = `
  <div class="section contract-clauses">
    <h2>Clauses contractuelles – Location de robes</h2>

    <p><strong>Entre les soussignés :</strong></p>
    <p>
      La société <strong>ALLURE CREATION</strong>, Société par actions simplifiée (SAS) immatriculée
      au registre du commerce et des sociétés sous le numéro <strong>9852878800014</strong>,
      ayant son siège social au <strong>4 avenue Laurent Cély, 92600 Asnières-sur-Seine</strong>,
      représentée par <strong>Hassna NAFILI</strong> en qualité de gérante,
      ci-après dénommée « le Prestataire ».
    </p>
    <p>
      Et le Client, ci-après dénommé « la Cliente », identifié(e) dans le présent contrat.
    </p>

    <p><strong>Il a alors été convenu ce qui suit :</strong></p>

    <!-- Article 1 -->
    <div class="article">
      <h3>Article 1 : Description</h3>
      <p>
        Le présent contrat a pour objet de définir les modalités selon lesquelles le Prestataire fournira
        à la Cliente un ensemble de services liés à la tenue de manifestations festives (mariage, fiançailles,
        cérémonies).
      </p>
      <ul>
        <li>Location des robes mariée, bijoux et accessoires (voiles, jupons).</li>
        <li>Location des robes invitées.</li>
      </ul>
    </div>

    <!-- Article 2 -->
    <div class="article">
      <h3>Article 2 : Conditions financières et caution</h3>
      <p>
        Un acompte de <strong>50&nbsp;%</strong> du montant total de la location est versé le jour de la signature.
        Le solde doit être réglé au moment du retrait des tenues, accompagné d’une caution.
      </p>
      <p>
        L’intégralité du paiement doit être effectuée selon ces modalités ; à défaut, la location ne pourra
        avoir lieu.
      </p>
      <p><strong>Attention :</strong> seules les cautions en empreinte carte bancaire ou en espèces sont acceptées.
      Aucun chèque ne sera accepté.</p>
    </div>

    <!-- Article 3 -->
    <div class="article">
      <h3>Article 3 : Résiliation – Annulation</h3>
      <p>
        Les contrats sont fermes et définitifs dès leur signature. Ils ne font pas l’objet du droit de rétractation
        prévu par l’article L212-20 du Code de la Consommation.
      </p>
      <p>
        L’acompte de 50&nbsp;% reste acquis au Prestataire en cas d’annulation.
      </p>
      <p>
        La responsabilité du Prestataire ne pourra être engagée en cas de retard ou impossibilité d’exécution
        résultant d’un cas de force majeure, tel que défini par la jurisprudence de la Cour de cassation.
      </p>
    </div>

    <!-- Article 4 -->
    <div class="article">
      <h3>Article 4 : Responsabilité des parties</h3>
      <p>
        En cas de perte, dégât ou vol d’un article loué :
      </p>
      <ul>
        <li>La caution bancaire sera conservée si le bien est abîmé (trou, tâche, brûlure, déchirure).</li>
        <li>Si le bien est réparable, le montant des retouches sera déduit de la caution.</li>
        <li>Si le bien est perdu, volé ou irréparable, le Prestataire pourra réclamer le prix d’achat du bien.</li>
      </ul>
      <p>
        Les parties ne peuvent être tenues responsables des conséquences d’un cas de force majeure conformément
        à la jurisprudence française.
      </p>
    </div>

    <!-- Article 5 -->
    <div class="article">
      <h3>Article 5 : Restitution</h3>
      <p>
        Les biens loués doivent être restitués <strong>le dimanche</strong> (pour les locations week-end)
        aux heures d’ouverture du showroom.
      </p>
    </div>

    <!-- Article 6 -->
    <div class="article">
      <h3>Article 6 : Retard dans la restitution</h3>
      <p>En cas de retard, les pénalités suivantes s’appliquent :</p>
      <ul>
        <li>50&nbsp;€ par jour de retard et par robe invitée ;</li>
        <li>100&nbsp;€ par jour de retard et par robe mariée.</li>
      </ul>
      <p>
        Les biens doivent être restitués en parfait état. À défaut, des indemnités supplémentaires peuvent être appliquées.
      </p>
    </div>

    <!-- Article 7 -->
    <div class="article">
      <h3>Article 7 : Substitution</h3>
      <p>
        En cas d’impossibilité de fournir le bien réservé à la date souhaitée, ALLURE CREATION fournira un bien
        de même catégorie ou de qualité supérieure, sans frais supplémentaires.
      </p>
    </div>

    <!-- Article 8 -->
    <div class="article">
      <h3>Article 8 : Non-restitution de la housse ou du cintre</h3>
      <p>
        La non-restitution de la housse ou du cintre entraînera une indemnité forfaitaire de
        <strong>50&nbsp;€</strong>.
      </p>
    </div>

    ${signatureBlock}
  </div>
`;
    const defaultClauses = `
    <div class="section contract-clauses">
      <h2>Clauses contractuelles (autres)</h2>
      <div class="article">
        <h3>Article 1 – Objet</h3>
        <p>Location de tenues (robes, bijoux, accessoires) pour la durée convenue au contrat.</p>
      </div>
      <div class="article">
        <h3>Article 2 – Restitution</h3>
        <p>Les robes doivent être rendues propres et protégées dans leur housse.</p>
      </div>
      <div class="article">
        <h3>Article 3 – Retard</h3>
        <p>Pénalités de 50&nbsp;€ par jour et par robe invitée et 100&nbsp;€ par jour et par robe mariée.</p>
      </div>
      <div class="article">
        <h3>Article 4 – Responsabilité</h3>
        <p>En cas de perte ou de détérioration, la caution peut être retenue pour couvrir les réparations ou remplacements.</p>
      </div>
      <div class="article">
        <h3>Article 5 – Engagement</h3>
        <p>Le client confirme avoir lu et accepté les présentes conditions.</p>
      </div>
      ${signatureBlock}
    </div>
  `;
    const clausesSection = isForfaitJournalier ? forfaitJournalierClauses : isForfaitService ? forfaitClauses : defaultClauses;
    // 🔹 Prépare le HTML dynamique à partir du JSON
    const html = `
  <html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <title>Contrat ${contract.contract_number}</title>
    <style>
      body {
        font-family: 'Helvetica', sans-serif;
        background: #f9fafb;
        color: #111827;
        padding: 40px;
        font-size: 13px;
        line-height: 1.6;
      }
      h1, h2 {
        text-align: center;
        margin-bottom: 0;
      }
      h1 { font-size: 20px; margin-bottom: 6px; }
      h2 { font-size: 16px; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
      .section {
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 16px 24px;
        margin-top: 20px;
        page-break-inside: avoid;
      }
      .contract-clauses {
        page-break-before: always;
      }
      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .grid.grid-3 {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .info-grid {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .info-row {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px 24px;
      }
      .info-item {
        display: flex;
        flex-direction: column;
      }
      .label {
        font-size: 10px;
        color: #6b7280;
        text-transform: uppercase;
        font-weight: 600;
      }
      .value {
        font-size: 12px;
        color: #111827;
        margin-bottom: 8px;
      }
      .price-box {
        background: #eff6ff;
        border-radius: 8px;
        padding: 10px;
        text-align: center;
        font-weight: 600;
      }
      img {
        border-radius: 6px;
        width: 100px;
        height: auto;
      }
      .addon-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .addon-item {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 8px;
      }
      .addon-price {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .striked {
        text-decoration: line-through;
        color: #b91c1c;
      }
      .tag {
        background: #ecfccb;
        color: #4d7c0f;
        font-size: 10px;
        padding: 2px 8px;
        border-radius: 999px;
        text-transform: uppercase;
      }
      .tag-success {
        color: #15803d;
        background: #dcfce7;
        border: 1px solid #bbf7d0;
      }
      .contract-clauses h3  {
        margin-top: 14px;
        font-size: 13px;
      }
      .article {
        margin-top: 14px;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .signatures {
        margin-top: 20px;
      }
      .signature-grid {
        display: flex;
        justify-content: space-between;
        gap: 32px;
        flex-wrap: wrap;
      }
      table.dress-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 12px;
      }
      table.dress-table thead {
        background: #f3f4f6;
      }
      table.dress-table th {
        text-align: left;
        padding: 10px 12px;
        font-size: 11px;
        font-weight: 600;
        color: #374151;
        text-transform: uppercase;
        border-bottom: 2px solid #e5e7eb;
      }
      table.dress-table td {
        padding: 10px 12px;
        font-size: 12px;
        color: #111827;
        border-bottom: 1px solid #e5e7eb;
      }
      table.dress-table tbody tr:last-child td {
        border-bottom: none;
      }
      table.dress-table tbody tr:hover {
        background: #f9fafb;
      }
      @media print {
        .section,
        .article,
        .contract-clauses h3,
        .contract-clauses p,
        .contract-clauses ul,
        .contract-clauses li {
          page-break-inside: avoid;
          break-inside: avoid;
        }
      }
    </style>
  </head>
  <body>
    <h1>Contrat de ${contract.contract_type?.name || "location"}</h1>
    <p style="text-align:center;font-size:12px;color:#6b7280;">
      Contrat n° ${contract.contract_number} — ${new Date(contract.created_at).toLocaleString("fr-FR")}
    </p>

    <div class="section">
      <h2>Informations client</h2>
      <div class="info-grid">
        ${customerInfoRows
        .map((row) => `
        <div class="info-row">
          ${row
        .map(({ label, value }) => `
          <div class="info-item">
            <div class="label">${label}</div>
            <div class="value">${value}</div>
          </div>`)
        .join("")}
          ${row.length === 1 ? `<div class="info-item"></div>` : ""}
        </div>`)
        .join("")}
      </div>
    </div>

    <div class="section">
      <h2>Détails du contrat</h2>
      <div class="grid">
        <div>
          <div class="label">Type de contrat</div>
          <div class="value">${contract.contract_type?.name ?? "-"}</div>
          <div class="label">Méthode de paiement</div>
          <div class="value">${formatPaymentMethod(contract.deposit_payment_method)}</div>
        </div>
        <div>
          <div class="label">Période de location</div>
          <div class="value">${new Date(contract.start_datetime).toLocaleString("fr-FR")} — ${new Date(contract.end_datetime).toLocaleString("fr-FR")}</div>
          <div class="label">Date de création</div>
          <div class="value">${new Date(contract.created_at).toLocaleString("fr-FR")}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Récapitulatif financier</h2>
      <div class="grid grid-3">
        <div>
          <div class="label">Total TTC</div>
          <div class="price-box">${formatCurrency(contract.total_price_ttc)} € TTC</div>
        </div>
        <div>
          <div class="label">Acompte TTC</div>
          <div class="price-box">${formatCurrency(contract.account_ttc)} € TTC</div>
        </div>
        <div>
          <div class="label">Acompte réglé</div>
          <div class="price-box">${formatCurrency(contract.account_paid_ttc)} € TTC</div>
        </div>
      </div>
      <div class="grid grid-3" style="margin-top:16px;">
        <div>
          <div class="label">Caution TTC</div>
          <div class="price-box">${formatCurrency(contract.caution_ttc)} € TTC</div>
        </div>
        <div>
          <div class="label">Caution réglée</div>
          <div class="price-box">${formatCurrency(contract.caution_paid_ttc)} € TTC</div>
        </div>
        <div>
          <div class="label">Méthode de paiement</div>
          <div class="value">${formatPaymentMethod(contract.deposit_payment_method)}</div>
        </div>
      </div>
    </div>

    ${dresses.length ? `
    <div class="section">
      <h2>Robes incluses (${dresses.length})</h2>
      <table class="dress-table">
        <thead>
          <tr>
            <th>Nom de la robe</th>
            <th>Référence</th>
            <th>Prix journée TTC</th>
          </tr>
        </thead>
        <tbody>
          ${dresses
        .map((d) => `
          <tr>
            <td><strong>${d.dress?.name ?? "Robe"}</strong></td>
            <td>${d.dress?.reference ?? "-"}</td>
            <td>${formatCurrency(d.dress?.price_per_day_ttc ?? 0)} € TTC</td>
          </tr>`)
        .join("")}
        </tbody>
      </table>
    </div>` : ""}

    ${addonsSection}

    ${clausesSection}
  </body>
  </html>
  `;
    let browser = null;
    try {
        // 🖨️ Génération PDF via Puppeteer
        browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "load" });
        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "25mm", bottom: "25mm", left: "20mm", right: "20mm" },
        });
        // ☁️ Upload vers Hetzner
        const pdfKey = `contracts/${contractId}/signed_${Date.now()}.pdf`;
        await s3.send(new PutObjectCommand({
            Bucket: hetznerBucket,
            Key: pdfKey,
            Body: pdfBuffer,
            ContentType: "application/pdf",
        }));
        return `https://${hetznerBucket}.hel1.your-objectstorage.com/${pdfKey}`;
    }
    catch (err) {
        logger.error({ err }, "❌ Génération PDF Puppeteer impossible, bascule sur pdf-lib");
        if (browser) {
            await browser.close().catch(() => { });
            browser = null;
        }
        return generateContractPDFWithPdfLib(contract, options);
    }
    finally {
        if (browser) {
            await browser.close().catch(() => { });
        }
    }
}
//# sourceMappingURL=generateContractPDF.js.map