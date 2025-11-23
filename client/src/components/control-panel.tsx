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
    visual: true
  });

  const toggleSection = (section: string) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="fixed bottom-8 right-8 w-80 pointer-events-auto z-10">
      <Card className="backdrop-blur-md bg-card/90 border-card-border p-6">
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
              <span>Pulse Settings</span>
              {expanded.pulse ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {expanded.pulse && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fft-size" className="text-xs text-muted-foreground mb-2 block">
                    FFT Size
                  </Label>
                  <Select 
                    value={settings.fftSize} 
                    onValueChange={(value) => onSettingsChange({ fftSize: value as any })}
                  >
                    <SelectTrigger id="fft-size" data-testid="select-fft-size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="256">256</SelectItem>
                      <SelectItem value="512">512</SelectItem>
                      <SelectItem value="1024">1024</SelectItem>
                      <SelectItem value="2048">2048</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="sensitivity" className="text-xs text-muted-foreground">
                      Sensitivity
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

          {/* Quantum Parameters */}
          <div className="border-b border-border pb-4">
            <button
              onClick={() => toggleSection('quantum')}
              data-testid="button-toggle-quantum-settings"
              className="flex items-center justify-between w-full text-sm font-medium mb-3 hover-elevate active-elevate-2 rounded-md p-2 -m-2"
            >
              <span>Quantum Parameters</span>
              {expanded.quantum ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {expanded.quantum && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="quantum-mode" className="text-xs text-muted-foreground mb-2 block">
                    QML Mode
                  </Label>
                  <Select 
                    value={settings.quantumMode} 
                    onValueChange={(value) => onSettingsChange({ quantumMode: value as any })}
                  >
                    <SelectTrigger id="quantum-mode" data-testid="select-quantum-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="off">Off</SelectItem>
                      <SelectItem value="enhancement">Enhancement</SelectItem>
                      <SelectItem value="full">Full QML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="enhancement" className="text-xs text-muted-foreground">
                      Enhancement Level
                    </Label>
                    <span className="text-xs font-mono text-foreground">
                      {settings.enhancementLevel}%
                    </span>
                  </div>
                  <Slider
                    id="enhancement"
                    data-testid="slider-enhancement"
                    value={[settings.enhancementLevel]}
                    onValueChange={([value]) => onSettingsChange({ enhancementLevel: value })}
                    min={0}
                    max={100}
                    step={1}
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
