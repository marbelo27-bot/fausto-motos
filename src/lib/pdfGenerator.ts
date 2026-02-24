"use client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Client, Motorcycle, Reception, ServiceOrder, Payment } from "./types";

// Color palette: #CAF404 (lime), #11A900 (green), #000 (black), #FFF (white)
const HEADER_BG: [number, number, number] = [0, 0, 0];         // black header
const PRIMARY_RGB: [number, number, number] = [202, 244, 4];   // #CAF404

function addHeader(doc: jsPDF, title: string, subtitle?: string) {
  // Header background — black
  doc.setFillColor(...HEADER_BG);
  doc.rect(0, 0, 210, 28, "F");

  // Lime accent bar at bottom of header
  doc.setFillColor(...PRIMARY_RGB);
  doc.rect(0, 26, 210, 2, "F");

  // Title text
  doc.setTextColor(...PRIMARY_RGB);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("FAUSTO MOTOS", 14, 12);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(title, 14, 21);

  if (subtitle) {
    doc.setFontSize(9);
    doc.text(subtitle, 14, 26);
  }

  // Date on right
  doc.setFontSize(9);
  doc.setTextColor(180, 180, 180);
  doc.text(
    `Fecha: ${new Date().toLocaleDateString("es-AR")}`,
    196,
    26,
    { align: "right" }
  );

  doc.setTextColor(0, 0, 0);
  return 35;
}

function addClientInfo(
  doc: jsPDF,
  y: number,
  client: Client,
  motorcycle?: Motorcycle
): number {
  // Light dark background box
  doc.setFillColor(240, 255, 200); // very light lime tint
  doc.rect(10, y, 190, motorcycle ? 22 : 14, "F");
  doc.setDrawColor(...PRIMARY_RGB);
  doc.rect(10, y, 190, motorcycle ? 22 : 14, "S");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PRIMARY_RGB);
  doc.text("DATOS DEL CLIENTE", 14, y + 6);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
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
  let y = addHeader(doc, "ORDEN DE RECEPCIÓN", `N° ${reception.id.slice(0, 8).toUpperCase()}`);

  y = addClientInfo(doc, y, client, motorcycle);

  // Reception details
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PRIMARY_RGB);
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
    headStyles: { fillColor: HEADER_BG, textColor: PRIMARY_RGB, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 255, 220] },
    styles: { fontSize: 9, textColor: [0, 0, 0] },
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
      styles: { fontSize: 9, textColor: [0, 0, 0] },
      margin: { left: 14, right: 14 },
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
  }

  if (reception.notes) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY_RGB);
    doc.text("OBSERVACIONES:", 14, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
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
    doc.setTextColor(...PRIMARY_RGB);
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
          doc.setTextColor(0, 0, 0);
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
  const clientNameR = client.fullName.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9 ]/g, "").trim().replace(/\s+/g, "-");
  doc.save(`recepcion-${clientNameR}-${reception.id.slice(0, 8)}.pdf`);
}

export async function generateServiceOrderPDF(
  order: ServiceOrder,
  client: Client,
  motorcycle: Motorcycle
) {
  const doc = new jsPDF();
  let y = addHeader(doc, "ORDEN DE SERVICIO", `N° ${order.id.slice(0, 8).toUpperCase()}`);

  y = addClientInfo(doc, y, client, motorcycle);

  // Service info
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PRIMARY_RGB);
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
    styles: { fontSize: 9, textColor: [0, 0, 0] },
    columnStyles: { 0: { fontStyle: "bold", fillColor: [245, 255, 220] } },
    margin: { left: 14, right: 14 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

  // Parts
  if (order.parts && order.parts.length > 0) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY_RGB);
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
      headStyles: { fillColor: HEADER_BG, textColor: PRIMARY_RGB, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 255, 220] },
      styles: { fontSize: 9, textColor: [0, 0, 0] },
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
    styles: { fontSize: 10, textColor: [0, 0, 0] },
    columnStyles: {
      0: { fontStyle: "bold", halign: "right" },
      1: { halign: "right" },
    },
    didParseCell: (data) => {
      if (data.row.index === 2) {
        data.cell.styles.fontSize = 12;
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = HEADER_BG;
        data.cell.styles.textColor = PRIMARY_RGB;
      }
    },
    margin: { left: 100, right: 14 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

  if (order.notes) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY_RGB);
    doc.text("OBSERVACIONES:", 14, y + 5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    const lines = doc.splitTextToSize(order.notes, 180);
    doc.text(lines, 14, y + 11);
  }

  addFooter(doc);
  const clientNameO = client.fullName.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9 ]/g, "").trim().replace(/\s+/g, "-");
  doc.save(`orden-servicio-${clientNameO}-${order.id.slice(0, 8)}.pdf`);
}

export async function generatePaymentPDF(
  payment: Payment,
  client: Client,
  serviceOrder?: ServiceOrder
) {
  const doc = new jsPDF();
  let y = addHeader(doc, "COMPROBANTE DE PAGO", `N° ${payment.id.slice(0, 8).toUpperCase()}`);

  y = addClientInfo(doc, y, client);

  // Payment details
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PRIMARY_RGB);
  doc.text("DETALLE DEL PAGO", 14, y + 6);
  y += 10;

  const paymentData = [
    ["Fecha", new Date(payment.date + "T00:00:00").toLocaleDateString("es-AR")],
    ["Tipo de pago", payment.type.toUpperCase()],
    ["Forma de pago", payment.method.toUpperCase()],
    ...(serviceOrder ? [["Orden de servicio", `N° ${serviceOrder.id.slice(0, 8).toUpperCase()}`]] : []),
    ...(payment.notes ? [["Notas", payment.notes]] : []),
  ];

  autoTable(doc, {
    startY: y,
    body: paymentData,
    theme: "grid",
    styles: { fontSize: 10, textColor: [0, 0, 0] },
    columnStyles: { 0: { fontStyle: "bold", fillColor: [245, 255, 220] } },
    margin: { left: 14, right: 14 },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Amount box — black background with lime text
  doc.setFillColor(...HEADER_BG);
  doc.rect(60, y, 90, 20, "F");
  doc.setDrawColor(...PRIMARY_RGB);
  doc.rect(60, y, 90, 20, "S");
  doc.setTextColor(...PRIMARY_RGB);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("MONTO ABONADO", 105, y + 8, { align: "center" });
  doc.setFontSize(18);
  doc.text(`$${payment.amount.toLocaleString("es-AR")}`, 105, y + 17, { align: "center" });

  y += 30;

  // Signature lines
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setDrawColor(0, 0, 0);
  doc.line(20, y + 15, 80, y + 15);
  doc.line(130, y + 15, 190, y + 15);
  doc.text("Firma del cliente", 50, y + 20, { align: "center" });
  doc.text("Firma del taller", 160, y + 20, { align: "center" });

  addFooter(doc);
  const clientNameP = client.fullName.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9 ]/g, "").trim().replace(/\s+/g, "-");
  doc.save(`pago-${clientNameP}-${payment.id.slice(0, 8)}.pdf`);
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(...HEADER_BG);
    doc.rect(0, 285, 210, 12, "F");
    // Lime accent line at top of footer
    doc.setFillColor(...PRIMARY_RGB);
    doc.rect(0, 285, 210, 1, "F");
    doc.setTextColor(...PRIMARY_RGB);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Fausto Motos - Sistema de Gestión", 14, 292);
    doc.setTextColor(180, 180, 180);
    doc.text(`Página ${i} de ${pageCount}`, 196, 292, { align: "right" });
  }
}

