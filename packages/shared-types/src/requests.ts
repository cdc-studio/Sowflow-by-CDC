import { z } from "zod";

export const ExtractSowRequestSchema = z.object({
  transcript: z.string().trim().min(1, "transcript must not be empty"),
});
export type ExtractSowRequest = z.infer<typeof ExtractSowRequestSchema>;
