# Quantum Audio Sonar - Live Environmental Mapping

Experience quantum-enhanced audio visualization that maps your environment through sound waves, powered by Qiskit and advanced signal processing.

## Features

- **Real-time Audio Capture**: Captures microphone input and analyzes frequency patterns
- **Quantum Enhancement**: Uses Qiskit quantum circuits to enhance audio signals and detect distances
- **Beautiful Sonar Visualization**: Stunning cyberpunk-themed visualization with expanding pulses
- **Adaptive Range**: Pulses extend as far as quantum-processed audio detects reflections
- **Live Frequency Display**: Real-time circular frequency visualization around the center
- **Interactive Controls**: Toggle quantum enhancement and adjust levels in real-time

## Running the Application

### Python Pygame Version (Recommended)

```bash
python3 quantum_sonar_app.py
```

**Controls:**
- `SPACE` - Toggle quantum enhancement on/off
- `+/-` - Adjust enhancement level (0-100%)
- `ESC` - Exit application

### How It Works

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

## Web Version (Alternative)

To run the web-based version:

```bash
npm run dev
```

Then open http://localhost:5000 in your browser.

## Requirements

- Python 3.11+
- Microphone access
- Dependencies: pygame, pyaudio, qiskit, numpy, scipy

## Tips for Best Results

- Make loud, sharp sounds (claps, snaps) for best pulse emission
- Adjust enhancement level to see different detection ranges
- The brighter the pulse, the stronger the quantum-enhanced signal
- Works best in environments with acoustic reflections (rooms, not open spaces)

Enjoy mapping your environment through quantum-enhanced sound! 🌊🔬
