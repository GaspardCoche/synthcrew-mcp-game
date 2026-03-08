/**
 * Schémas Zod pour validation des entrées API (CLI, missions, automations).
 */
import { z } from "zod";

export const cliTaskSchema = z.object({
  prompt: z.string().min(1, "Le prompt est requis"),
  title: z.string().max(200).optional(),
  source: z.enum(["claude-cli", "cursor", "api", "cron", "cli", "game"]).default("api"),
  autoRun: z.boolean().default(true),
  templateId: z.string().optional(),
});

export const missionCreateSchema = z.object({
  title: z.string().min(1).max(300),
  prompt: z.string().optional(),
  templateId: z.string().optional(),
  agentIds: z.array(z.string()).optional(),
  autoRun: z.boolean().default(false),
});

export const automationSchema = z.object({
  name: z.string().min(1).max(100),
  templateId: z.string().optional(),
  prompt: z.string().optional(),
  cron: z.string().optional(),
  enabled: z.boolean().optional(),
});
