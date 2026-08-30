const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

// ---- Marque PHOTART IMPRIM ----
const NAVY = rgb(0x0b / 255, 0x1f / 255, 0x4e / 255);
const ORANGE = rgb(0xe8 / 255, 0x72 / 255, 0x0c / 255);
const INK = rgb(0x1a / 255, 0x1a / 255, 0x1a / 255);
const WHITE = rgb(1, 1, 1);
const GRAY = rgb(0.35, 0.33, 0.31);

const COMPANY = {
  address: "BP/2588 Bamako Magnambougou, République du Mali",
  tel: "(+223) 20 20 61 17",
  mobile: "(+223) 72 41 85 51",
  email: "sanousidibe01@gmail.com",
  rc: "07158",
  nif: "08610358J",
  compte: "6765462040172581 BNDA",
};

function fmtFCFA(n) {
  if (n === null || n === undefined || isNaN(n)) return "À confirmer";
  return Math.round(n).toLocaleString("fr-FR") + " FCFA";
}

async function buildDocument({ title, numero, client, product, details, unitPrice, note }) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 en points
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const reg = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const italic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  drawDocumentPage(page, { bold, reg, italic }, { title, numero, client, product, details, unitPrice, note });
  return pdfDoc.save();
}

// Crée un seul PDF contenant les 2 documents (bon de commande + facture proforma),
// une page chacun — pratique pour un téléchargement direct en un seul fichier.
async function buildCombinedDocument({ numero, client, product, details, unitPrice, noteBonCommande, noteFacture }) {
  const pdfDoc = await PDFDocument.create();
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const reg = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const italic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const fonts = { bold, reg, italic };

  const page1 = pdfDoc.addPage([595.28, 841.89]);
  drawDocumentPage(page1, fonts, {
    title: "BON DE COMMANDE",
    numero, client, product, details, unitPrice,
    note: noteBonCommande,
  });

  const page2 = pdfDoc.addPage([595.28, 841.89]);
  drawDocumentPage(page2, fonts, {
    title: "FACTURE PROFORMA",
    numero, client, product, details, unitPrice,
    note: noteFacture,
  });

  return pdfDoc.save();
}

function drawDocumentPage(page, { bold, reg, italic }, { title, numero, client, product, details, unitPrice, note }) {
  let y = 800;

  // En-tête société
  page.drawText("PHOT", { x: 40, y, size: 24, font: bold, color: INK });
  page.drawText("ARTS", { x: 40 + bold.widthOfTextAtSize("PHOT", 24), y, size: 24, font: bold, color: ORANGE });
  page.drawText("La finition c'est notre passion", { x: 40, y: y - 18, size: 9, font: italic, color: NAVY });
  page.drawText(COMPANY.address, { x: 40, y: y - 34, size: 8.5, font: reg, color: INK });
  page.drawText(`Tél : ${COMPANY.tel}  /  Mobile-WhatsApp : ${COMPANY.mobile}`, { x: 40, y: y - 46, size: 8.5, font: reg, color: INK });
  page.drawText(`Email : ${COMPANY.email}`, { x: 40, y: y - 58, size: 8.5, font: reg, color: INK });
  page.drawText(`RC : ${COMPANY.rc}   N° Fiscal : ${COMPANY.nif}`, { x: 40, y: y - 70, size: 8.5, font: reg, color: INK });

  page.drawLine({ start: { x: 40, y: y - 82 }, end: { x: 555, y: y - 82 }, thickness: 2, color: ORANGE });

  y -= 115;
  page.drawText(title, { x: 40, y, size: 22, font: bold, color: NAVY });
  page.drawText(`N° ${numero}`, { x: 400, y: y + 4, size: 13, font: bold, color: ORANGE });
  page.drawText(`Date : ${new Date().toLocaleDateString("fr-FR")}`, { x: 400, y: y - 14, size: 10, font: reg, color: INK });

  y -= 45;
  page.drawText(`Doit / Client : ${client.name}`, { x: 40, y, size: 12, font: bold, color: INK });
  y -= 16;
  page.drawText(`Téléphone : ${client.phone || "-"}`, { x: 40, y, size: 10, font: reg, color: INK });
  y -= 14;
  page.drawText(`Email : ${client.email || "-"}`, { x: 40, y, size: 10, font: reg, color: INK });

  y -= 30;
  // Table
  page.drawRectangle({ x: 40, y: y - 6, width: 515, height: 22, color: NAVY });
  page.drawText("Désignation", { x: 46, y: y, size: 10, font: bold, color: WHITE });
  page.drawText("P.U.", { x: 420, y: y, size: 10, font: bold, color: WHITE });
  page.drawText("Montant", { x: 480, y: y, size: 10, font: bold, color: WHITE });
  y -= 26;

  const designation = product + (details ? ` — ${details}` : "");
  const lines = wrapText(designation, reg, 10, 360);
  lines.forEach((line, i) => {
    page.drawText(line, { x: 46, y: y - i * 13, size: 10, font: reg, color: INK });
  });
  page.drawText(fmtFCFA(unitPrice), { x: 420, y, size: 10, font: reg, color: INK });
  page.drawText(fmtFCFA(unitPrice), { x: 480, y, size: 10, font: reg, color: INK });
  y -= Math.max(lines.length * 13, 16) + 10;

  page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
  y -= 24;
  page.drawText("TOTAL", { x: 420, y, size: 12, font: bold, color: INK });
  page.drawText(fmtFCFA(unitPrice), { x: 480, y, size: 12, font: bold, color: ORANGE });

  y -= 50;
  if (note) {
    const noteLines = wrapText(note, italic, 8.5, 515);
    noteLines.forEach((line, i) => {
      page.drawText(line, { x: 40, y: y - i * 12, size: 8.5, font: italic, color: GRAY });
    });
  }
}

