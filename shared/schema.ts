import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Time-of-Flight measurement for precise distance
export const tofMeasurementSchema = z.object({
  emitTime: z.number(),           // When chirp was emitted
  receiveTime: z.number(),        // When echo was received
  roundTripMs: z.number(),        // Round trip time in milliseconds
  distanceMeters: z.number(),     // Calculated distance (speed of sound * time / 2)
  correlationStrength: z.number().min(0).max(1), // How confident the echo detection is
  temperature: z.number().optional(), // Air temperature for speed of sound adjustment
});

export type TofMeasurement = z.infer<typeof tofMeasurementSchema>;

// Chirp pulse configuration
export const chirpConfigSchema = z.object({
  startFreq: z.number().default(2000),    // Start frequency in Hz
  endFreq: z.number().default(8000),      // End frequency in Hz
  duration: z.number().default(50),        // Pulse duration in ms
  type: z.enum(["linear", "logarithmic"]).default("logarithmic"),
});

export type ChirpConfig = z.infer<typeof chirpConfigSchema>;

// Precise object position
export const objectPositionSchema = z.object({
  azimuth: z.number(),            // Horizontal angle 0-360 degrees
  elevation: z.number(),          // Vertical angle -90 to 90 degrees
  distance: z.number(),           // Distance in meters
  distanceAccuracy: z.number(),   // Accuracy margin in meters (+/-)
  x: z.number().optional(),       // Cartesian X coordinate
  y: z.number().optional(),       // Cartesian Y coordinate
  z: z.number().optional(),       // Cartesian Z coordinate (height)
});

export type ObjectPosition = z.infer<typeof objectPositionSchema>;

// Detection Event with precise localization
export const detectionSchema = z.object({
  id: z.string(),
  position: objectPositionSchema,
  signalStrength: z.number().min(0).max(1),
  timestamp: z.number(),
  classification: z.string().optional(),
  objectType: z.enum(["solid", "soft", "medium", "diffuse"]).optional(),
  confidence: z.number().min(0).max(1),
  tofData: tofMeasurementSchema.optional(), // Time-of-flight data if available
  velocity: z.number().optional(),  // m/s, positive = approaching, negative = receding
});

export type Detection = z.infer<typeof detectionSchema>;

// Quantum detection result from Bell state processing
export const quantumDetectionResultSchema = z.object({
  detections: z.array(detectionSchema),
  entanglementQuality: z.number().min(0).max(1),
  totalObjects: z.number(),
  quantumProcessed: z.boolean(),
  circuitDepth: z.number().optional(),
  bellState: z.string().optional(),
  processingTimeMs: z.number().optional(),
});

export type QuantumDetectionResult = z.infer<typeof quantumDetectionResultSchema>;

// Audio Analysis Data
export const audioAnalysisSchema = z.object({
  volume: z.number().min(0).max(255),
  frequencyData: z.array(z.number()),
  isBeat: z.boolean(),
  timestamp: z.number(),
});

export type AudioAnalysis = z.infer<typeof audioAnalysisSchema>;

// Pulse Data (for sonar rings visualization)
export const pulseSchema = z.object({
  id: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  startTime: z.number(),
  speed: z.number().default(15),
  maxDistance: z.number().optional(),
  intensity: z.number().min(0).max(1).default(1),
  isChirp: z.boolean().default(false), // True if this is an active sonar pulse
});

export type Pulse = z.infer<typeof pulseSchema>;

// Quantum Processing Result
export const quantumResultSchema = z.object({
  enhancedFrequencies: z.array(z.number()),
  detectedDistance: z.number().nullable(),
  quantumState: z.string(),
  processingTime: z.number(),
  circuitDepth: z.number(),
  confidence: z.number().min(0).max(1),
});

export type QuantumResult = z.infer<typeof quantumResultSchema>;

// Settings Configuration
export const settingsSchema = z.object({
  fftSize: z.enum(["256", "512", "1024", "2048"]).default("256"),
  sensitivity: z.number().min(0).max(100).default(50),
  quantumMode: z.enum(["off", "enhancement", "full"]).default("enhancement"),
  enhancementLevel: z.number().min(0).max(100).default(50),
  gridOpacity: z.number().min(0).max(100).default(20),
  pulseColorIntensity: z.number().min(0).max(100).default(80),
  noiseMode: z.boolean().default(false),
  // Precise localization settings
  activeSonar: z.boolean().default(true),       // Enable chirp pulse emission
  detectionRange: z.number().min(1).max(50).default(10), // Max range in meters
  temperatureCelsius: z.number().default(20),    // For speed of sound calculation
  autoCalibrate: z.boolean().default(true),      // Auto-adjust for device latency
});

export type Settings = z.infer<typeof settingsSchema>;

// Calibration data for device-specific adjustments
export const calibrationSchema = z.object({
  deviceLatencyMs: z.number().default(0),      // Audio I/O latency
  microphoneSensitivity: z.number().default(1), // Gain adjustment
  speakerDelay: z.number().default(0),         // Speaker output delay
  lastCalibrated: z.number().optional(),       // Timestamp
  isCalibrated: z.boolean().default(false),
});

export type Calibration = z.infer<typeof calibrationSchema>;

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
