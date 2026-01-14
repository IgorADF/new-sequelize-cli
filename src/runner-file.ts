import path from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";
import { SequelizeRunnerDefaultError } from "./errors/_default.js";
import { ReadFileError } from "./errors/read-file.js";

const runnerFileDefaultName = "sequelize-runner.ts";

export const RunnerConfigSchema = z.object({
	configFilePath: z.string(),
	modelsFolderPath: z.string(),
	migrationsFolderPath: z.string(),
	seedersFolderPath: z.string(),
});

export async function readAndGetRunnerFile() {
	const runnerFilePath = path.resolve(process.cwd(), runnerFileDefaultName);
	let runnerFile: any;

	try {
		runnerFile = await import(pathToFileURL(runnerFilePath).href); // Or use url?
	} catch {
		throw new ReadFileError(
			`Could not import runner file at path: ${runnerFilePath}`,
		);
	}

	if (!runnerFile?.default) {
		throw new SequelizeRunnerDefaultError(
			`Runner file must export a default function`,
		);
	}

	const parsedConfig = RunnerConfigSchema.safeParse(runnerFile.default);
	if (!parsedConfig.success) {
		throw new SequelizeRunnerDefaultError(
			`Runner file default export is not valid: ${parsedConfig.error.message}`,
		);
	}

	return {
		config: parsedConfig.data,
	};
}
