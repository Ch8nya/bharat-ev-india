import { getDb } from './db';
import { fileURLToPath } from 'url';
import path from 'path';
import { vehicles, manufacturers } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixVehicleManufacturers() {
  try { 
    console.log('Starting vehicle manufacturer fix process...');
    
    // Get database connection
    const db = await getDb();
    
    // Get all vehicles
    const allVehicles = await db.select().from(vehicles);
    console.log(`Found ${allVehicles.length} vehicles in database`);
    
    // Get all manufacturers
    const allManufacturers = await db.select().from(manufacturers);
    console.log(`Found ${allManufacturers.length} manufacturers in database`);
    
    // Create a map of manufacturer names to IDs (case insensitive)
    const manufacturerMap = new Map();
    allManufacturers.forEach((m: { id: number; name: string }) => {
      manufacturerMap.set(m.name.toLowerCase(), m.id);
    });
    
    // Print all manufacturers for debugging
    console.log('Available manufacturers:');
    allManufacturers.forEach((m: { id: number; name: string }) => {
      console.log(`- ${m.id}: ${m.name}`);
    });
    
    // Count vehicles with missing manufacturer IDs
    const missingManufacturerVehicles = allVehicles.filter(v => !v.manufacturerId);
    console.log(`Found ${missingManufacturerVehicles.length} vehicles with missing manufacturer IDs`);
    
    // Get unique manufacturer names from the vehicles
    const vehicleManufacturerNames = new Set<string>();
    allVehicles.forEach((v: { manufacturerName?: string }) => {
      if (v.manufacturerName) {
        vehicleManufacturerNames.add(v.manufacturerName.toLowerCase());
      }
    });
    console.log('Manufacturer names from vehicles:', Array.from(vehicleManufacturerNames));
    
    // Check which manufacturer names don't have corresponding IDs
    const missingManufacturers = Array.from(vehicleManufacturerNames)
      .filter((name) => !manufacturerMap.has(name as string));
    console.log('Missing manufacturers:', missingManufacturers);
    
    // Fix vehicles with missing manufacturer IDs
    let fixedCount = 0;
    for (const vehicle of allVehicles as Array<{ id: number; manufacturerName?: string; modelName?: string; manufacturerId?: number }>) {
      if (vehicle.manufacturerName && !vehicle.manufacturerId) {
        const manufacturerId = manufacturerMap.get(vehicle.manufacturerName.toLowerCase());
        if (manufacturerId) {
          console.log(`Fixing vehicle ${vehicle.id} (${vehicle.manufacturerName} ${vehicle.modelName}): setting manufacturerId to ${manufacturerId}`);
          await db.update(vehicles)
            .set({ manufacturerId })
            .where(eq(vehicles.id, vehicle.id));
          fixedCount++;
        } else {
          console.log(`WARNING: Cannot find manufacturer ID for vehicle ${vehicle.id} (${vehicle.manufacturerName} ${vehicle.modelName})`);
        }
      }
    }
    
    console.log(`Fixed ${fixedCount} vehicles with missing manufacturer IDs`);
    console.log('Vehicle manufacturer fix process completed successfully');
  } catch (error) {
    console.error('Error fixing vehicle manufacturers:', error);
  }
}

// Run the fix function
fixVehicleManufacturers().catch(console.error);
