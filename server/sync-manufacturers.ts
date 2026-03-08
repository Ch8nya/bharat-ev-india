import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './db';
import { manufacturers } from '@shared/schema';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function syncManufacturers() {
  try {
    console.log('Starting manufacturer sync process...');
    
    // Path to the CSV file
    const csvPath = path.resolve(__dirname, '../attached_assets/vehicles_final.csv');
    console.log('CSV path:', csvPath);
    
    // Read and parse the CSV file
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const records = fileContent.split('\n').map(line => line.split(','));
    
    // Extract unique manufacturer names (first column in CSV)
    const uniqueManufacturers = new Set<string>();
    records.forEach((record: any) => {
      if (record[0] && typeof record[0] === 'string') {
        uniqueManufacturers.add(record[0].trim());
      }
    });
    
    console.log(`Found ${uniqueManufacturers.size} unique manufacturers in CSV file`);
    
    // Get database connection
    const db = await getDb();
    
    // Get existing manufacturers from database
    const existingManufacturers = await db.select().from(manufacturers);
    const existingNames = new Set(existingManufacturers.map((m: { name: string }) => m.name.toLowerCase()));
    
    console.log(`Found ${existingManufacturers.length} existing manufacturers in database`);
    
    // Identify manufacturers to add
    const manufacturersToAdd = Array.from(uniqueManufacturers)
      .filter(name => !existingNames.has(name.toLowerCase()))
      .map(name => ({ 
        name,
        country: 'India' // Default country since these are Indian EVs
      }));
    
    console.log(`Adding ${manufacturersToAdd.length} new manufacturers to database`);
    
    // Insert new manufacturers if any
    if (manufacturersToAdd.length > 0) {
      const result = await db.insert(manufacturers).values(manufacturersToAdd).returning();
      console.log(`Successfully added ${result.length} new manufacturers`);
      console.log('New manufacturers:', result.map((m: { name: string }) => m.name).join(', '));
    } else {
      console.log('No new manufacturers to add');
    }
    
    // Show all manufacturers in database after sync
    const updatedManufacturers = await db.select().from(manufacturers);
    console.log('All manufacturers in database after sync:');
    updatedManufacturers.forEach((m: { id: number; name: string }) => console.log(`- ${m.id}: ${m.name}`));
    
    console.log('Manufacturer sync completed successfully');
  } catch (error) {
    console.error('Error syncing manufacturers:', error);
  }
}

// Run the sync function
syncManufacturers().catch(console.error);
