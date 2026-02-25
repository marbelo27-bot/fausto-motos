"use client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Client, Motorcycle, Reception, ServiceOrder, Payment, Quote } from "./types";
import { getLogoDataUrl } from "./logoData";

// ── Light theme palette ──────────────────────────────────────────────────────
// Header: light gray background, dark text
const HEADER_BG: [number, number, number] = [245, 245, 245];
// Accent line below header: dark green
const ACCENT_LINE: [number, number, number] = [34, 120, 34];
// Section label text: dark green
const SECTION_COLOR: [number, number, number] = [20, 100, 20];
// Table header: dark slate bg, white text
const TH_BG: [number, number, number] = [45, 55, 72];
const TH_TEXT: [number, number, number] = [255, 255, 255];
// Table body: white rows, very light alternate
const ROW_ALT: [number, number, number] = [240, 245, 255];
const ROW_BODY_TEXT: [number, number, number] = [30, 30, 30];
// Client info box: light blue bg, dark blue border
const CLIENT_BG: [number, number, number] = [235, 245, 255];
const CLIENT_BORDER: [number, number, number] = [60, 100, 180];
const CLIENT_LABEL: [number, number, number] = [30, 70, 160];
// Total row: light green bg, dark green text
const TOTAL_BG: [number, number, number] = [220, 252, 220];
const TOTAL_TEXT: [number, number, number] = [10, 100, 10];
// Footer: light gray bg, dark text
const FOOTER_BG: [number, number, number] = [240, 240, 240];
const FOOTER_TEXT: [number, number, number] = [80, 80, 80];
// Amount box (payment): light green bg
const AMOUNT_BG: [number, number, number] = [220, 252, 220];
const AMOUNT_BORDER: [number, number, number] = [34, 120, 34];
const AMOUNT_TEXT: [number, number, number] = [10, 100, 10];

// Header height in mm
const HEADER_H = 38;

