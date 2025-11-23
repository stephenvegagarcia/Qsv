# Quantum Audio Sonar - Live Environmental Mapping

## Overview

Quantum Audio Sonar is a specialized audio visualization application that maps environments through sound waves using quantum-enhanced signal processing. The application captures real-time microphone input, processes it through Qiskit quantum circuits, and displays an interactive 3D sonar visualization with cyberpunk aesthetics.

The system offers both a Python Pygame version (recommended) and a web-based version built with React, TypeScript, and Three.js. It combines real-time audio analysis, quantum computing algorithms, and advanced 3D visualization to create an immersive environmental mapping experience.

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
- `HUDOverlay`: Displays real-time metrics (audio level, pulse count, quantum status)
- `ControlPanel`: Collapsible settings interface for FFT size, sensitivity, quantum modes
- `DetectionPanel`: Shows detected environmental objects with direction and distance
- `ThemeToggle`: Light/dark mode switcher

**Key Features:**
- Real-time audio analysis using Web Audio API (AudioContext, AnalyserNode)
- Custom hooks for audio processing (`use-audio-analyzer`) and WebSocket communication (`use-quantum-websocket`)
- Dynamic Three.js scene management with fog, lighting, and particle effects
- Responsive sonar pulse visualization with adaptive range based on quantum processing

### Backend Architecture

**Technology Stack:**
- Node.js with Express server
- TypeScript for type safety
- WebSocket (ws library) for real-time bidirectional communication
- Python 3 integration for quantum processing via child processes

**Server Structure:**
- `server/app.ts`: Express application setup with JSON body parsing and logging
- `server/routes.ts`: WebSocket server and API endpoint registration
- `server/quantum_service.ts`: Service layer spawning Python quantum processor
- `server/quantum_processor.py`: Qiskit-based quantum audio enhancement

**Communication Pattern:**
- HTTP REST endpoint for health checks
- WebSocket connection for streaming audio data and quantum results
- Message-based protocol with typed payloads (audio_data, quantum_result, settings_update, detection)

**Python Integration:**
- Spawns Python subprocess to execute Qiskit quantum circuits
- JSON-based input/output for frequency data and enhancement parameters
- Fallback handling when quantum processing fails (returns original frequencies)

### Quantum Processing Pipeline

**Quantum Enhancement Approach:**
1. Normalize audio frequency data to [0, 1] range
2. Encode frequencies into quantum states using Ry and Rz rotation gates
3. Apply CNOT gates for entanglement between adjacent qubits
4. Use Hadamard gates to create superposition states
5. Measure quantum states and enhance original frequencies
6. Estimate detection distance from quantum-processed signal strength

**Technology:**
- Qiskit quantum computing framework
- Statevector simulation for circuit execution
- 4-qubit circuits (configurable) for frequency encoding
- Signal processing with NumPy and SciPy

**Processing Flow:**
```
Audio Input → FFT Analysis → Quantum Circuit Encoding → 
Quantum Operations → Measurement → Signal Enhancement → 
Distance Estimation → Visualization Update
```

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
- PyAudio: Audio stream capture for Pygame version
- Pygame: Desktop application rendering and event handling
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