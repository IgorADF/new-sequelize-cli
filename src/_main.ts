#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const argv = await yargs(hideBin(process.argv))
	.option("command", {
		alias: "c",
		type: "string",
		description: "Command to execute",
	})
	.parse();

console.log(argv.command);
