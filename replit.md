# Quantum Audio Sonar - Live Environmental Mapping

## Overview

Quantum Audio Sonar is a specialized audio visualization application that maps environments through sound waves using quantum-enhanced signal processing. The application captures real-time microphone input, processes it through Qiskit quantum circuits, and displays an interactive 3D sonar visualization with cyberpunk aesthetics.

The system offers both a Python OpenCV version (recommended for desktop use) and a web-based version built with React, TypeScript, and Three.js. It combines real-time audio analysis, quantum computing algorithms, and advanced visualization to create an immersive environmental mapping experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript for UI components
- Three.js for 3D visualization and sonar rendering
- Vite as build tool and development server
- Tailwind CSS with custom design system for styling
- shadcn/ui component library (Radix UI primitives)
- Wouter for lightweight client-side routing

**Design Pattern:**
- Canvas-first architecture prioritizing full-viewport 3D visualization
- Minimal overlay UI with absolute-positioned control panels
- Custom data visualization framework focused on technical precision
- Real-time state management using React hooks and WebSocket connections

**Component Structure:**
- `SonarCanvas` / `SonarCanvas2D`: Main visualization components handling Three.js scene rendering
- `HUDOverlay`: Displays real-time metrics (audio level, pulse count, quantum status, detection range, acoustic weather conditions)
- `ControlPanel`: Collapsible settings interface for FFT size, sensitivity, quantum modes, enhancement level, and noise reflection toggle
- `DetectionPanel`: Shows detected environmental objects with direction and distance
- `InfoPanel`: Tabbed help panel explaining FFT analysis, object detection, and weather detection systems (toggle with H key or help button)
- `ThemeToggle`: Light/dark mode switcher

**Key Features:**
- Real-time audio analysis using Web Audio API (AudioContext, AnalyserNode)
- Custom hooks for audio processing (`use-audio-analyzer`)
- Dynamic Three.js scene management with fog, lighting, and particle effects
- Responsive sonar pulse visualization with simulated quantum processing
- Voice assistant with speech recognition and text-to-speech (uses OpenAI for AI responses)

### Backend Architecture

**Technology Stack:**
- Node.js with Express server
- TypeScript for type safety
- Python 3 integration for quantum processing

**Server Structure:**
- `server/app.ts`: Express application setup with JSON body parsing and logging
- `server/routes.ts`: API endpoint registration
- `server/quantum_service.ts`: Service layer spawning Python quantum processor
- `server/quantum_processor.py`: Qiskit-based quantum audio enhancement

**Communication Pattern:**
- HTTP REST endpoint for health checks
- No real-time WebSocket communication (removed)
- Standalone Python application for desktop use

**Python Integration:**
- Spawns Python subprocess to execute Qiskit quantum circuits
- JSON-based input/output for frequency data and enhancement parameters
- Fallback handling when quantum processing fails (returns original frequencies)

### Quantum Processing Pipeline

**Quantum Enhancement Approach:**
1. Apply Automatic Gain Control (AGC) to maintain consistent audio levels (target: 50/255, gain: 0.5x-4.0x)
2. Normalize audio frequency data to [0, 1] range
3. Encode frequencies into quantum states using Ry and Rz rotation gates
4. Apply forward CNOT entanglement (i → i+1) between adjacent qubits
5. Apply reverse CNOT entanglement (i → i-1) when noise mode is enabled
6. Apply H-X-X-H gate pattern (0110 encoding): Hadamard on qubits 0 and 3, X gates on qubits 1 and 2
7. Measure quantum states and calculate Shannon entropy from measurement counts
8. Enhance original frequencies based on quantum measurements
9. Apply reverse noise reflection when noise mode is enabled (entropy-weighted blending)
10. Estimate detection distance from quantum-processed signal strength

**Technology:**
- Qiskit quantum computing framework
- Statevector simulation for circuit execution
- 4-qubit circuits with H-X-X-H pattern and CNOT entanglement
- Shannon entropy calculation for quantum state analysis
- Signal processing with NumPy and SciPy

**Advanced Features:**
- **Automatic Gain Control**: Maintains consistent audio levels regardless of microphone sensitivity
- **H-X-X-H Pattern**: Specific quantum gate arrangement (0110 encoding) for enhanced signal processing
- **CNOT Entanglement**: Forward and reverse entanglement patterns for improved detection
- **Entropy Tracking**: Shannon entropy calculation from quantum measurements, displayed in HUD
- **Noise Mode**: Reverse noise reflection using entropy-weighted blending for enhanced environmental detection

**Processing Flow:**
```
Audio Input → AGC → FFT Analysis → Quantum Circuit Encoding → 
CNOT Entanglement → H-X-X-H Pattern → Measurement → Entropy Calculation →
Signal Enhancement → Noise Reflection (if enabled) → Distance Estimation → 
Weather Detection → Visualization Update
```

### Acoustic Weather Detection

**Detection Algorithm:**
The application analyzes frequency patterns in real-time audio to detect environmental acoustic conditions without external APIs or sensors.

