# EV Database Import Instructions

This document explains how to import data into the EV Database application.

## CSV Data Files

The application uses three CSV files for importing data:

1. `attached_assets/manufacturers_final.csv` - Contains manufacturer information
2. `attached_assets/models_final.csv` - Contains car model information
3. `attached_assets/vehicles_final.csv` - Contains vehicle variant information

## Simplified Import Process

We've simplified the import process to a single workflow:

### Using the Workflow

To import all data at once, simply run the "Import EV Data" workflow:

```
Import EV Data
```

This workflow will:
1. Clear all existing data
2. Import reference data (body styles, drive types, etc.)
3. Import all manufacturers
4. Import all car models
5. Import all vehicles
6. Create a default admin user

### What happens during import

The import process:
1. Parses the CSV files
2. Maps relationships between entities (manufacturers -> models -> vehicles)
3. Handles numeric conversions (for example, converting decimal strings to integers)
4. Creates proper foreign key relationships

## Troubleshooting Imports

If you encounter issues during the import process:

1. **Database Connection**: Ensure your database is properly configured and the connection string is correct.

2. **CSV File Issues**: If there are problems with the CSV data:
   - Check for any missing required fields
   - Ensure numeric fields contain valid numbers
   - Verify relationships between files (manufacturer names must match between files)

3. **Import Errors**: Check the console output for specific error messages during import.

## Production Optimization

For production environments, the import script has been optimized to import vehicles in a single transaction rather than in batches. This provides:

1. **Better Performance**: A single transaction is faster and more efficient.
2. **Atomic Operations**: All vehicles are imported as a single atomic operation.
3. **Reduced Database Load**: Fewer separate transactions means less overhead on the database server.

The batching logic previously used was primarily a safeguard for development environments with potential connectivity issues (like Replit). In a real production PostgreSQL server, the script is now optimized for maximum performance.

## Manual Import (if needed)

If you need to import the data manually:

```bash
node simple-import.js
```

The `simple-import.js` file is the script executed by the Import EV Data workflow.