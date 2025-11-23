import { useState, useRef, useCallback } from 'react';
import type { AudioAnalysis } from '@shared/schema';

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
    updateFFTSize
  };
}
