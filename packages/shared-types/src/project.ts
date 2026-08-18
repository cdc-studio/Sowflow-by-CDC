import { z } from "zod";
import { SowExtractionSchema } from "./sow";

export const ProjectSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  extraction: SowExtractionSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Project = z.infer<typeof ProjectSchema>;

export const CreateProjectRequestSchema = z.object({
  ownerId: z.string().min(1),
  extraction: SowExtractionSchema,
});
export type CreateProjectRequest = z.infer<typeof CreateProjectRequestSchema>;

export const UpdateProjectRequestSchema = z.object({
  ownerId: z.string().min(1),
  extraction: SowExtractionSchema,
});
export type UpdateProjectRequest = z.infer<typeof UpdateProjectRequestSchema>;
