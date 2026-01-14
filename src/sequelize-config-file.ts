import path from "node:path";
import { pathToFileURL } from "node:url";
import type { SequelizeInstanceOptions } from "./@types/sequelize-instance-options.js";
import { SequelizeRunnerDefaultError } from "./errors/_default.js";
import { ImportFileError } from "./errors/import-file.js";

export async function readAndGetSequelizeConfigFile(configPath: string) {
	const runnerFilePath = path.resolve(configPath);
	let runnerFile: any;

	try {
		runnerFile = await import(pathToFileURL(runnerFilePath).href);
	} catch {
		throw new ImportFileError(
			`Could not import sequelize config file at path: ${runnerFilePath}`,
		);
	}

	if (!runnerFile?.default) {
		throw new SequelizeRunnerDefaultError(
			`Sequelize config file must export a default object`,
		);
	}

	//Sequelize config validation???

	return {
		config: runnerFile.default as SequelizeInstanceOptions,
	};
}
