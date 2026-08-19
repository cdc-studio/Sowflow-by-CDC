import { jsPDF } from "jspdf";
import type { SowExtraction } from "@sowflow/shared-types";
import { NOTO_SANS_GEORGIAN_BOLD_BASE64, NOTO_SANS_GEORGIAN_REGULAR_BASE64 } from "@/lib/fonts/notoSansGeorgian";

const PDF_FONT = "NotoSansGeorgian";

interface BrandingInfo {
  companyName?: string;
  addressLine?: string;
  vatId?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

const MARGIN = 48;
const LINE_HEIGHT = 14;

function hexToRgb(hex: string | undefined, fallback: [number, number, number]): [number, number, number] {
  if (!hex) return fallback;
  const match = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!match) return fallback;
  return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
}

function imageFormatFromDataUrl(dataUrl: string): string {
  const match = /^data:image\/(\w+);/.exec(dataUrl);
  const type = match?.[1]?.toUpperCase() ?? "PNG";
  return type === "JPG" ? "JPEG" : type;
}

class PdfWriter {
  private readonly doc: jsPDF;
  private readonly pageWidth: number;
  private readonly pageHeight: number;
  private readonly contentWidth: number;
  private y = MARGIN;
  private readonly primary: [number, number, number];

  constructor(private readonly branding: BrandingInfo) {
    this.doc = new jsPDF({ unit: "pt", format: "letter" });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.contentWidth = this.pageWidth - MARGIN * 2;
    this.primary = hexToRgb(branding.primaryColor, [29, 78, 216]);

    // Helvetica (jsPDF's default) has no Georgian glyphs, so any ka-GE text
    // renders as blank boxes. Embed Noto Sans Georgian for every weight we
    // use — it covers both Latin and Georgian, so all text goes through one
    // font instead of switching per-language.
    this.doc.addFileToVFS("NotoSansGeorgian-Regular.ttf", NOTO_SANS_GEORGIAN_REGULAR_BASE64);
    this.doc.addFont("NotoSansGeorgian-Regular.ttf", PDF_FONT, "normal");
    this.doc.addFileToVFS("NotoSansGeorgian-Bold.ttf", NOTO_SANS_GEORGIAN_BOLD_BASE64);
    this.doc.addFont("NotoSansGeorgian-Bold.ttf", PDF_FONT, "bold");
  }

  private ensureSpace(height: number) {
    if (this.y + height > this.pageHeight - MARGIN) {
      this.doc.addPage();
      this.y = MARGIN;
    }
  }

  addLogo(dataUrl: string | null) {
    if (dataUrl) {
      try {
        const format = imageFormatFromDataUrl(dataUrl);
        this.doc.addImage(dataUrl, format, MARGIN, this.y, 48, 48);
        return;
      } catch {
        // Malformed/unsupported image data — fall through to the drawn mark below.
      }
    }
    // No agency logo on file: draw the SOWFlow mark (vector, matching
    // components/Logo.tsx's badge-with-flow-lines shape) instead of leaving
    // the header blank or defaulting to some other brand's asset.
    const [r, g, b] = this.primary;
    this.doc.setFillColor(r, g, b);
    this.doc.roundedRect(MARGIN, this.y, 40, 40, 11, 11, "F");
    this.doc.setDrawColor(255, 255, 255);
    this.doc.setLineWidth(1.6);
    this.doc.line(MARGIN + 8, this.y + 24, MARGIN + 32, this.y + 24);
    this.doc.setLineWidth(1.6);
    this.doc.line(MARGIN + 8, this.y + 16, MARGIN + 32, this.y + 16);
  }

  companyHeader() {
    const textX = MARGIN + 60;
    const headerWidth = this.pageWidth - textX - MARGIN;
    this.doc.setFont(PDF_FONT, "bold");
    this.doc.setFontSize(14);
    this.doc.setTextColor(...this.primary);
    // Company name is free-text (and may be in Georgian, which runs longer
    // than Latin for the same content), so it can't be trusted to fit on one
    // line next to the logo — wrap it like paragraph()/bulletList() do.
    const nameLines = this.doc.splitTextToSize(this.branding.companyName || "SOWFlow", headerWidth) as string[];
    let lineY = this.y + 18;
    for (const line of nameLines) {
      this.doc.text(line, textX, lineY);
      lineY += 14;
    }
    this.doc.setFont(PDF_FONT, "normal");
    this.doc.setFontSize(9);
    this.doc.setTextColor(100, 100, 100);
    if (this.branding.addressLine) {
      this.doc.text(this.branding.addressLine, textX, lineY);
      lineY += 14;
    }
    this.y = Math.max(this.y + 64, lineY + 8);
  }

  title(text: string) {
    this.doc.setFont(PDF_FONT, "bold");
    this.doc.setFontSize(18);
    this.doc.setTextColor(20, 20, 20);
    const lines = this.doc.splitTextToSize(text, this.contentWidth) as string[];
    for (const line of lines) {
      this.ensureSpace(24);
      this.doc.text(line, MARGIN, this.y);
      this.y += 24;
    }
  }

