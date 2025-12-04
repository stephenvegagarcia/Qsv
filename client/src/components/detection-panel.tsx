import { Navigation, Signal, Crosshair, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { Detection } from '@shared/schema';

interface DetectionPanelProps {
  detections: Detection[];
}

export function DetectionPanel({ detections }: DetectionPanelProps) {
  if (detections.length === 0) {
    return null;
  }

  const getDirectionLabel = (azimuth: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(azimuth / 45) % 8;
    return directions[index];
  };

  const formatTimestamp = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
  };

  const formatDistance = (distance: number, accuracy?: number): string => {
    if (accuracy !== undefined && accuracy < 0.5) {
      return `${distance.toFixed(2)}m`;
    }
    return `${distance.toFixed(1)}m`;
  };

  const formatCoordinates = (x?: number, y?: number, z?: number): string | null => {
    if (x === undefined || y === undefined) return null;
    const zStr = z !== undefined ? `, ${z.toFixed(1)}` : '';
    return `(${x.toFixed(1)}, ${y.toFixed(1)}${zStr})`;
  };

  return (
    <div className="fixed left-8 top-1/3 w-72 pointer-events-auto z-10 space-y-2">
      {detections.slice(0, 5).map((detection) => {
        const hasPrecision = detection.position.distanceAccuracy < 0.5;
        const coords = formatCoordinates(
          detection.position.x, 
          detection.position.y, 
          detection.position.z
        );
        
        return (
          <Card 
            key={detection.id}
            data-testid={`card-detection-${detection.id}`}
            className="backdrop-blur-sm bg-card/70 border-card-border p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Navigation 
                  className="w-4 h-4 text-chart-1" 
                  style={{ 
                    transform: `rotate(${detection.position.azimuth}deg)` 
                  }}
                />
                <span className="text-sm font-medium text-foreground">
                  {getDirectionLabel(detection.position.azimuth)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {detection.position.azimuth.toFixed(0)}°
                </span>
              </div>
              <div className="flex items-center gap-1">
                {hasPrecision && (
                  <Crosshair className="w-3 h-3 text-chart-3" />
                )}
                <Signal className="w-4 h-4 text-chart-3" />
              </div>
            </div>

            <div className="space-y-2">
              {/* Distance with precision indicator */}
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                  Distance
                  {hasPrecision && (
                    <Badge variant="outline" className="text-[8px] px-1 py-0 h-4">
                      ToF
                    </Badge>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-mono text-foreground">
                    {formatDistance(detection.position.distance, detection.position.distanceAccuracy)}
                  </span>
                  {detection.position.distanceAccuracy !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      ±{detection.position.distanceAccuracy.toFixed(2)}m
                    </span>
                  )}
                </div>
              </div>

              {/* 3D Coordinates if available */}
              {coords && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Position (x, y, z)
                  </div>
                  <div className="text-xs font-mono text-foreground">
                    {coords}
                  </div>
                </div>
              )}

              {/* Elevation */}
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                    Elevation
                  </div>
                  <div className="text-sm font-mono text-foreground">
                    {detection.position.elevation >= 0 ? '+' : ''}{detection.position.elevation.toFixed(1)}°
                  </div>
                </div>
                
                {/* Confidence */}
                {detection.confidence !== undefined && (
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                      Confidence
                    </div>
                    <div className="text-sm font-mono text-foreground">
                      {Math.round(detection.confidence * 100)}%
                    </div>
                  </div>
                )}
              </div>

              {/* Signal Strength */}
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Signal Strength
                </div>
                <Progress 
                  value={detection.signalStrength * 100} 
                  className="h-1.5"
                />
              </div>

              {/* Classification and Type */}
              <div className="flex items-center gap-2 flex-wrap">
                {detection.classification && (
                  <Badge variant="secondary" className="text-xs">
                    {detection.classification}
                  </Badge>
                )}
                {detection.objectType && (
                  <Badge variant="outline" className="text-xs">
                    {detection.objectType}
                  </Badge>
                )}
              </div>

              <div className="text-[10px] text-muted-foreground pt-1">
                {formatTimestamp(detection.timestamp)}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
