/**
 * PDF export for itinerary drafts using jsPDF.
 * Generates a branded Marriott Bonvoy itinerary document client-side.
 */

export interface PdfItineraryItem {
  time?: string;
  type: "accommodation" | "activity" | "transport" | "restaurant" | "flight";
  title: string;
  description?: string;
  price?: number;
  currency?: string;
  address?: string;
  confirmationRef?: string;
}

export interface PdfItineraryDay {
  date: string; // YYYY-MM-DD
  label?: string;
  items: PdfItineraryItem[];
}

export interface PdfItineraryData {
  tripTitle: string;
  destination: string;
  checkIn: string;
  checkOut: string;
  travellers: number;
  bonvoyPoints?: number;
  memberName?: string;
  days: PdfItineraryDay[];
  totalCost?: number;
  currency?: string;
}

const TYPE_ICONS: Record<PdfItineraryItem["type"], string> = {
  accommodation: "🏠",
  activity: "🎯",
  transport: "🚗",
  restaurant: "🍽",
  flight: "✈",
};

function formatDateDisplay(ymd: string): string {
  const d = new Date(ymd + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

/** Dynamically imports jsPDF and generates a PDF blob URL. */
export async function generateItineraryPdf(data: PdfItineraryData): Promise<string> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const PAGE_W = 210;
  const MARGIN = 18;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  let y = 0;

  function newPageIfNeeded(needed = 20) {
    if (y + needed > 275) {
      doc.addPage();
      y = MARGIN;
    }
  }

  function drawLine(color = "#e2e0d6") {
    doc.setDrawColor(color);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 4;
  }

  // ── Cover header ────────────────────────────────────────────────────────────
  // Gold header band
  doc.setFillColor(166, 124, 82); // Marriott gold
  doc.rect(0, 0, PAGE_W, 38, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("MARRIOTT BONVOY  ·  HOMES & VILLAS", MARGIN, 12);

  doc.setFontSize(20);
  doc.text(data.tripTitle, MARGIN, 24);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`${data.destination}  ·  ${data.checkIn} → ${data.checkOut}  ·  ${data.travellers} traveller${data.travellers > 1 ? "s" : ""}`, MARGIN, 33);

  y = 46;

  // ── Summary strip ────────────────────────────────────────────────────────────
  doc.setFillColor(250, 248, 244);
  doc.rect(MARGIN, y, CONTENT_W, 18, "F");
  doc.setTextColor(100, 85, 60);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const nights = Math.round(
    (new Date(data.checkOut).getTime() - new Date(data.checkIn).getTime()) / 86_400_000
  );
  const summaryItems = [
    `${nights} nights`,
    `${data.days.length} days`,
    data.bonvoyPoints ? `${data.bonvoyPoints.toLocaleString()} Bonvoy Points` : null,
    data.totalCost ? `Total: $${data.totalCost.toLocaleString()}` : null,
    data.memberName ? `Guest: ${data.memberName}` : null,
  ].filter(Boolean) as string[];

  const colW = CONTENT_W / summaryItems.length;
  summaryItems.forEach((item, i) => {
    doc.text(item, MARGIN + i * colW + colW / 2, y + 11, { align: "center" });
  });

  y += 24;

  // ── Daily itinerary ──────────────────────────────────────────────────────────
  for (const day of data.days) {
    newPageIfNeeded(30);

    // Day header
    doc.setFillColor(240, 236, 228);
    doc.rect(MARGIN, y, CONTENT_W, 10, "F");
    doc.setTextColor(80, 60, 30);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(day.label ?? formatDateDisplay(day.date), MARGIN + 4, y + 7);
    y += 14;

    for (const item of day.items) {
      newPageIfNeeded(24);

      const icon = TYPE_ICONS[item.type];

      // Time column
      if (item.time) {
        doc.setFontSize(8);
        doc.setTextColor(150, 130, 100);
        doc.setFont("helvetica", "normal");
        doc.text(item.time, MARGIN, y + 4.5);
      }

      const itemX = MARGIN + 14;
      const itemW = CONTENT_W - 14;

      // Icon + title
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(40, 30, 20);
      doc.text(`${icon}  ${item.title}`, itemX, y + 4.5);

      y += 8;

      // Description
      if (item.description) {
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 90, 75);
        const lines = doc.splitTextToSize(item.description, itemW - 4);
        lines.forEach((line: string) => {
          newPageIfNeeded(6);
          doc.text(line, itemX + 4, y + 4);
          y += 5;
        });
      }

      // Meta row (price + confirmation)
      const metaParts: string[] = [];
      if (item.price) metaParts.push(`$${item.price} ${item.currency ?? ""}`);
      if (item.address) metaParts.push(item.address);
      if (item.confirmationRef) metaParts.push(`Ref: ${item.confirmationRef}`);
      if (metaParts.length > 0) {
        doc.setFontSize(7.5);
        doc.setTextColor(130, 115, 95);
        doc.text(metaParts.join("  ·  "), itemX + 4, y + 4);
        y += 6;
      }

      y += 3;
    }

    drawLine();
  }

  // ── Footer ───────────────────────────────────────────────────────────────────
  newPageIfNeeded(20);
  y += 4;
  doc.setFontSize(7.5);
  doc.setTextColor(160, 150, 130);
  doc.setFont("helvetica", "normal");
  const footerText = `Generated by Marriott Bonvoy AI Travel Planner  ·  marriottbonvoy.com/hvmi  ·  ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`;
  doc.text(footerText, PAGE_W / 2, y, { align: "center" });

  // Return object URL for download / preview
  const blob = doc.output("blob");
  return URL.createObjectURL(blob);
}

/** Triggers a browser download of the generated PDF. */
export async function downloadItineraryPdf(data: PdfItineraryData, filename?: string): Promise<void> {
  const url = await generateItineraryPdf(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? `${data.tripTitle.toLowerCase().replace(/\s+/g, "-")}-itinerary.pdf`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}
