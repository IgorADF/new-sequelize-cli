# Sequelize Runner

A modern TypeScript-first CLI tool for Sequelize database migrations and seeds, built to solve PostgreSQL schema issues that exist in the original Sequelize CLI.

## Why This Project Exists

This project was created to support all Sequelize CLI features while resolving a critical problem with PostgreSQL schemas:

- **The Core Issue**: The original Sequelize CLI has limitations when working with PostgreSQL schemas
- **Root Cause**: The problem originates from Sequelize itself, not just the CLI (though there are related issues within Sequelize CLI as well)
- **The Solution**: This project is a reimplementation of Sequelize CLI **without Umzug** (a migration tool), providing direct control over migration execution and better PostgreSQL schema support

## Key Features

- ✅ **TypeScript-first**: Uses `.ts` files by default (powered by tsx)
- ✅ **ESM Modules**: Modern ES module support out of the box
- ✅ **PostgreSQL Optimized**: Built primarily for PostgreSQL with support for other databases
- ✅ **No Umzug**: Direct migration control without third-party migration tools
- ✅ **Transaction Support**: Automatic transaction injection in up/down migration functions

## Implemented Commands

### Database Management

- `db:create` - Create the database
- `db:drop` - Drop the database
- `db:run` - Execute custom database commands

### Migrations

- `db:migrate` - Run next pending migration
- `db:migrate:all` - Run all pending migrations
- `db:migrate:undo` - Undo last migration
- `db:migrate:undo:all` - Undo all migrations
- `migration:create` - Create a new migration file (named with date + sequential number)

### Seeds

- `db:seed` - Run next pending seed
- `db:seed:all` - Run all pending seeds
- `db:seed:undo` - Undo last seed
- `db:seed:undo:all` - Undo all seeds
- `seed:create` - Create a new seed file

## Planned Features

### Coming Soon

- `db:ping` - Check database connectivity
- `db:reset` - Complete database reset (drop + create + migrate:all + seed:all) with confirmation

### Future Enhancements

- **Tags**: Run migrations/seeds from start file to end file
- **Re-run Flag**: Ignore already executed migrations/seeds

## Migration & Seed Features

All migration and seed files automatically include:

- Transaction injection in `up` and `down` functions
- Sequelize instance access
- DataTypes for model definitions
- TypeScript support with proper typing

## Installation

```bash
npm install sequelize-runner
```

## Configuration

Create a `sequelizerunner.ts` configuration file in your project root to define your database connection and options.

## Usage Example

```bash
# Create a new migration
npx sequelize-runner migration:create add-users-table

# Run all pending migrations
npx sequelize-runner db:migrate:all

# Create a seed file
npx sequelize-runner seed:create demo-users

# Run all seeds
npx sequelize-runner db:seed:all
```

## Project Structure

```
src/
├── commands/           # CLI command implementations
├── @types/            # TypeScript type definitions
├── errors/            # Custom error classes
├── runner-file.ts     # Migration/seed file runner
├── sequelize-config-file.ts
└── sequelize-instance.ts
```

## Dependencies

- **sequelize**: ^6.37.7
- **sequelize-typescript**: ^2.1.6
- **pg**: PostgreSQL client
- **tsx**: TypeScript execution
- **yargs**: CLI argument parsing
- **zod**: Schema validation

## Development

```bash
# Lint code
npm run lint

# Format code
npm run format

# Organize and fix all
npm run organize:all

# Build
npm run build
```

## License

ISC

## Contributing

This project aims to provide a robust alternative to Sequelize CLI with better PostgreSQL schema support. Contributions are welcome!
