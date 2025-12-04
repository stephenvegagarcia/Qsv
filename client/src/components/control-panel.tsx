import { Settings as SettingsIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Settings } from '@shared/schema';

interface ControlPanelProps {
  settings: Settings;
  onSettingsChange: (settings: Partial<Settings>) => void;
}

export function ControlPanel({ settings, onSettingsChange }: ControlPanelProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    pulse: true,
    quantum: true,
    precision: true,
    visual: false,
  });

  const toggleSection = (section: string) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="fixed bottom-8 right-8 w-80 pointer-events-auto z-10">
      <Card className="backdrop-blur-md bg-card/90 border-card-border p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          <SettingsIcon className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Controls</h2>
        </div>

        <div className="space-y-4">
          {/* Pulse Settings */}
          <div className="border-b border-border pb-4">
            <button
              onClick={() => toggleSection('pulse')}
              data-testid="button-toggle-pulse-settings"
              className="flex items-center justify-between w-full text-sm font-medium mb-3 hover-elevate active-elevate-2 rounded-md p-2 -m-2"
            >
              <span>Audio Analysis</span>
              {expanded.pulse ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {expanded.pulse && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fft-size" className="text-xs text-muted-foreground mb-2 block">
                    FFT Size (frequency resolution)
                  </Label>
                  <Select 
                    value={settings.fftSize} 
                    onValueChange={(value) => onSettingsChange({ fftSize: value as any })}
                  >
                    <SelectTrigger id="fft-size" data-testid="select-fft-size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="256">256 (fast)</SelectItem>
                      <SelectItem value="512">512 (balanced)</SelectItem>
                      <SelectItem value="1024">1024 (detailed)</SelectItem>
                      <SelectItem value="2048">2048 (high res)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="sensitivity" className="text-xs text-muted-foreground">
                      Detection Sensitivity
                    </Label>
                    <span className="text-xs font-mono text-foreground">
                      {settings.sensitivity}%
                    </span>
                  </div>
                  <Slider
                    id="sensitivity"
                    data-testid="slider-sensitivity"
                    value={[settings.sensitivity]}
                    onValueChange={([value]) => onSettingsChange({ sensitivity: value })}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Precision Localization */}
          <div className="border-b border-border pb-4">
            <button
              onClick={() => toggleSection('precision')}
              data-testid="button-toggle-precision-settings"
              className="flex items-center justify-between w-full text-sm font-medium mb-3 hover-elevate active-elevate-2 rounded-md p-2 -m-2"
            >
              <span>Precision Localization</span>
              {expanded.precision ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {expanded.precision && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="active-sonar" className="text-xs text-muted-foreground">
                    Active Sonar (emit pings)
                  </Label>
                  <Switch
                    id="active-sonar"
                    data-testid="switch-active-sonar"
                    checked={settings.activeSonar}
                    onCheckedChange={(checked) => onSettingsChange({ activeSonar: checked })}
                  />
                </div>

                <div className="text-[10px] text-muted-foreground bg-accent/30 p-2 rounded-md">
                  Active sonar sends chirp pulses and measures echo return time for precise distance
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="detection-range" className="text-xs text-muted-foreground">
                      Max Detection Range
                    </Label>
                    <span className="text-xs font-mono text-foreground">
                      {settings.detectionRange}m
                    </span>
                  </div>
                  <Slider
                    id="detection-range"
                    data-testid="slider-detection-range"
                    value={[settings.detectionRange]}
                    onValueChange={([value]) => onSettingsChange({ detectionRange: value })}
                    min={1}
                    max={50}
                    step={1}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="temperature" className="text-xs text-muted-foreground">
                      Air Temperature (for speed of sound)
                    </Label>
                    <span className="text-xs font-mono text-foreground">
                      {settings.temperatureCelsius}°C
                    </span>
                  </div>
                  <Slider
                    id="temperature"
                    data-testid="slider-temperature"
                    value={[settings.temperatureCelsius]}
                    onValueChange={([value]) => onSettingsChange({ temperatureCelsius: value })}
                    min={-10}
                    max={45}
                    step={1}
                  />
                  <div className="text-[10px] text-muted-foreground mt-1">
                    Speed of sound: {(331.3 + 0.606 * settings.temperatureCelsius).toFixed(1)} m/s
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-calibrate" className="text-xs text-muted-foreground">
                    Auto-Calibrate Device
                  </Label>
                  <Switch
                    id="auto-calibrate"
                    data-testid="switch-auto-calibrate"
                    checked={settings.autoCalibrate}
                    onCheckedChange={(checked) => onSettingsChange({ autoCalibrate: checked })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quantum Parameters */}
          <div className="border-b border-border pb-4">
            <button
              onClick={() => toggleSection('quantum')}
              data-testid="button-toggle-quantum-settings"
              className="flex items-center justify-between w-full text-sm font-medium mb-3 hover-elevate active-elevate-2 rounded-md p-2 -m-2"
            >
              <span>Quantum Detection</span>
              {expanded.quantum ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {expanded.quantum && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="quantum-mode" className="text-xs text-muted-foreground mb-2 block">
                    Bell State Mode
                  </Label>
                  <Select 
                    value={settings.quantumMode} 
                    onValueChange={(value) => onSettingsChange({ quantumMode: value as any })}
                  >
                    <SelectTrigger id="quantum-mode" data-testid="select-quantum-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="off">Off (classical)</SelectItem>
                      <SelectItem value="enhancement">Enhancement</SelectItem>
                      <SelectItem value="full">Full Quantum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="text-[10px] text-muted-foreground bg-accent/30 p-2 rounded-md font-mono">
                  |φ⁺⟩ = 1/√2 (|00⟩ + |11⟩)
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="noise-mode" className="text-xs text-muted-foreground">
                    Noise Cancellation
                  </Label>
                  <Switch
                    id="noise-mode"
                    data-testid="switch-noise-mode"
                    checked={settings.noiseMode}
                    onCheckedChange={(checked) => onSettingsChange({ noiseMode: checked })}
                    disabled={settings.quantumMode === 'off'}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Visualization */}
          <div>
            <button
              onClick={() => toggleSection('visual')}
              data-testid="button-toggle-visual-settings"
              className="flex items-center justify-between w-full text-sm font-medium mb-3 hover-elevate active-elevate-2 rounded-md p-2 -m-2"
            >
              <span>Visualization</span>
              {expanded.visual ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {expanded.visual && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="grid-opacity" className="text-xs text-muted-foreground">
                      Grid Opacity
                    </Label>
                    <span className="text-xs font-mono text-foreground">
                      {settings.gridOpacity}%
                    </span>
                  </div>
                  <Slider
                    id="grid-opacity"
                    data-testid="slider-grid-opacity"
                    value={[settings.gridOpacity]}
                    onValueChange={([value]) => onSettingsChange({ gridOpacity: value })}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="pulse-intensity" className="text-xs text-muted-foreground">
                      Pulse Intensity
                    </Label>
                    <span className="text-xs font-mono text-foreground">
                      {settings.pulseColorIntensity}%
                    </span>
                  </div>
                  <Slider
                    id="pulse-intensity"
                    data-testid="slider-pulse-intensity"
                    value={[settings.pulseColorIntensity]}
                    onValueChange={([value]) => onSettingsChange({ pulseColorIntensity: value })}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
