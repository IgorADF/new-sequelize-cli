import { Sequelize, type SequelizeOptions } from "sequelize-typescript";
import { SequelizeRunnerDefaultError } from "./errors/_default.js";
import { readAndGetRunnerFile } from "./runner-file.js";
import { readAndGetSequelizeConfigFile } from "./sequelize-config-file.js";

export async function createSequelizeInstance(options?: {
	defaultInstanceConfig?: Partial<SequelizeOptions>;
}) {
	const { config: runnerConfig } = await readAndGetRunnerFile();
	const { config: sequelizeOriginalConfig } =
		await readAndGetSequelizeConfigFile(runnerConfig.configFilePath);

	let instance: Sequelize;

	try {
		const cloneConfig = structuredClone(sequelizeOriginalConfig);
		const sequelizeFinalConfig = {
			...cloneConfig,
			...options?.defaultInstanceConfig,
		};

		instance = new Sequelize(sequelizeFinalConfig);

		await instance.authenticate();

		return {
			instance,
			runnerConfig,
			sequelizeOriginalConfig,
			sequelizeFinalConfig,
		};
	} catch (err) {
		throw new SequelizeRunnerDefaultError(
			`Could not create Sequelize instance with provided config` +
				` - ${(err as Error)?.message}`,
		);
	}
}
