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
  const vessel = data.vessel;

  const paymentRows =
    data.payments.length > 0
      ? data.payments
          .map(
            (p) => `
              <tr>
                <td>${escapeHtml(formatDateFr(p.paidAt))}</td>
                <td>${escapeHtml(p.reason)}</td>
                <td class="num">${escapeHtml(String(p.amount))}</td>
                <td>${escapeHtml(p.notes || "")}</td>
              </tr>`,
          )
          .join("")
      : `<tr><td colspan="4" style="text-align:center;color:#666;">Aucun paiement enregistré</td></tr>`;

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Facture - ${escapeHtml(data.invoiceNumber)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cormorant+Garamond:wght@600;700&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      margin: 0;
      padding: 24px;
      color: #111;
      font-size: 13px;
      line-height: 1.35;
    }
    .doc { max-width: 820px; margin: 0 auto; }
    .brand { text-align: center; margin-bottom: 18px; }
    .brand .logo {
      margin: 0;
      font-family: "Bebas Neue", "Arial Narrow", Impact, sans-serif;
      font-size: 56px;
      font-weight: 400;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      line-height: 1;
      color: #0a0a0a;
    }
    .brand h1 {
      margin: 10px 0 0;
      font-family: "Cormorant Garamond", Georgia, "Times New Roman", serif;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .brand .tagline { margin: 6px 0 0; font-size: 12px; }
    .brand .slogan {
      margin: 4px 0 0;
      font-size: 12px;
      font-weight: 700;
      text-decoration: underline;
      text-transform: uppercase;
    }
    table.box {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
    }
    table.box th, table.box td {
      border: 1px solid #111;
      padding: 8px 10px;
      vertical-align: top;
    }
    table.box th {
      background: #f3f3f3;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .party-label { font-weight: 700; font-size: 12px; margin-bottom: 6px; }
    .party-line { margin: 2px 0; }
    .party-line span { color: #444; }
    .vehicle-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 18px;
      margin: 10px 0 4px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin: 12px 0;
      font-weight: 700;
    }
    table.payments td.num { text-align: right; font-variant-numeric: tabular-nums; }
    .totals {
      width: 280px;
      margin-left: auto;
      margin-top: 12px;
    }
    .totals .row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid #ddd;
    }
    .totals .row.strong {
      font-weight: 800;
      font-size: 15px;
      border-bottom: 2px solid #111;
      margin-top: 4px;
    }
    .observations {
      margin-top: 18px;
      padding: 10px;
      border: 1px solid #111;
      font-size: 10px;
      color: #333;
      text-align: justify;
    }
    .observations strong { display: block; margin-bottom: 6px; font-size: 11px; }
    .footer {
      margin-top: 16px;
      text-align: center;
      font-size: 10px;
      color: #444;
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
      <div class="logo">2NP</div>
      ${data.companyName && data.companyName.trim().toUpperCase() !== "2NP"
        ? `<h1>${escapeHtml(data.companyName)}</h1>`
        : ""}
      <p class="tagline">Spécialiste de l'envoi de véhicules vers l'Afrique</p>
      <p class="slogan">Le meilleur service à prix compétitif</p>
    </div>

    <table class="box">
      <thead>
        <tr>
          <th style="width:50%">Expéditeur</th>
          <th style="width:50%">Destinataire</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div class="party-line"><span>Nom et Prénom :</span> <strong>${escapeHtml(data.sender.name)}</strong></div>
            <div class="party-line"><span>Adresse :</span> ${escapeHtml(data.sender.address)}</div>
            <div class="party-line"><span>Ville :</span> ${escapeHtml([data.sender.zipCode, data.sender.city].filter(Boolean).join(" "))}</div>
            <div class="party-line"><span>Pays :</span> ${escapeHtml(data.sender.country)}</div>
            <div class="party-line"><span>Téléphone :</span> ${escapeHtml(data.sender.phone)}</div>
          </td>
          <td>
            <div class="party-line"><span>Nom et Prénom :</span> <strong>${escapeHtml(data.receiver.name)}</strong></div>
            <div class="party-line"><span>Adresse :</span> ${escapeHtml(data.receiver.address)}</div>
            <div class="party-line"><span>Code Post :</span> ${escapeHtml(data.receiver.zipCode || "")}</div>
            <div class="party-line"><span>Ville :</span> ${escapeHtml(data.receiver.city)}</div>
            <div class="party-line"><span>Pays :</span> ${escapeHtml(data.receiver.country)}</div>
            <div class="party-line"><span>Téléphone :</span> ${escapeHtml(data.receiver.phone)}</div>
          </td>
        </tr>
      </tbody>
    </table>

    <table class="box">
      <thead>
        <tr><th colspan="2">Véhicule &amp; transport</th></tr>
      </thead>
      <tbody>
        <tr>
          <td colspan="2">
            <div class="vehicle-grid">
              <div><strong>- IMMAT :</strong> ${escapeHtml(data.registrationNumber || "—")}</div>
              <div><strong>- MARQUE :</strong> ${escapeHtml(data.itemName)}</div>
              <div><strong>- CHASSIS :</strong> ${escapeHtml(data.chassisNumber)}</div>
              <div><strong>- VALEUR D'ACHAT :</strong> ${escapeHtml(data.purchaseValue || "")}</div>
              <div><strong>- TRANSPORTEUR :</strong> ${escapeHtml(vessel?.carrierName || "—")}</div>
              <div><strong>- NOM DU BATEAU :</strong> ${escapeHtml(vessel?.boatName || "—")}</div>
              <div><strong>- N° BATEAU (IMO) :</strong> ${escapeHtml(vessel?.boatNumber || "—")}</div>
              <div><strong>- TRAJET :</strong> ${escapeHtml(data.tripName || "—")}</div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="meta-row">
      <div>FACTURE N° : ${escapeHtml(data.invoiceNumber)}</div>
      <div>Date : ${escapeHtml(formatDateFr(data.issuedAt))}</div>
    </div>

    <table class="box payments">
      <thead>
        <tr>
          <th>Date de paiement</th>
          <th>Raison</th>
          <th>Montant</th>
          <th>Notes</th>
        </tr>
      </thead>
      <tbody>
        ${paymentRows}
        <tr>
          <td colspan="2"><strong>Prix transport</strong></td>
          <td class="num" colspan="2"><strong>${escapeHtml(String(data.shippingCost))}</strong></td>
        </tr>
        <tr>
          <td colspan="2">Total payé (acomptes)</td>
          <td class="num" colspan="2">${escapeHtml(String(paidTotal))}</td>
        </tr>
        <tr>
          <td colspan="2"><strong>Reste</strong></td>
          <td class="num" colspan="2"><strong>${escapeHtml(String(remaining))}</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="totals">
      <div class="row"><span>Total HT</span><span>${escapeHtml(money(data.shippingCost))}</span></div>
      <div class="row"><span>Reste à payer</span><span>${escapeHtml(money(remaining))}</span></div>
      <div class="row strong"><span>Net à payer</span><span>${escapeHtml(money(data.shippingCost))}</span></div>
    </div>

    <div class="observations">
      <strong>Observations</strong>
      Les dates de départ sont données à titre indicatif. Conformément à l'Art 256-III du CGI,
      les acomptes sont valables un mois. Le fret non soldé un mois après l'émission du connaissement
      peut entraîner la vente de la marchandise. Suivi : ${escapeHtml(data.trackingNumber)}.
    </div>

    <div class="footer">
      <strong>${escapeHtml(data.companyName || "2NP")}</strong><br/>
      14 AVENUE DU 8 MAI 1945 — 95200 SARCELLES — France<br/>
      Capital 3.000 € — SIRET 932857212 RCS PONTOISE — TVA FR 10932857212<br/>
      info2npimportexport@yahoo.com
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
