import { dbRun } from "./db-run.js";

export const dbSeedAllDown = () => dbRun("seed", "down", "all");
