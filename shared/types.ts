import { z } from "zod";

// Vehicle Filter Schema
export const vehicleFilterSchema = z.object({
  // Manufacturer filtering
  manufacturerId: z.number().optional(),
  manufacturerIds: z.array(z.number()).optional(),
  
  // Body style filtering
  bodyStyleId: z.number().optional(),
  bodyStyleIds: z.array(z.number()).optional(),
  
  // Drive type filtering
  driveTypeIds: z.array(z.number()).optional(),
  
  // Battery type filtering
  batteryTypeIds: z.array(z.number()).optional(),
  
  // Price range filtering
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  
  // Range filtering
  minRange: z.number().optional(),
  maxRange: z.number().optional(),
  
  // Performance filtering
  minAcceleration: z.number().optional(),
  maxAcceleration: z.number().optional(),
  minHorsepower: z.number().optional(),
  maxHorsepower: z.number().optional(),
  minTorque: z.number().optional(),
  maxTorque: z.number().optional(),
  
  // Charging filtering
  minFastCharging: z.number().optional(),
  maxFastCharging: z.number().optional(),
  minFastChargingCapacity: z.number().optional(),
  maxFastChargingCapacity: z.number().optional(),
  minFastChargingTime: z.number().optional(),
  maxFastChargingTime: z.number().optional(),
  
  // Battery filtering
  minBatteryCapacity: z.number().optional(),
  maxBatteryCapacity: z.number().optional(),
  minUsableBatteryCapacity: z.number().optional(),
  maxUsableBatteryCapacity: z.number().optional(),
  
  // Weight filtering
  minWeight: z.number().optional(),
  maxWeight: z.number().optional(),
  
  // Warranty filtering
  minBatteryWarrantyYears: z.number().optional(),
  maxBatteryWarrantyYears: z.number().optional(),
  minBatteryWarrantyKm: z.number().optional(),
  maxBatteryWarrantyKm: z.number().optional(),
  
  // Feature filtering
  v2lSupport: z.boolean().optional(),
  
  // Text search
  searchTerm: z.string().optional(),
  
  // Sorting
  sortBy: z.enum([
    'popular',
    'price_low',
    'price_high',
    'range_high',
    'battery_high',
    'efficiency',
    'acceleration',
    'weight_low',
    'weight_high',
    'cost_per_km',
    'charging_fast',
    'horsepower',
    'torque'
  ]).optional().default('popular'),
  
  // Pagination
  page: z.number().optional().default(1),
  perPage: z.number().optional().default(10),
});

export type VehicleFilter = z.infer<typeof vehicleFilterSchema>;

// Extended vehicle type with related information
export interface VehicleWithDetails {
  id: number;
  modelId: number;
  variantName: string;
  batteryCapacity: number | null;
  usableBatteryCapacity: number | null;
  officialRange: number | null;
  realWorldRange: number | null;
  efficiency: number | null;
  horsepower: number | null;
  torque: number | null;
  acceleration: number | null;
  topSpeed: number | null;
  fastChargingCapacity: number | null;
  fastChargingTime: number | null;
  weight: number | null;
  v2lSupport: boolean;
  v2lOutputPower: number | null;
  price: number | null;
  manufacturerId: number;
  manufacturerName: string;
  modelName: string;
  bodyStyleId: number;
  bodyStyleName: string;
  image: string | null;
  manufacturingStartYear: number;
  manufacturingEndYear: number | null;
  driveTypeName: string | null;
  batteryTypeName: string | null;
  chargingPortLocation: string | null;
  rangeRatingSystem: string | null;
  batteryWarrantyYears: number | null;
  batteryWarrantyKm: number | null;
  bootSpace: number | null; // Added bootSpace field
  viewCount: number | null; // Added viewCount field for popularity tracking
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}
