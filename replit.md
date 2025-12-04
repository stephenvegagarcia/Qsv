# Quantum Audio Sonar - Acoustic Object Detection

## Overview

Quantum Audio Sonar is a specialized audio visualization application that detects and classifies objects through sound waves using quantum-enhanced signal processing. The application captures real-time microphone input, processes it through Qiskit quantum circuits using Bell state entanglement, and displays detected objects on an interactive sonar visualization.

The system uses the maximally entangled Bell state |φ⁺⟩ = 1/√2 (|00⟩ + |11⟩) to detect acoustic correlations that indicate the presence and type of objects in the environment.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript for UI components
- Canvas 2D for sonar visualization
- Vite as build tool and development server
- Tailwind CSS with custom design system for styling
- shadcn/ui component library (Radix UI primitives)
- Wouter for lightweight client-side routing

**Design Pattern:**
- Canvas-first architecture prioritizing full-viewport 2D visualization
- Minimal overlay UI with absolute-positioned control panels
- Real-time state management using React hooks

**Component Structure:**
- `SonarCanvas2D`: Main visualization component rendering expanding pulses
- `HUDOverlay`: Displays real-time metrics (audio level, pulse count, quantum status, detection range, object count, entanglement quality)
- `ControlPanel`: Collapsible settings interface for FFT size, sensitivity, quantum modes, detection range, and noise cancellation
- `DetectionPanel`: Shows detected objects with direction, distance, and classification
- `InfoPanel`: Tabbed help panel explaining Detection, Bell State quantum processing, and FFT analysis
- `ThemeToggle`: Light/dark mode switcher

**Key Features:**
- Real-time audio analysis using Web Audio API (AudioContext, AnalyserNode)
- Custom hooks for audio processing (`use-audio-analyzer`)
- Quantum object detection via Bell state entanglement
- Multiple object detection with classification

### Backend Architecture

**Technology Stack:**
- Node.js with Express server
- TypeScript for type safety
- Python 3 integration for Qiskit quantum processing

**Server Structure:**
- `server/routes.ts`: API endpoint registration
- `server/quantum-detector.ts`: TypeScript service calling Python quantum processor
- `server/quantum-acoustic-detector.py`: Qiskit-based quantum object detection

**API Endpoints:**
- `POST /api/detect`: Submit frequency data, receive detected objects

### Quantum Detection Pipeline

**Bell State Algorithm:**
The detector uses the maximally entangled Bell state for correlation detection:

```
|φ⁺⟩ = 1/√2 (|00⟩ + |11⟩)
```

**Detection Process:**
1. Create 4 Bell state pairs (8 qubits total)
2. Encode audio frequencies using Rz rotation gates
3. Apply cross-correlation using CZ gates between frequency pairs
4. Apply Hadamard gates for interference
5. Measure quantum states
6. Analyze correlations:
   - |00⟩ or |11⟩ dominant → Solid/reflective object
   - |01⟩ or |10⟩ dominant → Soft/distant object
7. Classify objects based on frequency band:
   - Low frequencies (Band 0-1): Large objects (walls, vehicles, furniture)
   - High frequencies (Band 2-3): Small objects (people, electronics)

**Object Classification:**
Based on frequency band and correlation type:
- **Band 0 (Very Low)**: Wall/Building, Large Soft Object, Vehicle/Structure
- **Band 1 (Low-Mid)**: Dense Surface, Fabric/Curtain, Furniture
- **Band 2 (Mid)**: Metal/Glass, Person/Animal, Moving Object
- **Band 3 (High)**: Small Hard Object, Air Movement, Electronic Device

**Detection Output:**
Each detected object includes:
- `azimuth`: Direction in degrees (0-360°)
- `elevation`: Vertical angle (-15° to +15°)
- `distance`: Estimated distance in meters
- `strength`: Signal strength (0-1)
- `type`: solid, soft, medium, or diffuse
- `classification`: Human-readable object type
- `confidence`: Detection reliability (0-1)

### Data Models

**Detection Schema:**
```typescript
{
  id: string;
  direction: { azimuth: number; elevation: number };
  distance: number;
  signalStrength: number;
  timestamp: number;
  classification?: string;
}
```

**Settings Schema:**
```typescript
{
  fftSize: '256' | '512' | '1024' | '2048';
  sensitivity: number;  // 0-100
  quantumMode: 'off' | 'enhancement' | 'full';
  enhancementLevel: number;  // 0-100
  gridOpacity: number;  // 0-100
  pulseColorIntensity: number;  // 0-100
  noiseMode: boolean;
}
```

### External Dependencies

**Python Libraries:**
- Qiskit: Quantum circuit creation and simulation
- Qiskit-Aer: AerSimulator for quantum state simulation
- NumPy: Numerical computations

**Frontend Libraries:**
- React Query (@tanstack/react-query) for server state management
- Radix UI primitives for accessible component foundation
- Lucide React for icons
- class-variance-authority and clsx for component styling variants

**Build Tools:**
- Vite with React plugin
- esbuild for server-side bundling
- PostCSS with Tailwind CSS and Autoprefixer
- tsx for TypeScript execution in development

### Keyboard Shortcuts

- **C**: Toggle control panel
- **H**: Toggle help/info panel

### How to Use

1. Click "Initialize Quantum Sonar" to start
2. Allow microphone access when prompted
3. Make sounds or play audio to detect objects
4. Detected objects appear in the Detection panel on the left
5. The HUD shows:
   - Audio level
   - Number of detected objects
   - Quantum processing status
   - Entanglement quality
   - Detection range
6. Press C for controls, H for help
