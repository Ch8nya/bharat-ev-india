# EV Database Development Notes

## Database Architecture

This application is designed to work with both PostgreSQL and in-memory storage:

1. **PostgreSQL Mode** (for local development and production)
   - Uses Drizzle ORM to interact with PostgreSQL database
   - All database operations in `server/storage.ts` as `DatabaseStorage` class
   - Schema defined in `shared/schema.ts`

2. **In-Memory Mode** (for Replit deployment)
   - Uses memory-based storage as fallback when PostgreSQL connection fails
   - All data operations in `server/memory-storage.ts` as `MemoryStorage` class
   - Loads data from CSV files in `attached_assets/` directory

The system automatically falls back to in-memory storage when PostgreSQL is unavailable, making it compatible with Replit's environment restrictions.

## Key Components

- **server/db.ts**: Manages database connection and storage fallback
- **server/storage.ts**: Implements the PostgreSQL database operations
- **server/memory-storage.ts**: Implements the in-memory storage fallback
- **shared/schema.ts**: Defines database schema and types used by both storage implementations
- **migrate.ts**: Script for PostgreSQL database setup and data import

## Adding New Features

When adding new features that require database interactions:

1. Add new models or modify existing ones in `shared/schema.ts`
2. Update `IStorage` interface in `server/storage.ts` with new operations
3. Implement the operations in both `server/storage.ts` (for PostgreSQL) and `server/memory-storage.ts` (for in-memory storage)
4. For importing data, update the CSV loading code in `server/memory-storage.ts` constructor

This dual implementation ensures your feature works in both environments.

## Important Notes

- The application handles 45 car models and 135 vehicle variants from the CSV files
- Some filtering and sorting operations behave differently between PostgreSQL and memory storage
- When developing locally with PostgreSQL, run `node migrate.ts` to set up the database and import data
- All authentications and admin operations work regardless of storage type

## Removed Redundant Files

The following files were deemed redundant and removed:
- `test-db-connection.js`: Simple test script
- `import-all-data.js`: Redundant with `migrate.ts`
- `setup-database.js`: Similar functionality in `migrate.ts`