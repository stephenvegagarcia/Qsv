import { X, Activity, Radio, CloudRain, Cpu, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface InfoPanelProps {
  onClose: () => void;
}

export function InfoPanel({ onClose }: InfoPanelProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-auto">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden bg-card border-card-border">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-bold" data-testid="text-info-title">How Detection Works</h2>
          <Button size="icon" variant="ghost" onClick={onClose} data-testid="button-close-info">
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
          <Tabs defaultValue="fft" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="fft" data-testid="tab-fft">
                <BarChart3 className="w-4 h-4 mr-2" />
                FFT Analysis
              </TabsTrigger>
              <TabsTrigger value="detection" data-testid="tab-detection">
                <Radio className="w-4 h-4 mr-2" />
                Object Detection
              </TabsTrigger>
              <TabsTrigger value="weather" data-testid="tab-weather">
                <CloudRain className="w-4 h-4 mr-2" />
                Weather
              </TabsTrigger>
            </TabsList>

            <TabsContent value="fft" className="space-y-4" data-testid="content-fft">
              <div className="flex items-start gap-3">
                <Activity className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2" data-testid="text-fft-title">FFT (Fast Fourier Transform)</h3>
                  <p className="text-muted-foreground mb-3" data-testid="text-fft-description">
                    FFT converts audio from your microphone into frequency data, showing which sound pitches are present.
                  </p>
                </div>
              </div>

              <div className="bg-accent/20 rounded-lg p-4 space-y-3" data-testid="section-fft-how-it-works">
                <h4 className="font-medium" data-testid="text-fft-how-title">How It Works:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li data-testid="text-fft-step-1"><strong>Microphone captures sound</strong> - Raw audio waveform is recorded</li>
                  <li data-testid="text-fft-step-2"><strong>FFT splits into frequencies</strong> - Sound is broken into 256-2048 frequency bands</li>
                  <li data-testid="text-fft-step-3"><strong>Amplitude calculated</strong> - How loud each frequency is (0-255 scale)</li>
                  <li data-testid="text-fft-step-4"><strong>Beat detection</strong> - Sudden volume spikes trigger sonar pulses</li>
                </ol>
              </div>

              <div className="bg-primary/10 rounded-lg p-4" data-testid="section-fft-frequency-bands">
                <h4 className="font-medium mb-2" data-testid="text-fft-bands-title">Frequency Bands:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li data-testid="text-fft-band-low"><span className="text-red-500">Low (0-20%)</span> - Bass, rumble, thunder</li>
                  <li data-testid="text-fft-band-mid"><span className="text-yellow-500">Mid (20-60%)</span> - Voice, music, most sounds</li>
                  <li data-testid="text-fft-band-high"><span className="text-cyan-500">High (60-100%)</span> - Hiss, rain, high-pitched noise</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="detection" className="space-y-4" data-testid="content-detection">
              <div className="flex items-start gap-3">
                <Radio className="w-6 h-6 text-chart-2 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2" data-testid="text-detection-title">Sonar Object Detection</h3>
                  <p className="text-muted-foreground mb-3" data-testid="text-detection-description">
                    Like a bat or submarine, the sonar sends out pulses and detects objects based on audio reflections.
                  </p>
                </div>
              </div>

              <div className="bg-accent/20 rounded-lg p-4 space-y-3" data-testid="section-detection-process">
                <h4 className="font-medium" data-testid="text-detection-process-title">Detection Process:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li data-testid="text-detection-step-1"><strong>Beat triggers pulse</strong> - Loud sound creates expanding sonar ring</li>
                  <li data-testid="text-detection-step-2"><strong>Volume = Distance</strong> - Louder sounds suggest closer objects</li>
                  <li data-testid="text-detection-step-3"><strong>Frequency analysis</strong> - Different materials reflect sound differently</li>
                  <li data-testid="text-detection-step-4"><strong>Quantum enhancement</strong> - 4-qubit circuit amplifies weak signals</li>
                </ol>
              </div>

              <div className="bg-chart-2/10 rounded-lg p-4" data-testid="section-quantum-enhancement">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="w-4 h-4 text-chart-2" />
                  <h4 className="font-medium" data-testid="text-quantum-enhancement-title">Quantum Enhancement:</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-2" data-testid="text-quantum-enhancement-description">
                  When enabled, audio frequencies are encoded into quantum states using rotation gates (Ry, Rz).
                </p>
                <div className="font-mono text-xs bg-background/50 p-2 rounded" data-testid="text-quantum-pipeline">
                  Audio → Ry/Rz encoding → CNOT entanglement → H-X-X-H pattern → Measurement
                </div>
                <p className="text-sm text-muted-foreground mt-2" data-testid="text-quantum-entropy">
                  Shannon entropy from quantum measurements helps detect faint signals in noise.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="weather" className="space-y-4" data-testid="content-weather">
              <div className="flex items-start gap-3">
                <CloudRain className="w-6 h-6 text-blue-500 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2" data-testid="text-weather-title">Weather Detection System</h3>
                  <p className="text-muted-foreground mb-3" data-testid="text-weather-description">
                    Three modes detect weather conditions using different data sources.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-accent/20 rounded-lg p-4" data-testid="section-acoustic-detection">
                  <h4 className="font-medium mb-2" data-testid="text-acoustic-title">1. Acoustic Detection</h4>
                  <p className="text-sm text-muted-foreground mb-2" data-testid="text-acoustic-description">
                    Analyzes microphone audio patterns to identify weather sounds:
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li data-testid="text-weather-thunder"><span className="text-purple-500">Thunder</span> - Loud + strong low frequencies</li>
                    <li data-testid="text-weather-rain"><span className="text-blue-500">Rain</span> - High frequencies 1.5x louder than low</li>
                    <li data-testid="text-weather-wind"><span className="text-cyan-500">Wind</span> - Low frequencies 1.3x louder than mid</li>
                    <li data-testid="text-weather-clear"><span className="text-yellow-500">Clear</span> - No distinct weather pattern</li>
                  </ul>
                </div>

                <div className="bg-blue-500/10 rounded-lg p-4" data-testid="section-satellite-detection">
                  <h4 className="font-medium mb-2" data-testid="text-satellite-title">2. Satellite Detection (NOAA)</h4>
                  <p className="text-sm text-muted-foreground mb-2" data-testid="text-satellite-description">
                    Uses your location to fetch real weather data from NOAA Weather.gov API.
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li data-testid="text-satellite-location">Requires location permission</li>
                    <li data-testid="text-satellite-updates">Updates every 30 seconds</li>
                    <li data-testid="text-satellite-data">Provides temperature, humidity, wind speed</li>
                  </ul>
                </div>

                <div className="bg-red-500/10 rounded-lg p-4" data-testid="section-quantum-storm">
                  <div className="flex items-center gap-2 mb-2">
                    <Cpu className="w-4 h-4 text-red-500" />
                    <h4 className="font-medium" data-testid="text-quantum-storm-title">3. Quantum Storm Detection (Bell State)</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2" data-testid="text-quantum-storm-description">
                    Uses a 2-qubit entangled Bell state to detect storm patterns:
                  </p>
                  <div className="font-mono text-sm bg-background/50 p-2 rounded text-center mb-2" data-testid="text-bell-state-formula">
                    |Φ⁺⟩ = 1/√2 (|00⟩ + |11⟩)
                  </div>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li data-testid="text-quantum-entropy-measure">Measures quantum entanglement entropy</li>
                    <li data-testid="text-quantum-concurrence">Calculates concurrence (entanglement strength)</li>
                    <li data-testid="text-quantum-confidence">Storm confidence displayed as percentage</li>
                  </ul>
                </div>

                <div className="bg-green-500/10 rounded-lg p-4" data-testid="section-fused-mode">
                  <h4 className="font-medium mb-2" data-testid="text-fused-title">Fused Mode (All Sources)</h4>
                  <p className="text-sm text-muted-foreground" data-testid="text-fused-description">
                    Combines all three sources using weighted voting:
                  </p>
                  <ul className="text-sm space-y-1 text-muted-foreground mt-2">
                    <li data-testid="text-fused-acoustic-weight">Acoustic: 30% weight</li>
                    <li data-testid="text-fused-satellite-weight">Satellite: 50% weight</li>
                    <li data-testid="text-fused-quantum-weight">Quantum Storm: 20% weight</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
}
