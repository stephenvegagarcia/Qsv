import { spawn } from 'child_process';
import type { QuantumResult } from '@shared/schema';

export class QuantumService {
  private pythonPath: string;

  constructor() {
    // Use the Python 3.11 installation from Replit
    this.pythonPath = 'python3';
  }

  async processAudio(
    frequencyData: number[],
    enhancementLevel: number
  ): Promise<QuantumResult> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const input = JSON.stringify({
        frequency_data: frequencyData,
        enhancement_level: enhancementLevel / 100, // Convert from 0-100 to 0-1
      });

      const python = spawn(this.pythonPath, ['server/quantum_processor.py']);
      
      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        const processingTime = Date.now() - startTime;

        if (code !== 0) {
          console.error('Quantum processor error:', stderr);
          // Return a fallback result instead of rejecting
          resolve({
            enhancedFrequencies: frequencyData,
            detectedDistance: null,
            quantumState: '{}',
            processingTime,
            circuitDepth: 0,
            confidence: 0,
          });
          return;
        }

        try {
          const result = JSON.parse(stdout);
          resolve({
            enhancedFrequencies: result.enhanced_frequencies || frequencyData,
            detectedDistance: result.detected_distance,
            quantumState: result.quantum_state || '{}',
            processingTime,
            circuitDepth: result.circuit_depth || 0,
            confidence: result.confidence || 0,
          });
        } catch (error) {
          console.error('Failed to parse quantum processor output:', error);
          resolve({
            enhancedFrequencies: frequencyData,
            detectedDistance: null,
            quantumState: '{}',
            processingTime,
            circuitDepth: 0,
            confidence: 0,
          });
        }
      });

      // Send input data to Python process
      python.stdin.write(input);
      python.stdin.end();

      // Timeout after 5 seconds
      setTimeout(() => {
        python.kill();
        resolve({
          enhancedFrequencies: frequencyData,
          detectedDistance: null,
          quantumState: '{}',
          processingTime: 5000,
          circuitDepth: 0,
          confidence: 0,
        });
      }, 5000);
    });
  }
}
