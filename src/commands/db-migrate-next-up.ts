import { dbRun } from "./db-run.js";

export const dbMigrationNextUp = () => dbRun("migration", "up", "next");
