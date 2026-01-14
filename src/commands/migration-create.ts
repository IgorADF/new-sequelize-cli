import fs from "node:fs";
import path from "node:path";
import { DateTime } from "luxon";
import { SequelizeRunnerDefaultError } from "../errors/_default.js";
import { createSequelizeInstance } from "../sequelize-instance.js";

const newMigrationFileTimestampFormat = "yyyy_MM_dd_HH_mm_ss";

export async function migrationCreate() {
	try {
		const { instance, runnerConfig } = await createSequelizeInstance();

		const fileName = DateTime.now().toFormat(newMigrationFileTimestampFormat);

		const fullPathToNewMigrationFile = path.join(
			runnerConfig.migrationsFolderPath,
			`${fileName}-new-migration.ts`,
		);

		fs.writeFileSync(fullPathToNewMigrationFile, fileTemplate);

		await instance.close();
	} catch (error) {
		throw new SequelizeRunnerDefaultError(
			`Error running migrations: ${(error as Error)?.message} `,
		);
	}
}

const fileTemplate = `const Migration = {
    up: async () => {
    },
    down: async () => {
    }
}

export default Migration`;
