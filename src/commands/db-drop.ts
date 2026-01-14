import { SequelizeRunnerDefaultError } from "../errors/_default.js";
import { ValidationError } from "../errors/validation-error.js";
import { createSequelizeInstance } from "../sequelize-instance.js";

export async function dbDrop() {
	try {
		const { instance, sequelizeOriginalConfig } = await createSequelizeInstance(
			{
				defaultInstanceConfig: { database: undefined },
			},
		);

		if (sequelizeOriginalConfig?.database === undefined) {
			throw new ValidationError(
				"Database name is undefined in Sequelize config",
			);
		}

		await instance
			.getQueryInterface()
			.dropDatabase(sequelizeOriginalConfig.database);

		await instance.close();
	} catch (error) {
		throw new SequelizeRunnerDefaultError(
			`Error dropping database: ${(error as Error)?.message} `,
		);
	}
}
