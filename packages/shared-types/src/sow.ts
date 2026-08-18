import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { toOpenAIStrictJsonSchema } from "./openaiStrictSchema";

export const PricingModel = z.enum(["fixed", "hourly", "retainer"]);
export type PricingModel = z.infer<typeof PricingModel>;

export const PaymentMilestoneSchema = z.object({
  description: z.string(),
  amount: z.number().nonnegative(),
  trigger: z.string(),
});
export type PaymentMilestone = z.infer<typeof PaymentMilestoneSchema>;

export const DeliverableSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  milestone: z.string().optional(),
  dueDate: z.string().optional(),
});
export type Deliverable = z.infer<typeof DeliverableSchema>;

export const PricingSchema = z.object({
  model: PricingModel,
  currency: z.string().default("USD"),
  totalAmount: z.number().nonnegative().optional(),
  hourlyRate: z.number().nonnegative().optional(),
  retainerAmount: z.number().nonnegative().optional(),
  retainerPeriod: z.enum(["weekly", "monthly", "quarterly"]).optional(),
  paymentSchedule: z.array(PaymentMilestoneSchema).default([]),
});
export type Pricing = z.infer<typeof PricingSchema>;

export const RiskSeverity = z.enum(["low", "medium", "high"]);
export type RiskSeverity = z.infer<typeof RiskSeverity>;

export const RiskFlagSchema = z.object({
  quote: z.string(),
  risk: z.string(),
  severity: RiskSeverity,
});
export type RiskFlag = z.infer<typeof RiskFlagSchema>;

export const SowExtractionSchema = z.object({
  projectTitle: z.string(),
  clientName: z.string(),
  agencyName: z.string().optional(),
  sourceLanguage: z.string().optional(),
  executiveSummary: z.string(),
  projectObjectives: z.array(z.string()).default([]),
  deliverables: z.array(DeliverableSchema).default([]),
  outOfScope: z.array(z.string()).default([]),
  pricing: PricingSchema,
  clientResponsibilities: z.array(z.string()).default([]),
  assetRequirements: z.array(z.string()).default([]),
  riskFlags: z.array(RiskFlagSchema).default([]),
});
export type SowExtraction = z.infer<typeof SowExtractionSchema>;

export const sowExtractionJsonSchema = toOpenAIStrictJsonSchema(
  zodToJsonSchema(SowExtractionSchema) as Record<string, unknown>,
);
