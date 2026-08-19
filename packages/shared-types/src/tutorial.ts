import { z } from "zod";

export const TutorialSchema = z.object({
  id: z.string(),
  title: z.string(),
  titleEn: z.string().optional(),
  description: z.string(),
  descriptionEn: z.string().optional(),
  videoUrl: z.string(),
  category: z.string(),
  order: z.number(),
  publishedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Tutorial = z.infer<typeof TutorialSchema>;

export const UpsertTutorialRequestSchema = z.object({
  title: z.string().trim().min(1, "title must not be empty"),
  titleEn: z.string().trim().optional(),
  description: z.string().trim().min(1, "description must not be empty"),
  descriptionEn: z.string().trim().optional(),
  videoUrl: z.string().trim().url("videoUrl must be a valid URL"),
  category: z.string().trim().min(1, "category must not be empty"),
  order: z.number().int().default(0),
  published: z.boolean().default(false),
});
export type UpsertTutorialRequest = z.infer<typeof UpsertTutorialRequestSchema>;
