import { spawn } from 'child_process';
import path from 'path';

export interface DetectedObject {
  id: string;
  azimuth: number;
  elevation: number;
  distance: number;
  strength: number;
  type: string;
  classification: string;
  confidence: number;
}

export interface DetectionResult {
  detections: DetectedObject[];
  total_objects: number;
  quantum_processed: boolean;
  entanglement_quality: number;
  circuit_depth?: number;
  bell_state?: string;
  error?: string;
}

export async function detectObjects(
  frequencies: number[],
  volume: number
): Promise<DetectionResult> {
  return new Promise((resolve) => {
    const scriptPath = path.join(process.cwd(), 'server', 'quantum-acoustic-detector.py');
    
    const python = spawn('python3', [scriptPath]);
    
    let stdout = '';
    let stderr = '';
    
    python.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    python.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    python.on('close', (code) => {
      if (code !== 0 || stderr) {
        console.error('Quantum detector error:', stderr);
        resolve(fallbackDetection(frequencies, volume));
        return;
      }
      
      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (e) {
        console.error('Failed to parse quantum detector output:', e);
        resolve(fallbackDetection(frequencies, volume));
      }
    });
    
    python.on('error', (err) => {
      console.error('Failed to spawn quantum detector:', err);
      resolve(fallbackDetection(frequencies, volume));
    });
    
    // Send input data
    const input = JSON.stringify({ frequencies, volume });
    python.stdin.write(input);
    python.stdin.end();
    
    // Timeout after 5 seconds
    setTimeout(() => {
      python.kill();
      resolve(fallbackDetection(frequencies, volume));
    }, 5000);
  });
}

function fallbackDetection(frequencies: number[], volume: number): DetectionResult {
  const detections: DetectedObject[] = [];
  
  if (frequencies.length < 8 || volume < 10) {
    return {
      detections: [],
      total_objects: 0,
      quantum_processed: false,
      entanglement_quality: 0
    };
  }
  
  // Simple peak detection
  const bandSize = Math.floor(frequencies.length / 4);
  const bands = [
    frequencies.slice(0, bandSize),
    frequencies.slice(bandSize, bandSize * 2),
    frequencies.slice(bandSize * 2, bandSize * 3),
    frequencies.slice(bandSize * 3)
  ];
  
  const classifications = ['Wall/Structure', 'Surface', 'Moving Object', 'Small Item'];
  
  bands.forEach((band, i) => {
    if (band.length === 0) return;
    
    const avg = band.reduce((a, b) => a + b, 0) / band.length;
    const peak = Math.max(...band);
    
    if (peak > 30 && peak > avg * 1.3) {
      const peakIndex = band.indexOf(peak);
      const strength = Math.min(peak / 255, 1.0);
      const azimuth = (i / 4) * 360 + (peakIndex / band.length) * 90;
      const distance = 5 + (i * 12) + (1 - strength) * 8;
      
      detections.push({
        id: `obj_${i}_${Math.round(azimuth)}`,
        azimuth: Math.round(azimuth * 10) / 10 % 360,
        elevation: Math.round((strength - 0.5) * 20 * 10) / 10,
        distance: Math.round(distance * 10) / 10,
        strength: Math.round(strength * 1000) / 1000,
        type: strength > 0.6 ? 'solid' : 'soft',
        classification: classifications[i],
        confidence: Math.round(strength * 0.75 * 100) / 100
      });
    }
  });
  
  return {
    detections,
    total_objects: detections.length,
    quantum_processed: false,
    entanglement_quality: detections.length > 0 ? 0.3 : 0
  };
}
