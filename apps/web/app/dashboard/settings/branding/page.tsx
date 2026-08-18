"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BrandingForm {
  companyName: string;
  addressLine: string;
  vatId: string;
  primaryColor: string;
  secondaryColor: string;
}

const DEFAULT_FORM: BrandingForm = {
  companyName: "",
  addressLine: "",
  vatId: "",
  primaryColor: "#1D4ED8",
  secondaryColor: "#F59E0B",
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function BrandingSettingsPage() {
  const [form, setForm] = useState<BrandingForm>(DEFAULT_FORM);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [pendingLogo, setPendingLogo] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [brandingRes, logoRes] = await Promise.all([
          fetch("/api/branding", { cache: "no-store" }),
          fetch("/api/branding/logo-data-url", { cache: "no-store" }),
        ]);
        const branding = await brandingRes.json().catch(() => null);
        const logo = await logoRes.json().catch(() => null);

        if (branding) {
          setForm({
            companyName: branding.companyName ?? "",
            addressLine: branding.addressLine ?? "",
            vatId: branding.vatId ?? "",
            primaryColor: branding.primaryColor ?? DEFAULT_FORM.primaryColor,
            secondaryColor: branding.secondaryColor ?? DEFAULT_FORM.secondaryColor,
          });
        }
        if (logo?.dataUrl) {
          setLogoPreview(logo.dataUrl);
        }
      } catch {
        setError("Failed to load branding settings.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPendingLogo(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const logo = pendingLogo
        ? {
            fileName: pendingLogo.name,
            contentType: pendingLogo.type || "application/octet-stream",
            dataBase64: await fileToBase64(pendingLogo),
          }
        : undefined;

      const response = await fetch("/api/branding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, logo }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.error ?? "Failed to save branding.");
        return;
      }

      setPendingLogo(null);
      setSaved(true);
    } catch {
      setError("Failed to save branding.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 text-sm text-muted-foreground">Loading…</div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">White-label branding</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Applied to the header and footer of every generated SOW, including PDF exports.
      </p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Company details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Logo</Label>
              <div className="flex items-center gap-4">
                {logoPreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoPreview} alt="Logo preview" className="h-12 w-12 rounded object-contain" />
                )}
                <input type="file" accept="image/*" onChange={handleLogoChange} className="text-sm" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Company name</Label>
              <Input
                value={form.companyName}
                onChange={(event) => setForm({ ...form, companyName: event.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Address</Label>
              <Input
                value={form.addressLine}
                onChange={(event) => setForm({ ...form, addressLine: event.target.value })}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>VAT / Tax ID</Label>
              <Input value={form.vatId} onChange={(event) => setForm({ ...form, vatId: event.target.value })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Primary color</Label>
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(event) => setForm({ ...form, primaryColor: event.target.value })}
                  className="h-10 w-full rounded-md border border-input"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Secondary color</Label>
                <input
                  type="color"
                  value={form.secondaryColor}
                  onChange={(event) => setForm({ ...form, secondaryColor: event.target.value })}
                  className="h-10 w-full rounded-md border border-input"
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {saved && <p className="text-sm text-muted-foreground">Saved.</p>}

            <Button type="submit" disabled={saving} className="self-start">
              {saving ? "Saving…" : "Save branding"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
