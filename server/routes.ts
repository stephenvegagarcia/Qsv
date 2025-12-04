import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getSatelliteWeather } from "./satellite-weather";
import { processQuantumStorm } from "./quantum-storm";
import { askSonarAssistant, checkAIConnection } from "./ai-assistant";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Satellite weather endpoint
  app.get("/api/weather/satellite", async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string) || 40.7128;
      const lon = parseFloat(req.query.lon as string) || -74.006;
      
      const weather = await getSatelliteWeather(lat, lon);
      res.json(weather);
    } catch (error) {
      console.error('Satellite weather error:', error);
      res.status(500).json({ error: 'Failed to fetch satellite weather' });
    }
  });

  // Quantum storm detection endpoint
  app.post("/api/quantum/storm", async (req, res) => {
    try {
      const { frequencies, volume, stormProbability } = req.body;
      
      if (!Array.isArray(frequencies)) {
        return res.status(400).json({ error: 'frequencies must be an array' });
      }
      
      const result = await processQuantumStorm(
        frequencies.slice(0, 8),
        volume || 0,
        stormProbability || 0
      );
      
      res.json(result);
    } catch (error) {
      console.error('Quantum storm processing error:', error);
      res.status(500).json({ error: 'Quantum storm processing failed' });
    }
  });

  // AI Assistant - ask questions about sonar detections
  app.post("/api/assistant/ask", async (req, res) => {
    try {
      const { question, context } = req.body;
      
      if (!question || typeof question !== 'string') {
        return res.status(400).json({ error: 'question is required' });
      }
      
      const response = await askSonarAssistant(question, context || {
        detections: [],
        audioAnalysis: null,
        weather: null,
        detectionRange: 0,
        quantumStatus: 'idle'
      });
      
      res.json({ response });
    } catch (error) {
      console.error('AI assistant error:', error);
      res.status(500).json({ error: 'AI assistant failed to respond' });
    }
  });

  // Check AI connection status
  app.get("/api/assistant/status", async (req, res) => {
    try {
      const connected = await checkAIConnection();
      res.json({ 
        connected,
        provider: 'openai',
        model: 'gpt-4o-mini'
      });
    } catch (error) {
      res.json({ connected: false });
    }
  });

  return httpServer;
}
