import type { ShipmentDocumentData } from "@/lib/documents/types";

function escapeHtml(s: string): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDateFr(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR");
  } catch {
    return iso;
  }
}

function money(amount: number): string {
  return `${amount.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} EUROS`;
}

/**
 * Invoice HTML matching the AUTO TRANSIT 3N Word template
 * (expéditeur / destinataire, véhicule, règlements, totaux).
 */
export function buildAutoTransitInvoiceHtml(data: ShipmentDocumentData): string {
  const paidTotal = data.payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, data.shippingCost - paidTotal);

  // Règlement rows — dynamic payments, padded to keep the template's fixed shape.
  const reglementRows: string[] = data.payments.map(
    (p) => `
            <tr>
              <td>${escapeHtml(formatDateFr(p.paidAt))}</td>
              <td class="num">${escapeHtml(String(p.amount))}</td>
              <td></td>
              <td>${escapeHtml(p.reason || p.notes || "")}</td>
              <td class="num">${escapeHtml(String(p.amount))}</td>
            </tr>`,
  );
  while (reglementRows.length < 3) {
    reglementRows.push(
      `            <tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>`,
    );
  }

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Facture - ${escapeHtml(data.invoiceNumber)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: "Times New Roman", Times, serif;
      margin: 0;
      padding: 32px 40px;
      color: #000;
      font-size: 14px;
      line-height: 1.45;
    }
    .doc { max-width: 900px; margin: 0 auto; }

    .brand { text-align: center; margin-bottom: 10px; }
    .brand .title {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 46px;
      font-weight: 900;
      letter-spacing: 0.01em;
      text-transform: uppercase;
      line-height: 1;
      margin: 0;
    }
    .brand .tagline { margin: 16px 0 0; font-size: 14px; }
    .brand .slogan {
      margin: 8px 0 0;
      font-size: 20px;
      font-weight: 700;
    }

    .meta {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 24px;
      margin: 14px 0 8px;
      font-size: 15px;
    }

    table.box { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
    table.box td, table.box th {
      border: 1px solid #000;
      padding: 6px 8px;
      vertical-align: top;
      font-size: 14px;
    }
    table.box th {
      text-align: center;
      font-weight: 700;
      text-transform: uppercase;
    }
    .party-line { margin: 8px 0; }
    .spacer td { height: 14px; }
    .vehicle-cell div { margin: 2px 0; }
    .valeur { font-weight: 700; text-transform: uppercase; }

    table.reglement td, table.reglement th { text-align: center; height: 26px; }
    table.reglement .num { text-align: right; font-variant-numeric: tabular-nums; }
    table.reglement .rgmt { font-weight: 700; }
    table.reglement .lbl { font-weight: 700; }

    table.obs td { border: 1px solid #000; padding: 8px 10px; font-size: 12px; text-align: justify; }
    .obs-title { text-align: center; font-weight: 700; font-size: 14px; margin-bottom: 4px; }

    .footer {
      margin-top: 22px;
      text-align: center;
      font-size: 11px;
      line-height: 1.5;
    }

    @media print {
      body { padding: 0; }
      .doc { max-width: none; }
    }
  </style>
</head>
<body>
  <div class="doc">
    <div class="brand">
      <p class="title">${escapeHtml(data.companyName?.trim() || "AUTO TRANSIT 3N")}</p>
      <p class="tagline">Spécialiste de l'envoi&nbsp;&nbsp;&nbsp;&nbsp;de véhicules vers l'Afrique</p>
      <p class="slogan">LE MEILLEUR SERVICE A PRIX COMPETITIF</p>
    </div>

    <div class="meta">
      <div>FACTURE N° : ${escapeHtml(data.invoiceNumber)}</div>
      <div>Date&nbsp;&nbsp;${escapeHtml(formatDateFr(data.issuedAt))}</div>
    </div>

    <table class="box">
      <thead>
        <tr>
          <th style="width:50%">Expéditeur</th>
          <th style="width:50%">Destinateur</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div class="party-line">Nom et Prénom: <strong>${escapeHtml(data.sender.name)}</strong></div>
            <div class="party-line">Adresse : ${escapeHtml(data.sender.address)}</div>
            <div class="party-line">Ville : ${escapeHtml([data.sender.zipCode, data.sender.city].filter(Boolean).join(" "))}</div>
            <div class="party-line">Pays : ${escapeHtml(data.sender.country)}</div>
            <div class="party-line">Téléphone : ${escapeHtml(data.sender.phone)}</div>
          </td>
          <td>
            <div class="party-line">Nom et Prénom: <strong>${escapeHtml(data.receiver.name)}</strong></div>
            <div class="party-line">Adresse : ${escapeHtml(data.receiver.address)}</div>
            <div class="party-line">Code Post : ${escapeHtml(data.receiver.zipCode || "")}</div>
            <div class="party-line">Ville : ${escapeHtml(data.receiver.city)}</div>
            <div class="party-line">Pays : ${escapeHtml(data.receiver.country)}</div>
            <div class="party-line">Téléphone : ${escapeHtml(data.receiver.phone)}</div>
          </td>
        </tr>
        <tr class="spacer"><td></td><td></td></tr>
        <tr>
          <td class="vehicle-cell">
            <div>-IMMAT: ${escapeHtml(data.registrationNumber || "")}</div>
            <div>&nbsp;-MARQUE : ${escapeHtml(data.itemName)}</div>
            <div>-CHASSIS : ${escapeHtml(data.chassisNumber)}</div>
          </td>
          <td></td>
        </tr>
        <tr>
          <td colspan="2" class="valeur">VALEUR D ACHAT : ${escapeHtml(data.purchaseValue || "")}</td>
        </tr>
      </tbody>
    </table>

    <table class="box reglement">
      <tbody>
        <tr>
          <td colspan="2"></td>
          <td class="rgmt">Règlement</td>
          <td colspan="2"></td>
        </tr>
        <tr>
          <td style="width:18%">Date</td>
          <td style="width:20%">Prix transport</td>
          <td style="width:20%">Prime assurance</td>
          <td style="width:20%">Mode</td>
          <td style="width:22%">Total</td>
        </tr>
${reglementRows.join("\n")}
        <tr>
          <td></td>
          <td class="lbl">Acompte :</td>
          <td class="lbl">Reste:</td>
          <td class="lbl">Total&nbsp;&nbsp;HT</td>
          <td class="num">${escapeHtml(money(data.shippingCost))}</td>
        </tr>
        <tr>
          <td></td>
          <td class="num">${escapeHtml(String(paidTotal))}</td>
          <td class="num">${escapeHtml(String(remaining))}</td>
          <td class="lbl">Reste à payer</td>
          <td class="num">${escapeHtml(money(remaining))}</td>
        </tr>
        <tr>
          <td></td>
          <td></td>
          <td></td>
          <td class="lbl"><strong>Net à payer</strong></td>
          <td class="num"><strong>${escapeHtml(money(data.shippingCost))}</strong></td>
        </tr>
      </tbody>
    </table>

    <table class="obs">
      <tbody>
        <tr>
          <td>
            <div class="obs-title">Observations</div>
            Les dates de départ sont données à titre indicatifs et peuvent être modifiées ou annulées
            (bon de commande exonéré de TVA) : Art 256-III, et suivants, 283-2 du code général des impôts.
            Les acomptes sont valables un(1) mois. Tout fret non payé un(1) mois après l'émission du
            connaissement fera l'objet d'une vente de la marchandise.
          </td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      SAS AUTO TRANSIT 3N<br/>
      Siège social : 14 AVENUE DU 8 MAI 1945 95200 SARCELLES– France<br/>
      Capital social : 3.000€ - Siret : 932857212 RCS  R.C.S PONTOISE<br/>
      TVA Intracommunautaire : FR 10932857212<br/>
      Infoline : 00 33 (1) 60547593  / 0033669180375 mail : info2npimportexport@yahoo.com
    </div>
  </div>
</body>
</html>`;
}

/** @deprecated Prefer buildAutoTransitInvoiceHtml with ShipmentDocumentData */
export function buildInvoiceHtmlFromLegacyReceipt(
  receipt: {
    receiptNumber: string;
    issuedAt: string;
    shipment: {
      trackingNumber: string;
      chassisNumber: string;
      itemName: string;
      shippingCost: string;
      status: string;
    };
    sender: {
      name: string;
      email: string;
      phone: string;
      address: string;
      city: string;
      country: string;
    };
    receiver: {
      name: string;
      email: string;
      phone: string;
      address: string;
      city: string;
      country: string;
    };
  },
  options: { invoiceNumber?: string; issuedAt?: string; payments?: ShipmentDocumentData["payments"]; vessel?: ShipmentDocumentData["vessel"]; tripName?: string | null; companyName?: string } = {},
): string {
  return buildAutoTransitInvoiceHtml({
    invoiceNumber: options.invoiceNumber ?? `INV-${receipt.receiptNumber.replace(/^RCPT?-?/, "")}`,
    issuedAt: options.issuedAt ?? receipt.issuedAt,
    currency: "EUR",
    trackingNumber: receipt.shipment.trackingNumber,
    chassisNumber: receipt.shipment.chassisNumber,
    itemName: receipt.shipment.itemName,
    shippingCost: Number(receipt.shipment.shippingCost || 0),
    status: receipt.shipment.status,
    tripName: options.tripName ?? null,
    vessel: options.vessel ?? null,
    sender: receipt.sender,
    receiver: receipt.receiver,
    payments: options.payments ?? [],
    companyName: options.companyName ?? "2NP",
  });
}
