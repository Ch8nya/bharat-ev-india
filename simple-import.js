// Simple EV Database Import Script
import pkg from 'pg';
const { Pool } = pkg;
import { parse } from 'csv-parse';
import fs from 'fs';

// Create database connection
const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'bharat_ev',
  ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false }
});

// Log with timestamp
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// Helper function to read and parse CSV file
async function parseCSV(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  return new Promise((resolve, reject) => {
    parse(fileContent, { columns: true, skip_empty_lines: true }, (err, records) => {
      if (err) reject(err);
      else resolve(records);
    });
  });
}

// Clear database tables
async function clearTables() {
  try {
    log('Clearing existing data...');
    // Delete in correct order (foreign key constraints)
    await pool.query('DELETE FROM vehicles');
    await pool.query('DELETE FROM car_models');
    await pool.query('DELETE FROM manufacturers');
    await pool.query('DELETE FROM body_styles');
    await pool.query('DELETE FROM drive_types');
    await pool.query('DELETE FROM battery_types');
    await pool.query('DELETE FROM charging_port_locations');
    await pool.query('DELETE FROM range_rating_systems');
    await pool.query('DELETE FROM users');
    log('All tables cleared successfully');
  } catch (error) {
    log(`Error clearing tables: ${error.message}`);
    throw error;
  }
}

// Import reference data
async function importReferenceData() {
  try {
    log('Importing reference data...');
    
    // Import body styles - ensuring they match what's in the CSV file
    await pool.query(`
      INSERT INTO body_styles (id, name) VALUES 
      (1, 'Coupe'), 
      (2, 'SUV'), 
      (3, 'Sedan'), 
      (4, 'Hatchback'), 
      (5, 'MPV')
    `);
    
    // Import drive types
    await pool.query(`
      INSERT INTO drive_types (id, name) VALUES 
      (1, 'AWD'), 
      (2, 'FWD'), 
      (3, 'RWD')
    `);
    
    // Import battery types
    await pool.query(`
      INSERT INTO battery_types (id, name) VALUES 
      (1, 'NCM'), 
      (2, 'NCA'), 
      (3, 'LFP'),
      (4, 'NMCA')
    `);
    
    // Import charging port locations
    await pool.query(`
      INSERT INTO charging_port_locations (id, location) VALUES 
      (1, 'Front'), 
      (2, 'Rear'), 
      (3, 'Side')
    `);
    
    // Import range rating systems
    await pool.query(`
      INSERT INTO range_rating_systems (id, name) VALUES 
      (1, 'WLTP'), 
      (2, 'EPA'), 
      (3, 'NEDC'), 
      (4, 'CLTC'),
      (5, 'ARAI'),
      (6, 'MIDC')
    `);
    
    log('Reference data imported successfully');
  } catch (error) {
    log(`Error importing reference data: ${error.message}`);
    throw error;
  }
}

// Import manufacturers
async function importManufacturers() {
  try {
    log('Importing manufacturers...');
    const records = await parseCSV('./attached_assets/manufacturers_final.csv');
    
    // Prepare the query with all manufacturers
    const valueStrings = [];
    const values = [];
    let paramIndex = 1;
    let id = 1; // Auto-assign IDs starting from 1
    
    for (const record of records) {
      valueStrings.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2})`);
      values.push(id, record.Manufacturer, record.Country);
      paramIndex += 3;
      id++;
    }
    
    if (values.length > 0) {
      const query = `
        INSERT INTO manufacturers (id, name, country) 
        VALUES ${valueStrings.join(', ')}
      `;
      await pool.query(query, values);
    }
    
    log(`Imported ${records.length} manufacturers`);
  } catch (error) {
    log(`Error importing manufacturers: ${error.message}`);
    throw error;
  }
}

// Import car models
async function importCarModels() {
  try {
    log('Importing car models...');
    const records = await parseCSV('./attached_assets/models_final.csv');
    
    // Get manufacturers for mapping by name
    const manufacturersResult = await pool.query('SELECT id, name FROM manufacturers');
    const manufacturersMap = {};
    manufacturersResult.rows.forEach(m => {
      manufacturersMap[m.name] = m.id;
    });
    
    // Get body styles for mapping by name
    const bodyStylesResult = await pool.query('SELECT id, name FROM body_styles');
    const bodyStylesMap = {};
    bodyStylesResult.rows.forEach(bs => {
      bodyStylesMap[bs.name] = bs.id;
    });
    
    const valueStrings = [];
    const values = [];
    let paramIndex = 1;
    let id = 1; // Auto-assign IDs starting from 1
    
    for (const record of records) {
      // Map manufacturer name to ID
      const manufacturerId = manufacturersMap[record.Manufacturer];
      if (!manufacturerId) {
        log(`Warning: Manufacturer "${record.Manufacturer}" not found, skipping model ${record["Model Name"]}`);
        continue;
      }
      
      // Map body style name to ID, default to 1 (Sedan) if not found
      const bodyStyleId = bodyStylesMap[record["Body Style"]] || 1;
      
      // Convert boot space to number or null
      const bootSpace = record["Boot Space Ltrs"] ? parseInt(record["Boot Space Ltrs"]) : null;
      
      valueStrings.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6})`);
      values.push(
        id, 
        manufacturerId, 
        record["Model Name"], 
        bodyStyleId,
        record["Image Link"] || null,
        parseInt(record["Start Year"]) || 2020,
        bootSpace
      );
      paramIndex += 7;
      id++;
    }
    
    if (values.length > 0) {
      const query = `
        INSERT INTO car_models (id, manufacturer_id, model_name, body_style_id, image, manufacturing_start_year, boot_space) 
        VALUES ${valueStrings.join(', ')}
      `;
      await pool.query(query, values);
    }
    
    log(`Imported ${values.length / 7} car models`);
  } catch (error) {
    log(`Error importing car models: ${error.message}`);
    throw error;
  }
}