function wrapText(text, font, size, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const w of words) {
    const test = current ? current + " " + w : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
      lines.push(current);
      current = w;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

exports.handler = async function (event) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Méthode non autorisée" }) };
  }

  try {
    const data = JSON.parse(event.body || "{}");
    // mode : "email" (par défaut), "whatsapp" ou "download"
    const { name, email, phone, product, details, unitPrice, mode } = data;
    const deliveryMode = mode || "email";

    // Pour whatsapp et download, l'email n'est pas obligatoire
    if (!name) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Le nom est requis." }) };
    }
    if (deliveryMode === "email" && !email) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Email requis pour ce mode d'envoi." }) };
    }

    const numero = String(Date.now()).slice(-6);
    const client = { name, phone, email };

    const NOTE_BON_COMMANDE = "En validant cette commande, le client reconnaît avoir pris connaissance des conditions de travail de PHOTART IMPRIM (brief, retouches, délais, validation avant impression, paiement) et les accepte sans réserve. Le prix indiqué est une estimation et peut varier selon les conditions et termes de travail définis avec le client.";
    const NOTE_FACTURE = "Ce document est un devis estimatif et ne constitue pas une facture définitive. Le prix final peut varier selon les conditions et termes de travail définis avec le client. Validité 15 jours. Paiement : Orange Money, Wave, Moov Money, ou virement bancaire N° " + COMPANY.compte + ".";

    const toBase64 = (bytes) => Buffer.from(bytes).toString("base64");

    // ---- MODE TÉLÉCHARGEMENT : un seul PDF (2 pages) pour éviter le blocage
    // par le navigateur des téléchargements multiples automatiques ----
    if (deliveryMode === "download") {
      const combinedBytes = await buildCombinedDocument({
        numero,
        client,
        product: product || "Demande de devis",
        details,
        unitPrice: unitPrice || null,
        noteBonCommande: NOTE_BON_COMMANDE,
        noteFacture: NOTE_FACTURE,
      });
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          numero,
          files: [
            { filename: "PHOTART_IMPRIM_Bon_de_commande_et_facture.pdf", content: toBase64(combinedBytes) },
          ],
        }),
      };
    }

    const bonCommandeBytes = await buildDocument({
      title: "BON DE COMMANDE",
      numero,
      client,
      product: product || "Demande de devis",
      details,
      unitPrice: unitPrice || null,
      note: NOTE_BON_COMMANDE,
    });

    const factureProformaBytes = await buildDocument({
      title: "FACTURE PROFORMA",
      numero,
      client,
      product: product || "Demande de devis",
      details,
      unitPrice: unitPrice || null,
      note: NOTE_FACTURE,
    });

    // ---- MODE WHATSAPP : pas d'envoi automatique de PDF (limitation WhatsApp),
    // on renvoie juste un lien wa.me pré-rempli vers le numéro de l'entreprise ----
    if (deliveryMode === "whatsapp") {
      const msg =
        `Bonjour PHOTART IMPRIM, je souhaite une commande :\n` +
        `Nom : ${name}\n` +
        (phone ? `Téléphone : ${phone}\n` : "") +
        `Produit : ${product || "Demande de devis"}\n` +
        (details ? `Détails : ${details}\n` : "") +
        `N° de référence : ${numero}`;

      const waNumber = COMPANY.mobile.replace(/[^\d]/g, ""); // garde uniquement les chiffres
      const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, numero, whatsappUrl: waLink }),
      };
    }

    // ---- MODE EMAIL (comportement d'origine) ----
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Service email non configuré (clé API manquante)." }),
      };
    }

    const emailPayload = {
      from: process.env.RESEND_FROM || "PHOTART IMPRIM <onboarding@resend.dev>",
      to: [email],
      bcc: [COMPANY.email],
      subject: `Votre bon de commande & facture proforma — PHOTART IMPRIM`,
      html: `<p>Bonjour ${name},</p>
        <p>Merci pour votre demande auprès de <strong>PHOTART IMPRIM</strong>. Vous trouverez ci-joint :</p>
        <ul><li>Votre bon de commande</li><li>Votre facture proforma</li></ul>
        <p>Un membre de notre équipe vous recontactera rapidement pour confirmer les détails et le prix définitif.</p>
        <p>À bientôt,<br>PHOTART IMPRIM — La finition c'est notre passion</p>`,
      attachments: [
        { filename: "Bon_de_commande.pdf", content: toBase64(bonCommandeBytes) },
        { filename: "Facture_proforma.pdf", content: toBase64(factureProformaBytes) },
      ],
    };

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailPayload),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return { statusCode: 502, headers, body: JSON.stringify({ error: "Échec de l'envoi email", details: errText }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, numero }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
