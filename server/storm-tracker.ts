import type { StormTracking, StormLocation, WeatherCondition } from '@shared/schema';

interface NearbyCity {
  name: string;
  lat: number;
  lon: number;
  distance: number;
  bearing: number;
}

const MAJOR_US_CITIES: { name: string; lat: number; lon: number }[] = [
  { name: "New York", lat: 40.7128, lon: -74.0060 },
  { name: "Los Angeles", lat: 34.0522, lon: -118.2437 },
  { name: "Chicago", lat: 41.8781, lon: -87.6298 },
  { name: "Houston", lat: 29.7604, lon: -95.3698 },
  { name: "Phoenix", lat: 33.4484, lon: -112.0740 },
  { name: "Philadelphia", lat: 39.9526, lon: -75.1652 },
  { name: "San Antonio", lat: 29.4241, lon: -98.4936 },
  { name: "San Diego", lat: 32.7157, lon: -117.1611 },
  { name: "Dallas", lat: 32.7767, lon: -96.7970 },
  { name: "San Jose", lat: 37.3382, lon: -121.8863 },
  { name: "Austin", lat: 30.2672, lon: -97.7431 },
  { name: "Jacksonville", lat: 30.3322, lon: -81.6557 },
  { name: "Fort Worth", lat: 32.7555, lon: -97.3308 },
  { name: "Columbus", lat: 39.9612, lon: -82.9988 },
  { name: "Charlotte", lat: 35.2271, lon: -80.8431 },
  { name: "Seattle", lat: 47.6062, lon: -122.3321 },
  { name: "Denver", lat: 39.7392, lon: -104.9903 },
  { name: "Boston", lat: 42.3601, lon: -71.0589 },
  { name: "Nashville", lat: 36.1627, lon: -86.7816 },
  { name: "Detroit", lat: 42.3314, lon: -83.0458 },
  { name: "Portland", lat: 45.5152, lon: -122.6784 },
  { name: "Las Vegas", lat: 36.1699, lon: -115.1398 },
  { name: "Memphis", lat: 35.1495, lon: -90.0490 },
  { name: "Louisville", lat: 38.2527, lon: -85.7585 },
  { name: "Baltimore", lat: 39.2904, lon: -76.6122 },
  { name: "Milwaukee", lat: 43.0389, lon: -87.9065 },
  { name: "Albuquerque", lat: 35.0844, lon: -106.6504 },
  { name: "Tucson", lat: 32.2226, lon: -110.9747 },
  { name: "Fresno", lat: 36.7378, lon: -119.7871 },
  { name: "Sacramento", lat: 38.5816, lon: -121.4944 },
  { name: "Atlanta", lat: 33.7490, lon: -84.3880 },
  { name: "Miami", lat: 25.7617, lon: -80.1918 },
  { name: "Tampa", lat: 27.9506, lon: -82.4572 },
  { name: "Orlando", lat: 28.5383, lon: -81.3792 },
  { name: "Minneapolis", lat: 44.9778, lon: -93.2650 },
  { name: "Cleveland", lat: 41.4993, lon: -81.6944 },
  { name: "New Orleans", lat: 29.9511, lon: -90.0715 },
  { name: "Kansas City", lat: 39.0997, lon: -94.5786 },
  { name: "Oklahoma City", lat: 35.4676, lon: -97.5164 },
  { name: "Salt Lake City", lat: 40.7608, lon: -111.8910 },
];

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;
  
  const x = Math.sin(dLon) * Math.cos(lat2Rad);
  const y = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
  
  let bearing = Math.atan2(x, y) * 180 / Math.PI;
  return (bearing + 360) % 360;
}

function getCardinalDirection(bearing: number): string {
  const directions = ["North", "Northeast", "East", "Southeast", "South", "Southwest", "West", "Northwest"];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

function getNearbyCities(userLat: number, userLon: number, maxDistance: number = 500): NearbyCity[] {
  return MAJOR_US_CITIES
    .map(city => ({
      name: city.name,
      lat: city.lat,
      lon: city.lon,
      distance: calculateDistance(userLat, userLon, city.lat, city.lon),
      bearing: calculateBearing(userLat, userLon, city.lat, city.lon)
    }))
    .filter(city => city.distance <= maxDistance && city.distance > 10)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 10);
}

