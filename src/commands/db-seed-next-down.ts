import { dbRun } from "./db-run.js";

export const dbSeedNextDown = () => dbRun("seed", "down", "next");
