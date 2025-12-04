import { spawn } from 'child_process';
import path from 'path';

export interface ObjectPosition {
  azimuth: number;
  elevation: number;
  distance: number;
  distanceAccuracy: number;
  x?: number;
  y?: number;
  z?: number;
}

export interface TofData {
  emitTime: number;
  receiveTime: number;
  roundTripMs: number;
  distanceMeters: number;
  correlationStrength: number;
  temperature?: number;
}

export interface DetectedObject {
  id: string;
  position: ObjectPosition;
  signalStrength: number;
  objectType: string;
  classification: string;
  confidence: number;
  tofData?: TofData;
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
  volume: number,
  tofData?: TofData
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
        resolve(fallbackDetection(frequencies, volume, tofData));
        return;
      }
      
      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (e) {
        console.error('Failed to parse quantum detector output:', e);
        resolve(fallbackDetection(frequencies, volume, tofData));
      }
    });
    
    python.on('error', (err) => {
      console.error('Failed to spawn quantum detector:', err);
      resolve(fallbackDetection(frequencies, volume, tofData));
    });
    
    // Send input data including ToF
    const input = JSON.stringify({ frequencies, volume, tofData });
    python.stdin.write(input);
    python.stdin.end();
    
    // Timeout after 5 seconds
    setTimeout(() => {
      python.kill();
      resolve(fallbackDetection(frequencies, volume, tofData));
    }, 5000);
  });
}

function fallbackDetection(
  frequencies: number[], 
  volume: number,
  tofData?: TofData
): DetectionResult {
  const detections: DetectedObject[] = [];
  
  if (frequencies.length < 8 || volume < 10) {
    return {
      detections: [],
      total_objects: 0,
      quantum_processed: false,
      entanglement_quality: 0
    };
  }
  
  // Get ToF distance if available
  const tofDistance = tofData?.distanceMeters;
  const tofAccuracy = tofData ? 0.3 : 2.0;
  
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
      
      // Use ToF for first detection, estimate for others
      let distance: number;
      let distanceAccuracy: number;
      
      if (tofDistance !== undefined && i === 0) {
        distance = tofDistance;
        distanceAccuracy = tofAccuracy;
      } else {
        distance = 2 + (i * 8) + (1 - strength) * 5;
        distanceAccuracy = distance * 0.25;
      }
      
      const elevation = (strength - 0.5) * 20;
      
      // Calculate Cartesian coordinates
      const azimuthRad = (azimuth * Math.PI) / 180;
      const elevationRad = (elevation * Math.PI) / 180;
      
      const x = distance * Math.cos(elevationRad) * Math.sin(azimuthRad);
      const y = distance * Math.cos(elevationRad) * Math.cos(azimuthRad);
      const z = distance * Math.sin(elevationRad);
      
      detections.push({
        id: `obj_${i}_${Math.round(azimuth)}`,
        position: {
          azimuth: Math.round(azimuth * 10) / 10 % 360,
          elevation: Math.round(elevation * 10) / 10,
          distance: Math.round(distance * 100) / 100,
          distanceAccuracy: Math.round(distanceAccuracy * 100) / 100,
          x: Math.round(x * 100) / 100,
          y: Math.round(y * 100) / 100,
          z: Math.round(z * 100) / 100,
        },
        signalStrength: Math.round(strength * 1000) / 1000,
        objectType: strength > 0.6 ? 'solid' : 'soft',
        classification: classifications[i],
        confidence: Math.round(strength * 0.75 * 100) / 100,
        tofData: i === 0 ? tofData : undefined,
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
