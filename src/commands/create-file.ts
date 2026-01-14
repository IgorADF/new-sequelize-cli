import fs from "node:fs";
import path from "node:path";
import { DateTime } from "luxon";
import type { DbRunType } from "../@types/db-run-type.js";
import type { RunnerConfig } from "../_export.js";
import { SequelizeRunnerDefaultError } from "../errors/_default.js";
import { createSequelizeInstance } from "../sequelize-instance.js";

const newMigrationFileTimestampFormat = "yyyy_MM_dd_HH_mm_ss";

const fileTemplate = `import { type RunFileExport } from 'sequelize-runner'

const _: RunFileExport = {
    up: async (queryInterface, transaction) => {
    },
    down: async (queryInterface, transaction) => {
    }
}

export default _`;

export async function createFile(type: "migration" | "seed") {
	try {
		const { instance, runnerConfig } = await createSequelizeInstance();

		const fileName = DateTime.now().toFormat(newMigrationFileTimestampFormat);

		const folderPath = getRunnerFolderPath(type, runnerConfig);

		const fullPathToNewFile = path.join(
			folderPath,
			`${fileName}-new-migration.ts`,
		);

		fs.writeFileSync(fullPathToNewFile, fileTemplate);

		await instance.close();
	} catch (error) {
		throw new SequelizeRunnerDefaultError(
			`Error running file creation: ${(error as Error)?.message} `,
		);
	}
}

function getRunnerFolderPath(
	type: DbRunType,
	runnerConfig: RunnerConfig,
): string {
	if (type === "migration") {
		return runnerConfig.migrationsFolderPath;
	} else if (type === "seed") {
		return runnerConfig.seedersFolderPath;
	} else {
		throw new SequelizeRunnerDefaultError(
			`Invalid type provided to runnerConfig: ${type}`,
		);
	}
}
