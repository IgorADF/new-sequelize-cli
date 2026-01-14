import { dbRun } from "./db-run.js";

export const dbSeedAllUp = () => dbRun("seed", "up", "all");
