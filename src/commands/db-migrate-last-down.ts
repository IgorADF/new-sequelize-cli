import { dbRun } from "./db-run.js";

export const dbMigrationLastDown = () => dbRun("migration", "down", "last");
