import { dbRun } from "./db-run.js";

export const dbMigrationAllDown = () => dbRun("migration", "down", "all");
