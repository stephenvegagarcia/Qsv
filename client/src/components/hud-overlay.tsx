import { Activity, Cpu, Radio, Ruler, Target, Atom, Crosshair, CheckCircle2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface HUDOverlayProps {
  audioLevel: number;
  pulseCount: number;
  quantumStatus: 'idle' | 'ready' | 'processing' | 'pinging';
  detectionRange: number;
  entanglementQuality?: number;
  objectCount?: number;
  precisionMode?: boolean;
  isCalibrated?: boolean;
}

export function HUDOverlay({ 
  audioLevel, 
  pulseCount, 
  quantumStatus, 
  detectionRange,
  entanglementQuality = 0,
  objectCount = 0,
  precisionMode = false,
  isCalibrated = false,
}: HUDOverlayProps) {
  const statusColors = {
    idle: 'text-muted-foreground',
    ready: 'text-chart-3',
    processing: 'text-primary',
    pinging: 'text-chart-2',
  };

  const statusLabels = {
    idle: 'Idle',
    ready: 'Ready',
    processing: 'Processing',
    pinging: 'Pinging',
  };

  return (
    <div className="fixed top-0 left-0 right-0 p-4 pointer-events-none z-10">
      <div className="backdrop-blur-md bg-card/80 border border-card-border rounded-lg p-4">
        <div className="flex flex-wrap gap-6">
          {/* Audio Input Level */}
          <div className="flex items-center gap-3 min-w-[180px]">
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
                <span className="text-sm font-mono text-foreground w-10 text-right">
                  {Math.round((audioLevel / 255) * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Active Pulses */}
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
                Bell State |φ⁺⟩
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
                Max Range
              </div>
              <div className="text-base font-mono text-foreground">
                {detectionRange.toFixed(1)}m
              </div>
            </div>
          </div>

          {/* Objects Detected */}
          <div className="flex items-center gap-3">
            <Target className={`w-4 h-4 ${objectCount > 0 ? 'text-chart-1' : 'text-muted-foreground'}`} data-testid="icon-objects" />
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Objects
              </div>
              <div className={`text-base font-mono ${objectCount > 0 ? 'text-chart-1' : 'text-foreground'}`} data-testid="text-object-count">
                {objectCount}
              </div>
            </div>
          </div>

          {/* Entanglement Quality */}
          <div className="flex items-center gap-3">
            <Atom className={`w-4 h-4 ${entanglementQuality > 0.5 ? 'text-primary' : 'text-muted-foreground'}`} data-testid="icon-entanglement" />
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Entanglement
              </div>
              <div className="flex items-center gap-2">
                <Progress 
                  value={entanglementQuality * 100} 
                  className="h-2 w-14"
                />
                <span className={`text-sm font-mono ${entanglementQuality > 0.5 ? 'text-primary' : 'text-foreground'}`} data-testid="text-entanglement">
                  {Math.round(entanglementQuality * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Precision Mode Indicator */}
          <div className="flex items-center gap-3">
            <Crosshair className={`w-4 h-4 ${precisionMode ? 'text-chart-3' : 'text-muted-foreground'}`} data-testid="icon-precision" />
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Precision
              </div>
              <div className={`text-base font-medium ${precisionMode ? 'text-chart-3' : 'text-muted-foreground'}`} data-testid="text-precision">
                {precisionMode ? 'ToF Active' : 'Standard'}
              </div>
            </div>
          </div>

          {/* Calibration Status */}
          <div className="flex items-center gap-3">
            <CheckCircle2 className={`w-4 h-4 ${isCalibrated ? 'text-chart-3' : 'text-muted-foreground'}`} data-testid="icon-calibrated" />
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Calibration
              </div>
              <div className={`text-base font-medium ${isCalibrated ? 'text-chart-3' : 'text-muted-foreground'}`} data-testid="text-calibrated">
                {isCalibrated ? 'Ready' : 'Pending'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
