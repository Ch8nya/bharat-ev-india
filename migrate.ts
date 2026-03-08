import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import * as schema from "./shared/schema.js";

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

// Check if environment variables are set
if (!process.env.PGHOST || !process.env.PGUSER || !process.env.PGPASSWORD || !process.env.PGDATABASE) {
  console.error("DATABASE ERROR: Environment variables are not completely set");
  process.exit(1);
}

// Create PostgreSQL connection pool
const poolConfig = {
  host: process.env.PGHOST,
  port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false
};

console.log("Connecting to PostgreSQL database...");
const pool = new Pool(poolConfig);
const db = drizzle(pool, { schema });

// Function to read and parse CSV files
function readCsvFile(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf8');
  return parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    cast: true
  });
}

// Main migration function
async function runMigration() {
  try {
    console.log("Creating tables...");
    
    // Create tables for all schema entities
    await db.execute(`
      CREATE TABLE IF NOT EXISTS manufacturers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        country TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS body_styles (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS drive_types (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS battery_types (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS charging_port_locations (
        id SERIAL PRIMARY KEY,
        location TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS range_rating_systems (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL
      );
      
      CREATE TABLE IF NOT EXISTS car_models (
        id SERIAL PRIMARY KEY,
        manufacturer_id INTEGER NOT NULL REFERENCES manufacturers(id),
        model_name TEXT NOT NULL,
        body_style_id INTEGER NOT NULL REFERENCES body_styles(id),
        image TEXT,
        charging_port_location_id INTEGER REFERENCES charging_port_locations(id),
        boot_space INTEGER,
        manufacturing_start_year INTEGER NOT NULL,
        manufacturing_end_year INTEGER
      );
      
      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        model_id INTEGER NOT NULL REFERENCES car_models(id),
        variant_name TEXT NOT NULL,
        drive_type_id INTEGER REFERENCES drive_types(id),
        battery_type_id INTEGER REFERENCES battery_types(id),
        battery_capacity DOUBLE PRECISION,
        usable_battery_capacity DOUBLE PRECISION,
        battery_warranty_years INTEGER,
        battery_warranty_km INTEGER,
        official_range INTEGER,
        range_rating_id INTEGER REFERENCES range_rating_systems(id),
        real_world_range INTEGER,
        efficiency DOUBLE PRECISION,
        horsepower DOUBLE PRECISION,
        torque INTEGER,
        acceleration DOUBLE PRECISION,
        top_speed INTEGER,
        fast_charging_capacity INTEGER,
        fast_charging_time INTEGER,
        weight INTEGER,
        v2l_support BOOLEAN DEFAULT false,
        v2l_output_power INTEGER,
        price DOUBLE PRECISION,
        view_count INTEGER DEFAULT 0
      );
      
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        is_admin BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL PRIMARY KEY,
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire);
    `);
    
    console.log("Tables created successfully!");
    
    // Insert reference data
    console.log("Inserting reference data...");
    
    // Insert body styles
    await db.insert(schema.bodyStyles).values([
      { name: "Hatchback" },
      { name: "Sedan" },
      { name: "SUV" },
      { name: "Crossover" },
      { name: "MPV" }
    ]).onConflictDoNothing();
    
    // Insert drive types
    await db.insert(schema.driveTypes).values([
      { name: "FWD" },
      { name: "RWD" },
      { name: "AWD" }
    ]).onConflictDoNothing();
    
    // Insert battery types
    await db.insert(schema.batteryTypes).values([
      { name: "Lithium-ion" },
      { name: "LFP" },
      { name: "NMC" }
    ]).onConflictDoNothing();
    
    // Insert charging port locations
    await db.insert(schema.chargingPortLocations).values([
      { location: "Front" },
      { location: "Rear" },
      { location: "Side" }
    ]).onConflictDoNothing();
    
    // Insert range rating systems
    await db.insert(schema.rangeRatingSystems).values([
      { name: "ARAI" },
      { name: "WLTP" },
      { name: "NEDC" }
    ]).onConflictDoNothing();
    
    // Create admin user
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    await db.insert(schema.users).values({
      username: 'admin',
      passwordHash: adminPassword, // In a real app, this should be hashed
      isAdmin: true
    }).onConflictDoNothing();
    
    // Import data from CSV files
    console.log("Importing data from CSV files...");
    
    // Import manufacturers
    const manufacturersData = readCsvFile(path.join(__dirname, 'attached_assets', 'manufacturers_final.csv'));
    for (const manufacturer of manufacturersData) {
      await db.insert(schema.manufacturers).values({
        name: manufacturer.Manufacturer,
        country: manufacturer.Country
      }).onConflictDoNothing();
    }
    
    // Get reference data for lookups
    const manufacturers = await db.select().from(schema.manufacturers);
    const bodyStyles = await db.select().from(schema.bodyStyles);
    const driveTypes = await db.select().from(schema.driveTypes);
    const batteryTypes = await db.select().from(schema.batteryTypes);
    const chargingPortLocations = await db.select().from(schema.chargingPortLocations);
    const rangeRatingSystems = await db.select().from(schema.rangeRatingSystems);
    
    // Import car models
    const modelsData = readCsvFile(path.join(__dirname, 'attached_assets', 'models_final.csv'));
    for (const model of modelsData) {
      const manufacturer = manufacturers.find(m => m.name === model.Manufacturer);
      const bodyStyle = bodyStyles.find(b => b.name === model["Body Style"]);
      const chargingPortLocation = chargingPortLocations.find(c => c.location === model.chargingPortLocation);
      
      if (manufacturer && bodyStyle) {
        await db.insert(schema.carModels).values({
          manufacturerId: manufacturer.id,
          modelName: model["Model Name"],
          bodyStyleId: bodyStyle.id,
          image: model["Image Link"] || null,
          chargingPortLocationId: chargingPortLocation ? chargingPortLocation.id : null,
          bootSpace: model["Boot Space Ltrs"] ? parseInt(model["Boot Space Ltrs"]) : null,
          manufacturingStartYear: parseInt(model["Start Year"]),
          manufacturingEndYear: model["End Year"] ? parseInt(model["End Year"]) : null
        }).onConflictDoNothing();
      }
    }
    
    // Get car models for vehicle import
    const carModels = await db.select().from(schema.carModels);
    
    // Import vehicles
    const vehiclesData = readCsvFile(path.join(__dirname, 'attached_assets', 'vehicles_final.csv'));
    for (const vehicle of vehiclesData) {
      const model = carModels.find(m => 
        m.modelName === vehicle["Model Name"] && 
        manufacturers.find(mfr => mfr.id === m.manufacturerId)?.name === vehicle["Manufacturer Name"]
      );
      
      const driveType = driveTypes.find(d => d.name === vehicle["Drive Type"]);
      const batteryType = batteryTypes.find(b => b.name === vehicle["Battery Type"]);
      const rangeRating = rangeRatingSystems.find(r => r.name === vehicle["Range Rating System"]);
      
      if (model) {
        await db.insert(schema.vehicles).values({
          modelId: model.id,
          variantName: vehicle["Variant Name"],
          driveTypeId: driveType ? driveType.id : null,
          batteryTypeId: batteryType ? batteryType.id : null,
          batteryCapacity: vehicle["Battery Capacity"] ? parseFloat(vehicle["Battery Capacity"]) : null,
          usableBatteryCapacity: vehicle["Useable Capacity"] ? parseFloat(vehicle["Useable Capacity"]) : null,
          batteryWarrantyYears: vehicle["Warranty Years"] ? parseInt(vehicle["Warranty Years"]) : null,
          batteryWarrantyKm: vehicle["Warranty Kms"] ? parseInt(vehicle["Warranty Kms"]) : null,
          officialRange: vehicle["Official Range"] ? parseInt(vehicle["Official Range"]) : null,
          rangeRatingId: rangeRating ? rangeRating.id : null,
          realWorldRange: vehicle["Real Range"] ? parseInt(vehicle["Real Range"]) : null,
          efficiency: vehicle["Efficiency"] ? parseFloat(vehicle["Efficiency"]) : null,
          horsepower: vehicle["Horsepower"] ? parseFloat(vehicle["Horsepower"]) : null,
          torque: vehicle["Torque"] ? parseInt(vehicle["Torque"]) : null,
          acceleration: vehicle["0-100"] ? parseFloat(vehicle["0-100"]) : null,
          topSpeed: vehicle["Top speed"] ? parseInt(vehicle["Top speed"]) : null,
          fastChargingCapacity: vehicle["Fast Charging DC KW"] ? parseInt(vehicle["Fast Charging DC KW"]) : null,
          fastChargingTime: vehicle["10-80 time"] ? parseInt(vehicle["10-80 time"]) : null,
          weight: vehicle["Weight"] ? parseInt(vehicle["Weight"]) : null,
          v2lSupport: vehicle["v2l output kw AC"] && parseFloat(vehicle["v2l output kw AC"]) > 0,
          v2lOutputPower: vehicle["v2l output kw AC"] ? parseFloat(vehicle["v2l output kw AC"]) * 1000 : null,
          price: vehicle["price (in lakhs)"] ? parseFloat(vehicle["price (in lakhs)"]) : null,
          viewCount: vehicle["view_count"] ? parseInt(vehicle["view_count"]) : 0
        }).onConflictDoNothing();
      }
    }
    
    console.log("Data import completed successfully!");
    console.log("Migration completed successfully!");
    
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await pool.end();
  }
}

// Run the migration
runMigration();
