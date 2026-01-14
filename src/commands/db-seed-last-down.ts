import { dbRun } from "./db-run.js";

export const dbSeedLastDown = () => dbRun("seed", "down", "last");
