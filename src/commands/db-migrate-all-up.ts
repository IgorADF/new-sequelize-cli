import { dbRun } from "./db-run.js";

export const dbMigrationAllUp = () => dbRun("migration", "up", "all");
