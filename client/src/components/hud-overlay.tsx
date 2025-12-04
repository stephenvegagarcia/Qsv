import { Activity, Cpu, Radio, Ruler, CloudRain, Wind, CloudLightning, Sun, HelpCircle, Zap, Satellite } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { WeatherCondition, FusedWeather, WeatherMode } from '@shared/schema';

interface HUDOverlayProps {
  audioLevel: number;
  pulseCount: number;
  quantumStatus: 'idle' | 'ready' | 'processing';
  detectionRange: number;
  weather?: WeatherCondition;
  fusedWeather?: FusedWeather | null;
  weatherMode?: WeatherMode;
}

export function HUDOverlay({ 
  audioLevel, 
  pulseCount, 
  quantumStatus, 
  detectionRange,
  weather = 'unknown',
  fusedWeather,
  weatherMode = 'acoustic'
}: HUDOverlayProps) {
  const statusColors = {
    idle: 'text-muted-foreground',
    ready: 'text-chart-3',
    processing: 'text-primary'
  };

  const statusLabels = {
    idle: 'Idle',
    ready: 'Ready',
    processing: 'Processing'
  };

  const weatherIcons: Record<WeatherCondition, typeof Sun> = {
    clear: Sun,
    rain: CloudRain,
    wind: Wind,
    thunder: CloudLightning,
    storm: Zap,
    unknown: HelpCircle
  };

  const weatherColors: Record<WeatherCondition, string> = {
    clear: 'text-yellow-500',
    rain: 'text-blue-500',
    wind: 'text-cyan-500',
    thunder: 'text-purple-500',
    storm: 'text-red-500',
    unknown: 'text-muted-foreground'
  };

  const weatherLabels: Record<WeatherCondition, string> = {
    clear: 'Clear',
    rain: 'Rain',
    wind: 'Wind',
    thunder: 'Thunder',
    storm: 'Storm',
    unknown: 'Unknown'
  };

  const modeLabels: Record<WeatherMode, string> = {
    acoustic: 'Acoustic',
    satellite: 'Satellite',
    fused: 'Fused'
  };

  // Determine which weather to display based on mode
  // In acoustic mode: always use acoustic weather
  // In satellite/fused mode: use fused weather, show loading if not yet available
  const isFetchingWeather = weatherMode !== 'acoustic' && !fusedWeather;
  const displayWeather: WeatherCondition = 
    weatherMode === 'acoustic' 
      ? weather 
      : (fusedWeather?.condition || 'unknown');
  const WeatherIcon = weatherIcons[displayWeather];
  const stormConfidence = fusedWeather?.stormQuantum?.stormConfidence;

  return (
    <div className="fixed top-0 left-0 right-0 p-4 pointer-events-none z-10">
      <div className="backdrop-blur-md bg-card/80 border border-card-border rounded-lg p-4">
        <div className="flex flex-wrap gap-8">
          {/* Audio Input Level */}
          <div className="flex items-center gap-3 min-w-[200px]">
            <Activity className="w-4 h-4 text-primary" />
            <div className="flex-1">
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
                Audio Input
              </div>
              <div className="flex items-center gap-2">
                <Progress 
                  value={(audioLevel / 255) * 100} 
                  className="h-2 flex-1"
                />
                <span className="text-sm font-mono text-foreground w-12 text-right">
                  {Math.round((audioLevel / 255) * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Pulse Count */}
          <div className="flex items-center gap-3">
            <Radio className="w-4 h-4 text-chart-2" />
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Active Pulses
              </div>
              <div className="text-base font-mono text-foreground">
                {pulseCount}
              </div>
            </div>
          </div>

          {/* Quantum Status */}
          <div className="flex items-center gap-3">
            <Cpu className={`w-4 h-4 ${statusColors[quantumStatus]}`} />
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Quantum Processing
              </div>
              <div className={`text-base font-medium ${statusColors[quantumStatus]}`}>
                {statusLabels[quantumStatus]}
              </div>
            </div>
          </div>

          {/* Detection Range */}
          <div className="flex items-center gap-3">
            <Ruler className="w-4 h-4 text-chart-4" />
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Detection Range
              </div>
              <div className="text-base font-mono text-foreground">
                {detectionRange.toFixed(1)}m
              </div>
            </div>
          </div>

          {/* Weather Detection */}
          <div className="flex items-center gap-3">
            <WeatherIcon className={`w-4 h-4 ${weatherColors[displayWeather]}`} data-testid="icon-weather" />
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                {weatherMode !== 'acoustic' && <Satellite className="w-3 h-3" />}
                {modeLabels[weatherMode]} Weather
              </div>
              <div className={`text-base font-medium ${weatherColors[displayWeather]}`} data-testid="text-weather-condition">
                {weatherLabels[displayWeather]}
              </div>
            </div>
          </div>

          {/* Storm Detection (Bell State) */}
          {stormConfidence !== undefined && (
            <div className="flex items-center gap-3">
              <Zap className={`w-4 h-4 ${stormConfidence > 0.5 ? 'text-red-500' : 'text-muted-foreground'}`} data-testid="icon-storm" />
              <div>
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Storm Detection (|Φ⁺⟩)
                </div>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={stormConfidence * 100} 
                    className="h-2 w-16"
                  />
                  <span className={`text-sm font-mono ${stormConfidence > 0.5 ? 'text-red-500' : 'text-foreground'}`} data-testid="text-storm-confidence">
                    {Math.round(stormConfidence * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
