import { z } from "zod";

export const BrandingSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  companyName: z.string().optional(),
  hasLogo: z.boolean().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  addressLine: z.string().optional(),
  vatId: z.string().optional(),
  updatedAt: z.string(),
});
export type Branding = z.infer<typeof BrandingSchema>;

export const UpsertBrandingRequestSchema = z.object({
  ownerId: z.string().min(1),
  companyName: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  addressLine: z.string().optional(),
  vatId: z.string().optional(),
  logo: z
    .object({
      fileName: z.string(),
      contentType: z.string(),
      dataBase64: z.string(),
    })
    .optional(),
});
export type UpsertBrandingRequest = z.infer<typeof UpsertBrandingRequestSchema>;
