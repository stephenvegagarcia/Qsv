import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { detectObjects } from "./quantum-detector";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Quantum acoustic object detection using Bell state |φ⁺⟩
  // Accepts optional ToF (Time-of-Flight) data for precise distance measurement
  app.post("/api/detect", async (req, res) => {
    try {
      const { frequencies, volume, tofData } = req.body;
      
      if (!Array.isArray(frequencies)) {
        return res.status(400).json({ error: 'frequencies must be an array' });
      }
      
      const result = await detectObjects(
        frequencies.slice(0, 32),  // Use up to 32 frequency bins
        volume || 0,
        tofData  // Pass ToF data for precise localization
      );
      
      res.json(result);
    } catch (error) {
      console.error('Detection error:', error);
      res.status(500).json({ error: 'Object detection failed' });
    }
  });

  return httpServer;
}
