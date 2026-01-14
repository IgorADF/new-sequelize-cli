import { dbRun } from "./db-run.js";

export const dbSeedNextUp = () => dbRun("seed", "up", "next");