// Import all vehicles at once - production ready
async function importVehicles() {
  try {
    log('Importing vehicles...');
    const records = await parseCSV('./attached_assets/vehicles_final.csv');
    
    // Get necessary reference data mappings
    // Manufacturers map
    const manufacturersResult = await pool.query('SELECT id, name FROM manufacturers');
    const manufacturersMap = {};
    manufacturersResult.rows.forEach(m => {
      manufacturersMap[m.name] = m.id;
    });
    
    // Models map (by manufacturer id and model name)
    const modelsResult = await pool.query('SELECT id, manufacturer_id, model_name FROM car_models');
    const modelsMap = {};
    modelsResult.rows.forEach(m => {
      // Create a key using manufacturer_id and model_name
      const key = `${m.manufacturer_id}_${m.model_name}`;
      modelsMap[key] = m.id;
    });
    
    // Battery types map
    const batteryTypesResult = await pool.query('SELECT id, name FROM battery_types');
    const batteryTypesMap = {};
    batteryTypesResult.rows.forEach(bt => {
      batteryTypesMap[bt.name] = bt.id;
    });
    
    // Drive types map
    const driveTypesResult = await pool.query('SELECT id, name FROM drive_types');
    const driveTypesMap = {};
    driveTypesResult.rows.forEach(dt => {
      driveTypesMap[dt.name] = dt.id;
    });
    
    // Range rating systems map
    const rangeRatingSystemsResult = await pool.query('SELECT id, name FROM range_rating_systems');
    const rangeRatingSystemsMap = {};
    rangeRatingSystemsResult.rows.forEach(rrs => {
      rangeRatingSystemsMap[rrs.name] = rrs.id;
    });
    
    // Prepare bulk insert values
    const valueStrings = [];
    const values = [];
    let paramIndex = 1;
    let vehicleId = 1; // Auto-increment ID
    let totalImported = 0;

    // Process all vehicles at once for production environment
    log(`Processing all ${records.length} vehicles at once`);
    
    for (const record of records) {
      // Find manufacturer ID
      const manufacturerId = manufacturersMap[record["Manufacturer Name"]];
      if (!manufacturerId) {
        log(`Warning: Manufacturer "${record["Manufacturer Name"]}" not found, skipping vehicle ${record["Variant Name"]}`);
        continue;
      }
      
      // Find model ID using manufacturer ID and model name
      const modelKey = `${manufacturerId}_${record["Model Name"]}`;
      const modelId = modelsMap[modelKey];
      if (!modelId) {
        log(`Warning: Model "${record["Model Name"]}" for manufacturer ID ${manufacturerId} not found, skipping vehicle ${record["Variant Name"]}`);
        continue;
      }
      
      // Map battery type, drive type and range rating system to their IDs
      const batteryTypeId = batteryTypesMap[record["Battery Type"]] || null;
      const driveTypeId = driveTypesMap[record["Drive Type"]] || null;
      const rangeRatingId = rangeRatingSystemsMap[record["Range Rating System"]] || null;
      
      // Prepare parameters for bulk insert
      valueStrings.push(`($${paramIndex}, $${paramIndex+1}, $${paramIndex+2}, $${paramIndex+3}, $${paramIndex+4}, $${paramIndex+5}, $${paramIndex+6}, $${paramIndex+7}, $${paramIndex+8}, $${paramIndex+9}, $${paramIndex+10}, $${paramIndex+11}, $${paramIndex+12}, $${paramIndex+13}, $${paramIndex+14}, $${paramIndex+15}, $${paramIndex+16}, $${paramIndex+17}, $${paramIndex+18}, $${paramIndex+19}, $${paramIndex+20}, $${paramIndex+21}, $${paramIndex+22}, $${paramIndex+23})`);
      
      values.push(
        vehicleId,
        modelId,
        record["Variant Name"],
        record["Battery Capacity"] ? parseFloat(record["Battery Capacity"]) : null,
        record["Useable Capacity"] ? parseFloat(record["Useable Capacity"]) : null,
        record["Official Range"] ? Math.round(parseFloat(record["Official Range"])) : null,
        record["Real Range"] ? Math.round(parseFloat(record["Real Range"])) : null,
        record["Efficiency"] ? parseFloat(record["Efficiency"]) : null,
        driveTypeId,
        batteryTypeId,
        rangeRatingId,
        record["Warranty Years"] ? parseInt(record["Warranty Years"]) : null,
        record["Warranty Kms"] ? parseInt(record["Warranty Kms"]) : null,
        record["Horsepower"] ? parseFloat(record["Horsepower"]) : null,
        record["Torque"] ? Math.round(parseFloat(record["Torque"])) : null,
        record["0-100"] ? parseFloat(record["0-100"]) : null,
        record["Top speed"] ? Math.round(parseFloat(record["Top speed"])) : null,
        record["Fast Charging DC KW"] ? Math.round(parseFloat(record["Fast Charging DC KW"])) : null,
        record["10-80 time"] ? Math.round(parseFloat(record["10-80 time"])) : null,
        record["Weight"] ? Math.round(parseFloat(record["Weight"])) : null,
        record["v2l output kw AC"] && parseFloat(record["v2l output kw AC"]) > 0 ? true : false,
        record["v2l output kw AC"] && parseFloat(record["v2l output kw AC"]) > 0 ? Math.round(parseFloat(record["v2l output kw AC"]) * 1000) : null,
        record["price (in lakhs)"] ? parseFloat(record["price (in lakhs)"]) : null,
        record["view_count"] ? parseInt(record["view_count"]) : 0 // Use view_count from CSV or 0 if not available
      );

      paramIndex += 24;
      vehicleId++;
      totalImported++;
    }
    
    // Execute the bulk insert if we have vehicles to insert
    if (values.length > 0) {
      const query = `
        INSERT INTO vehicles (
          id, model_id, variant_name, battery_capacity, usable_battery_capacity,
          official_range, real_world_range, efficiency, drive_type_id, battery_type_id,
          range_rating_id, battery_warranty_years, battery_warranty_km,
          horsepower, torque, acceleration, top_speed, fast_charging_capacity, 
          fast_charging_time, weight, v2l_support, v2l_output_power, price, view_count
        ) VALUES ${valueStrings.join(', ')}
      `;
      
      await pool.query(query, values);
      log(`Imported ${totalImported} vehicles successfully in a single transaction`);
    } else {
      log('No vehicles to import');
    }
    
  } catch (error) {
    log(`Error importing vehicles: ${error.message}`);
    throw error;
  }
}

