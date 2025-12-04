import { X, Activity, Radio, Cpu, BarChart3, Atom, Target } from 'lucide-react';
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
          <h2 className="text-xl font-bold" data-testid="text-info-title">Quantum Acoustic Detection</h2>
          <Button size="icon" variant="ghost" onClick={onClose} data-testid="button-close-info">
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
          <Tabs defaultValue="detection" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="detection" data-testid="tab-detection">
                <Target className="w-4 h-4 mr-2" />
                Detection
              </TabsTrigger>
              <TabsTrigger value="quantum" data-testid="tab-quantum">
                <Atom className="w-4 h-4 mr-2" />
                Bell State
              </TabsTrigger>
              <TabsTrigger value="fft" data-testid="tab-fft">
                <BarChart3 className="w-4 h-4 mr-2" />
                FFT Analysis
              </TabsTrigger>
            </TabsList>

            <TabsContent value="detection" className="space-y-4" data-testid="content-detection">
              <div className="flex items-start gap-3">
                <Radio className="w-6 h-6 text-chart-2 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2" data-testid="text-detection-title">Acoustic Object Detection</h3>
                  <p className="text-muted-foreground mb-3" data-testid="text-detection-description">
                    Like a bat or submarine sonar, this system detects objects by analyzing sound reflections and patterns using quantum-enhanced signal processing.
                  </p>
                </div>
              </div>

              <div className="bg-accent/20 rounded-lg p-4 space-y-3" data-testid="section-detection-process">
                <h4 className="font-medium" data-testid="text-detection-process-title">Detection Process:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li data-testid="text-detection-step-1"><strong>Sound captured</strong> - Microphone records ambient audio</li>
                  <li data-testid="text-detection-step-2"><strong>FFT analysis</strong> - Sound split into frequency bands</li>
                  <li data-testid="text-detection-step-3"><strong>Quantum processing</strong> - Bell state entanglement detects correlations</li>
                  <li data-testid="text-detection-step-4"><strong>Object classification</strong> - Pattern matching identifies object types</li>
                </ol>
              </div>

              <div className="bg-chart-1/10 rounded-lg p-4" data-testid="section-object-types">
                <h4 className="font-medium mb-2" data-testid="text-object-types-title">Detectable Objects:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground"><strong>Low Frequencies:</strong></p>
                    <ul className="text-muted-foreground pl-3">
                      <li>Walls & Buildings</li>
                      <li>Vehicles</li>
                      <li>Large furniture</li>
                    </ul>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground"><strong>High Frequencies:</strong></p>
                    <ul className="text-muted-foreground pl-3">
                      <li>People & Animals</li>
                      <li>Electronic devices</li>
                      <li>Small objects</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-primary/10 rounded-lg p-4" data-testid="section-detection-info">
                <h4 className="font-medium mb-2">Detection Display:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li><strong>Direction</strong> - Azimuth angle (0-360°) shows object position</li>
                  <li><strong>Distance</strong> - Estimated in meters based on signal strength</li>
                  <li><strong>Classification</strong> - Object type based on acoustic signature</li>
                  <li><strong>Confidence</strong> - Detection reliability percentage</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="quantum" className="space-y-4" data-testid="content-quantum">
              <div className="flex items-start gap-3">
                <Atom className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2" data-testid="text-quantum-title">Bell State Entanglement</h3>
                  <p className="text-muted-foreground mb-3" data-testid="text-quantum-description">
                    The detector uses quantum entanglement to identify correlated patterns in audio that indicate objects.
                  </p>
                </div>
              </div>

              <div className="bg-primary/20 rounded-lg p-6 text-center" data-testid="section-bell-state">
                <h4 className="font-medium mb-3">Bell State Used:</h4>
                <div className="font-mono text-2xl mb-4" data-testid="text-bell-state-formula">
                  |φ⁺⟩ = 1/√2 (|00⟩ + |11⟩)
                </div>
                <p className="text-sm text-muted-foreground">
                  Maximally entangled two-qubit state
                </p>
              </div>

              <div className="bg-accent/20 rounded-lg p-4 space-y-3" data-testid="section-quantum-process">
                <h4 className="font-medium">Quantum Detection Pipeline:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li><strong>Create Bell pairs</strong> - 4 pairs of entangled qubits (8 qubits total)</li>
                  <li><strong>Encode frequencies</strong> - Rz rotation gates encode audio data</li>
                  <li><strong>Apply interference</strong> - Cross-correlate frequency pairs</li>
                  <li><strong>Measure correlations</strong> - |00⟩/|11⟩ = solid object, |01⟩/|10⟩ = soft object</li>
                </ol>
              </div>

              <div className="bg-chart-2/10 rounded-lg p-4" data-testid="section-entanglement">
                <div className="flex items-center gap-2 mb-2">
                  <Cpu className="w-4 h-4 text-chart-2" />
                  <h4 className="font-medium">Entanglement Quality:</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  The entanglement quality percentage in the HUD shows how well the quantum circuit is detecting correlations:
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li><strong>High (60%+)</strong> - Strong object reflections detected</li>
                  <li><strong>Medium (30-60%)</strong> - Moderate detection confidence</li>
                  <li><strong>Low (0-30%)</strong> - Weak or no objects in range</li>
                </ul>
              </div>

              <div className="bg-background/50 rounded-lg p-4 font-mono text-xs" data-testid="section-circuit">
                <h4 className="font-medium mb-2 font-sans text-sm">Qiskit Circuit Structure:</h4>
                <pre className="overflow-x-auto">
{`H ─────●───── Rz ─── CZ ─── H ─── M
       │
X ─────X───── Rz ────────────────── M

(Repeated for 4 frequency pairs)`}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="fft" className="space-y-4" data-testid="content-fft">
              <div className="flex items-start gap-3">
                <Activity className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2" data-testid="text-fft-title">FFT (Fast Fourier Transform)</h3>
                  <p className="text-muted-foreground mb-3" data-testid="text-fft-description">
                    FFT converts audio from your microphone into frequency data, revealing which sound pitches are present.
                  </p>
                </div>
              </div>

              <div className="bg-accent/20 rounded-lg p-4 space-y-3" data-testid="section-fft-how-it-works">
                <h4 className="font-medium" data-testid="text-fft-how-title">How It Works:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li data-testid="text-fft-step-1"><strong>Microphone captures sound</strong> - Raw audio waveform is recorded</li>
                  <li data-testid="text-fft-step-2"><strong>FFT splits into frequencies</strong> - Sound is broken into 256-2048 frequency bins</li>
                  <li data-testid="text-fft-step-3"><strong>Amplitude calculated</strong> - How loud each frequency is (0-255 scale)</li>
                  <li data-testid="text-fft-step-4"><strong>Beat detection</strong> - Volume spikes trigger quantum detection</li>
                </ol>
              </div>

              <div className="bg-primary/10 rounded-lg p-4" data-testid="section-fft-frequency-bands">
                <h4 className="font-medium mb-2" data-testid="text-fft-bands-title">Frequency Bands for Detection:</h4>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li data-testid="text-fft-band-low">
                    <span className="text-red-500 font-medium">Band 0 (Very Low)</span>
                    <br />Detects large objects: walls, buildings, vehicles
                  </li>
                  <li data-testid="text-fft-band-mid-low">
                    <span className="text-orange-500 font-medium">Band 1 (Low-Mid)</span>
                    <br />Detects surfaces: furniture, dense materials
                  </li>
                  <li data-testid="text-fft-band-mid">
                    <span className="text-yellow-500 font-medium">Band 2 (Mid)</span>
                    <br />Detects moving objects: people, animals
                  </li>
                  <li data-testid="text-fft-band-high">
                    <span className="text-cyan-500 font-medium">Band 3 (High)</span>
                    <br />Detects small objects: electronics, fine details
                  </li>
                </ul>
              </div>

              <div className="bg-chart-3/10 rounded-lg p-4">
                <h4 className="font-medium mb-2">FFT Size Settings:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li><strong>256</strong> - Fastest, lower resolution</li>
                  <li><strong>512</strong> - Balanced (recommended)</li>
                  <li><strong>1024</strong> - More detail, slower</li>
                  <li><strong>2048</strong> - Maximum resolution</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
}