async function addHeader(doc: jsPDF, title: string, subtitle?: string): Promise<number> {
  // Light gray header background
  doc.setFillColor(...HEADER_BG);
  doc.rect(0, 0, 210, HEADER_H, "F");

  // --- Logo on the left ---
  const logoDataUrl = await getLogoDataUrl();
  if (logoDataUrl) {
    const logoH = 24; // mm
    const logoW = logoH * 3.5;
    const logoY = (HEADER_H - logoH) / 2;
    try {
      doc.addImage(logoDataUrl, "PNG", 8, logoY, logoW, logoH);
    } catch {
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("FAUSTO MOTOS", 14, HEADER_H / 2 + 3);
    }
  } else {
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("FAUSTO MOTOS", 14, HEADER_H / 2 + 3);
  }

  // --- Title, order number, date on the right ---
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, 202, 13, { align: "right" });

  if (subtitle) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text(subtitle, 202, 23, { align: "right" });
  }

  // Date: smaller, muted dark gray
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Fecha: ${new Date().toLocaleDateString("es-AR")}`,
    202,
    subtitle ? 32 : 26,
    { align: "right" }
  );

  // --- Dark green accent line below header ---
  doc.setDrawColor(...ACCENT_LINE);
  doc.setLineWidth(1.4);
  doc.line(0, HEADER_H, 210, HEADER_H);

  doc.setTextColor(30, 30, 30);
  return HEADER_H + 6;
}

function addClientInfo(
  doc: jsPDF,
  y: number,
  client: Client,
  motorcycle?: Motorcycle
): number {
  // Light blue client info box
  doc.setFillColor(...CLIENT_BG);
  doc.rect(10, y, 190, motorcycle ? 22 : 14, "F");
  doc.setDrawColor(...CLIENT_BORDER);
  doc.setLineWidth(0.5);
  doc.rect(10, y, 190, motorcycle ? 22 : 14, "S");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...CLIENT_LABEL);
  doc.text("DATOS DEL CLIENTE", 14, y + 6);

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...ROW_BODY_TEXT);
  doc.text(`Cliente: ${client.fullName}`, 14, y + 12);
  doc.text(`Tel: ${client.phone}`, 110, y + 12);

  if (motorcycle) {
    doc.text(
      `Moto: ${motorcycle.brand} ${motorcycle.model} (${motorcycle.year}) - Dom: ${motorcycle.plate}`,
      14,
      y + 19
    );
  }

  return y + (motorcycle ? 22 : 14) + 5;
}

export async function generateReceptionPDF(
  reception: Reception,
  client: Client,
  motorcycle: Motorcycle
) {
  const doc = new jsPDF();
  let y = await addHeader(doc, "ORDEN DE RECEPCIÓN", `N° ${reception.id.slice(0, 8).toUpperCase()}`);

  y = addClientInfo(doc, y, client, motorcycle);

  // Section label
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...SECTION_COLOR);
  doc.text("ESTADO DEL VEHÍCULO AL INGRESO", 14, y + 6);
  y += 10;

  const details = [
    ["Fecha de recepción", new Date(reception.date + "T00:00:00").toLocaleDateString("es-AR")],
    ["Kilómetros", `${reception.km.toLocaleString("es-AR")} km`],
    ["Combustible", `${reception.fuelPercent}% (${reception.fuelPercent >= 75 ? "Lleno" : reception.fuelPercent >= 50 ? "3/4" : reception.fuelPercent >= 25 ? "1/2" : "Vacío"})`],
    ["Cubiertas", `${reception.tiresPercent}% (${reception.tiresPercent >= 75 ? "Excelente" : reception.tiresPercent >= 50 ? "Buenas" : reception.tiresPercent >= 25 ? "Regular" : "Malas"})`],
    ["Transmisión", `${reception.transmissionPercent}% (${reception.transmissionPercent >= 75 ? "Excelente" : reception.transmissionPercent >= 50 ? "Buena" : reception.transmissionPercent >= 25 ? "Regular" : "Mala"})`],
    ["Carrocería", reception.bodyCondition.toUpperCase()],
    ["Casco", reception.helmet ? "SÍ" : "NO"],
    ["Documentación", reception.documentation ? "SÍ" : "NO"],
  ];

  autoTable(doc, {
    startY: y,
    head: [["Ítem", "Estado"]],
    body: details,
    theme: "grid",
    headStyles: { fillColor: TH_BG, textColor: TH_TEXT, fontStyle: "bold" },
    alternateRowStyles: { fillColor: ROW_ALT },
    bodyStyles: { textColor: ROW_BODY_TEXT, fontStyle: "bold" },
    styles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

  if (reception.missing || reception.accessories) {
    const extras = [];
    if (reception.missing) extras.push(["Faltantes", reception.missing]);
    if (reception.accessories) extras.push(["Accesorios", reception.accessories]);

    autoTable(doc, {
      startY: y,
      body: extras,
      theme: "plain",
      styles: { fontSize: 9, textColor: ROW_BODY_TEXT, fontStyle: "bold" },
      margin: { left: 14, right: 14 },
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
  }

  if (reception.notes) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...SECTION_COLOR);
    doc.text("OBSERVACIONES:", 14, y + 5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...ROW_BODY_TEXT);
    const lines = doc.splitTextToSize(reception.notes, 180);
    doc.text(lines, 14, y + 11);
    y += 11 + lines.length * 5;
  }

  // Images
  if (reception.images && reception.images.length > 0) {
    if (y > 220) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...SECTION_COLOR);
    doc.text("REGISTRO FOTOGRÁFICO", 14, y + 6);
    y += 12;

    let imgX = 14;
    let imgY = y;
    const imgW = 85;
    const imgH = 60;

    reception.images.forEach((img, idx) => {
      if (imgX + imgW > 200) {
        imgX = 14;
        imgY += imgH + 10;
      }
      if (imgY + imgH > 270) {
        doc.addPage();
        imgY = 20;
        imgX = 14;
      }
      try {
        doc.addImage(img.dataUrl, "JPEG", imgX, imgY, imgW, imgH);
        if (img.caption) {
          doc.setFontSize(7);
          doc.setTextColor(80, 80, 80);
          doc.text(img.caption, imgX, imgY + imgH + 4, { maxWidth: imgW });
        }
      } catch {
        // skip invalid images
      }
      imgX += imgW + 10;
      if (idx % 2 === 1) {
        imgX = 14;
        imgY += imgH + 10;
      }
    });
  }

  addFooter(doc);
  const clientNameR = client.fullName.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9 ]/g, "").trim().replace(/\s+/g, "-");
  doc.save(`recepcion-${clientNameR}-${reception.id.slice(0, 8)}.pdf`);
}

export async function generateServiceOrderPDF(
  order: ServiceOrder,
  client: Client,
  motorcycle: Motorcycle
) {
  const doc = new jsPDF();
  let y = await addHeader(doc, "ORDEN DE SERVICIO", `N° ${order.id}`);

  y = addClientInfo(doc, y, client, motorcycle);

  // Section label
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...SECTION_COLOR);
  doc.text("DETALLE DEL SERVICIO", 14, y + 6);
  y += 10;

  autoTable(doc, {
    startY: y,
    body: [
      ["Fecha", new Date(order.date + "T00:00:00").toLocaleDateString("es-AR")],
      ["Servicio requerido", order.requiredService],
      ["Servicio realizado", order.performedService],
      ["Estado", order.status.toUpperCase()],
      ["Garantía", order.warranty || "Sin garantía"],
    ],
    theme: "grid",
    styles: { fontSize: 9, textColor: ROW_BODY_TEXT, fontStyle: "bold" },
    columnStyles: {
      0: { fontStyle: "bold", fillColor: CLIENT_BG, textColor: CLIENT_LABEL },
    },
    bodyStyles: { fillColor: [255, 255, 255] },
    margin: { left: 14, right: 14 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

  // Parts
  if (order.parts && order.parts.length > 0) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...SECTION_COLOR);
    doc.text("REPUESTOS UTILIZADOS", 14, y + 5);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [["Descripción", "Cantidad", "Precio Unit.", "Subtotal"]],
      body: order.parts.map((p) => [
        p.description,
        p.quantity.toString(),
        `$${p.unitPrice.toLocaleString("es-AR")}`,
        `$${(p.quantity * p.unitPrice).toLocaleString("es-AR")}`,
      ]),
      theme: "grid",
      headStyles: { fillColor: TH_BG, textColor: TH_TEXT, fontStyle: "bold" },
      alternateRowStyles: { fillColor: ROW_ALT },
      bodyStyles: { textColor: ROW_BODY_TEXT, fontStyle: "bold" },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
  }

  // Totals
  const totalsData = [
    ["Mano de obra", `$${order.laborCost.toLocaleString("es-AR")}`],
    ["Repuestos", `$${order.partsCost.toLocaleString("es-AR")}`],
    ["TOTAL", `$${order.totalCost.toLocaleString("es-AR")}`],
  ];

  autoTable(doc, {
    startY: y,
    body: totalsData,
    theme: "plain",
    styles: { fontSize: 10, textColor: ROW_BODY_TEXT, fontStyle: "bold" },
    columnStyles: {
      0: { fontStyle: "bold", halign: "right" },
      1: { halign: "right" },
    },
    didParseCell: (data) => {
      if (data.row.index === 2) {
        data.cell.styles.fontSize = 12;
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = TOTAL_BG;
        data.cell.styles.textColor = TOTAL_TEXT;
      }
    },
    margin: { left: 100, right: 14 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

  if (order.notes) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...SECTION_COLOR);
    doc.text("OBSERVACIONES:", 14, y + 5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...ROW_BODY_TEXT);
    const lines = doc.splitTextToSize(order.notes, 180);
    doc.text(lines, 14, y + 11);
  }

  addFooter(doc);
  const clientNameO = client.fullName.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9 ]/g, "").trim().replace(/\s+/g, "-");
  doc.save(`orden-servicio-${clientNameO}-${order.id}.pdf`);
}

export async function generatePaymentPDF(
  payment: Payment,
  client: Client,
  serviceOrder?: ServiceOrder
) {
  const doc = new jsPDF();
  let y = await addHeader(doc, "COMPROBANTE DE PAGO", `N° ${payment.id.slice(0, 8).toUpperCase()}`);

  y = addClientInfo(doc, y, client);

  // Section label
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...SECTION_COLOR);
  doc.text("DETALLE DEL PAGO", 14, y + 6);
  y += 10;

  const paymentData = [
    ["Fecha", new Date(payment.date + "T00:00:00").toLocaleDateString("es-AR")],
    ["Tipo de pago", payment.type.toUpperCase()],
    ["Forma de pago", payment.method.toUpperCase()],
    ...(serviceOrder ? [["Orden de servicio", `N° ${serviceOrder.id}`]] : []),
    ...(payment.notes ? [["Notas", payment.notes]] : []),
  ];

  autoTable(doc, {
    startY: y,
    body: paymentData,
    theme: "grid",
    styles: { fontSize: 10, textColor: ROW_BODY_TEXT, fontStyle: "bold" },
    columnStyles: { 0: { fontStyle: "bold", fillColor: CLIENT_BG, textColor: CLIENT_LABEL } },
    bodyStyles: { fillColor: [255, 255, 255] },
    margin: { left: 14, right: 14 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Amount box — light green
  doc.setFillColor(...AMOUNT_BG);
  doc.rect(60, y, 90, 20, "F");
  doc.setDrawColor(...AMOUNT_BORDER);
  doc.setLineWidth(0.8);
  doc.rect(60, y, 90, 20, "S");
  doc.setTextColor(...AMOUNT_TEXT);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("MONTO ABONADO", 105, y + 8, { align: "center" });
  doc.setFontSize(18);
  doc.text(`$${payment.amount.toLocaleString("es-AR")}`, 105, y + 17, { align: "center" });

  y += 30;

  // Signature lines
  doc.setTextColor(80, 80, 80);
  doc.setDrawColor(120, 120, 120);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.line(20, y + 15, 80, y + 15);
  doc.line(130, y + 15, 190, y + 15);
  doc.text("Firma del cliente", 50, y + 20, { align: "center" });
  doc.text("Firma del taller", 160, y + 20, { align: "center" });

  addFooter(doc);
  const clientNameP = client.fullName.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9 ]/g, "").trim().replace(/\s+/g, "-");
  doc.save(`pago-${clientNameP}-${payment.id.slice(0, 8)}.pdf`);
}

export async function generateQuotePDF(
  quote: Quote,
  client: Client,
  motorcycle: Motorcycle
) {
  const doc = new jsPDF();
  const statusLabels: Record<Quote["status"], string> = {
    borrador: "BORRADOR",
    enviada: "ENVIADA",
    aceptada: "ACEPTADA",
    rechazada: "RECHAZADA",
  };

  let y = await addHeader(doc, "COTIZACIÓN", `N° ${quote.id.slice(0, 8).toUpperCase()}`);

  y = addClientInfo(doc, y, client, motorcycle);

  // Dates row
  autoTable(doc, {
    startY: y,
    body: [
      ["Fecha de cotización", new Date(quote.date + "T00:00:00").toLocaleDateString("es-AR"),
       "Válida hasta", new Date(quote.validUntil + "T00:00:00").toLocaleDateString("es-AR"),
       "Estado", statusLabels[quote.status]],
    ],
    theme: "grid",
    styles: { fontSize: 9, textColor: ROW_BODY_TEXT, fontStyle: "bold" },
    columnStyles: {
      0: { fontStyle: "bold", fillColor: CLIENT_BG, textColor: CLIENT_LABEL },
      2: { fontStyle: "bold", fillColor: CLIENT_BG, textColor: CLIENT_LABEL },
      4: { fontStyle: "bold", fillColor: CLIENT_BG, textColor: CLIENT_LABEL },
    },
    bodyStyles: { fillColor: [255, 255, 255] },
    margin: { left: 14, right: 14 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  // Labor items
  const laborItems = quote.items.filter((i) => i.type === "labor");
  if (laborItems.length > 0) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...SECTION_COLOR);
    doc.text("TRABAJOS / MANO DE OBRA", 14, y + 5);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [["Descripción", "Cantidad", "Precio Unit.", "Subtotal"]],
      body: laborItems.map((i) => [
        i.description,
        i.quantity.toString(),
        `$${i.unitPrice.toLocaleString("es-AR")}`,
        `$${(i.quantity * i.unitPrice).toLocaleString("es-AR")}`,
      ]),
      theme: "grid",
      headStyles: { fillColor: TH_BG, textColor: TH_TEXT, fontStyle: "bold" },
      alternateRowStyles: { fillColor: ROW_ALT },
      bodyStyles: { textColor: ROW_BODY_TEXT, fontStyle: "bold" },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
  }

  // Parts items
  const partItems = quote.items.filter((i) => i.type === "part");
  if (partItems.length > 0) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...SECTION_COLOR);
    doc.text("REPUESTOS", 14, y + 5);
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [["Descripción", "Cantidad", "Precio Unit.", "Subtotal"]],
      body: partItems.map((i) => [
        i.description,
        i.quantity.toString(),
        `$${i.unitPrice.toLocaleString("es-AR")}`,
        `$${(i.quantity * i.unitPrice).toLocaleString("es-AR")}`,
      ]),
      theme: "grid",
      headStyles: { fillColor: TH_BG, textColor: TH_TEXT, fontStyle: "bold" },
      alternateRowStyles: { fillColor: ROW_ALT },
      bodyStyles: { textColor: ROW_BODY_TEXT, fontStyle: "bold" },
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });

    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
  }

  // Totals
  const totalsData: [string, string][] = [];
  if (laborItems.length > 0) totalsData.push(["Mano de obra", `$${quote.laborTotal.toLocaleString("es-AR")}`]);
  if (partItems.length > 0) totalsData.push(["Repuestos", `$${quote.partsTotal.toLocaleString("es-AR")}`]);
  totalsData.push(["TOTAL", `$${quote.total.toLocaleString("es-AR")}`]);

  autoTable(doc, {
    startY: y,
    body: totalsData,
    theme: "plain",
    styles: { fontSize: 10, textColor: ROW_BODY_TEXT, fontStyle: "bold" },
    columnStyles: {
      0: { fontStyle: "bold", halign: "right" },
      1: { halign: "right" },
    },
    didParseCell: (data) => {
      if (data.row.index === totalsData.length - 1) {
        data.cell.styles.fontSize = 12;
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = TOTAL_BG;
        data.cell.styles.textColor = TOTAL_TEXT;
      }
    },
    margin: { left: 100, right: 14 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  if (quote.notes) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...SECTION_COLOR);
    doc.text("OBSERVACIONES:", 14, y + 5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...ROW_BODY_TEXT);
    const lines = doc.splitTextToSize(quote.notes, 180);
    doc.text(lines, 14, y + 11);
    y += 11 + lines.length * 5;
  }

  // Validity note
  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Esta cotización es válida hasta el ${new Date(quote.validUntil + "T00:00:00").toLocaleDateString("es-AR")}. Los precios pueden variar según disponibilidad de repuestos.`,
    14,
    y,
    { maxWidth: 182 }
  );

  addFooter(doc);
  const clientNameQ = client.fullName.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9 ]/g, "").trim().replace(/\s+/g, "-");
  doc.save(`cotizacion-${clientNameQ}-${quote.id.slice(0, 8)}.pdf`);
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    // Light gray footer background
    doc.setFillColor(...FOOTER_BG);
    doc.rect(0, 285, 210, 12, "F");
    // Dark green top border on footer
    doc.setDrawColor(...ACCENT_LINE);
    doc.setLineWidth(0.5);
    doc.line(0, 285, 210, 285);
    doc.setTextColor(...FOOTER_TEXT);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("Fausto Motos - Sistema de Gestión", 14, 292);
    doc.text(`Página ${i} de ${pageCount}`, 196, 292, { align: "right" });
  }
}