// Add default admin user
async function addDefaultUser() {
  try {
    log('Adding default admin user...');
    
    // Check if user already exists
    const existingUserResult = await pool.query("SELECT * FROM users WHERE username = 'admin' LIMIT 1");
    
    if (existingUserResult.rows.length === 0) {
      await pool.query(`
        INSERT INTO users (username, password_hash, is_admin)
        VALUES ('admin', 'admin', true)
      `);
      log('Admin user created');
    } else {
      log('Admin user already exists');
    }
  } catch (error) {
    log(`Error adding default user: ${error.message}`);
    throw error;
  }
}

// Main import function
async function runImport() {
  try {
    log('Starting EV database import process...');
    
    // Test database connection
    const testResult = await pool.query('SELECT NOW()');
    log(`Connected to database at ${testResult.rows[0].now}`);
    
    await clearTables();
    await importReferenceData();
    await importManufacturers();
    await importCarModels();
    await importVehicles();
    await addDefaultUser();
    
    log('Import completed successfully');
    
    // Count records
    const manufacturerCount = await pool.query('SELECT COUNT(*) FROM manufacturers');
    const modelCount = await pool.query('SELECT COUNT(*) FROM car_models');
    const vehicleCount = await pool.query('SELECT COUNT(*) FROM vehicles');
    
    log(`Database now contains:
    - ${manufacturerCount.rows[0].count} manufacturers
    - ${modelCount.rows[0].count} car models
    - ${vehicleCount.rows[0].count} vehicles`);
    
    // Close the connection pool to exit gracefully
    await pool.end();
    
  } catch (error) {
    log(`Import failed: ${error.message}`);
    // Ensure pool is closed even if there's an error
    try {
      await pool.end();
    } catch (err) {
      // Silently ignore
    }
    process.exit(1);
  }
}

// Run the import process
runImport();