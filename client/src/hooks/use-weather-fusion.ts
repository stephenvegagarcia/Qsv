import { useState, useCallback, useRef, useEffect } from 'react';
import type { 
  WeatherCondition, 
  WeatherMode, 
  SatelliteWeather, 
  StormQuantum, 
  FusedWeather 
} from '@shared/schema';

interface UseWeatherFusionProps {
  weatherMode: WeatherMode;
  acousticWeather?: WeatherCondition;
  frequencies?: number[];
  volume?: number;
}

interface LocationState {
  lat: number;
  lon: number;
  available: boolean;
  error?: string;
}

export function useWeatherFusion({ 
  weatherMode, 
  acousticWeather, 
  frequencies = [], 
  volume = 0 
}: UseWeatherFusionProps) {
  const [satelliteWeather, setSatelliteWeather] = useState<SatelliteWeather | null>(null);
  const [stormQuantum, setStormQuantum] = useState<StormQuantum | null>(null);
  const [fusedWeather, setFusedWeather] = useState<FusedWeather | null>(null);
  const [location, setLocation] = useState<LocationState>({ lat: 40.7128, lon: -74.006, available: false });
  const [isLoading, setIsLoading] = useState(false);
  
  const lastFetchRef = useRef<number>(0);
  const FETCH_INTERVAL = 30000;

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            available: true
          });
        },
        (error) => {
          console.warn('Geolocation error:', error.message);
          setLocation(prev => ({ ...prev, error: error.message }));
        },
        { enableHighAccuracy: false, timeout: 10000 }
      );
    }
  }, []);

  const fetchSatelliteWeather = useCallback(async () => {
    if (weatherMode === 'acoustic') return;
    
    const now = Date.now();
    if (now - lastFetchRef.current < FETCH_INTERVAL) return;
    lastFetchRef.current = now;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/weather/satellite?lat=${location.lat}&lon=${location.lon}`
      );
      if (response.ok) {
        const data: SatelliteWeather = await response.json();
        setSatelliteWeather(data);
      }
    } catch (error) {
      console.error('Satellite weather fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [weatherMode, location.lat, location.lon]);

  const processQuantumStorm = useCallback(async () => {
    if (weatherMode === 'acoustic' || frequencies.length === 0) return;
    
    try {
      const response = await fetch('/api/quantum/storm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frequencies: frequencies.slice(0, 8),
          volume,
          stormProbability: satelliteWeather?.stormProbability || 0
        })
      });
      
      if (response.ok) {
        const data: StormQuantum = await response.json();
        setStormQuantum(data);
      }
    } catch (error) {
      console.error('Quantum storm processing error:', error);
    }
  }, [weatherMode, frequencies, volume, satelliteWeather?.stormProbability]);

  const fuseWeatherData = useCallback(() => {
    if (weatherMode === 'acoustic') {
      setFusedWeather({
        condition: acousticWeather || 'unknown',
        confidence: acousticWeather ? 0.7 : 0.3,
        acousticCondition: acousticWeather,
        source: 'acoustic'
      });
      return;
    }

    if (weatherMode === 'satellite') {
      const condition = satelliteWeather?.condition || 'unknown';
      const isStorm = stormQuantum?.isStormDetected && condition !== 'storm';
      
      setFusedWeather({
        condition: isStorm ? 'storm' : condition,
        confidence: stormQuantum?.stormConfidence || satelliteWeather?.stormProbability || 0.5,
        satelliteCondition: satelliteWeather?.condition,
        stormQuantum: stormQuantum || undefined,
        source: 'satellite'
      });
      return;
    }

    if (weatherMode === 'fused') {
      const conditions: WeatherCondition[] = [];
      const weights: number[] = [];
      
      if (acousticWeather && acousticWeather !== 'unknown') {
        conditions.push(acousticWeather);
        weights.push(0.3);
      }
      
      if (satelliteWeather?.condition && satelliteWeather.condition !== 'unknown') {
        conditions.push(satelliteWeather.condition);
        weights.push(0.5);
      }
      
      if (stormQuantum?.isStormDetected) {
        conditions.push('storm');
        weights.push(0.2);
      }
      
      let finalCondition: WeatherCondition = 'unknown';
      let maxWeight = 0;
      
      const conditionWeights = new Map<WeatherCondition, number>();
      conditions.forEach((cond, i) => {
        const current = conditionWeights.get(cond) || 0;
        conditionWeights.set(cond, current + weights[i]);
      });
      
      conditionWeights.forEach((weight, cond) => {
        if (weight > maxWeight) {
          maxWeight = weight;
          finalCondition = cond;
        }
      });
      
      const avgConfidence = [
        acousticWeather ? 0.7 : 0,
        satelliteWeather?.stormProbability || 0,
        stormQuantum?.stormConfidence || 0
      ].filter(c => c > 0).reduce((a, b, _, arr) => a + b / arr.length, 0);
      
      setFusedWeather({
        condition: finalCondition,
        confidence: avgConfidence || 0.5,
        acousticCondition: acousticWeather,
        satelliteCondition: satelliteWeather?.condition,
        stormQuantum: stormQuantum || undefined,
        source: 'fused'
      });
    }
  }, [weatherMode, acousticWeather, satelliteWeather, stormQuantum]);

  useEffect(() => {
    if (weatherMode !== 'acoustic') {
      fetchSatelliteWeather();
    }
  }, [weatherMode, fetchSatelliteWeather]);

  useEffect(() => {
    if (weatherMode !== 'acoustic' && satelliteWeather && frequencies.length > 0) {
      processQuantumStorm();
    }
  }, [weatherMode, satelliteWeather, frequencies.length > 0, processQuantumStorm]);

  useEffect(() => {
    fuseWeatherData();
  }, [fuseWeatherData]);

  const refreshSatellite = useCallback(() => {
    lastFetchRef.current = 0;
    fetchSatelliteWeather();
  }, [fetchSatelliteWeather]);

  return {
    fusedWeather,
    satelliteWeather,
    stormQuantum,
    location,
    isLoading,
    refreshSatellite
  };
}
