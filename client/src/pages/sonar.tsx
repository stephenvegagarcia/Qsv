import { useState, useEffect, useCallback, useRef } from 'react';
import { useAudioAnalyzer } from '@/hooks/use-audio-analyzer';
import { SonarCanvas2D } from '@/components/sonar-canvas-2d';
import { HUDOverlay } from '@/components/hud-overlay';
import { ControlPanel } from '@/components/control-panel';
import { DetectionPanel } from '@/components/detection-panel';
import { InfoPanel } from '@/components/info-panel';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Waves, HelpCircle, Crosshair } from 'lucide-react';
import type { AudioAnalysis, Pulse, Detection, Settings, TofMeasurement } from '@shared/schema';

interface ObjectPosition {
  azimuth: number;
  elevation: number;
  distance: number;
  distanceAccuracy: number;
  x?: number;
  y?: number;
  z?: number;
}

interface QuantumDetectionResult {
  detections: Array<{
    id: string;
    position: ObjectPosition;
    signalStrength: number;
    objectType: string;
    classification: string;
    confidence: number;
    tofData?: TofMeasurement;
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
  const [quantumStatus, setQuantumStatus] = useState<'idle' | 'ready' | 'processing' | 'pinging'>('idle');
  const [detectionRange, setDetectionRange] = useState(0);
  const [entanglementQuality, setEntanglementQuality] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const [precisionMode, setPrecisionMode] = useState(false);
  
  const [settings, setSettings] = useState<Settings>({
    fftSize: '512',
    sensitivity: 50,
    quantumMode: 'full',
    enhancementLevel: 50,
    gridOpacity: 20,
    pulseColorIntensity: 80,
    noiseMode: false,
    activeSonar: true,
    detectionRange: 10,
    temperatureCelsius: 20,
    autoCalibrate: true,
  });

  // Track last detection time to prevent flooding
  const lastDetectionTimeRef = useRef(0);
  const lastChirpTimeRef = useRef(0);
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

  // Update temperature for speed of sound calculation
  useEffect(() => {
    if (audio.ready) {
      audio.setTemperature(settings.temperatureCelsius);
    }
  }, [settings.temperatureCelsius, audio.ready, audio.setTemperature]);

  // Auto-calibrate on start
  useEffect(() => {
    if (audio.ready && settings.autoCalibrate && !isCalibrated) {
      const doCalibration = async () => {
        await audio.calibrate();
        setIsCalibrated(true);
      };
      doCalibration();
    }
  }, [audio.ready, settings.autoCalibrate, isCalibrated, audio.calibrate]);

  // Update quantum status based on mode
  useEffect(() => {
    if (settings.quantumMode === 'off') {
      setQuantumStatus('idle');
    } else {
      setQuantumStatus('ready');
    }
  }, [settings.quantumMode]);

  // Active sonar: emit chirp pulses periodically
  useEffect(() => {
    if (!audio.ready || !settings.activeSonar || settings.quantumMode === 'off') {
      return;
    }

    const chirpInterval = setInterval(() => {
      const now = Date.now();
      if (now - lastChirpTimeRef.current > 500) { // Max 2 pings per second
        audio.emitChirp({
          startFreq: 2000,
          endFreq: 8000,
          duration: 50,
          type: 'logarithmic',
        });
        lastChirpTimeRef.current = now;
        setQuantumStatus('pinging');
        
        // Reset status after ping
        setTimeout(() => {
          if (quantumStatus === 'pinging') {
            setQuantumStatus('ready');
          }
        }, 100);
      }
    }, 600);

    return () => clearInterval(chirpInterval);
  }, [audio.ready, settings.activeSonar, settings.quantumMode, audio.emitChirp, quantumStatus]);

  // Quantum object detection using Bell state |φ⁺⟩ = 1/√2 (|00⟩ + |11⟩)
  const performQuantumDetection = useCallback(async (frequencies: number[], volume: number) => {
    if (isDetectingRef.current) return;
    
    isDetectingRef.current = true;
    setQuantumStatus('processing');
    
    try {
      // Get ToF measurement for precise distance
      let tofData: TofMeasurement | null = null;
      if (settings.activeSonar) {
        tofData = audio.detectEcho();
      }
      
      const response = await fetch('/api/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          frequencies, 
          volume,
          tofData: tofData || undefined,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Detection failed');
      }
      
      const result: QuantumDetectionResult = await response.json();
      
      // Update entanglement quality
      setEntanglementQuality(result.entanglement_quality);
      
      // Enable precision mode if ToF data is available
      if (result.detections.some(d => d.tofData)) {
        setPrecisionMode(true);
      }
      
      // Convert quantum detections to Detection format with precise positions
      const now = Date.now();
      const newDetections: Detection[] = result.detections.map((det, index) => ({
        id: `${det.id}_${now}_${index}`,
        position: {
          azimuth: det.position.azimuth,
          elevation: det.position.elevation,
          distance: det.position.distance,
          distanceAccuracy: det.position.distanceAccuracy,
          x: det.position.x,
          y: det.position.y,
          z: det.position.z,
        },
        signalStrength: det.signalStrength,
        timestamp: now,
        classification: det.classification,
        objectType: det.objectType as 'solid' | 'soft' | 'medium' | 'diffuse',
        confidence: det.confidence,
        tofData: det.tofData,
      }));
      
      if (newDetections.length > 0) {
        // Update detection range to max detected distance
        const maxDistance = Math.max(...newDetections.map(d => d.position.distance));
        setDetectionRange(prev => Math.max(prev, maxDistance));
        
        // Merge new detections, keeping most recent
        setDetections(prev => {
          const combined = [...newDetections, ...prev];
          // Remove duplicates by similar azimuth (within 10 degrees) and distance (within accuracy)
          const unique: Detection[] = [];
          for (const det of combined) {
            const isDuplicate = unique.some(u => 
              Math.abs(u.position.azimuth - det.position.azimuth) < 10 &&
              Math.abs(u.position.distance - det.position.distance) < (det.position.distanceAccuracy + u.position.distanceAccuracy)
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
  }, [settings.activeSonar, audio]);

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

  const handleManualPing = useCallback(() => {
    if (audio.ready && settings.activeSonar) {
      audio.emitChirp({
        startFreq: 2000,
        endFreq: 8000,
        duration: 50,
        type: 'logarithmic',
      });
      setQuantumStatus('pinging');
      setTimeout(() => setQuantumStatus('ready'), 100);
    }
  }, [audio, settings.activeSonar]);

  // Keyboard shortcuts: C for controls, H for help/info, P for manual ping
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') {
        setShowControls(prev => !prev);
      }
      if (e.key === 'h' || e.key === 'H') {
        setShowInfo(prev => !prev);
      }
      if (e.key === 'p' || e.key === 'P') {
        handleManualPing();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleManualPing]);

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
              Precise object detection using quantum Bell state entanglement
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
            Microphone + Speaker required • Active sonar with Time-of-Flight
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
          maxPulseDistance={settings.detectionRange}
          gridOpacity={settings.gridOpacity / 100}
          pulseIntensity={settings.pulseColorIntensity / 100}
        />
      </div>

      {/* HUD Overlay - Now shows precision mode */}
      <HUDOverlay
        audioLevel={audioAnalysis?.volume || 0}
        pulseCount={pulses.length}
        quantumStatus={quantumStatus}
        detectionRange={detectionRange}
        entanglementQuality={entanglementQuality}
        objectCount={detections.length}
        precisionMode={precisionMode}
        isCalibrated={isCalibrated}
      />

      {/* Detection Panel - Shows detected objects with precise positions */}
      <DetectionPanel detections={detections} />

      {/* Control Panel - Conditionally shown */}
      {showControls && (
        <ControlPanel
          settings={settings}
          onSettingsChange={handleSettingsChange}
        />
      )}

      {/* Manual Ping Button */}
      {settings.activeSonar && (
        <Button
          size="icon"
          variant="ghost"
          onClick={handleManualPing}
          className="fixed bottom-32 right-8 backdrop-blur-sm bg-card/70 border border-card-border z-10"
          data-testid="button-manual-ping"
        >
          <Crosshair className="w-5 h-5" />
        </Button>
      )}

      {/* Status Indicator */}
      <div className="fixed bottom-8 left-8 pointer-events-none">
        <div className="backdrop-blur-sm bg-card/70 border border-card-border rounded-md px-4 py-2">
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              {quantumStatus === 'processing' ? 'Quantum Processing...' : 
               quantumStatus === 'pinging' ? 'Sending Ping...' :
               audioAnalysis?.isBeat ? 'Object Detected!' : 'Listening...'}
              {settings.quantumMode !== 'off' && ' • Bell State Active'}
              {precisionMode && ' • Precision Mode'}
            </p>
          </div>
        </div>
      </div>

      {/* Controls Toggle Hint */}
      {!showControls && (
        <div className="fixed top-8 right-8 pointer-events-none">
          <div className="backdrop-blur-sm bg-card/70 border border-card-border rounded-md px-4 py-2">
            <p className="text-xs text-muted-foreground" data-testid="text-controls-hint">
              Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded">C</kbd> controls
              {' • '}
              <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded">H</kbd> help
              {' • '}
              <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded">P</kbd> ping
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
