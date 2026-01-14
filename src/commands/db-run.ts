import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { QueryTypes, type Transaction } from "sequelize";
import type { Sequelize } from "sequelize-typescript";
import type { DbRunType } from "../@types/db-run-type.js";
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

const defaultPostgresSchema = "public";

type DbRunRunningDirection = "up" | "down";
type DbRunRunningType = "all" | "next";

export async function dbRun(
	type: DbRunType,
	runningDirection: DbRunRunningDirection,
	runningType: DbRunRunningType,
) {
	try {
		const { instance, runnerConfig } = await createSequelizeInstance();

		const config = getConfigByRunType(type);
		const pathToFolder = getFolderPathByRunType(type, runnerConfig);

		const filesRunnedInsideDb = await createAndReadDb(instance, config);
		const folderFiles = await readFilesFromFolder(pathToFolder);
		const filesToRun = await getFilesToRun(
			folderFiles,
			filesRunnedInsideDb,
			runningType,
			runningDirection,
			config,
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

async function verifyTableExist(
	instance: Sequelize,
	config: ConfigType,
	schema: string,
) {
	const tableName = config.tableName;

	const query = `SELECT table_name FROM information_schema.tables WHERE table_schema = '${schema}' AND table_name = '${tableName}'`;

	const result = await instance.query(query, { type: QueryTypes.SELECT });
	const tableExist = result.length > 0;

	if (tableExist) {
		return;
	}

	await createTable(instance, config, schema);
}

async function createSchema(instance: Sequelize, schemaName: string) {
	const query = `CREATE SCHEMA IF NOT EXISTS "${schemaName}"`;
	await instance.query(query);
}

async function verifyAndCreateTableSchema(
	instance: Sequelize,
	config: ConfigType,
	schema: string,
) {
	if (!schema || schema === defaultPostgresSchema) {
		await verifyTableExist(instance, config, schema);
		return;
	}

	const dbSchemas = await instance.showAllSchemas({});
	const hasSchema = (dbSchemas as any[]).find((_schema) => _schema === schema);

	if (!hasSchema) {
		await createSchema(instance, schema);
	}

	await verifyTableExist(instance, config, schema);
}

function formatTableAndSchemaName(
	schema: string | undefined,
	tableName: string,
) {
	return schema ? `"${schema}"."${tableName}"` : `"${tableName}"`;
}

async function createTable(
	instance: Sequelize,
	config: ConfigType,
	schema: string,
) {
	const formattedTableName = formatTableAndSchemaName(schema, config.tableName);
	const query = `CREATE TABLE IF NOT EXISTS ${formattedTableName} ("${config.columnName}" VARCHAR(255) NOT NULL UNIQUE , PRIMARY KEY ("${config.columnName}"));`;
	await instance.query(query);
}

async function getTableData(
	instance: Sequelize,
	config: ConfigType,
	schema: string,
) {
	const formattedTableName = formatTableAndSchemaName(schema, config.tableName);

	const query = `SELECT * FROM ${formattedTableName}`;
	const result = await instance.query(query, { type: QueryTypes.SELECT });

	return result;
}

async function createAndReadDb(instance: Sequelize, config: ConfigType) {
	// const schema = instance.options.schema || defaultPostgresSchema;
	const schema = defaultPostgresSchema;

	await verifyAndCreateTableSchema(instance, config, schema);
	const data = await getTableData(instance, config, schema);

	return data as { [key: string]: string }[];
}

async function readFilesFromFolder(pathToFolder: string) {
	pathToFolder = path.resolve(pathToFolder);

	return fs
		.readdirSync(pathToFolder)
		.filter((file) => file.endsWith(".js") || file.endsWith(".ts"));
}

async function getFilesToRun(
	folderFiles: string[],
	filesRunnedInsideDb: { [key: string]: string }[],
	fileType: DbRunRunningType,
	runningDirection: DbRunRunningDirection,
	config: ConfigType,
) {
	let filesToRun = folderFiles.filter((file) => {
		return runningDirection === "up"
			? !filesRunnedInsideDb.find(
					(filesToSkip) => filesToSkip[config.columnName] === file,
				)
			: filesRunnedInsideDb.find(
					(filesToSkip) => filesToSkip[config.columnName] === file,
				);
	});

	if (fileType === "next") {
		if (runningDirection === "down") {
			filesToRun = filesToRun.slice(-1);
		} else if (runningDirection === "up") {
			filesToRun = filesToRun.slice(0, 1);
		} else {
			throw new SequelizeRunnerDefaultError(
				`Invalid runningDirection provided to readFromFolder: ${runningDirection}`,
			);
		}
	}

	if (runningDirection === "down") {
		filesToRun = filesToRun.toReversed();
	}

	return filesToRun;
}

function createRecord(
	instance: Sequelize,
	fileName: string,
	config: ConfigType,
	transaction: Transaction,
) {
	return instance.getQueryInterface().bulkInsert(
		config.tableName,
		[
			{
				[config.columnName]: fileName,
			},
		],
		{ transaction },
	);
}

function removeRecord(
	instance: Sequelize,
	fileName: string,
	config: ConfigType,
	transaction: Transaction,
) {
	return instance.getQueryInterface().bulkDelete(
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
				await createRecord(instance, fileName, config, transaction);
			} else if (type === "down") {
				await down(instance.getQueryInterface(), transaction);
				await removeRecord(instance, fileName, config, transaction);
			} else {
				throw new SequelizeRunnerDefaultError(`Invalid type: ${type}`);
			}

			await transaction.commit();
		} catch (err) {
			await transaction.rollback();
			throw new SequelizeRunnerDefaultError(
				`Error running file: ${filePath}: ${(err as Error)?.message ?? ""}`,
			);
		}
	}
}
