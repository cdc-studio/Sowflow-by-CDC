"use client";

import { useEffect, useRef, useState } from "react";
import type { Branding, SowExtraction } from "@sowflow/shared-types";
import { cn } from "@/lib/utils";

interface SowDocumentPreviewProps {
  sow: SowExtraction;
  branding: Branding | null;
  logoDataUrl: string | null;
}

const SECTIONS = [
  { id: "summary", label: "Executive Summary" },
  { id: "objectives", label: "Objectives" },
  { id: "deliverables", label: "Deliverables" },
  { id: "out-of-scope", label: "Out of Scope" },
  { id: "pricing", label: "Pricing" },
  { id: "responsibilities", label: "Client Responsibilities" },
  { id: "assets", label: "Asset Requirements" },
];

export function SowDocumentPreview({ sow, branding, logoDataUrl }: SowDocumentPreviewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length > 0) {
          const topMost = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b));
          setActiveSection(topMost.target.id);
        }
      },
      { root, rootMargin: "-10% 0px -70% 0px", threshold: 0 },
    );

    for (const section of SECTIONS) {
      const el = root.querySelector(`#${section.id}`);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [sow]);

  function scrollToSection(id: string) {
    const root = scrollRef.current;
    const el = root?.querySelector(`#${id}`);
    if (el && root) {
      root.scrollTo({ top: (el as HTMLElement).offsetTop - 8, behavior: "smooth" });
    }
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto">
      <nav className="sticky top-0 z-10 flex flex-wrap gap-1 border-b border-border bg-popover/95 px-3 py-2 backdrop-blur">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => scrollToSection(section.id)}
            className={cn(
              "rounded-md px-2 py-1 text-xs font-medium transition-colors",
              activeSection === section.id
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {section.label}
          </button>
        ))}
      </nav>

      <div className="px-6 py-6 text-sm leading-relaxed">
        {(logoDataUrl || branding?.companyName) && (
          <div className="mb-6 flex items-center gap-3 border-b border-border pb-4">
            {logoDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoDataUrl} alt="" className="h-9 w-9 rounded object-contain" />
            )}
            <div>
              {branding?.companyName && <p className="font-semibold">{branding.companyName}</p>}
              {branding?.addressLine && <p className="text-xs text-muted-foreground">{branding.addressLine}</p>}
            </div>
          </div>
        )}

        <h1 className="text-xl font-semibold tracking-tight">{sow.projectTitle || "Untitled Project"}</h1>
        <p className="mt-1 text-muted-foreground">Prepared for {sow.clientName || "—"}</p>

        <PreviewSection id="summary" title="Executive Summary">
          <p className="whitespace-pre-wrap text-foreground/90">{sow.executiveSummary || "—"}</p>
        </PreviewSection>

        <PreviewSection id="objectives" title="Project Objectives">
          <BulletList items={sow.projectObjectives} />
        </PreviewSection>

        <PreviewSection id="deliverables" title="Deliverables & Milestones">
          {sow.deliverables.length === 0 ? (
            <p className="text-muted-foreground">No deliverables listed.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {sow.deliverables.map((d) => (
                <li key={d.id} className="rounded-md border border-border p-3">
                  <p className="font-medium">{d.title || "Untitled deliverable"}</p>
                  <p className="mt-1 text-foreground/80">{d.description}</p>
                  <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                    {d.milestone && <span>Milestone: {d.milestone}</span>}
                    {d.dueDate && <span>Due: {d.dueDate}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </PreviewSection>

        <PreviewSection id="out-of-scope" title="Out of Scope">
          <BulletList items={sow.outOfScope} />
        </PreviewSection>

        <PreviewSection id="pricing" title="Pricing">
          <p className="text-foreground/90">
            {sow.pricing.model === "fixed" && sow.pricing.totalAmount
              ? `Fixed fee: ${sow.pricing.totalAmount} ${sow.pricing.currency}`
              : sow.pricing.model === "hourly" && sow.pricing.hourlyRate
                ? `Hourly rate: ${sow.pricing.hourlyRate} ${sow.pricing.currency}/hr`
                : sow.pricing.model === "retainer" && sow.pricing.retainerAmount
                  ? `Retainer: ${sow.pricing.retainerAmount} ${sow.pricing.currency} / ${sow.pricing.retainerPeriod ?? "period"}`
                  : `${sow.pricing.model} (${sow.pricing.currency})`}
          </p>
          {sow.pricing.paymentSchedule.length > 0 && (
            <table className="mt-3 w-full border-collapse text-xs">
              <tbody>
                {sow.pricing.paymentSchedule.map((p, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="py-1.5 pr-2 text-foreground/90">{p.description}</td>
                    <td className="py-1.5 pr-2 text-muted-foreground">{p.trigger}</td>
                    <td className="py-1.5 text-right font-medium">
                      {p.amount} {sow.pricing.currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </PreviewSection>

        <PreviewSection id="responsibilities" title="Client Responsibilities">
          <BulletList items={sow.clientResponsibilities} />
        </PreviewSection>

        <PreviewSection id="assets" title="Asset Requirements">
          <BulletList items={sow.assetRequirements} />
        </PreviewSection>

        {(branding?.companyName || branding?.vatId) && (
          <div className="mt-8 border-t border-border pt-4 text-center text-xs text-muted-foreground">
            {[branding?.companyName, branding?.vatId ? `VAT: ${branding.vatId}` : null].filter(Boolean).join("  •  ")}
          </div>
        )}
      </div>
    </div>
  );
}

function PreviewSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-8 scroll-mt-4">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">{title}</h2>
      {children}
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <p className="text-muted-foreground">Nothing listed.</p>;
  }
  return (
    <ul className="flex list-disc flex-col gap-1 pl-5 text-foreground/90">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}
