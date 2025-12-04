import type { Detection, AudioAnalysis, FusedWeather } from "@shared/schema";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

interface SonarContext {
  detections: Detection[];
  audioAnalysis: AudioAnalysis | null;
  weather: FusedWeather | null;
  detectionRange: number;
  quantumStatus: string;
}

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

export async function askSonarAssistant(
  question: string,
  context: SonarContext
): Promise<string> {
  const systemPrompt = buildSystemPrompt(context);
  
  try {
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: `${systemPrompt}\n\nUser question: ${question}\n\nAssistant:`,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 150,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Ollama API error:", errorText);
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = (await response.json()) as OllamaResponse;
    return data.response.trim();
  } catch (error) {
    console.error("Ollama service error:", error);
    
    if (error instanceof Error && error.message.includes("fetch failed")) {
      return "I cannot connect to the Ollama server. Please make sure Ollama is running and the URL is correct.";
    }
    
    return generateFallbackResponse(question, context);
  }
}

function buildSystemPrompt(context: SonarContext): string {
  const { detections, audioAnalysis, weather, detectionRange, quantumStatus } = context;
  
  let prompt = `You are the Quantum Audio Sonar AI assistant. You help users understand what the sonar is detecting in their environment. Keep responses brief and conversational (1-2 sentences).

Current sonar status:
- Quantum processing: ${quantumStatus}
- Detection range: ${detectionRange.toFixed(1)} meters
- Audio level: ${audioAnalysis?.volume || 0}/255`;

  if (weather) {
    prompt += `\n- Weather condition: ${weather.condition} (${Math.round(weather.confidence * 100)}% confidence)`;
    if (weather.stormQuantum) {
      prompt += `\n- Storm detection: ${weather.stormQuantum.isStormDetected ? 'Storm detected' : 'No storm'} (${Math.round(weather.stormQuantum.stormConfidence * 100)}% confidence)`;
    }
  }

  if (detections.length > 0) {
    prompt += `\n\nCurrent detections (${detections.length} objects):`;
    detections.forEach((det, i) => {
      const direction = getCardinalDirection(det.direction.azimuth);
      prompt += `\n${i + 1}. Object at ${det.distance.toFixed(1)}m, ${direction} (${det.direction.azimuth.toFixed(0)}°), signal strength: ${Math.round(det.signalStrength * 100)}%`;
    });
  } else {
    prompt += "\n\nNo objects currently detected.";
  }

  return prompt;
}

function getCardinalDirection(azimuth: number): string {
  const directions = ["North", "Northeast", "East", "Southeast", "South", "Southwest", "West", "Northwest"];
  const index = Math.round(azimuth / 45) % 8;
  return directions[index];
}

function generateFallbackResponse(question: string, context: SonarContext): string {
  const q = question.toLowerCase();
  const { detections, weather, detectionRange } = context;

  if (q.includes("nearest") || q.includes("closest")) {
    if (detections.length === 0) {
      return "I don't see any detections right now. The sonar is listening for objects.";
    }
    const nearest = detections.reduce((min, det) => 
      det.distance < min.distance ? det : min, detections[0]);
    const direction = getCardinalDirection(nearest.direction.azimuth);
    return `The nearest detection is ${nearest.distance.toFixed(1)} meters away to the ${direction}.`;
  }

  if (q.includes("how many") || q.includes("count")) {
    return detections.length === 0 
      ? "No objects detected at the moment."
      : `I'm detecting ${detections.length} object${detections.length > 1 ? 's' : ''} in the area.`;
  }

  if (q.includes("weather") || q.includes("storm")) {
    if (weather) {
      return `Current acoustic weather shows ${weather.condition} conditions with ${Math.round(weather.confidence * 100)}% confidence.`;
    }
    return "Weather detection is analyzing the environment.";
  }

  if (q.includes("range") || q.includes("far")) {
    return `The sonar is currently detecting up to ${detectionRange.toFixed(1)} meters away.`;
  }

  return "I'm monitoring the sonar. Ask me about detections, distances, or weather conditions.";
}

export async function checkOllamaConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
