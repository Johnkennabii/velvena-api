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
    const normalizeTypeName = (value) => value ? value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
    const typeName = normalizeTypeName(contract.contract_type?.name);
    const isNegafa = typeName.includes("negafa");
    const isForfait = typeName.includes("forfait");
    const isJournalier = typeName.includes("Location par jour");
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
        y -= 8;
        drawText("Entre les soussignés :", 11, true);
        drawText("La société ALLURE CRÉATION, SAS immatriculée sous le n° 985 287 880 0014, sise 4 avenue Laurent Cély, 92600 Asnières-sur-Seine, représentée par Madame Hassna NAFILI en qualité de gérante, ci-après dénommée « le Prestataire »,");
        drawText("Et le Client, ci-après dénommé « la Cliente », identifié(e) dans le présent contrat.");
        y -= 8;
        drawText("Article 1 – Objet du contrat", 11, true);
        drawText("Le contrat encadre une prestation de préparation, habillage, accompagnement et location de tenues traditionnelles fournie pour un événement personnel (mariage, fiançailles, cérémonie).");
        y -= 8;
        drawText("Article 2 – Description de la prestation", 11, true);
        drawText("1. Essayage et sélection des tenues au showroom ALLURE CRÉATION.");
        drawText("2. Location des tenues traditionnelles, accessoires et parures.");
        drawText("3. Habillage et préparation de la mariée sur place le jour J.");
        drawText("4. Accompagnement, changements de tenues et présence continue dans la limite définie ci-après.");
        y -= 8;
        drawText("Article 3 – Durée de la prestation", 11, true);
        drawText("La prestation est limitée à sept (7) heures consécutives (ex. 19h00 – 2h00). Toute heure supplémentaire entamée est facturée 150 € TTC.");
        y -= 8;
        drawText("Article 4 – Mise à disposition d'un espace sécurisé", 11, true);
        drawText("La Cliente fournit une loge ou un local sécurisé, fermé par clé ou code, dédié au stockage du matériel et aux préparatifs.");
        drawText("1. Aucun objet personnel ou de valeur de la Cliente/invités ne doit y être déposé.");
        drawText("2. ALLURE CRÉATION décline toute responsabilité en cas de perte, vol ou détérioration de biens tiers.");
        drawText("3. Seule la négafa dispose de la clé ou du dispositif d'ouverture durant la prestation.");
        drawText("4. La loge est strictement réservée à la Mariée et à la Prestataire.");
        drawText("5. Le repas de la négafa est à la charge de la Cliente.");
        y -= 8;
        drawText("Article 5 – Conditions financières", 11, true);
        drawText("• Les tarifs appliqués correspondent au forfait sélectionné par la Cliente.");
        drawText("• Un acompte de 50 % est exigé à la signature du contrat.");
        drawText("• Le solde est payable à la remise des tenues.");
        drawText("Tout retard de paiement peut entraîner suspension ou annulation de la prestation, sans indemnité.");
        y -= 8;
        drawText("Article 6 – Caution", 11, true);
        drawText("Une caution est obligatoire pour toute location. Elle est restituée après vérification de l'état du matériel. Toute perte, détérioration, brûlure, tâche irréversible ou dommage est déduite de la caution, sans préjudice d'une facturation complémentaire.");
        y -= 8;
        drawText("Article 7 – Substitution", 11, true);
        drawText("En cas d'impossibilité de fournir le bien réservé pour une raison indépendante de la volonté du Prestataire, un bien de catégorie équivalente ou supérieure est proposé sans frais additionnels. Cette substitution n'est pas un manquement contractuel.");
        y -= 8;
        drawText("Article 8 – Annulation", 11, true);
        drawText("En cas d'annulation par la Cliente, l'acompte demeure acquis, sauf cas de force majeure dûment justifié. Toute demande doit être formulée par écrit.");
        y -= 8;
        drawText("Article 9 – Engagement et signature", 11, true);
        drawText("• La Cliente atteste avoir lu et accepté les conditions générales et particulières.");
        drawText("• L'acceptation électronique vaut signature manuscrite conformément à l'article 1367 du Code civil.");
    }
    else if (isForfaitJournalier) {
        drawSubtitle("Clauses contractuelles – Forfait Journalier");
        y -= 8;
        drawText("Entre les soussignés :", 11, true);
        drawText("La société ALLURE CRÉATION, Société par actions simplifiée (SAS) immatriculée au registre du commerce et des sociétés sous le numéro 9852878800014, ayant son siège social au 4 avenue Laurent Cély 92600 Asnières-sur-Seine, représentée par Madame Hassna NAFILI en qualité de gérante, ci-après dénommée « le Prestataire » ALLURE CREATION.");
        drawText("Et le Client, ci-après dénommé « la Cliente », identifié(e) dans le présent contrat.");
        drawText("Il a alors été convenu ce qui suit :");
        y -= 8;
        drawText("Article 1 – Description", 11, true);
        drawText("Ce contrat a pour objet de définir les modalités selon lesquelles le Prestataire fournit à ses clientes un ensemble de services liés à la tenue de manifestations festives (mariage, fiançailles, cérémonies).");
        drawText("Les prestations incluent notamment :");
        drawText("• Location des robes mariée, bijoux et accessoires (voiles, jupons) ;");
        drawText("• Location des robes invitées.");
        y -= 8;
        drawText("Article 2 – Conditions financières et caution", 11, true);
        drawText("Un acompte de 50 % du montant total doit être versé par la Cliente le jour de la signature du contrat.");
        drawText("Le solde est payable le jour de la récupération de la robe, accompagné d'une caution.");
        drawText("Nous insistons sur le fait que l’intégralité du paiement doit être effectuée selon ces conditions ; à défaut, la location n’aura pas lieu.");
        drawText("ATTENTION : Seules les cautions en empreinte CB ou en espèces sont acceptées (aucun chèque).");
        y -= 8;
        drawText("Article 3 – Résiliation – Annulation", 11, true);
        drawText("Les contrats sont fermes et définitifs dès leur signature.");
        drawText("Le présent contrat n’entre pas dans le champ d’application de la loi de rétractation L212-20 du Code de la Consommation.");
        drawText("L’acompte de 50 % est définitivement acquis au Prestataire en cas d’annulation par la Cliente.");
        drawText("La responsabilité du Prestataire ne pourra être engagée en cas de retard ou de défaillance dû à un cas de force majeure au sens de la jurisprudence de la Cour de cassation.");
        y -= 8;
        drawText("Article 4 – Responsabilité des parties", 11, true);
        drawText("En cas de perte, dégât ou vol d’un bien loué :");
        drawText("• La caution bancaire sera conservée si le bien est abîmé (trou, tâche, brûlure, déchirure) ;");
        drawText("• Si le bien est réparable, le montant des retouches sera déduit de la caution ;");
        drawText("• Si une robe ou un accessoire est endommagé, égaré ou volé, le Prestataire se réserve le droit d’exiger le prix d’achat du bien.");
        drawText("Les parties conviennent de n’être responsables d’aucun dommage résultant d’un cas de force majeure conformément à la jurisprudence française.");
        y -= 8;
        drawText("Article 5 – Restitution", 11, true);
        drawText("Le bien loué doit impérativement être restitué le dimanche (pour les locations du week-end) aux heures d’ouverture du Prestataire.");
        y -= 8;
        drawText("Article 6 – Retard de restitution", 11, true);
        drawText("En cas de retard dans la restitution du bien, les indemnités suivantes s’appliquent :");
        drawText("• 50 € par jour de retard et par robe invitée ;");
        drawText("• 100 € par jour de retard et par robe mariée.");
        drawText("Le client s’engage à restituer les fournitures en parfait état et dans les délais convenus. À défaut, une indemnité complémentaire pourra être facturée.");
        y -= 8;
        drawText("Article 7 – Substitution", 11, true);
        drawText("En cas d’impossibilité de fournir le bien réservé à la date souhaitée, ALLURE CREATION fournira un bien de même catégorie ou de qualité supérieure, sans frais supplémentaires.");
        y -= 8;
        drawText("Article 8 – Non-restitution des accessoires", 11, true);
        drawText("En cas de non-restitution de la housse ou du cintre, une indemnité forfaitaire de 50 € sera exigée du locataire.");
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
    if (includeSignatureBlock) {
        // Signature manuelle
        drawText(`Fait à Asnières-sur-Seine le ${formattedContractCreatedDate}`, 10);
        drawText("Signature client « Lu & approuvé »", 10);
        drawText("Signature prestataire « Lu & approuvé »", 10);
    }
    else if (contract.signed_at) {
        // Signature électronique avec métadonnées
        drawText("Signé électroniquement conformément à l'article 1367 du Code civil.", 10, true);
        y -= 5;
        const customerFullName = [contract.customer?.firstname, contract.customer?.lastname]
            .filter(Boolean)
            .join(" ") || "Client";
        const signedDate = contract.signed_at
            ? new Date(contract.signed_at).toLocaleString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            })
            : "Date inconnue";
        drawText(`Signé électroniquement par : ${customerFullName}`, 9);
        drawText(`Adresse e-mail : ${contract.customer?.email || "Non renseignée"}`, 9);
        drawText(`Date et heure de signature : ${signedDate}`, 9);
        drawText(`Localisation de la signature : ${contract.signature_location || "Non disponible"}`, 9);
        drawText(`Adresse IP : ${contract.signature_ip || "Non disponible"}`, 9);
        drawText(`Référence unique de signature : ${contract.signature_reference || "Non disponible"}`, 9);
    }
    else {
        // Pas encore signé
        drawText("Signé électroniquement conformément à l'article 1367 du Code civil.", 10);
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