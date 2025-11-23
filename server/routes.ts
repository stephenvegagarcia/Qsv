import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { QuantumService } from "./quantum_service";
import { 
  audioAnalysisSchema, 
  settingsSchema,
  type WSMessage 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer });
  const quantumService = new QuantumService();

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", quantum: "ready" });
  });

  // WebSocket connection for real-time quantum processing
  wss.on("connection", (ws: WebSocket) => {
    console.log("Client connected to quantum sonar WebSocket");

    let currentSettings = settingsSchema.parse({});

    ws.on("message", async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString()) as WSMessage;

        if (message.type === "audio_data") {
          // Process audio through quantum service
          const audioData = message.payload;
          
          // Only process if quantum mode is enabled
          if (currentSettings.quantumMode !== "off") {
            const quantumResult = await quantumService.processAudio(
              audioData.frequencyData,
              currentSettings.enhancementLevel
            );

            // Send quantum result back to client
            ws.send(JSON.stringify({
              type: "quantum_result",
              payload: quantumResult
            }));
          }
        } else if (message.type === "settings_update") {
          // Update current settings
          currentSettings = { ...currentSettings, ...message.payload };
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
        ws.send(JSON.stringify({
          type: "error",
          payload: { message: "Failed to process message" }
        }));
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected from quantum sonar WebSocket");
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  return httpServer;
}
