import type { SatelliteWeather, WeatherCondition } from '@shared/schema';

interface CacheEntry {
  data: SatelliteWeather;
  expiry: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

async function fetchNOAAWeather(lat: number, lon: number): Promise<SatelliteWeather | null> {
  try {
    const pointsUrl = `https://api.weather.gov/points/${lat},${lon}`;
    const pointsRes = await fetch(pointsUrl, {
      headers: { 'User-Agent': 'QuantumAudioSonar/1.0' }
    });
    
    if (!pointsRes.ok) return null;
    
    const pointsData = await pointsRes.json();
    const forecastUrl = pointsData.properties?.forecast;
    
    if (!forecastUrl) return null;
    
    const forecastRes = await fetch(forecastUrl, {
      headers: { 'User-Agent': 'QuantumAudioSonar/1.0' }
    });
    
    if (!forecastRes.ok) return null;
    
    const forecastData = await forecastRes.json();
    const period = forecastData.properties?.periods?.[0];
    
    if (!period) return null;
    
    const shortForecast = (period.shortForecast || '').toLowerCase();
    const detailedForecast = (period.detailedForecast || '').toLowerCase();
    const combined = shortForecast + ' ' + detailedForecast;
    
    let condition: WeatherCondition = 'clear';
    let stormProbability = 0;
    let cloudCover = 0;
    
    if (combined.includes('thunderstorm') || combined.includes('severe')) {
      condition = 'storm';
      stormProbability = 0.8;
      cloudCover = 90;
    } else if (combined.includes('thunder') || combined.includes('lightning')) {
      condition = 'thunder';
      stormProbability = 0.6;
      cloudCover = 80;
    } else if (combined.includes('rain') || combined.includes('shower')) {
      condition = 'rain';
      stormProbability = combined.includes('heavy') ? 0.4 : 0.2;
      cloudCover = 70;
    } else if (combined.includes('wind') || combined.includes('breezy') || combined.includes('gusty')) {
      condition = 'wind';
      stormProbability = 0.1;
      cloudCover = 40;
    } else if (combined.includes('cloud') || combined.includes('overcast')) {
      condition = 'clear';
      cloudCover = combined.includes('mostly') ? 60 : 40;
    } else if (combined.includes('sunny') || combined.includes('clear')) {
      condition = 'clear';
      cloudCover = 10;
    }
    
    return {
      condition,
      cloudCover,
      stormProbability,
      temperature: period.temperature,
      source: 'noaa',
      timestamp: Date.now(),
      location: { lat, lon }
    };
  } catch (error) {
    console.error('NOAA fetch error:', error);
    return null;
  }
}

function generateFallbackWeather(lat: number, lon: number): SatelliteWeather {
  const hour = new Date().getHours();
  const season = Math.floor((new Date().getMonth() + 1) / 4);
  
  const baseStormProb = Math.abs(lat) < 30 ? 0.3 : 0.15;
  const timeModifier = (hour >= 14 && hour <= 20) ? 1.5 : 0.8;
  const stormProbability = Math.min(1, baseStormProb * timeModifier * (0.5 + Math.random() * 0.5));
  
  let condition: WeatherCondition = 'clear';
  let cloudCover = 20 + Math.random() * 30;
  
  if (stormProbability > 0.6) {
    condition = 'storm';
    cloudCover = 85 + Math.random() * 15;
  } else if (stormProbability > 0.4) {
    condition = 'thunder';
    cloudCover = 70 + Math.random() * 20;
  } else if (stormProbability > 0.25) {
    condition = 'rain';
    cloudCover = 60 + Math.random() * 25;
  } else if (Math.random() > 0.7) {
    condition = 'wind';
    cloudCover = 30 + Math.random() * 30;
  }
  
  return {
    condition,
    cloudCover,
    stormProbability,
    source: 'fallback',
    timestamp: Date.now(),
    location: { lat, lon }
  };
}

export async function getSatelliteWeather(lat: number, lon: number): Promise<SatelliteWeather> {
  const cacheKey = getCacheKey(lat, lon);
  const cached = cache.get(cacheKey);
  
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }
  
  let result = await fetchNOAAWeather(lat, lon);
  
  if (!result) {
    result = generateFallbackWeather(lat, lon);
  }
  
  cache.set(cacheKey, {
    data: result,
    expiry: Date.now() + CACHE_TTL
  });
  
  return result;
}

export function clearWeatherCache(): void {
  cache.clear();
}