**Weather Classification:**
1. **Thunder**: Detected when volume exceeds 150 AND low-frequency average exceeds 100
   - Indicates sudden loud bursts with strong low-frequency components
2. **Rain**: Detected when high-frequency average exceeds 60 AND is 1.5x higher than low frequencies
   - White noise pattern characteristic of rainfall
3. **Wind**: Detected when low-frequency average exceeds 50 AND is 1.3x higher than mid frequencies
   - Rumbling pattern from air movement
4. **Clear**: Default state when no specific weather pattern is detected
5. **Unknown**: Initial state before sufficient samples are collected

**Frequency Band Analysis:**
- **Low Band**: 0-20% of frequency spectrum (bass/rumble)
- **Mid Band**: 20-60% of frequency spectrum (speech/music range)
- **High Band**: 60-100% of frequency spectrum (hiss/noise)

**Smoothing Algorithm:**
- Maintains 10-sample rolling history of detected conditions
- Returns dominant weather condition from history
- Prevents rapid flickering between states
- Updates every animation frame (~60fps)

**Display Integration:**
- Real-time display in HUD overlay with weather-specific icons
- Color coding: Yellow (Clear/Sun), Blue (Rain/CloudRain), Cyan (Wind), Purple (Thunder/CloudLightning)
- Labeled as "Acoustic Weather" to distinguish from meteorological data
- Updates continuously based on microphone input

**Implementation:**
- Integrated into audio analyzer hook (`use-audio-analyzer.ts`)
- No external API dependencies
- Purely client-side processing
- Part of the AudioAnalysis data structure with WeatherCondition type

### Multi-Source Weather Fusion System

**Weather Modes:**
The application supports three weather detection modes, selectable via the control panel:

1. **Acoustic Mode**: Uses only microphone-based frequency analysis (default)
2. **Satellite Mode**: Uses NOAA Weather.gov API data + quantum storm detection
3. **Fused Mode**: Combines all sources with weighted voting algorithm

**Satellite Weather Integration:**
- Primary source: NOAA Weather.gov API (`api.weather.gov/points/{lat},{lon}`)
- Provides: temperature, humidity, wind speed, storm probability
- Requires geolocation (graceful fallback if denied)
- Refreshes every 30 seconds

**Quantum Storm Detection (Bell State):**
Uses 2-qubit quantum entanglement for storm pattern detection:
- Creates Bell state: |Φ⁺⟩ = 1/√2 (|00⟩ + |11⟩)
- Measures concurrence and entanglement entropy
- Storm confidence threshold: 0.7 (70%)
- Displayed in HUD with progress bar

**Fusion Algorithm:**
Weighted voting when combining multiple sources:
- Acoustic data: 30% weight
- Satellite data: 50% weight
- Quantum storm detection: 20% weight

**Key Files:**
- `client/src/hooks/use-weather-fusion.ts`: Weather fusion hook
- `server/satellite-weather.ts`: NOAA API integration
- `server/quantum-storm.ts`: Bell state quantum circuit
- `shared/schema.ts`: WeatherMode, SatelliteWeather, StormQuantum, FusedWeather types

### Data Storage

**Current Implementation:**
- In-memory storage using Map-based data structures (`MemStorage` class)
- User management with username/ID mapping
- No persistent database currently active

**Schema Definition:**
- Drizzle ORM configured with PostgreSQL support (via Neon serverless driver)
- Schema types defined in `shared/schema.ts` but not actively used
- Prepared for future database integration (schema includes users, audio analysis, pulses, quantum results, detections)

**Data Models:**
- `AudioAnalysis`: Volume, frequency data array, beat detection, timestamp
- `Pulse`: Position (3D coordinates), speed, distance, intensity
- `QuantumResult`: Enhanced frequencies, detected distance, quantum state serialization, processing metrics
- `Detection`: Direction (azimuth/elevation), distance, confidence, timestamp
- `Settings`: FFT size, sensitivity, quantum mode, enhancement level, visual parameters

### External Dependencies

**Third-Party Services:**
- None currently (fully local processing)

**APIs:**
- Web Audio API for microphone access and frequency analysis
- Three.js CDN import via ES modules and importmap

**Database:**
- PostgreSQL via Neon serverless (configured but not actively used)
- Drizzle ORM for schema management and migrations

**Python Libraries:**
- Qiskit: Quantum circuit creation and simulation
- PyAudio: Audio stream capture for desktop version
- OpenCV (cv2): Desktop application rendering and visualization
- NumPy: Numerical computations
- SciPy: Signal processing utilities

**Frontend Libraries:**
- React Query (@tanstack/react-query) for server state management
- Radix UI primitives for accessible component foundation
- class-variance-authority and clsx for component styling variants
- react-hook-form with Zod validation for form handling
- date-fns for timestamp formatting

**Build Tools:**
- Vite with React plugin
- esbuild for server-side bundling
- PostCSS with Tailwind CSS and Autoprefixer
- tsx for TypeScript execution in development

**Replit-Specific:**
- @replit/vite-plugin-cartographer
- @replit/vite-plugin-dev-banner  
- @replit/vite-plugin-runtime-error-modal