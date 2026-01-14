import { dbRun } from "./db-run.js";

export const dbMigrationNextDown = () => dbRun("migration", "down", "next");
