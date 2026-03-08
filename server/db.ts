import { drizzle } from "drizzle-orm/node-postgres";
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from "@shared/schema";
import { DatabaseStorage } from "./storage";

// This will be set to true if PostgreSQL connection is successful
let dbConnected = false;

// Function to attempt PostgreSQL connection
async function attemptPostgresConnection() {
  try {
    // Use direct connection parameters instead of connection string
    if (!process.env.PGHOST || !process.env.PGUSER || !process.env.PGPASSWORD || !process.env.PGDATABASE) {
      console.error("DATABASE ERROR: Environment variables are not completely set");
      return { success: false };
    }

    // Create pool with improved configuration
    const poolConfig: any = {
      host: process.env.PGHOST,
      port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      database: process.env.PGDATABASE,
      // Connection timeout (ms)
      connectionTimeoutMillis: 5000,
      // Short idle timeout for quick testing
      idleTimeoutMillis: 10000,
      max: 5,
      ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false }
    };
    
    const pool = new Pool(poolConfig);

    // Add event listeners for connection issues
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      dbConnected = false;
    });

    // Test the connection with a timeout
    const connectionResult: any = await Promise.race([
      pool.query('SELECT NOW()'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 5000))
    ]);

    if (connectionResult) {
      console.log('Database connected successfully at:', connectionResult.rows[0].now);
      dbConnected = true;
      return { success: true, pool };
    }
  } catch (err) {
    console.error('Database connection failed:', err);
    console.error('The application requires a PostgreSQL database connection to function.');
    return { success: false };
  }
  
  console.error('Database connection failed with no specific error.');
  console.error('The application requires a PostgreSQL database connection to function.');
  return { success: false };
}

// Initialize variables that will be set during connection
let connectionAttempt: any = null;
let pool: any = null;
let db: any = null;

// Initialize the database connection
function initializeDatabase() {
  return attemptPostgresConnection().then((result) => {
    connectionAttempt = result;
    // Create pool and db only if connection was successful
    pool = connectionAttempt && connectionAttempt.success ? connectionAttempt.pool : null;
    // For type safety, we'll create a db instance even if it might not be used
    db = pool ? drizzle(pool, { schema }) : null;
    return db;
  });
}

// Export the database instance
export const getDb = async () => {
  if (!db) {
    await initializeDatabase();
  }
  return db;
};

// This function returns the database storage implementation
export async function getStorage() {
  // Ensure we have a database connection
  const database = await getDb();
  
  // Verify we have a database connection
  if (!dbConnected || !database) {
    console.error('ERROR: No database connection available');
    throw new Error('Database connection failed');
  }
  
  // Return the PostgreSQL database storage implementation
  return new DatabaseStorage();
}
