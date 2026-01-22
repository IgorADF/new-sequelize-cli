import type { QueryInterface, Transaction } from "sequelize";

export type RunFileExport = {
	up: (
		queryInterface: QueryInterface,
		transaction: Transaction,
		schema: string,
	) => Promise<void>;
	down: (
		queryInterface: QueryInterface,
		transaction: Transaction,
		schema: string,
	) => Promise<void>;
};
