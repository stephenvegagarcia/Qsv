import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Audio Analysis Data
export const audioAnalysisSchema = z.object({
  volume: z.number().min(0).max(255),
  frequencyData: z.array(z.number()),
  isBeat: z.boolean(),
  timestamp: z.number(),
});

export type AudioAnalysis = z.infer<typeof audioAnalysisSchema>;

// Pulse Data (for sonar rings)
export const pulseSchema = z.object({
  id: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  startTime: z.number(),
  speed: z.number().default(15),
  maxDistance: z.number().optional(), // how far the pulse detected something
  intensity: z.number().min(0).max(1).default(1),
});

export type Pulse = z.infer<typeof pulseSchema>;

// Quantum Processing Result
export const quantumResultSchema = z.object({
  enhancedFrequencies: z.array(z.number()),
  detectedDistance: z.number().nullable(),
  quantumState: z.string(), // serialized quantum state
  processingTime: z.number(),
  circuitDepth: z.number(),
  confidence: z.number().min(0).max(1),
});

export type QuantumResult = z.infer<typeof quantumResultSchema>;

// Detection Event (when sonar detects an object)
export const detectionSchema = z.object({
  id: z.string(),
  direction: z.object({
    azimuth: z.number(), // 0-360 degrees
    elevation: z.number(), // -90 to 90 degrees
  }),
  distance: z.number(),
  signalStrength: z.number().min(0).max(1),
  timestamp: z.number(),
  classification: z.string().optional(), // QML classification result
});

export type Detection = z.infer<typeof detectionSchema>;

// Settings Configuration
export const settingsSchema = z.object({
  fftSize: z.enum(["256", "512", "1024", "2048"]).default("256"),
  sensitivity: z.number().min(0).max(100).default(50),
  quantumMode: z.enum(["off", "enhancement", "full"]).default("enhancement"),
  enhancementLevel: z.number().min(0).max(100).default(50),
  gridOpacity: z.number().min(0).max(100).default(20),
  pulseColorIntensity: z.number().min(0).max(100).default(80),
});

export type Settings = z.infer<typeof settingsSchema>;

// Keep existing user schema for auth (if needed later)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
