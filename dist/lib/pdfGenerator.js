import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3, hetznerBucket } from "./hetzner.js";
export async function generateContractPDFWithPdfLib(contract, options = {}) {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // Format A4 portrait
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const marginX = 60;
    const marginTop = 780;
    const lineWidth = 475; // Largeur utilisable (A4 - marges)
    let y = marginTop;
    const drawText = (text, size = 11, boldText = false, spacing = 16) => {
        const usedFont = boldText ? bold : font;
        const wrapped = wrapText(text, size, usedFont, lineWidth);
        for (const line of wrapped) {
            if (y < 60)
                addPage();
            page.drawText(line, { x: marginX, y, size, font: usedFont, color: rgb(0, 0, 0) });
            y -= spacing;
        }
    };
    const drawTitle = (text) => {
        if (y < 70)
            addPage();
        page.drawText(text, { x: marginX, y, size: 14, font: bold, color: rgb(0, 0, 0) });
        y -= 22;
    };
    const drawSubtitle = (text) => {
        drawText(text, 12, true, 18);
    };
    const drawLine = () => {
        page.drawLine({
            start: { x: marginX, y },
            end: { x: marginX + lineWidth, y },
            thickness: 0.5,
            color: rgb(0.8, 0.8, 0.8),
        });
        y -= 15;
    };
    const addPage = () => {
        const newPage = pdfDoc.addPage([595, 842]);
        y = marginTop;
        return newPage;
    };
    const wrapText = (text, fontSize, fontType, maxWidth) => {
        const words = text.split(" ");
        const lines = [];
        let currentLine = "";
        for (const word of words) {
            const width = fontType.widthOfTextAtSize(currentLine + word + " ", fontSize);
            if (width > maxWidth && currentLine) {
                lines.push(currentLine.trim());
                currentLine = word + " ";
            }
            else {
                currentLine += word + " ";
            }
        }
        if (currentLine)
            lines.push(currentLine.trim());
        return lines;
    };
    const drawAddonRow = (name, priceLabel, strike = false) => {
        if (y < 70)
            addPage();
        const priceX = marginX + 320;
        page.drawText(`• ${name}`, { x: marginX, y, size: 11, font });
        page.drawText(priceLabel, { x: priceX, y, size: 11, font });
        if (strike) {
            const width = font.widthOfTextAtSize(priceLabel, 11);
            page.drawLine({
                start: { x: priceX, y: y + 6 },
                end: { x: priceX + width, y: y + 6 },
                thickness: 0.8,
                color: rgb(0.75, 0.24, 0.24),
            });
            page.drawText("Inclus au forfait", { x: priceX, y: y - 12, size: 10, font });
            y -= 12;
        }
        y -= 16;
    };
    // -----------------------
    // 🏷️ En-tête société
    // -----------------------
    drawText("ALLURE CRÉATION", 16, true, 22);
    drawText("4 avenue Laurent Cély, 92600 Asnières-sur-Seine", 10);
    drawText("SAS - RCS 9852878800014", 10);
    y -= 20;
    drawLine();
    const formatCurrency = (value) => {
        const numeric = Number(value ?? 0);
        if (Number.isNaN(numeric))
            return "0,00";
        return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numeric);
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
    const typeName = contract.contract_type?.name?.toLowerCase() ?? "";
    const isNegafa = typeName.includes("negafa");
    const isForfait = typeName.includes("forfait");
    const isJournalier = typeName.includes("journalier");
    const isForfaitService = isNegafa || (isForfait && !isJournalier);
    const isForfaitJournalier = isForfait && isJournalier;
    const packageAddonIds = new Set((contract.package?.addons ?? [])
        .map((pkgAddon) => pkgAddon?.addon_id ?? pkgAddon?.addon?.id)
        .filter(Boolean));
    const addons = Array.isArray(contract.addon_links) ? contract.addon_links.filter((link) => link?.addon) : [];
    const includeSignatureBlock = options.includeSignatureBlock ?? false;
    const contractCreatedAt = contract.created_at ? new Date(contract.created_at) : null;
    const formattedContractCreatedDate = contractCreatedAt
        ? contractCreatedAt.toLocaleDateString("fr-FR")
        : "…………………………..";
    if (isForfaitService) {
        drawTitle("CONTRAT DE PRESTATION « NÉGAFA »");
    }
    else if (isForfaitJournalier) {
        drawTitle("CONTRAT DE LOCATION FORFAIT JOURNALIER");
    }
    else {
        drawTitle("CONTRAT DE LOCATION DE ROBES");
    }
    drawText(`Contrat n° ${contract.contract_number}`, 10);
    drawText(`Signé électroniquement le ${new Date().toLocaleString("fr-FR")}`, 10);
    y -= 10;
    drawLine();
    // -----------------------
    // 👩‍💼 Informations client
    // -----------------------
    drawSubtitle("Informations client");
    drawText(`Nom complet : ${contract.customer.firstname} ${contract.customer.lastname}`);
    drawText(`Email : ${contract.customer.email ?? "-"}`);
    drawText(`Téléphone : ${contract.customer.phone ?? "-"}`);
    drawText(`Adresse : ${contract.customer.address ?? "-"}, ${contract.customer.postal_code ?? ""} ${contract.customer.city ?? ""}`);
    drawText(`Pays : ${contract.customer.country ?? "-"}`);
    y -= 8;
    drawLine();
    // -----------------------
    // 📅 Détails du contrat
    // -----------------------
    drawSubtitle("Détails du contrat");
    drawText(`Type de contrat : ${contract.contract_type?.name ?? "-"}`);
    drawText(`Période : du ${new Date(contract.start_datetime).toLocaleDateString("fr-FR")} au ${new Date(contract.end_datetime).toLocaleDateString("fr-FR")}`);
    drawText(`Méthode de paiement : ${formatPaymentMethod(contract.deposit_payment_method)}`);
    drawText(`Créé le : ${new Date(contract.created_at).toLocaleDateString("fr-FR")}`);
    y -= 8;
    drawLine();
    // -----------------------
    // 💰 Montants financiers
    // -----------------------
    drawSubtitle("Récapitulatif financier");
    drawText(`Total TTC : ${formatCurrency(contract.total_price_ttc)} €`);
    drawText(`Acompte TTC : ${formatCurrency(contract.account_ttc)} € — Réglé : ${formatCurrency(contract.account_paid_ttc)} €`);
    drawText(`Caution TTC : ${formatCurrency(contract.caution_ttc)} € — Réglée : ${formatCurrency(contract.caution_paid_ttc)} €`);
    y -= 8;
    drawLine();
    // -----------------------
    // 👗 Robes incluses
    // -----------------------
    if (contract.dresses && contract.dresses.length > 0) {
        drawSubtitle(`Robes incluses (${contract.dresses.length})`);
        for (const d of contract.dresses) {
            drawText(`• ${d.dress?.name ?? "Robe"} (${d.dress?.reference ?? "-"}) – ${formatCurrency(d.dress?.price_per_day_ttc ?? 0)} € TTC`);
        }
        y -= 8;
        drawLine();
    }
    if (addons.length > 0) {
        drawSubtitle(`Options & addons (${addons.length})`);
        addons.forEach(({ addon }) => {
            const includedViaPackage = packageAddonIds.has(addon.id) && (isForfaitService || isForfaitJournalier);
            const priceLabel = `${formatCurrency(addon.price_ttc)} € TTC`;
            drawAddonRow(addon.name ?? "Option", priceLabel, includedViaPackage);
            const addonDescription = typeof addon.description === "string" && addon.description.trim().length > 0 ? addon.description.trim() : "";
            if (addonDescription) {
                drawText(`   ${addonDescription}`, 10, false, 14);
            }
        });
        y -= 8;
        drawLine();
    }
    // -----------------------
    // 📜 Clauses du contrat
    // -----------------------
    if (isForfaitService) {
        drawSubtitle("Clauses contractuelles – Prestation Négafa");
        drawText("Entre ALLURE CRÉATION (SAS 9852878800014) représentée par Madame Hassna NAFILI et la Cliente identifiée au présent contrat, il est convenu ce qui suit :");
        drawText("Article 1 – Objet : la prestation couvre la préparation, l’habillage, l’accompagnement et la location de tenues traditionnelles dans le cadre d’un événement personnel.");
        drawText("Article 2 – Description : essayage et sélection au showroom, location des tenues/accessoires, habillage le jour J par la négafa ou son assistante et accompagnement pour les changements.");
        drawText("Article 3 – Durée : limitée à sept (7) heures consécutives, par exemple 19h00–2h00; toute heure entamée au-delà est facturée 150 € TTC.");
        drawText("Article 4 – Espace sécurisé : la Cliente met une loge fermée à clé/code réservée au matériel et aux préparatifs; aucun objet personnel n’y est stocké, seule la négafa dispose des accès et le repas de la négafa est à la charge de la Cliente.");
        drawText("Article 5 – Conditions financières : la facturation suit le forfait choisi, acompte de 50 % à la signature, solde à la remise des tenues; un retard de paiement peut suspendre ou annuler la prestation sans indemnité.");
        drawText("Article 6 – Caution : demandée pour chaque location et restituée après vérification; pertes, vols, brûlures, tâches irréversibles ou détériorations sont déduits de la caution, avec facturation complémentaire possible.");
        drawText("Article 7 – Substitution : en cas d’indisponibilité indépendante de la volonté du Prestataire, un bien de catégorie équivalente ou supérieure est fourni sans frais additionnels, sans constituer un manquement contractuel.");
        drawText("Article 8 – Annulation : l’acompte reste acquis au Prestataire, sauf force majeure justifiée; toute demande doit être formulée par écrit.");
        drawText("Article 9 – Engagement : la Cliente reconnaît avoir pris connaissance des conditions et accepte qu’une validation électronique vaille signature manuscrite conformément à l’article 1367 du Code civil.");
    }
    else if (isForfaitJournalier) {
        drawSubtitle("Clauses contractuelles – Forfait journalier");
        drawText("Article 1 – Description : location robes mariée / invitées, bijoux et accessoires.");
        drawText("Article 2 – Finances & caution : acompte 50% à la signature, solde au retrait + caution (CB ou espèces).");
        drawText("Article 3 – Résiliation : contrats fermes, acompte acquis, seule la force majeure s’applique.");
        drawText("Article 4 – Responsabilité : perte, dégât ou vol imputés sur la caution ou facturés au prix d’achat.");
        drawText("Article 5 – Restitution : retour le dimanche (locations week-end) aux heures d’ouverture.");
        drawText("Article 6 – Retard : 50 € / jour / robe invitée et 100 € / jour / robe mariée.");
        drawText("Article 7 – Substitution : bien équivalent ou supérieur si indisponibilité.");
        drawText("Article 8 – Housse / cintre : indemnité 50 € en cas de non-restitution.");
    }
    else {
        drawSubtitle("Clauses contractuelles");
        drawText("Article 1 – Objet : location de tenues (robes, bijoux, accessoires) pour la durée convenue.");
        drawText("Article 2 – Restitution : tenues propres, complètes et rendues dans leur housse.");
        drawText("Article 3 – Retard : 50 € / jour / robe invitée, 100 € / jour / robe mariée.");
        drawText("Article 4 – Responsabilité : caution retenue en cas de perte ou détérioration.");
        drawText("Article 5 – Engagement : le client accepte les présentes conditions sans réserve.");
    }
    y -= 25;
    drawLine();
    drawText("Signé électroniquement conformément à l’article 1367 du Code civil.", 10);
    if (includeSignatureBlock) {
        drawText(`Fait à Asnières-sur-Seine le ${formattedContractCreatedDate}`, 10);
        drawText("Signature client « Lu & approuvé »", 10);
        drawText("Signature prestataire « Lu & approuvé »", 10);
    }
    // -----------------------
    // ☁️ Upload vers Hetzner
    // -----------------------
    const pdfBytes = await pdfDoc.save();
    const pdfKey = `contracts/${contract.id}/signed_${Date.now()}.pdf`;
    await s3.send(new PutObjectCommand({
        Bucket: hetznerBucket,
        Key: pdfKey,
        Body: Buffer.from(pdfBytes),
        ContentType: "application/pdf",
    }));
    return `https://${hetznerBucket}.hel1.your-objectstorage.com/${pdfKey}`;
}
//# sourceMappingURL=pdfGenerator.js.map