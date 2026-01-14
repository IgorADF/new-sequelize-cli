import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { Transaction } from "sequelize";
import { DataType, type Sequelize } from "sequelize-typescript";
import type { RunFileExport } from "../@types/run-file-export.js";
import type { RunnerConfig } from "../@types/runner-config.js";
import { SequelizeRunnerDefaultError } from "../errors/_default.js";
import { createSequelizeInstance } from "../sequelize-instance.js";

type ConfigType = {
	tableName: string;
	columnName: string;
};

const migrationConfig: ConfigType = {
	tableName: "SequelizeMigrations",
	columnName: "name",
} as const;

const seedConfig: ConfigType = {
	tableName: "SequelizeSeeds",
	columnName: "name",
} as const;

type DbRunType = "seed" | "migration";
type DbRunRunningDirection = "up" | "down";
type DbRunRunningType = "all" | "last";

export async function dbRun(
	type: DbRunType,
	runningDirection: DbRunRunningDirection,
	runningType: DbRunRunningType,
) {
	try {
		const { instance, runnerConfig } = await createSequelizeInstance();

		const config = getConfigByRunType(type);
		const filesToSkip = await readDb(instance, config);

		const pathToFolder = getFolderPathByRunType(type, runnerConfig);
		let folderFiles = await readFromFolder(pathToFolder, runningType);
		if (runningDirection === "down") {
			folderFiles = folderFiles.toReversed();
		}

		const filesToRun = folderFiles.filter(
			(file) =>
				!filesToSkip.find(
					(filesToSkip) => filesToSkip[config.columnName] === file,
				),
		);

		await run(instance, filesToRun, pathToFolder, runningDirection, config);

		await instance.close();
	} catch (error) {
		throw new SequelizeRunnerDefaultError(
			`Error running: ${(error as Error)?.message} `,
		);
	}
}

function getConfigByRunType(type: DbRunType): ConfigType {
	if (type === "migration") {
		return migrationConfig;
	} else if (type === "seed") {
		return seedConfig;
	} else {
		throw new SequelizeRunnerDefaultError(
			`Invalid type provided to getConfigByRunType: ${type}`,
		);
	}
}

function getFolderPathByRunType(type: DbRunType, runnerConfig: RunnerConfig) {
	if (type === "migration") {
		return runnerConfig.migrationsFolderPath;
	} else if (type === "seed") {
		return runnerConfig.seedersFolderPath;
	} else {
		throw new SequelizeRunnerDefaultError(
			`Invalid type provided to getFolderPathByRunType: ${type}`,
		);
	}
}

function verifyTableExist(instance: Sequelize, tableName: string) {
	return instance.getQueryInterface().tableExists(tableName);
}

function createTable(instance: Sequelize, tableConfig: ConfigType) {
	return instance.getQueryInterface().createTable(tableConfig.tableName, [
		{
			field: tableConfig.columnName,
			type: DataType.STRING,
			unique: true,
			allowNull: false,
			primaryKey: true,
		},
	] as any);
}

async function readDb(instance: Sequelize, config: ConfigType) {
	const doesTableExist = await verifyTableExist(instance, config.tableName);

	if (!doesTableExist) {
		await createTable(instance, config);
		return [];
	}

	const data = await instance
		.getQueryInterface()
		.select(null, config.tableName);

	return data as { [key: string]: string }[];
}

async function readFromFolder(
	pathToFolder: string,
	fileType: DbRunRunningType,
) {
	pathToFolder = path.resolve(pathToFolder);

	let folderFiles = fs
		.readdirSync(pathToFolder)
		.filter((file) => file.endsWith(".js") || file.endsWith(".ts"));

	if (fileType === "last") {
		folderFiles = folderFiles.slice(-1);
	}

	return folderFiles;
}

function createRecord(
	instance: Sequelize,
	fileName: string,
	config: ConfigType,
	transaction: Transaction,
) {
	return instance.getQueryInterface().insert(
		null,
		config.tableName,
		{
			[config.columnName]: fileName,
		},
		{ transaction },
	);
}

async function run(
	instance: Sequelize,
	filesToRun: string[],
	folderPath: string,
	type: DbRunRunningDirection,
	config: ConfigType,
) {
	for (const fileName of filesToRun) {
		const filePath = path.join(folderPath, fileName);

		const moduleImport = await import(pathToFileURL(filePath).href);
		if (!moduleImport?.default) {
			throw new SequelizeRunnerDefaultError(
				`File ${filePath} must export a default object`,
			);
		}

		const { up, down } = moduleImport.default as RunFileExport;
		if (typeof up !== "function" || typeof down !== "function") {
			throw new SequelizeRunnerDefaultError(
				`File ${filePath} must export an object with "up" and "down" functions`,
			);
		}

		const transaction = await instance.transaction();

		try {
			if (type === "up") {
				await up(instance.getQueryInterface(), transaction);
			} else if (type === "down") {
				await down(instance.getQueryInterface(), transaction);
			} else {
				throw new SequelizeRunnerDefaultError(`Invalid type: ${type}`);
			}

			await createRecord(instance, fileName, config, transaction);

			await transaction.commit();
		} catch {
			await transaction.rollback();
		}
	}
}