async function checkCityWeather(lat: number, lon: number): Promise<{ condition: WeatherCondition; stormProbability: number }> {
  try {
    const response = await fetch(`https://api.weather.gov/points/${lat},${lon}`, {
      headers: { 'User-Agent': 'QuantumAudioSonar/1.0' }
    });
    
    if (!response.ok) {
      return simulateWeatherCondition(lat, lon);
    }
    
    const data = await response.json();
    const forecastUrl = data.properties?.forecast;
    
    if (!forecastUrl) {
      return simulateWeatherCondition(lat, lon);
    }
    
    const forecastRes = await fetch(forecastUrl, {
      headers: { 'User-Agent': 'QuantumAudioSonar/1.0' }
    });
    
    if (!forecastRes.ok) {
      return simulateWeatherCondition(lat, lon);
    }
    
    const forecastData = await forecastRes.json();
    const period = forecastData.properties?.periods?.[0];
    
    if (!period) {
      return simulateWeatherCondition(lat, lon);
    }
    
    const forecast = (period.shortForecast || '').toLowerCase() + ' ' + (period.detailedForecast || '').toLowerCase();
    
    if (forecast.includes('thunderstorm') || forecast.includes('severe')) {
      return { condition: 'storm', stormProbability: 0.85 };
    } else if (forecast.includes('thunder') || forecast.includes('lightning')) {
      return { condition: 'thunder', stormProbability: 0.65 };
    } else if (forecast.includes('rain') || forecast.includes('shower')) {
      return { condition: 'rain', stormProbability: forecast.includes('heavy') ? 0.45 : 0.25 };
    } else if (forecast.includes('wind') || forecast.includes('gusty')) {
      return { condition: 'wind', stormProbability: 0.15 };
    }
    
    return { condition: 'clear', stormProbability: 0.05 };
  } catch {
    return simulateWeatherCondition(lat, lon);
  }
}

function simulateWeatherCondition(lat: number, lon: number): { condition: WeatherCondition; stormProbability: number } {
  const hour = new Date().getHours();
  const isAfternoon = hour >= 14 && hour <= 20;
  const isTropical = Math.abs(lat) < 30;
  
  const baseProb = isTropical ? 0.35 : 0.2;
  const timeModifier = isAfternoon ? 1.5 : 0.7;
  const randomFactor = 0.5 + Math.random() * 0.5;
  
  const stormProbability = Math.min(0.95, baseProb * timeModifier * randomFactor);
  
  let condition: WeatherCondition = 'clear';
  if (stormProbability > 0.6) {
    condition = 'storm';
  } else if (stormProbability > 0.4) {
    condition = 'thunder';
  } else if (stormProbability > 0.25) {
    condition = 'rain';
  } else if (Math.random() > 0.6) {
    condition = 'wind';
  }
  
  return { condition, stormProbability };
}

function getSeverity(stormProbability: number): "low" | "moderate" | "high" | "severe" {
  if (stormProbability >= 0.75) return 'severe';
  if (stormProbability >= 0.5) return 'high';
  if (stormProbability >= 0.25) return 'moderate';
  return 'low';
}

function estimateArrivalTime(distance: number, isApproaching: boolean): string | undefined {
  if (!isApproaching) return undefined;
  
  const avgStormSpeed = 40; // km/h average storm movement
  const hours = distance / avgStormSpeed;
  
  if (hours < 0.5) return "less than 30 minutes";
  if (hours < 1) return "about 1 hour";
  if (hours < 2) return "1-2 hours";
  if (hours < 4) return "2-4 hours";
  if (hours < 8) return "4-8 hours";
  return "more than 8 hours";
}

export async function getStormTracking(userLat: number, userLon: number): Promise<StormTracking> {
  const nearbyCities = getNearbyCities(userLat, userLon);
  const nearbyStorms: StormLocation[] = [];
  
  const weatherChecks = await Promise.all(
    nearbyCities.slice(0, 6).map(async city => {
      const weather = await checkCityWeather(city.lat, city.lon);
      return { city, weather };
    })
  );
  
  for (const { city, weather } of weatherChecks) {
    if (weather.stormProbability > 0.2 || weather.condition !== 'clear') {
      nearbyStorms.push({
        name: city.name,
        distance: Math.round(city.distance),
        direction: Math.round(city.bearing),
        cardinalDirection: getCardinalDirection(city.bearing),
        severity: getSeverity(weather.stormProbability),
        condition: weather.condition,
        stormProbability: weather.stormProbability,
      });
    }
  }
  
  nearbyStorms.sort((a, b) => b.stormProbability - a.stormProbability);
  
  const stormApproaching = nearbyStorms.length > 0 && nearbyStorms[0].stormProbability > 0.4;
  const nearestStorm = nearbyStorms[0];
  
  return {
    userLocation: { lat: userLat, lon: userLon },
    nearbyStorms,
    stormApproaching,
    approachingFrom: stormApproaching && nearestStorm ? nearestStorm.cardinalDirection : undefined,
    estimatedArrival: stormApproaching && nearestStorm ? 
      estimateArrivalTime(nearestStorm.distance, true) : undefined,
    timestamp: Date.now(),
  };
}
