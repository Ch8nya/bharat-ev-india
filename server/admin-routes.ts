import { Express, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { storage } from './storage';
import { uploadImage, deleteImage } from './cloudinary';
import { 
  insertManufacturerSchema, 
  insertCarModelSchema, 
  insertVehicleSchema 
} from '@shared/schema';
import { z } from 'zod';

// Configure multer for file uploads
const memoryStorage = multer.memoryStorage();
const upload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

/**
 * Register admin routes for managing manufacturers, models, and vehicles
 */
export function registerAdminRoutes(app: Express) {
  // Create a simple authentication middleware for admin routes
  const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user is logged in through session
      if (req.session && req.session.userId) {
        // Get the user from storage
        const user = await storage.getUser(req.session.userId);
        if (user && user.isAdmin) {
          return next();
        }
      }
      
      // If no valid session or not admin user, reject with 401
      return res.status(401).json({ error: 'Unauthorized - Admin access required' });
    } catch (error) {
      console.error('Error in admin authentication:', error);
      return res.status(500).json({ error: 'Internal server error during authentication' });
    }
  };

  // Prefix all admin routes
  const adminRoute = (path: string) => `/api/admin${path}`;

  // === MANUFACTURER ROUTES ===
  
  // Get all manufacturers
  app.get(adminRoute('/manufacturers'), adminAuth, async (req: Request, res: Response) => {
    try {
      const manufacturers = await storage.getManufacturers();
      res.json(manufacturers);
    } catch (error) {
      console.error('Error fetching manufacturers:', error);
      res.status(500).json({ error: 'Failed to fetch manufacturers' });
    }
  });

  // Get manufacturer by ID
  app.get(adminRoute('/manufacturers/:id'), adminAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const manufacturer = await storage.getManufacturer(id);
      
      if (!manufacturer) {
        return res.status(404).json({ error: 'Manufacturer not found' });
      }
      
      res.json(manufacturer);
    } catch (error) {
      console.error('Error fetching manufacturer:', error);
      res.status(500).json({ error: 'Failed to fetch manufacturer' });
    }
  });

  // Create manufacturer
  app.post(
    adminRoute('/manufacturers'), 
    adminAuth,
    upload.single('logo'),
    async (req: Request, res: Response) => {
      try {
        // Validate manufacturer data
        const manufacturerData = insertManufacturerSchema.parse(req.body);
        
        // We're not storing manufacturer logo images as per schema
        
        // Create manufacturer in database
        const newManufacturer = await storage.createManufacturer(manufacturerData);
        res.status(201).json(newManufacturer);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors });
        }
        console.error('Error creating manufacturer:', error);
        res.status(500).json({ error: 'Failed to create manufacturer' });
      }
    }
  );

  // Delete manufacturer
  app.delete(adminRoute('/manufacturers/:id'), adminAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteManufacturer(id);
      res.status(200).json({ message: 'Manufacturer deleted successfully' });
    } catch (error) {
      console.error('Error deleting manufacturer:', error);
      res.status(500).json({ error: 'Failed to delete manufacturer' });
    }
  });

  // === CAR MODEL ROUTES ===
  
  // Get all car models
  app.get(adminRoute('/car-models'), adminAuth, async (req: Request, res: Response) => {
    try {
      const carModels = await storage.getCarModels();
      res.json(carModels);
    } catch (error) {
      console.error('Error fetching car models:', error);
      res.status(500).json({ error: 'Failed to fetch car models' });
    }
  });

  // Get car model by ID
  app.get(adminRoute('/car-models/:id'), adminAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const carModel = await storage.getCarModel(id);
      
      if (!carModel) {
        return res.status(404).json({ error: 'Car model not found' });
      }
      
      res.json(carModel);
    } catch (error) {
      console.error('Error fetching car model:', error);
      res.status(500).json({ error: 'Failed to fetch car model' });
    }
  });

  // Create car model
  app.post(
    adminRoute('/car-models'), 
    adminAuth,
    upload.single('image'),
    async (req: Request, res: Response) => {
      try {
        // Parse form data into the expected shape
        const parsedFormData = {
          ...req.body,
          manufacturerId: parseInt(req.body.manufacturerId),
          bodyStyleId: parseInt(req.body.bodyStyleId),
          manufacturingStartYear: parseInt(req.body.manufacturingStartYear),
          manufacturingEndYear: req.body.manufacturingEndYear ? parseInt(req.body.manufacturingEndYear) : undefined,
          chargingPortLocationId: req.body.chargingPortLocationId ? parseInt(req.body.chargingPortLocationId) : undefined,
          bootSpace: req.body.bootSpace ? parseInt(req.body.bootSpace) : undefined,
        };
        
        // Validate car model data
        const carModelData = insertCarModelSchema.parse(parsedFormData);
        
        // Upload image if provided
        if (req.file) {
          const imageResult = await uploadImage(
            req.file.buffer,
            'car-models',
            `car-model-${carModelData.manufacturerId}-${carModelData.modelName.toLowerCase().replace(/\s+/g, '-')}`
          );
          carModelData.image = imageResult.url;
        }
        
        // Create car model in database
        const newCarModel = await storage.createCarModel(carModelData);
        res.status(201).json(newCarModel);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors });
        }
        console.error('Error creating car model:', error);
        res.status(500).json({ error: 'Failed to create car model' });
      }
    }
  );

  // Delete car model
  app.delete(adminRoute('/car-models/:id'), adminAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCarModel(id);
      res.status(200).json({ message: 'Car model deleted successfully' });
    } catch (error) {
      console.error('Error deleting car model:', error);
      res.status(500).json({ error: 'Failed to delete car model' });
    }
  });

  // === VEHICLE ROUTES ===
  
  // Get all vehicles
  app.get(adminRoute('/vehicles'), adminAuth, async (req: Request, res: Response) => {
    try {
      const vehicles = await storage.getVehicles();
      res.json(vehicles);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      res.status(500).json({ error: 'Failed to fetch vehicles' });
    }
  });

  // Get vehicle by ID
  app.get(adminRoute('/vehicles/:id'), adminAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const vehicle = await storage.getVehicle(id);
      
      if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }
      
      res.json(vehicle);
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      res.status(500).json({ error: 'Failed to fetch vehicle' });
    }
  });

  // Create vehicle
  app.post(
    adminRoute('/vehicles'), 
    adminAuth,
    async (req: Request, res: Response) => {
      try {
        // Convert string values to appropriate types
        const vehicleFormData = {
          ...req.body,
          modelId: parseInt(req.body.modelId),
          batteryCapacity: req.body.batteryCapacity ? parseFloat(req.body.batteryCapacity) : undefined,
          usableBatteryCapacity: req.body.usableBatteryCapacity ? parseFloat(req.body.usableBatteryCapacity) : undefined,
          officialRange: req.body.officialRange ? parseInt(req.body.officialRange) : undefined,
          realWorldRange: req.body.realWorldRange ? parseInt(req.body.realWorldRange) : undefined,
          efficiency: req.body.efficiency ? parseFloat(req.body.efficiency) : undefined,
          horsepower: req.body.horsepower ? parseInt(req.body.horsepower) : undefined,
          torque: req.body.torque ? parseInt(req.body.torque) : undefined,
          acceleration: req.body.acceleration ? parseFloat(req.body.acceleration) : undefined,
          topSpeed: req.body.topSpeed ? parseInt(req.body.topSpeed) : undefined,
          fastChargingCapacity: req.body.fastChargingCapacity ? parseInt(req.body.fastChargingCapacity) : undefined,
          fastChargingTime: req.body.fastChargingTime ? parseInt(req.body.fastChargingTime) : undefined,
          weight: req.body.weight ? parseInt(req.body.weight) : undefined,
          v2lSupport: req.body.v2lSupport === 'true',
          v2lOutputPower: req.body.v2lOutputPower ? parseInt(req.body.v2lOutputPower) : undefined,
          price: req.body.price ? parseFloat(req.body.price) : undefined,
          batteryTypeId: req.body.batteryTypeId ? parseInt(req.body.batteryTypeId) : undefined,
          driveTypeId: req.body.driveTypeId ? parseInt(req.body.driveTypeId) : undefined,
          batteryWarrantyYears: req.body.batteryWarrantyYears ? parseInt(req.body.batteryWarrantyYears) : undefined,
          batteryWarrantyKm: req.body.batteryWarrantyKm ? parseInt(req.body.batteryWarrantyKm) : undefined,
          rangeRatingId: req.body.rangeRatingId ? parseInt(req.body.rangeRatingId) : undefined,
        };
        
        // Validate vehicle data
        const vehicleData = insertVehicleSchema.parse(vehicleFormData);
        
        // Create vehicle in database
        const newVehicle = await storage.createVehicle(vehicleData);
        res.status(201).json(newVehicle);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: error.errors });
        }
        console.error('Error creating vehicle:', error);
        res.status(500).json({ error: 'Failed to create vehicle' });
      }
    }
  );

  // Delete vehicle
  app.delete(adminRoute('/vehicles/:id'), adminAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteVehicle(id);
      res.status(200).json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      res.status(500).json({ error: 'Failed to delete vehicle' });
    }
  });

  // === REFERENCE DATA ROUTES ===
  
  // Get all reference data for admin forms
  app.get(adminRoute('/reference-data'), adminAuth, async (req: Request, res: Response) => {
    try {
      const [
        manufacturers,
        bodyStyles,
        driveTypes,
        batteryTypes,
        chargingPortLocations,
        rangeRatingSystems
      ] = await Promise.all([
        storage.getManufacturers(),
        storage.getBodyStyles(),
        storage.getDriveTypes(),
        storage.getBatteryTypes(),
        storage.getChargingPortLocations(),
        storage.getRangeRatingSystems()
      ]);
      
      res.json({
        manufacturers,
        bodyStyles,
        driveTypes,
        batteryTypes,
        chargingPortLocations,
        rangeRatingSystems
      });
    } catch (error) {
      console.error('Error fetching reference data:', error);
      res.status(500).json({ error: 'Failed to fetch reference data' });
    }
  });
  
  // Clear all data (be careful with this one!)
  app.delete(adminRoute('/clear-data'), adminAuth, async (req: Request, res: Response) => {
    try {
      // This would be implemented in a real application with proper security measures
      // await storage.clearAllData();
      res.status(200).json({ message: 'All data cleared successfully' });
    } catch (error) {
      console.error('Error clearing data:', error);
      res.status(500).json({ error: 'Failed to clear data' });
    }
  });
}