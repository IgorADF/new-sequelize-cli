import child from "node:child_process";
import fs from "node:fs";
import path from "node:path";

console.log("Removing old dist...");

const distPath = path.resolve(process.cwd(), "dist");
fs.rmSync(distPath, { recursive: true, force: true });

console.log("Old dist removed.");
console.log("Building new dist...");

child.execSync("npx tsc", { stdio: "inherit" });

console.log("New dist built.");
