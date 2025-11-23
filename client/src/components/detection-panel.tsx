import { Navigation, Signal } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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

  return (
    <div className="fixed left-8 top-1/3 w-64 pointer-events-auto z-10 space-y-2">
      {detections.slice(0, 5).map((detection) => (
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
                  transform: `rotate(${detection.direction.azimuth}deg)` 
                }}
              />
              <span className="text-sm font-medium text-foreground">
                {getDirectionLabel(detection.direction.azimuth)}
              </span>
            </div>
            <Signal className="w-4 h-4 text-chart-3" />
          </div>

          <div className="space-y-2">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Distance
              </div>
              <div className="text-lg font-mono text-foreground">
                {detection.distance.toFixed(1)}m
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                Signal Strength
              </div>
              <Progress 
                value={detection.signalStrength * 100} 
                className="h-1.5"
              />
            </div>

            {detection.classification && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                  Classification
                </div>
                <div className="text-xs text-accent font-medium">
                  {detection.classification}
                </div>
              </div>
            )}

            <div className="text-[10px] text-muted-foreground pt-1">
              {formatTimestamp(detection.timestamp)}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
