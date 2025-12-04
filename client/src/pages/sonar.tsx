import { useState, useEffect, useCallback, useRef } from 'react';
import { useAudioAnalyzer } from '@/hooks/use-audio-analyzer';
import { SonarCanvas2D } from '@/components/sonar-canvas-2d';
import { HUDOverlay } from '@/components/hud-overlay';
import { ControlPanel } from '@/components/control-panel';
import { DetectionPanel } from '@/components/detection-panel';
import { InfoPanel } from '@/components/info-panel';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Waves, HelpCircle } from 'lucide-react';
import type { AudioAnalysis, Pulse, Detection, Settings } from '@shared/schema';

interface QuantumDetectionResult {
  detections: Array<{
    id: string;
    azimuth: number;
    elevation: number;
    distance: number;
    strength: number;
    type: string;
    classification: string;
    confidence: number;
  }>;
  total_objects: number;
  quantum_processed: boolean;
  entanglement_quality: number;
  bell_state?: string;
}

export default function SonarPage() {
  const audio = useAudioAnalyzer();
  const [audioAnalysis, setAudioAnalysis] = useState<AudioAnalysis | null>(null);
  const [pulses, setPulses] = useState<Pulse[]>([]);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [quantumStatus, setQuantumStatus] = useState<'idle' | 'ready' | 'processing'>('idle');
  const [detectionRange, setDetectionRange] = useState(0);
  const [entanglementQuality, setEntanglementQuality] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  
  const [settings, setSettings] = useState<Settings>({
    fftSize: '512',
    sensitivity: 50,
    quantumMode: 'full',
    enhancementLevel: 50,
    gridOpacity: 20,
    pulseColorIntensity: 80,
    noiseMode: false,
    weatherMode: 'acoustic',
  });

  // Track last detection time to prevent flooding
  const lastDetectionTimeRef = useRef(0);
  const isDetectingRef = useRef(false);

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
  }, [audio.ready]);

  // Update FFT size when settings change
  useEffect(() => {
    if (audio.ready) {
      const fftSize = parseInt(settings.fftSize);
      audio.updateFFTSize(fftSize);
    }
  }, [settings.fftSize, audio.ready]);

  // Update quantum status based on mode
  useEffect(() => {
    if (settings.quantumMode === 'off') {
      setQuantumStatus('idle');
    } else {
      setQuantumStatus('ready');
    }
  }, [settings.quantumMode]);

  // Quantum object detection using Bell state |φ⁺⟩ = 1/√2 (|00⟩ + |11⟩)
  const performQuantumDetection = useCallback(async (frequencies: number[], volume: number) => {
    if (isDetectingRef.current) return;
    
    isDetectingRef.current = true;
    setQuantumStatus('processing');
    
    try {
      const response = await fetch('/api/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frequencies, volume }),
      });
      
      if (!response.ok) {
        throw new Error('Detection failed');
      }
      
      const result: QuantumDetectionResult = await response.json();
      
      // Update entanglement quality
      setEntanglementQuality(result.entanglement_quality);
      
      // Convert quantum detections to Detection format
      const now = Date.now();
      const newDetections: Detection[] = result.detections.map((det, index) => ({
        id: `${det.id}_${now}_${index}`,
        direction: {
          azimuth: det.azimuth,
          elevation: det.elevation,
        },
        distance: det.distance,
        signalStrength: det.strength,
        timestamp: now,
        classification: det.classification,
      }));
      
      if (newDetections.length > 0) {
        // Update detection range to max detected distance
        const maxDistance = Math.max(...newDetections.map(d => d.distance));
        setDetectionRange(prev => Math.max(prev, maxDistance));
        
        // Merge new detections, keeping most recent
        setDetections(prev => {
          const combined = [...newDetections, ...prev];
          // Remove duplicates by similar azimuth (within 15 degrees)
          const unique: Detection[] = [];
          for (const det of combined) {
            const isDuplicate = unique.some(u => 
              Math.abs(u.direction.azimuth - det.direction.azimuth) < 15 &&
              Math.abs(u.distance - det.distance) < 5
            );
            if (!isDuplicate) {
              unique.push(det);
            }
          }
          return unique.slice(0, 15);
        });
      }
      
      setQuantumStatus('ready');
    } catch (error) {
      console.error('Quantum detection error:', error);
      setQuantumStatus('ready');
    } finally {
      isDetectingRef.current = false;
    }
  }, []);

  // Trigger detection on audio beats or volume spikes
  useEffect(() => {
    if (!audioAnalysis || settings.quantumMode === 'off') {
      return;
    }

    const now = Date.now();
    const minInterval = settings.quantumMode === 'full' ? 300 : 500;
    
    // Trigger on beat or high volume
    const shouldDetect = (audioAnalysis.isBeat || audioAnalysis.volume > 100) && 
                         now - lastDetectionTimeRef.current > minInterval;
    
    if (shouldDetect) {
      lastDetectionTimeRef.current = now;
      performQuantumDetection(audioAnalysis.frequencyData, audioAnalysis.volume);
    }
  }, [audioAnalysis, settings.quantumMode, performQuantumDetection]);

  // Decay detection range over time
  useEffect(() => {
    const interval = setInterval(() => {
      setDetectionRange(prev => Math.max(0, prev - 0.5));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Age out old detections
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setDetections(prev => prev.filter(d => now - d.timestamp < 10000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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

  // Keyboard shortcuts: C for controls, H for help/info
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') {
        setShowControls(prev => !prev);
      }
      if (e.key === 'h' || e.key === 'H') {
        setShowInfo(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

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
              Detect objects through sound using quantum Bell state entanglement
            </p>
            <p className="text-xs text-primary font-mono">
              |φ⁺⟩ = 1/√2 (|00⟩ + |11⟩)
            </p>
          </div>

          <Button
            size="lg"
            onClick={handleStart}
            data-testid="button-start-sonar"
            className="px-12 py-6 text-lg"
          >
            Initialize Quantum Sonar
          </Button>

          <p className="text-sm text-muted-foreground">
            Microphone required • Detects objects by analyzing sound reflections
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

      {/* HUD Overlay - Now shows entanglement quality */}
      <HUDOverlay
        audioLevel={audioAnalysis?.volume || 0}
        pulseCount={pulses.length}
        quantumStatus={quantumStatus}
        detectionRange={detectionRange}
        entanglementQuality={entanglementQuality}
        objectCount={detections.length}
      />

      {/* Detection Panel - Shows detected objects */}
      <DetectionPanel detections={detections} />

      {/* Control Panel - Conditionally shown */}
      {showControls && (
        <ControlPanel
          settings={settings}
          onSettingsChange={handleSettingsChange}
        />
      )}

      {/* Status Indicator */}
      <div className="fixed bottom-8 left-8 pointer-events-none">
        <div className="backdrop-blur-sm bg-card/70 border border-card-border rounded-md px-4 py-2">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {quantumStatus === 'processing' ? 'Quantum Processing...' : 
               audioAnalysis?.isBeat ? 'Object Detected!' : 'Listening...'}
              {settings.quantumMode !== 'off' && ' • Bell State Active'}
            </p>
          </div>
        </div>
      </div>

      {/* Controls Toggle Hint */}
      {!showControls && (
        <div className="fixed top-8 right-8 pointer-events-none">
          <div className="backdrop-blur-sm bg-card/70 border border-card-border rounded-md px-4 py-2">
            <p className="text-xs text-muted-foreground" data-testid="text-controls-hint">
              Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded">C</kbd> for controls
              {' • '}
              <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded">H</kbd> for help
            </p>
          </div>
        </div>
      )}

      {/* Help Button */}
      <Button
        size="icon"
        variant="ghost"
        onClick={() => setShowInfo(true)}
        className="fixed bottom-20 right-8 backdrop-blur-sm bg-card/70 border border-card-border z-10"
        data-testid="button-show-info"
      >
        <HelpCircle className="w-5 h-5" />
      </Button>

      {/* Info Panel */}
      {showInfo && <InfoPanel onClose={() => setShowInfo(false)} />}
    </div>
  );
}
