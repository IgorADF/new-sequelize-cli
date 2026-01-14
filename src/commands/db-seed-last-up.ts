import { dbRun } from "./db-run.js";

export const dbSeedLastUp = () => dbRun("seed", "up", "last");