  subtitle(text: string) {
    this.doc.setFont(PDF_FONT, "normal");
    this.doc.setFontSize(11);
    this.doc.setTextColor(80, 80, 80);
    const lines = this.doc.splitTextToSize(text, this.contentWidth) as string[];
    for (const line of lines) {
      this.ensureSpace(18);
      this.doc.text(line, MARGIN, this.y);
      this.y += 18;
    }
  }

  sectionHeading(text: string) {
    this.ensureSpace(24);
    this.y += 8;
    this.doc.setFont(PDF_FONT, "bold");
    this.doc.setFontSize(13);
    this.doc.setTextColor(...this.primary);
    this.doc.text(text, MARGIN, this.y);
    this.y += 16;
  }

  paragraph(text: string) {
    this.doc.setFont(PDF_FONT, "normal");
    this.doc.setFontSize(10);
    this.doc.setTextColor(30, 30, 30);
    const lines = this.doc.splitTextToSize(text, this.contentWidth) as string[];
    for (const line of lines) {
      this.ensureSpace(LINE_HEIGHT);
      this.doc.text(line, MARGIN, this.y);
      this.y += LINE_HEIGHT;
    }
  }

  bulletList(items: string[], emptyText: string) {
    if (items.length === 0) {
      this.paragraph(emptyText);
      return;
    }
    for (const item of items) {
      this.doc.setFont(PDF_FONT, "normal");
      this.doc.setFontSize(10);
      this.doc.setTextColor(30, 30, 30);
      const lines = this.doc.splitTextToSize(`•  ${item}`, this.contentWidth - 10) as string[];
      for (const line of lines) {
        this.ensureSpace(LINE_HEIGHT);
        this.doc.text(line, MARGIN, this.y);
        this.y += LINE_HEIGHT;
      }
    }
  }

  footer() {
    const footerY = this.pageHeight - MARGIN / 2;
    const pageCount = this.doc.getNumberOfPages();
    for (let page = 1; page <= pageCount; page++) {
      this.doc.setPage(page);
      this.doc.setFont(PDF_FONT, "normal");
      this.doc.setFontSize(8);
      this.doc.setTextColor(140, 140, 140);
      const footerText = [this.branding.companyName, this.branding.vatId ? `VAT: ${this.branding.vatId}` : null]
        .filter(Boolean)
        .join("   •   ");
      if (footerText) {
        this.doc.text(footerText, MARGIN, footerY);
      }
      this.doc.text(`${page} / ${pageCount}`, this.pageWidth - MARGIN, footerY, { align: "right" });
    }
  }

  save(fileName: string) {
    this.doc.save(fileName);
  }
}

export function generateSowPdf(sow: SowExtraction, branding: BrandingInfo, logoDataUrl: string | null) {
  const writer = new PdfWriter(branding);
  writer.addLogo(logoDataUrl);
  writer.companyHeader();
  writer.title(sow.projectTitle);
  writer.subtitle(`Prepared for ${sow.clientName}`);

  writer.sectionHeading("Executive Summary");
  writer.paragraph(sow.executiveSummary);

  writer.sectionHeading("Project Objectives");
  writer.bulletList(sow.projectObjectives, "No objectives listed.");

  writer.sectionHeading("Deliverables & Milestones");
  writer.bulletList(
    sow.deliverables.map((d) => {
      const parts = [d.title, d.description];
      if (d.milestone) parts.push(`Milestone: ${d.milestone}`);
      if (d.dueDate) parts.push(`Due: ${d.dueDate}`);
      return parts.join(" — ");
    }),
    "No deliverables listed.",
  );

  writer.sectionHeading("Out of Scope");
  writer.bulletList(sow.outOfScope, "Nothing explicitly excluded.");

  writer.sectionHeading("Pricing");
  const pricingLines = [`Model: ${sow.pricing.model} (${sow.pricing.currency})`];
  if (sow.pricing.totalAmount) pricingLines.push(`Total: ${sow.pricing.totalAmount} ${sow.pricing.currency}`);
  if (sow.pricing.hourlyRate) pricingLines.push(`Hourly rate: ${sow.pricing.hourlyRate} ${sow.pricing.currency}`);
  if (sow.pricing.retainerAmount) {
    pricingLines.push(
      `Retainer: ${sow.pricing.retainerAmount} ${sow.pricing.currency} / ${sow.pricing.retainerPeriod ?? "period"}`,
    );
  }
  writer.paragraph(pricingLines.join("\n"));
  writer.bulletList(
    sow.pricing.paymentSchedule.map((p) => `${p.description}: ${p.amount} ${sow.pricing.currency} — ${p.trigger}`),
    "No payment schedule specified.",
  );

  writer.sectionHeading("Client Responsibilities");
  writer.bulletList(sow.clientResponsibilities, "None specified.");

  writer.sectionHeading("Asset Requirements");
  writer.bulletList(sow.assetRequirements, "None specified.");

  writer.footer();
  const safeName = sow.projectTitle.replace(/[^a-zA-Z0-9-_]+/g, "_").slice(0, 60) || "SOW";
  writer.save(`${safeName}.pdf`);
}
