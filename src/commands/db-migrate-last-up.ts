import { dbRun } from "./db-run.js";

export const dbMigrationLastUp = () => dbRun("migration", "up", "last");
