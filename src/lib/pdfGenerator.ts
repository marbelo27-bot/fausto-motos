"use client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Client, Motorcycle, Reception, ServiceOrder, Payment } from "./types";
import { getLogoDataUrl } from "./logoData";

const PRIMARY = "#2596be";
const ACCENT = "#f5a623";
const DARK = "#1a1a2e";
const LIGHT_BG = "#f0f9ff";

function addHeader(doc: jsPDF, title: string, subtitle?: string, logoDataUrl?: string | null) {
  // Header background
  doc.setFillColor(PRIMARY);
  doc.rect(0, 0, 210, 28, "F");

  // Logo (if available) — placed on the right side of the header
  if (logoDataUrl) {
    try {
      // Draw white background behind logo for visibility
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(148, 2, 58, 24, 3, 3, "F");
      doc.addImage(logoDataUrl, "PNG", 150, 3, 54, 22);
    } catch {
      // If logo fails, fall back to text only
    }
  }

  // Title text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("TALLER DE MOTOS", 14, 12);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(title, 14, 21);

  if (subtitle) {
    doc.setFontSize(9);
    doc.text(subtitle, 14, 26);
  }

  // Date on right (below logo area)
  doc.setFontSize(9);
  doc.text(
    `Fecha: ${new Date().toLocaleDateString("es-AR")}`,
    196,
    26,
    { align: "right" }
  );

  doc.setTextColor(DARK);
  return 35;
}

function addClientInfo(
  doc: jsPDF,
  y: number,
  client: Client,
  motorcycle?: Motorcycle
): number {
  doc.setFillColor(LIGHT_BG);
  doc.rect(10, y, 190, motorcycle ? 22 : 14, "F");
  doc.setDrawColor(PRIMARY);
  doc.rect(10, y, 190, motorcycle ? 22 : 14, "S");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(PRIMARY);
  doc.text("DATOS DEL CLIENTE", 14, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(DARK);
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
  const logoDataUrl = await getLogoDataUrl();
  const doc = new jsPDF();
  let y = addHeader(doc, "ORDEN DE RECEPCIÓN", `N° ${reception.id.slice(0, 8).toUpperCase()}`, logoDataUrl);

  y = addClientInfo(doc, y, client, motorcycle);

  // Reception details
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(PRIMARY);
  doc.text("ESTADO DEL VEHÍCULO AL INGRESO", 14, y + 6);
  y += 10;

  const details = [
    ["Fecha de recepción", new Date(reception.date).toLocaleDateString("es-AR")],
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
    headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [240, 249, 255] },
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
      styles: { fontSize: 9 },
      margin: { left: 14, right: 14 },
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
  }

  if (reception.notes) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(PRIMARY);
    doc.text("OBSERVACIONES:", 14, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(DARK);
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
    doc.setTextColor(PRIMARY);
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
          doc.setTextColor(DARK);
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

  // Footer
  addFooter(doc);
  doc.save(`recepcion-${reception.id.slice(0, 8)}.pdf`);
}

export async function generateServiceOrderPDF(
  order: ServiceOrder,
  client: Client,
  motorcycle: Motorcycle
) {
  const logoDataUrl = await getLogoDataUrl();
  const doc = new jsPDF();
  let y = addHeader(doc, "ORDEN DE SERVICIO", `N° ${order.id.slice(0, 8).toUpperCase()}`, logoDataUrl);

  y = addClientInfo(doc, y, client, motorcycle);

  // Service info
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(PRIMARY);
  doc.text("DETALLE DEL SERVICIO", 14, y + 6);
  y += 10;

  autoTable(doc, {
    startY: y,
    body: [
      ["Fecha", new Date(order.date).toLocaleDateString("es-AR")],
      ["Servicio requerido", order.requiredService],
      ["Servicio realizado", order.performedService],
      ["Estado", order.status.toUpperCase()],
      ["Garantía", order.warranty || "Sin garantía"],
    ],
    theme: "grid",
    styles: { fontSize: 9 },
    columnStyles: { 0: { fontStyle: "bold", fillColor: [240, 249, 255] } },
    margin: { left: 14, right: 14 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

  // Parts
  if (order.parts && order.parts.length > 0) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(PRIMARY);
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
      headStyles: { fillColor: PRIMARY, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [240, 249, 255] },
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
    styles: { fontSize: 10 },
    columnStyles: {
      0: { fontStyle: "bold", halign: "right" },
      1: { halign: "right" },
    },
    didParseCell: (data) => {
      if (data.row.index === 2) {
        data.cell.styles.fontSize = 12;
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = PRIMARY;
        data.cell.styles.textColor = [255, 255, 255];
      }
    },
    margin: { left: 100, right: 14 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

  if (order.notes) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(PRIMARY);
    doc.text("OBSERVACIONES:", 14, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(DARK);
    const lines = doc.splitTextToSize(order.notes, 180);
    doc.text(lines, 14, y + 11);
  }

  addFooter(doc);
  doc.save(`orden-servicio-${order.id.slice(0, 8)}.pdf`);
}

export async function generatePaymentPDF(
  payment: Payment,
  client: Client,
  serviceOrder?: ServiceOrder
) {
  const logoDataUrl = await getLogoDataUrl();
  const doc = new jsPDF();
  let y = addHeader(doc, "COMPROBANTE DE PAGO", `N° ${payment.id.slice(0, 8).toUpperCase()}`, logoDataUrl);

  y = addClientInfo(doc, y, client);

  // Payment details
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(PRIMARY);
  doc.text("DETALLE DEL PAGO", 14, y + 6);
  y += 10;

  const paymentData = [
    ["Fecha", new Date(payment.date).toLocaleDateString("es-AR")],
    ["Tipo de pago", payment.type.toUpperCase()],
    ["Forma de pago", payment.method.toUpperCase()],
    ...(serviceOrder ? [["Orden de servicio", `N° ${serviceOrder.id.slice(0, 8).toUpperCase()}`]] : []),
    ...(payment.notes ? [["Notas", payment.notes]] : []),
  ];

  autoTable(doc, {
    startY: y,
    body: paymentData,
    theme: "grid",
    styles: { fontSize: 10 },
    columnStyles: { 0: { fontStyle: "bold", fillColor: [240, 249, 255] } },
    margin: { left: 14, right: 14 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Amount box
  doc.setFillColor(PRIMARY);
  doc.rect(60, y, 90, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("MONTO ABONADO", 105, y + 8, { align: "center" });
  doc.setFontSize(18);
  doc.text(`$${payment.amount.toLocaleString("es-AR")}`, 105, y + 17, { align: "center" });

  y += 30;

  // Signature lines
  doc.setTextColor(DARK);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.line(20, y + 15, 80, y + 15);
  doc.line(130, y + 15, 190, y + 15);
  doc.text("Firma del cliente", 50, y + 20, { align: "center" });
  doc.text("Firma del taller", 160, y + 20, { align: "center" });

  addFooter(doc);
  doc.save(`pago-${payment.id.slice(0, 8)}.pdf`);
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(PRIMARY);
    doc.rect(0, 285, 210, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Taller de Motos - Sistema de Gestión", 14, 292);
    doc.text(`Página ${i} de ${pageCount}`, 196, 292, { align: "right" });
  }
}
