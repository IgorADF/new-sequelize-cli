import type { QueryInterface, Transaction } from "sequelize";

export type RunFileExport = {
	up: (
		queryInterface: QueryInterface,
		transaction: Transaction,
	) => Promise<void>;
	down: (
		queryInterface: QueryInterface,
		transaction: Transaction,
	) => Promise<void>;
};
