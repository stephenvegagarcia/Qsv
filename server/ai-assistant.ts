import OpenAI from "openai";
import type { Detection, AudioAnalysis, FusedWeather, StormTracking } from "@shared/schema";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

interface SonarContext {
  detections: Detection[];
  audioAnalysis: AudioAnalysis | null;
  weather: FusedWeather | null;
  stormTracking: StormTracking | null;
  detectionRange: number;
  quantumStatus: string;
}

export async function askSonarAssistant(
  question: string,
  context: SonarContext
): Promise<string> {
  const systemPrompt = buildSystemPrompt(context);
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question }
      ],
      max_tokens: 200,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content?.trim() || 
      generateFallbackResponse(question, context);
  } catch (error) {
    console.error("OpenAI service error:", error);
    return generateFallbackResponse(question, context);
  }
}

function buildSystemPrompt(context: SonarContext): string {
  const { detections, audioAnalysis, weather, stormTracking, detectionRange, quantumStatus } = context;
  
  let prompt = `You are the Quantum Audio Sonar AI assistant. You help users understand what the sonar is detecting and provide storm/weather direction information. Keep responses brief and conversational (1-3 sentences max).

You can answer questions like:
- "Where's the nearest storm?" or "Point to the storm"
- "Which town has storms nearby?"
- "Where is the storm coming from?"
- "What's the nearest detection?"

Current sonar status:
- Quantum processing: ${quantumStatus}
- Detection range: ${detectionRange.toFixed(1)} meters
- Audio level: ${audioAnalysis?.volume || 0}/255`;

  if (weather) {
    prompt += `\n- Local weather: ${weather.condition} (${Math.round(weather.confidence * 100)}% confidence)`;
    if (weather.stormQuantum) {
      prompt += `\n- Quantum storm detection: ${weather.stormQuantum.isStormDetected ? 'Storm detected' : 'No storm'} (${Math.round(weather.stormQuantum.stormConfidence * 100)}% confidence)`;
    }
  }

  if (stormTracking) {
    if (stormTracking.nearbyStorms.length > 0) {
      prompt += `\n\nNearby storm activity (${stormTracking.nearbyStorms.length} locations):`;
      stormTracking.nearbyStorms.slice(0, 5).forEach((storm, i) => {
        prompt += `\n${i + 1}. ${storm.name}: ${storm.condition} (${storm.severity} severity), ${storm.distance}km ${storm.cardinalDirection} of you, ${Math.round(storm.stormProbability * 100)}% storm probability`;
      });
      
      if (stormTracking.stormApproaching) {
        prompt += `\n\nWARNING: Storm approaching from the ${stormTracking.approachingFrom}!`;
        if (stormTracking.estimatedArrival) {
          prompt += ` Estimated arrival: ${stormTracking.estimatedArrival}.`;
        }
      }
    } else {
      prompt += "\n\nNo significant storm activity detected in nearby cities.";
    }
  }

  if (detections.length > 0) {
    prompt += `\n\nSonar detections (${detections.length} objects):`;
    detections.slice(0, 5).forEach((det, i) => {
      const direction = getCardinalDirection(det.direction.azimuth);
      prompt += `\n${i + 1}. Object at ${det.distance.toFixed(1)}m, ${direction} (${det.direction.azimuth.toFixed(0)}°), signal: ${Math.round(det.signalStrength * 100)}%`;
    });
  } else {
    prompt += "\n\nNo objects currently detected by sonar.";
  }

  prompt += `\n\nWhen answering about storm directions, use cardinal directions (North, South, East, West, etc.) and mention the city name and distance. If asked to "point to" something, describe the direction clearly.`;

  return prompt;
}

function getCardinalDirection(azimuth: number): string {
  const directions = ["North", "Northeast", "East", "Southeast", "South", "Southwest", "West", "Northwest"];
  const index = Math.round(azimuth / 45) % 8;
  return directions[index];
}

function generateFallbackResponse(question: string, context: SonarContext): string {
  const q = question.toLowerCase();
  const { detections, weather, stormTracking, detectionRange } = context;

  if (q.includes("point") || q.includes("where") && (q.includes("storm") || q.includes("thunder"))) {
    if (stormTracking && stormTracking.nearbyStorms.length > 0) {
      const nearest = stormTracking.nearbyStorms[0];
      return `Point ${nearest.cardinalDirection}! There's ${nearest.condition} activity near ${nearest.name}, about ${nearest.distance} kilometers away.`;
    }
    return "I don't detect any storm activity in nearby cities right now.";
  }

  if (q.includes("coming") || q.includes("approaching")) {
    if (stormTracking?.stormApproaching) {
      return `A storm is approaching from the ${stormTracking.approachingFrom}. ${stormTracking.estimatedArrival ? `Expected arrival: ${stormTracking.estimatedArrival}.` : ''}`;
    }
    return "No storms are currently approaching your location.";
  }

  if (q.includes("town") || q.includes("city") || q.includes("nearby")) {
    if (stormTracking && stormTracking.nearbyStorms.length > 0) {
      const storms = stormTracking.nearbyStorms.slice(0, 3);
      const names = storms.map(s => `${s.name} (${s.cardinalDirection})`).join(", ");
      return `Storm activity detected near: ${names}.`;
    }
    return "No storm activity detected in nearby cities.";
  }

  if (q.includes("nearest") || q.includes("closest")) {
    if (q.includes("storm")) {
      if (stormTracking && stormTracking.nearbyStorms.length > 0) {
        const nearest = stormTracking.nearbyStorms[0];
        return `The nearest storm is near ${nearest.name}, ${nearest.distance}km to the ${nearest.cardinalDirection}.`;
      }
      return "No storms detected nearby.";
    }
    
    if (detections.length === 0) {
      return "I don't see any detections right now. The sonar is listening.";
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

  if (q.includes("weather")) {
    if (weather) {
      return `Current conditions: ${weather.condition} with ${Math.round(weather.confidence * 100)}% confidence.`;
    }
    return "Weather detection is analyzing the environment.";
  }

  if (q.includes("range") || q.includes("far")) {
    return `The sonar is detecting up to ${detectionRange.toFixed(1)} meters away.`;
  }

  return "I'm monitoring for storms and objects. Ask me about storm locations, nearby weather, or sonar detections.";
}

export async function checkAIConnection(): Promise<boolean> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "hi" }],
      max_tokens: 5,
    });
    return !!response.choices[0];
  } catch {
    return false;
  }
}
