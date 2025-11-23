import { useState, useEffect, useCallback } from 'react';
import { useAudioAnalyzer } from '@/hooks/use-audio-analyzer';
import { SonarCanvas2D } from '@/components/sonar-canvas-2d';
import { HUDOverlay } from '@/components/hud-overlay';
import { ControlPanel } from '@/components/control-panel';
import { DetectionPanel } from '@/components/detection-panel';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Waves } from 'lucide-react';
import type { AudioAnalysis, Pulse, Detection, Settings } from '@shared/schema';

export default function SonarPage() {
  const audio = useAudioAnalyzer();
  const [audioAnalysis, setAudioAnalysis] = useState<AudioAnalysis | null>(null);
  const [pulses, setPulses] = useState<Pulse[]>([]);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [quantumStatus, setQuantumStatus] = useState<'idle' | 'ready' | 'processing'>('idle');
  const [detectionRange, setDetectionRange] = useState(0);
  
  const [settings, setSettings] = useState<Settings>({
    fftSize: '256',
    sensitivity: 50,
    quantumMode: 'enhancement',
    enhancementLevel: 50,
    gridOpacity: 20,
    pulseColorIntensity: 80,
    noiseMode: false,
  });

  // Audio analysis loop
  useEffect(() => {
    if (!audio.ready) return;

    let frameId: number;
    const analyzeAudio = () => {
      const analysis = audio.getAnalysis();
      setAudioAnalysis(analysis);
      frameId = requestAnimationFrame(analyzeAudio);
    };

    analyzeAudio();
    return () => cancelAnimationFrame(frameId);
  }, [audio.ready, audio]);

  // Update FFT size when settings change
  useEffect(() => {
    if (audio.ready) {
      const fftSize = parseInt(settings.fftSize);
      audio.updateFFTSize(fftSize);
    }
  }, [settings.fftSize, audio.ready, audio]);

  // Update quantum status based on mode
  useEffect(() => {
    if (settings.quantumMode === 'off') {
      setQuantumStatus('idle');
    } else if (settings.quantumMode !== 'off') {
      // Only set to ready if currently idle
      setQuantumStatus(prev => prev === 'idle' ? 'ready' : prev);
    }
  }, [settings.quantumMode]);

  // Simulate basic detection based on audio analysis
  useEffect(() => {
    if (!audioAnalysis || settings.quantumMode === 'off') {
      return;
    }

    // Create detection on beats
    if (audioAnalysis.isBeat) {
      setQuantumStatus('processing');
      
      // Simulate detection based on volume
      const distance = (audioAnalysis.volume / 100) * 50 + 10;
      setDetectionRange(prev => Math.max(prev, distance));
      
      const detection: Detection = {
        id: `det-${Date.now()}`,
        direction: {
          azimuth: Math.random() * 360,
          elevation: (Math.random() - 0.5) * 60,
        },
        distance,
        signalStrength: audioAnalysis.volume / 100,
        timestamp: Date.now(),
        classification: settings.quantumMode === 'full' 
          ? ['Reflective Surface', 'Acoustic Boundary', 'Dense Object'][Math.floor(Math.random() * 3)]
          : undefined,
      };
      
      setDetections(prev => [detection, ...prev].slice(0, 10));
      
      setTimeout(() => setQuantumStatus('ready'), 100);
    }
  }, [audioAnalysis, settings.quantumMode]);

  const handlePulseCreate = useCallback((pulse: Pulse) => {
    setPulses(prev => [...prev, pulse].slice(-10));
  }, []);

  const handleSettingsChange = useCallback((newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const handleStart = async () => {
    try {
      await audio.start();
    } catch (error) {
      console.error('Failed to start audio:', error);
      alert('Failed to access microphone. Please check your permissions and try again.');
    }
  };

  if (!audio.ready) {
    return (
      <div className="w-screen h-screen bg-background flex items-center justify-center relative">
        <ThemeToggle />
        <div className="text-center space-y-6 max-w-md px-6">
          <div className="flex justify-center">
            <div className="p-6 rounded-full bg-primary/10 border border-primary/20">
              <Waves className="w-16 h-16 text-primary" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">
              Quantum Audio Sonar
            </h1>
            <p className="text-muted-foreground">
              Map your environment through sound waves enhanced by quantum computing
            </p>
          </div>

          <Button
            size="lg"
            onClick={handleStart}
            data-testid="button-start-sonar"
            className="px-12 py-6 text-lg"
          >
            Initialize Sonar System
          </Button>

          <p className="text-sm text-muted-foreground">
            Microphone access required • Make noise to scan your surroundings
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-background relative overflow-hidden">
      <ThemeToggle />
      
      {/* Quantum Sonar Canvas */}
      <div className="absolute inset-0">
        <SonarCanvas2D
          audioAnalysis={audioAnalysis}
          onPulseCreate={handlePulseCreate}
          maxPulseDistance={30 + (settings.enhancementLevel / 100) * 70}
          gridOpacity={settings.gridOpacity / 100}
          pulseIntensity={settings.pulseColorIntensity / 100}
        />
      </div>

      {/* HUD Overlay */}
      <HUDOverlay
        audioLevel={audioAnalysis?.volume || 0}
        pulseCount={pulses.length}
        quantumStatus={quantumStatus}
        detectionRange={detectionRange}
      />

      {/* Detection Panel */}
      <DetectionPanel detections={detections} />

      {/* Control Panel */}
      <ControlPanel
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />

      {/* Status Indicator */}
      <div className="fixed bottom-8 left-8 pointer-events-none">
        <div className="backdrop-blur-sm bg-card/70 border border-card-border rounded-md px-4 py-2">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Microphone Active • {audioAnalysis?.isBeat ? 'Pulse Emitted' : 'Listening...'}
              {settings.quantumMode !== 'off' && ' • Quantum Active'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
