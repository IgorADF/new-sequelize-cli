import type z from "zod";
import type { RunnerConfigSchema } from "../runner-file.js";

export type RunnerConfig = z.infer<typeof RunnerConfigSchema>;
