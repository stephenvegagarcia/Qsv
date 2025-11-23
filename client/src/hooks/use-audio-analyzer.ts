import { useState, useRef, useCallback } from 'react';
import type { AudioAnalysis } from '@shared/schema';

export function useAudioAnalyzer() {
  const [ready, setReady] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
    
    const volume = sum / dataArrayRef.current.length;
    const isBeat = volume > 35; // Beat detection threshold

    return {
      volume,
      frequencyData: frequencies,
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
