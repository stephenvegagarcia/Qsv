import type { StormQuantum } from '@shared/schema';

export async function processQuantumStorm(
  frequencies: number[],
  volume: number,
  satelliteStormProb: number
): Promise<StormQuantum> {
  const normalizedFreqs = frequencies.map(f => Math.min(1, f / 255));
  const avgFreq = normalizedFreqs.reduce((a, b) => a + b, 0) / normalizedFreqs.length || 0;
  const normalizedVolume = Math.min(1, volume / 255);
  
  const signalAmplitude = (avgFreq + normalizedVolume) / 2;
  
  const theta = signalAmplitude * Math.PI / 2;
  const alpha = Math.cos(theta / 2);
  const beta = Math.sin(theta / 2);
  
  const prob00 = Math.pow(alpha, 2);
  const prob11 = Math.pow(beta, 2);
  
  const bellStateAmplitude = 1 / Math.SQRT2;
  
  const measuredProb00 = bellStateAmplitude * bellStateAmplitude * prob00;
  const measuredProb11 = bellStateAmplitude * bellStateAmplitude * prob11;
  
  const probabilities = [measuredProb00, measuredProb11].filter(p => p > 0);
  const totalProb = probabilities.reduce((a, b) => a + b, 0) || 1;
  const normalizedProbs = probabilities.map(p => p / totalProb);
  
  const entanglementEntropy = -normalizedProbs.reduce((sum, p) => {
    return sum + (p > 0 ? p * Math.log2(p) : 0);
  }, 0);
  
  const concurrence = 2 * Math.abs(alpha * beta);
  
  const acousticStormIndicator = normalizedVolume > 0.6 ? 0.5 : 0.1;
  const entropyContribution = entanglementEntropy > 0.9 ? 0.3 : 0.1;
  const concurrenceContribution = concurrence > 0.8 ? 0.3 : 0.1;
  
  const stormConfidence = Math.min(1, 
    (satelliteStormProb * 0.4) + 
    (acousticStormIndicator * 0.2) + 
    (entropyContribution * 0.2) + 
    (concurrenceContribution * 0.2)
  );
  
  const isStormDetected = stormConfidence > 0.5 || (concurrence > 0.85 && entanglementEntropy > 0.95);
  
  return {
    stormConfidence,
    entanglementEntropy,
    bellStateAmplitude,
    concurrence,
    isStormDetected
  };
}
