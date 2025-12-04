import { useState, useRef, useCallback } from 'react';
import type { AudioAnalysis, WeatherCondition } from '@shared/schema';

export function useAudioAnalyzer() {
  const [ready, setReady] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const runningAverageRef = useRef<number>(30);
  const gainRef = useRef<number>(1.0);
  const targetLevelRef = useRef<number>(50);
  const weatherHistoryRef = useRef<WeatherCondition[]>([]);

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

      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      streamRef.current = stream;

      setReady(true);
      setIsActive(true);
    } catch (err) {
      console.error("Audio initialization failed:", err);
      throw err;
    }
  }, [ready]);

  const stop = useCallback(() => {
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
  }, []);

  const detectWeather = useCallback((frequencies: number[], volume: number): WeatherCondition => {
    const len = frequencies.length;
    const lowBand = frequencies.slice(0, Math.floor(len * 0.2));
    const midBand = frequencies.slice(Math.floor(len * 0.2), Math.floor(len * 0.6));
    const highBand = frequencies.slice(Math.floor(len * 0.6));
    
    const lowAvg = lowBand.reduce((a, b) => a + b, 0) / lowBand.length;
    const midAvg = midBand.reduce((a, b) => a + b, 0) / midBand.length;
    const highAvg = highBand.reduce((a, b) => a + b, 0) / highBand.length;
    
    let detected: WeatherCondition = "clear";
    
    if (volume > 150 && lowAvg > 100) {
      detected = "thunder";
    } else if (highAvg > 60 && highAvg > lowAvg * 1.5) {
      detected = "rain";
    } else if (lowAvg > 50 && lowAvg > midAvg * 1.3) {
      detected = "wind";
    }
    
    weatherHistoryRef.current.push(detected);
    if (weatherHistoryRef.current.length > 10) {
      weatherHistoryRef.current.shift();
    }
    
    const counts: Record<WeatherCondition, number> = {
      clear: 0,
      rain: 0,
      wind: 0,
      thunder: 0,
      storm: 0,
      unknown: 0
    };
    
    weatherHistoryRef.current.forEach(w => counts[w]++);
    
    let maxCount = 0;
    let dominantWeather: WeatherCondition = "clear";
    for (const [weather, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        dominantWeather = weather as WeatherCondition;
      }
    }
    
    return dominantWeather;
  }, []);

  const getAnalysis = useCallback((): AudioAnalysis => {
    if (!analyserRef.current || !dataArrayRef.current) {
      return { volume: 0, frequencyData: [], isBeat: false, timestamp: Date.now(), weather: "unknown" };
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
    
    const weather = detectWeather(normalizedFrequencies, normalizedVolume);

    return {
      volume: normalizedVolume,
      frequencyData: normalizedFrequencies,
      isBeat,
      timestamp: Date.now(),
      weather
    };
  }, [detectWeather]);

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
    updateFFTSize
  };
}
