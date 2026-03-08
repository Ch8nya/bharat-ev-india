import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { getStorage } from "./db";
import { vehicleFilterSchema, VehicleFilter } from "@shared/types";
import { 
  insertManufacturerSchema, 
  insertBodyStyleSchema, 
  insertDriveTypeSchema, 
  insertBatteryTypeSchema,
  insertChargingPortLocationSchema,
  insertRangeRatingSystemSchema,
  insertCarModelSchema,
  insertVehicleSchema
} from "@shared/schema";
import { z } from "zod";

// Extend Express Request type to include filter property
declare global {
  namespace Express {
    interface Request {
      filter: VehicleFilter;
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Get appropriate storage implementation based on database connection status
  let storage;
  try {
    storage = await getStorage();
    // Seed default data for the application
    await seedDefaultData();
  } catch (error) {
    console.error("Failed to initialize database storage:", error);
    throw new Error("Database connection failed - please check environment variables");
  }
  
  // Authentication routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }
      
      // Get user from storage
      const user = await storage.getUserByUsername(username);
      
      // Check if user exists and password matches (using simple comparison for demo)
      if (!user || user.passwordHash !== password) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      
      // Set user in session
      req.session.userId = user.id;
      
      res.json({ message: 'Login successful' });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });
  
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to logout' });
      }
      res.json({ message: 'Logout successful' });
    });
  });
  
  app.get('/api/auth/me', async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      // Return user info without password
      res.json({
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin
      });
    } catch (error) {
      console.error('Auth check error:', error);
      res.status(500).json({ message: 'Authentication check failed' });
    }
  });
  
  // Filter validation middleware
  const validateFilter = (req: Request, res: Response, next: NextFunction) => {
    try {
      // Convert query params to proper types
      const queryParams: Record<string, any> = {};
      
      // Process and convert query parameters to appropriate types
      for (const [key, value] of Object.entries(req.query)) {
        // Special handling for price filters
        // Both UI and DB use lakhs as the unit
        if (key === 'minPrice' || key === 'maxPrice') {
          // Just convert to number without multiplication
          const priceInLakhs = value ? Number(value) : undefined;
          queryParams[key] = priceInLakhs;
        }
        // Handle other numeric params
        else if (key === 'page' || key === 'perPage' || 
            key.startsWith('min') || key.startsWith('max') || 
            key.endsWith('Id')) {
          queryParams[key] = value ? Number(value) : undefined;
        } 
        // Handle boolean params  
        else if (key === 'v2lSupport') {
          queryParams[key] = value === 'true';
        } 
        // Handle array params
        else if (key.endsWith('Ids')) {
          // Handle arrays
          if (typeof value === 'string') {
            queryParams[key] = value.split(',').map(Number);
          } else if (Array.isArray(value)) {
            queryParams[key] = value.map(Number);
          }
        } 
        // Handle all other params
        else {
          queryParams[key] = value;
        }
      }
      
      const filter = vehicleFilterSchema.parse(queryParams);
      req.filter = filter;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Filter validation failed:', error.errors);
        res.status(400).json({ 
          message: "Invalid filter parameters", 
          errors: error.errors 
        });
      } else {
        console.error('Filter validation error:', error);
        res.status(400).json({ message: "Invalid request" });
      }
    }
  };

  // Manufacturer routes
  app.get("/api/manufacturers", async (_req, res) => {
    try {
      const manufacturers = await storage.getManufacturers();
      res.json(manufacturers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch manufacturers" });
    }
  });

  app.get("/api/manufacturers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const manufacturer = await storage.getManufacturer(id);
      
      if (!manufacturer) {
        return res.status(404).json({ message: "Manufacturer not found" });
      }
      
      res.json(manufacturer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch manufacturer" });
    }
  });

  // Body Style routes
  app.get("/api/body-styles", async (_req, res) => {
    try {
      const bodyStyles = await storage.getBodyStyles();
      res.json(bodyStyles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch body styles" });
    }
  });

  // Drive Type routes
  app.get("/api/drive-types", async (_req, res) => {
    try {
      const driveTypes = await storage.getDriveTypes();
      res.json(driveTypes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch drive types" });
    }
  });

  // Battery Type routes
  app.get("/api/battery-types", async (_req, res) => {
    try {
      const batteryTypes = await storage.getBatteryTypes();
      res.json(batteryTypes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch battery types" });
    }
  });

  // Vehicle routes
  app.get("/api/vehicles", validateFilter, async (req, res) => {
    try {
      const result = await storage.filterVehicles(req.filter);
      res.json(result);
    } catch (error) {
      console.error("Error in /api/vehicles route:", error);
      res.status(500).json({ message: "Failed to fetch vehicles" });
    }
  });

  app.get("/api/vehicles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const vehicle = await storage.getVehicleWithDetails(id);
      
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      res.json(vehicle);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vehicle" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Function to seed default reference data
async function seedDefaultData() {
  // Get appropriate storage implementation based on database connection status
  let storage;
  try {
    storage = await getStorage();
  } catch (error) {
    console.error("Failed to get storage for seeding:", error);
    throw error;
  }
  
  // Seed body styles if empty
  const bodyStyles = await storage.getBodyStyles();
  if (bodyStyles.length === 0) {
    // Only use body styles that match what's in the CSV file
    const defaultBodyStyles = ["SUV", "Sedan", "Hatchback", "MPV", "Coupe"];
    for (const name of defaultBodyStyles) {
      await storage.createBodyStyle({ name });
    }
  }

  // Seed drive types if empty
  const driveTypes = await storage.getDriveTypes();
  if (driveTypes.length === 0) {
    const defaultDriveTypes = ["FWD", "RWD", "AWD"];
    for (const name of defaultDriveTypes) {
      await storage.createDriveType({ name });
    }
  }

  // Seed battery types if empty
  const batteryTypes = await storage.getBatteryTypes();
  if (batteryTypes.length === 0) {
    const defaultBatteryTypes = ["LFP", "NCA", "NCM"];
    for (const name of defaultBatteryTypes) {
      await storage.createBatteryType({ name });
    }
  }

  // Seed charging port locations if empty
  const chargingPortLocations = await storage.getChargingPortLocations();
  if (chargingPortLocations.length === 0) {
    const defaultLocations = ["front", "rear", "left-side", "right-side"];
    for (const location of defaultLocations) {
      await storage.createChargingPortLocation({ location });
    }
  }

  // Seed range rating systems if empty
  const rangeRatingSystems = await storage.getRangeRatingSystems();
  if (rangeRatingSystems.length === 0) {
    const defaultSystems = ["ARAI", "MIDC", "WLTP", "NEDC"];
    for (const name of defaultSystems) {
      await storage.createRangeRatingSystem({ name });
    }
  }

  // Seed sample manufacturers if empty (for demo purposes)
  const manufacturers = await storage.getManufacturers();
  if (manufacturers.length === 0) {
    const sampleManufacturers = [
      { name: "Tata Motors", country: "India" },
      { name: "Mahindra", country: "India" },
      { name: "Hyundai", country: "South Korea" },
      { name: "MG", country: "China" },
      { name: "Kia", country: "South Korea" },
      { name: "BYD", country: "China" },
      { name: "Mercedes-Benz", country: "Germany" },
      { name: "Audi", country: "Germany" },
      { name: "BMW", country: "Germany" },
      { name: "Volvo", country: "Sweden" }
    ];
    
    for (const manufacturer of sampleManufacturers) {
      await storage.createManufacturer(manufacturer);
    }
  }
  
  // Add more car models and vehicles for testing
  const carModels = await storage.getCarModels();
  if (carModels.length <= 2) {
    // First get all manufacturers to find their IDs
    const allManufacturers = await storage.getManufacturers();
    const bodyStyles = await storage.getBodyStyles();
    const driveTypes = await storage.getDriveTypes();
    const batteryTypes = await storage.getBatteryTypes();
    const rangeRatingSystems = await storage.getRangeRatingSystems();
    
    // Find manufacturer IDs by name
    const findManufacturerId = (name: string): number | null => {
      const manufacturer = allManufacturers.find(m => m.name.toLowerCase().includes(name.toLowerCase()));
      return manufacturer ? manufacturer.id : null;
    };
    
    // Find body style ID
    const suvBodyStyleId = bodyStyles.find(bs => bs.name.toLowerCase() === "suv")?.id || 1;
    
    // Find drive type IDs
    const fwdDriveTypeId = driveTypes.find(dt => dt.name.toLowerCase() === "front-wheel drive" || dt.name.toLowerCase() === "fwd")?.id || 1;
    
    // Find battery type IDs
    const lfpBatteryTypeId = batteryTypes.find(bt => bt.name.toLowerCase().includes("lfp"))?.id || 1;
    const ncaBatteryTypeId = batteryTypes.find(bt => bt.name.toLowerCase().includes("nca"))?.id || 2;
    
    // Find range rating system ID
    const araiRatingId = rangeRatingSystems.find(rr => rr.name.toLowerCase().includes("arai"))?.id || 1;
    
    // Get manufacturer IDs
    const hyundaiId = findManufacturerId("Hyundai");
    const bydId = findManufacturerId("BYD");
    const mgId = findManufacturerId("MG");
    
    // Only add models if we have manufacturer IDs
    if (hyundaiId && bydId && mgId) {
      // Define additional car models to add with correct IDs (using camelCase as defined in schema)
      const additionalModels = [
        {
          manufacturerId: hyundaiId,
          modelName: "Kona Electric",
          bodyStyleId: suvBodyStyleId,
          manufacturingStartYear: 2021,
          image: "https://stimg.cardekho.com/images/carexteriorimages/930x620/Hyundai/Kona-Electric/10115/1684141136128/front-left-side-47.jpg"
        },
        {
          manufacturerId: bydId,
          modelName: "Atto 3",
          bodyStyleId: suvBodyStyleId,
          manufacturingStartYear: 2022,
          image: "https://stimg.cardekho.com/images/carexteriorimages/930x620/BYD/e6/10240/1683633221057/front-left-side-47.jpg"
        },
        {
          manufacturerId: mgId,
          modelName: "ZS EV",
          bodyStyleId: suvBodyStyleId,
          manufacturingStartYear: 2022,
          image: "https://stimg.cardekho.com/images/carexteriorimages/930x620/MG/ZS-EV/9481/1683631136584/front-left-side-47.jpg"
        }
      ];
      
      // Keeping track of models we add
      const addedModels = [];
      
      for (const model of additionalModels) {
        const newModel = await storage.createCarModel(model);
        addedModels.push(newModel);
        
        // Add variants for the Hyundai Kona model
        if (model.modelName === "Kona Electric") {
          await storage.createVehicle({
            modelId: newModel.id,
            variantName: "Premium",
            batteryCapacity: 39.2,
            usableBatteryCapacity: 36,
            batteryTypeId: ncaBatteryTypeId,
            driveTypeId: fwdDriveTypeId,
            batteryWarrantyYears: 8,
            batteryWarrantyKm: 160000,
            officialRange: 452,
            rangeRatingId: araiRatingId,
            realWorldRange: 370,
            efficiency: 6.2,
            horsepower: 134,
            torque: 395,
            acceleration: 9.7,
            topSpeed: 167,
            fastChargingCapacity: 50,
            fastChargingTime: 57,
            weight: 1610,
            v2lSupport: false,
            price: 23.99 // Prices in lakhs (not rupees)
          });
        } 
        // Add variants for the BYD Atto 3 model
        else if (model.modelName === "Atto 3") {
          await storage.createVehicle({
            modelId: newModel.id,
            variantName: "Extended Range",
            batteryCapacity: 60.5,
            usableBatteryCapacity: 58,
            batteryTypeId: lfpBatteryTypeId,
            driveTypeId: fwdDriveTypeId,
            batteryWarrantyYears: 8,
            batteryWarrantyKm: 150000,
            officialRange: 521,
            rangeRatingId: araiRatingId,
            realWorldRange: 450,
            efficiency: 5.8,
            horsepower: 201,
            torque: 310,
            acceleration: 7.3,
            topSpeed: 160,
            fastChargingCapacity: 80,
            fastChargingTime: 50,
            weight: 1750,
            v2lSupport: true,
            v2lOutputPower: 3000,
            price: 33.99 // Prices in lakhs (not rupees)
          });
        } 
        // Add variants for the MG ZS EV model
        else if (model.modelName === "ZS EV") {
          await storage.createVehicle({
            modelId: newModel.id,
            variantName: "Excite",
            batteryCapacity: 50.3,
            usableBatteryCapacity: 47,
            batteryTypeId: ncaBatteryTypeId,
            driveTypeId: fwdDriveTypeId,
            batteryWarrantyYears: 8,
            batteryWarrantyKm: 150000,
            officialRange: 461,
            rangeRatingId: araiRatingId,
            realWorldRange: 400,
            efficiency: 6.1,
            horsepower: 174,
            torque: 280,
            acceleration: 8.5,
            topSpeed: 175,
            fastChargingCapacity: 76,
            fastChargingTime: 60,
            weight: 1620,
            v2lSupport: false,
            price: 22.49 // Prices in lakhs (not rupees)
          });
        }
      }
    }
  }
}
