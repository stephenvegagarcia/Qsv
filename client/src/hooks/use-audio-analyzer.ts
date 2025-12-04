import { useState, useRef, useCallback } from 'react';
import type { AudioAnalysis, TofMeasurement, ChirpConfig, Calibration } from '@shared/schema';

// Speed of sound calculation based on temperature
const getSpeedOfSound = (tempCelsius: number): number => {
  // Speed of sound = 331.3 + 0.606 * temperature (in m/s)
  return 331.3 + 0.606 * tempCelsius;
};

export function useAudioAnalyzer() {
  const [ready, setReady] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [calibration, setCalibration] = useState<Calibration>({
    deviceLatencyMs: 0,
    microphoneSensitivity: 1,
    speakerDelay: 0,
    isCalibrated: false,
  });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  
  // For chirp detection
  const chirpBufferRef = useRef<Float32Array | null>(null);
  const lastChirpTimeRef = useRef<number>(0);
  const chirpSignatureRef = useRef<Float32Array | null>(null);
  const temperatureRef = useRef<number>(20);
  
  const runningAverageRef = useRef<number>(30);
  const gainRef = useRef<number>(1.0);
  const targetLevelRef = useRef<number>(50);

  // Generate chirp waveform for cross-correlation
  const generateChirpSignature = useCallback((config: ChirpConfig, sampleRate: number): Float32Array => {
    const samples = Math.floor((config.duration / 1000) * sampleRate);
    const signature = new Float32Array(samples);
    
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      let freq: number;
      
      if (config.type === "logarithmic") {
        // Logarithmic sweep
        const k = Math.pow(config.endFreq / config.startFreq, 1 / (config.duration / 1000));
        freq = config.startFreq * Math.pow(k, t);
      } else {
        // Linear sweep
        freq = config.startFreq + (config.endFreq - config.startFreq) * (t / (config.duration / 1000));
      }
      
      signature[i] = Math.sin(2 * Math.PI * freq * t);
    }
    
    return signature;
  }, []);

  // Cross-correlation to find echo delay
  const crossCorrelate = useCallback((signal: Float32Array, template: Float32Array): { delay: number; strength: number } => {
    const maxLag = signal.length - template.length;
    if (maxLag <= 0) return { delay: 0, strength: 0 };
    
    let maxCorrelation = 0;
    let bestLag = 0;
    
    // Sliding window cross-correlation
    for (let lag = 0; lag < maxLag; lag++) {
      let correlation = 0;
      let signalEnergy = 0;
      let templateEnergy = 0;
      
      for (let i = 0; i < template.length; i++) {
        correlation += signal[lag + i] * template[i];
        signalEnergy += signal[lag + i] * signal[lag + i];
        templateEnergy += template[i] * template[i];
      }
      
      // Normalized correlation
      const normalizer = Math.sqrt(signalEnergy * templateEnergy);
      if (normalizer > 0) {
        correlation /= normalizer;
      }
      
      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        bestLag = lag;
      }
    }
    
    return { delay: bestLag, strength: maxCorrelation };
  }, []);

  const start = useCallback(async () => {
    if (ready) return;

    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContext();

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      });
      
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      
      // Create gain node for chirp output
      const gainNode = ctx.createGain();
      gainNode.gain.value = 0.3; // Moderate volume for chirps
      gainNode.connect(ctx.destination);

      analyser.fftSize = 2048; // Higher resolution for ToF
      analyser.smoothingTimeConstant = 0.1; // Fast response
      source.connect(analyser);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      streamRef.current = stream;
      gainNodeRef.current = gainNode;
      
      // Initialize chirp buffer for echo detection
      chirpBufferRef.current = new Float32Array(ctx.sampleRate * 0.5); // 500ms buffer
      
      // Generate initial chirp signature
      const defaultChirpConfig: ChirpConfig = {
        startFreq: 2000,
        endFreq: 8000,
        duration: 50,
        type: "logarithmic"
      };
      chirpSignatureRef.current = generateChirpSignature(defaultChirpConfig, ctx.sampleRate);

      setReady(true);
      setIsActive(true);
    } catch (err) {
      console.error("Audio initialization failed:", err);
      throw err;
    }
  }, [ready, generateChirpSignature]);

  const stop = useCallback(() => {
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
      } catch (e) {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setReady(false);
    setIsActive(false);
    audioContextRef.current = null;
    analyserRef.current = null;
    dataArrayRef.current = null;
    streamRef.current = null;
    gainNodeRef.current = null;
    oscillatorRef.current = null;
  }, []);

  // Emit a chirp pulse for active sonar
  const emitChirp = useCallback((config?: Partial<ChirpConfig>): number => {
    if (!audioContextRef.current || !gainNodeRef.current) return 0;
    
    const ctx = audioContextRef.current;
    const fullConfig: ChirpConfig = {
      startFreq: config?.startFreq ?? 2000,
      endFreq: config?.endFreq ?? 8000,
      duration: config?.duration ?? 50,
      type: config?.type ?? "logarithmic"
    };
    
    const oscillator = ctx.createOscillator();
    const chirpGain = ctx.createGain();
    
    oscillator.connect(chirpGain);
    chirpGain.connect(gainNodeRef.current);
    
    const now = ctx.currentTime;
    const emitTime = Date.now();
    const durationSec = fullConfig.duration / 1000;
    
    // Frequency sweep
    oscillator.frequency.setValueAtTime(fullConfig.startFreq, now);
    if (fullConfig.type === "logarithmic") {
      oscillator.frequency.exponentialRampToValueAtTime(fullConfig.endFreq, now + durationSec);
    } else {
      oscillator.frequency.linearRampToValueAtTime(fullConfig.endFreq, now + durationSec);
    }
    
    // Envelope to avoid clicks
    chirpGain.gain.setValueAtTime(0, now);
    chirpGain.gain.linearRampToValueAtTime(0.5, now + 0.005);
    chirpGain.gain.setValueAtTime(0.5, now + durationSec - 0.005);
    chirpGain.gain.linearRampToValueAtTime(0, now + durationSec);
    
    oscillator.start(now);
    oscillator.stop(now + durationSec);
    
    lastChirpTimeRef.current = emitTime;
    
    // Update chirp signature for correlation
    chirpSignatureRef.current = generateChirpSignature(fullConfig, ctx.sampleRate);
    
    return emitTime;
  }, [generateChirpSignature]);

  // Detect echo and calculate time-of-flight
  const detectEcho = useCallback((): TofMeasurement | null => {
    if (!analyserRef.current || !audioContextRef.current || !chirpSignatureRef.current) {
      return null;
    }
    
    if (lastChirpTimeRef.current === 0) return null;
    
    const ctx = audioContextRef.current;
    const analyser = analyserRef.current;
    
    // Get time-domain data for correlation
    const timeDomainData = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(timeDomainData);
    
    // Cross-correlate with chirp signature
    const { delay, strength } = crossCorrelate(timeDomainData, chirpSignatureRef.current);
    
    // Only report if correlation is strong enough
    if (strength < 0.3) return null;
    
    // Calculate round-trip time
    const delaySamples = delay;
    const delaySeconds = delaySamples / ctx.sampleRate;
    const roundTripMs = delaySeconds * 1000 - calibration.deviceLatencyMs;
    
    if (roundTripMs <= 0) return null;
    
    // Calculate distance using speed of sound
    const speedOfSound = getSpeedOfSound(temperatureRef.current);
    const distanceMeters = (speedOfSound * (roundTripMs / 1000)) / 2;
    
    const receiveTime = Date.now();
    
    return {
      emitTime: lastChirpTimeRef.current,
      receiveTime,
      roundTripMs,
      distanceMeters,
      correlationStrength: strength,
      temperature: temperatureRef.current,
    };
  }, [crossCorrelate, calibration.deviceLatencyMs]);

  // Calibration routine to measure device latency
  const calibrate = useCallback(async (): Promise<Calibration> => {
    if (!audioContextRef.current || !gainNodeRef.current) {
      return calibration;
    }
    
    // Emit a test chirp and measure self-echo (direct path)
    const measurements: number[] = [];
    
    for (let i = 0; i < 5; i++) {
      emitChirp({ duration: 30, startFreq: 3000, endFreq: 6000 });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const tof = detectEcho();
      if (tof && tof.roundTripMs > 0 && tof.roundTripMs < 50) {
        measurements.push(tof.roundTripMs);
      }
    }
    
    let deviceLatencyMs = 0;
    if (measurements.length > 0) {
      // Use median to avoid outliers
      measurements.sort((a, b) => a - b);
      deviceLatencyMs = measurements[Math.floor(measurements.length / 2)];
    }
    
    const newCalibration: Calibration = {
      deviceLatencyMs,
      microphoneSensitivity: 1,
      speakerDelay: 0,
      lastCalibrated: Date.now(),
      isCalibrated: true,
    };
    
    setCalibration(newCalibration);
    return newCalibration;
  }, [emitChirp, detectEcho, calibration]);

  const setTemperature = useCallback((tempCelsius: number) => {
    temperatureRef.current = tempCelsius;
  }, []);

  const getAnalysis = useCallback((): AudioAnalysis => {
    if (!analyserRef.current || !dataArrayRef.current) {
      return { volume: 0, frequencyData: [], isBeat: false, timestamp: Date.now() };
    }

    analyserRef.current.getByteFrequencyData(dataArrayRef.current);

    let sum = 0;
    const frequencies: number[] = [];
    
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      const value = dataArrayRef.current[i];
      sum += value;
      frequencies.push(value);
    }
    
    const rawVolume = sum / dataArrayRef.current.length;
    
    runningAverageRef.current = runningAverageRef.current * 0.95 + rawVolume * 0.05;
    
    if (runningAverageRef.current > 5) {
      const targetGain = targetLevelRef.current / runningAverageRef.current;
      gainRef.current = gainRef.current * 0.9 + targetGain * 0.1;
      gainRef.current = Math.max(0.5, Math.min(4.0, gainRef.current));
    }
    
    const normalizedVolume = Math.min(255, rawVolume * gainRef.current);
    const normalizedFrequencies = frequencies.map(f => Math.min(255, f * gainRef.current));
    
    const dynamicThreshold = targetLevelRef.current * 0.7;
    const isBeat = normalizedVolume > dynamicThreshold;

    return {
      volume: normalizedVolume,
      frequencyData: normalizedFrequencies,
      isBeat,
      timestamp: Date.now()
    };
  }, []);

  const updateFFTSize = useCallback((size: number) => {
    if (analyserRef.current) {
      analyserRef.current.fftSize = size;
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
    }
  }, []);

  return { 
    ready, 
    isActive,
    start, 
    stop,
    getAnalysis,
    updateFFTSize,
    // Active sonar features
    emitChirp,
    detectEcho,
    calibrate,
    calibration,
    setTemperature,
  };
}
