import { 
  pgTable, 
  text, 
  serial, 
  integer, 
  boolean, 
  doublePrecision, 
  timestamp,
  primaryKey,
  foreignKey,
  uniqueIndex
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Core Tables
export const manufacturers = pgTable("manufacturers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
});

export const bodyStyles = pgTable("body_styles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const driveTypes = pgTable("drive_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const batteryTypes = pgTable("battery_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const chargingPortLocations = pgTable("charging_port_locations", {
  id: serial("id").primaryKey(),
  location: text("location").notNull(),
});

export const rangeRatingSystems = pgTable("range_rating_systems", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

// Car Models
export const carModels = pgTable("car_models", {
  id: serial("id").primaryKey(),
  manufacturerId: integer("manufacturer_id").notNull().references(() => manufacturers.id),
  modelName: text("model_name").notNull(),
  bodyStyleId: integer("body_style_id").notNull().references(() => bodyStyles.id),
  image: text("image"),
  chargingPortLocationId: integer("charging_port_location_id").references(() => chargingPortLocations.id),
  bootSpace: integer("boot_space"), // in liters
  manufacturingStartYear: integer("manufacturing_start_year").notNull(),
  manufacturingEndYear: integer("manufacturing_end_year"),
});

// Vehicles (Variants)
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  modelId: integer("model_id").notNull().references(() => carModels.id),
  variantName: text("variant_name").notNull(),
  driveTypeId: integer("drive_type_id").references(() => driveTypes.id),
  batteryTypeId: integer("battery_type_id").references(() => batteryTypes.id),
  batteryCapacity: doublePrecision("battery_capacity"), // in kWh
  usableBatteryCapacity: doublePrecision("usable_battery_capacity"), // in kWh
  batteryWarrantyYears: integer("battery_warranty_years"),
  batteryWarrantyKm: integer("battery_warranty_km"),
  officialRange: integer("official_range"), // in km
  rangeRatingId: integer("range_rating_id").references(() => rangeRatingSystems.id),
  realWorldRange: integer("real_world_range"), // in km
  efficiency: doublePrecision("efficiency"), // in Wh/km
  horsepower: doublePrecision("horsepower"), // in BHP
  torque: integer("torque"), // in Nm
  acceleration: doublePrecision("acceleration"), // in seconds (0-100 km/h)
  topSpeed: integer("top_speed"), // in km/h
  fastChargingCapacity: integer("fast_charging_capacity"), // in kW
  fastChargingTime: integer("fast_charging_time"), // in minutes (10% to 80%)
  weight: integer("weight"), // in kg
  v2lSupport: boolean("v2l_support").default(false),
  v2lOutputPower: integer("v2l_output_power"), // in watts
  price: doublePrecision("price"), // in lakhs (1 lakh = 100,000 rupees)
  viewCount: integer("view_count").default(0), // View count for popularity
});

// Insert Schemas
export const insertManufacturerSchema = createInsertSchema(manufacturers);
export const insertBodyStyleSchema = createInsertSchema(bodyStyles);
export const insertDriveTypeSchema = createInsertSchema(driveTypes);
export const insertBatteryTypeSchema = createInsertSchema(batteryTypes);
export const insertChargingPortLocationSchema = createInsertSchema(chargingPortLocations);
export const insertRangeRatingSystemSchema = createInsertSchema(rangeRatingSystems);
export const insertCarModelSchema = createInsertSchema(carModels);
export const insertVehicleSchema = createInsertSchema(vehicles);

// Insert Types
export type InsertManufacturer = z.infer<typeof insertManufacturerSchema>;
export type InsertBodyStyle = z.infer<typeof insertBodyStyleSchema>;
export type InsertDriveType = z.infer<typeof insertDriveTypeSchema>;
export type InsertBatteryType = z.infer<typeof insertBatteryTypeSchema>;
export type InsertChargingPortLocation = z.infer<typeof insertChargingPortLocationSchema>;
export type InsertRangeRatingSystem = z.infer<typeof insertRangeRatingSystemSchema>;
export type InsertCarModel = z.infer<typeof insertCarModelSchema>;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;

// Select Types
export type Manufacturer = typeof manufacturers.$inferSelect;
export type BodyStyle = typeof bodyStyles.$inferSelect;
export type DriveType = typeof driveTypes.$inferSelect;
export type BatteryType = typeof batteryTypes.$inferSelect;
export type ChargingPortLocation = typeof chargingPortLocations.$inferSelect;
export type RangeRatingSystem = typeof rangeRatingSystems.$inferSelect;
export type CarModel = typeof carModels.$inferSelect;
export type Vehicle = typeof vehicles.$inferSelect;

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  passwordHash: true,
  isAdmin: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Add TypeScript declaration for express-session
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}
