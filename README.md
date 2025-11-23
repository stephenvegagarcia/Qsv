# Quantum Audio Sonar - Live Environmental Mapping

Experience quantum-enhanced audio visualization that maps your environment through sound waves, powered by Qiskit and advanced signal processing.

## Features

- **Real-time Audio Capture**: Captures microphone input via Web Audio API
- **Quantum Enhancement**: Uses Qiskit quantum circuits (Aer simulator) to enhance audio signals
- **Beautiful 2D Sonar Visualization**: Cyberpunk-themed canvas with expanding pulses and frequency bars
- **Adaptive Pulse Range**: Pulses extend based on quantum-detected audio distance (10-100m range)
- **Live HUD Metrics**: Real-time display of audio level, pulse count, and quantum status
- **Interactive Controls**: Adjust FFT size, sensitivity, enhancement level, and visual settings

## Running the Application

### Web Version (Browser-Based - Recommended)

The application runs in your web browser where microphone access is available:

```bash
npm run dev
```

Then open **http://localhost:5000** in your browser.

**Important Notes:**
- The application will request microphone permission - click "Allow"
- Make sounds (claps, snaps, speech) to generate sonar pulses
- Vite HMR may show connection errors in console (safe to ignore - app still works)
- If you see a blank page, do a hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

**Browser Controls:**
- Click theme toggle (top right) to switch dark/light mode  
- Open control panel to adjust quantum and visual settings
- Beat detection triggers sonar pulses automatically

### Python Pygame Version (Desktop - Requires Display/Audio)

Note: Pygame version requires local machine with microphone and display (won't work in Replit):

```bash
python3 quantum_sonar_app.py
```

## How It Works

1. **Audio Capture**: Captures sound from your microphone using PyAudio
2. **Quantum Processing**: Processes audio frequencies through Qiskit quantum circuits
3. **Beat Detection**: Detects beats/loud sounds to emit sonar pulses
4. **Distance Estimation**: Uses quantum-enhanced signal analysis to estimate detection range
5. **Visualization**: Displays expanding sonar pulses with adaptive range based on detections

### Quantum Enhancement

The application uses Qiskit to:
- Encode audio frequency data into quantum states using rotation gates
- Apply quantum entanglement for signal enhancement
- Use superposition to extract hidden patterns
- Measure quantum states to enhance frequency data
- Estimate distances based on quantum-processed signal strength

The pulses extend further when quantum enhancement detects stronger audio reflections, effectively mapping your environment through sound!

## Technical Stack

**Frontend:**
- React + TypeScript for UI components
- HTML5 Canvas API for 2D sonar visualization  
- Web Audio API for microphone capture and FFT analysis
- WebSocket for real-time quantum processing communication
- shadcn/ui + Tailwind CSS for styled interface

**Backend:**
- Node.js + Express server
- Python subprocess for quantum processing
- Qiskit 2.2.3 with Aer simulator for quantum circuits
- WebSocket (ws library) for bidirectional communication

**Quantum Processing:**
- 4-qubit circuits encode audio frequency data
- Amplitude encoding via Ry/Rz rotation gates
- CNOT entanglement + Hadamard superposition
- Measurements enhance signal and estimate distances

## Requirements

### Web Version:
- Node.js 22+ (included in Replit)
- Python 3.11+ with qiskit, qiskit-aer, numpy, scipy
- Modern web browser with microphone support

### Pygame Version:
- All web requirements plus:
- pygame, pyaudio, opencv-python
- Local machine with microphone and display
- Audio device (ALSA/PulseAudio on Linux, CoreAudio on macOS, WASAPI on Windows)

## Tips for Best Results

- **Make sounds!** Clap, snap, or speak to trigger sonar pulses
- **Adjust sensitivity** in control panel if pulses don't appear
- **Enable quantum mode** for adaptive distance detection (pulses extend further)
- **Increase enhancement level** to see stronger quantum signal processing
- Works best in **rooms with reflective surfaces** rather than open outdoor spaces
- The **brighter the pulse**, the stronger the quantum-enhanced signal
- **Grid opacity** and **pulse intensity** sliders let you customize the visual style

## Troubleshooting

**Blank page / No visualization:**
- Hard refresh browser (Ctrl+Shift+R)
- Check browser console for errors
- Ensure server is running (check terminal for "serving on port 5000")

**No microphone access:**
- Browser will prompt for permission - click "Allow"
- Check browser settings to ensure site can access microphone
- Try different browser (Chrome/Edge recommended)

**No pulses appearing:**
- Make louder sounds (clap or snap near microphone)
- Lower sensitivity threshold in control panel
- Check HUD - audio level should show non-zero values when making sound

**Quantum status shows "Error":**
- Python quantum processor may have crashed - check server logs
- Restart server with `npm run dev`

Enjoy mapping your environment through quantum-enhanced sound! 🌊🔬
