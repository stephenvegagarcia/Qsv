#!/usr/bin/env python3
"""
Quantum Audio Sonar - Live Environmental Mapping
Uses Qiskit quantum computing to enhance audio and visualize sound waves
"""

import pygame
import numpy as np
import pyaudio
import math
import time
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass, field
from qiskit import QuantumCircuit
from qiskit.quantum_info import Statevector
from qiskit_aer import AerSimulator
import threading
import queue

# Constants
WINDOW_WIDTH = 1200
WINDOW_HEIGHT = 800
FPS = 60

# Audio settings
CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 1
RATE = 44100

# Colors (Cyan/Magenta cyberpunk theme)
BG_COLOR = (10, 15, 20)
GRID_COLOR = (0, 255, 255, 50)
PULSE_COLOR = (0, 255, 255)
ACCENT_COLOR = (255, 0, 255)
TEXT_COLOR = (0, 255, 255)
DETECTION_COLOR = (0, 255, 100)


@dataclass
class Pulse:
    """Represents a sonar pulse"""
    x: float
    y: float
    start_time: float
    speed: float = 200.0  # pixels per second
    max_distance: float = 500.0
    intensity: float = 1.0
    
    def get_radius(self, current_time: float) -> float:
        age = current_time - self.start_time
        return age * self.speed
    
    def is_alive(self, current_time: float) -> bool:
        return self.get_radius(current_time) < self.max_distance


@dataclass
class Detection:
    """Represents a detected object"""
    angle: float  # radians
    distance: float
    strength: float
    timestamp: float
    classification: Optional[str] = None


class QuantumAudioProcessor:
    """Processes audio using quantum circuits"""
    
    def __init__(self, num_qubits: int = 4):
        self.num_qubits = num_qubits
        self.simulator = AerSimulator()
        
    def process_frequencies(self, frequencies: np.ndarray, enhancement_level: float = 0.5) -> Dict:
        """Process audio frequencies through quantum circuit"""
        try:
            # Normalize frequencies
            max_freq = np.max(frequencies) if np.max(frequencies) > 0 else 1.0
            normalized = frequencies[:self.num_qubits] / max_freq
            
            # Create quantum circuit
            qc = QuantumCircuit(self.num_qubits, self.num_qubits)
            
            # Encode frequencies
            for i, freq in enumerate(normalized):
                angle = freq * np.pi / 2
                qc.ry(angle, i)
                qc.rz(freq * np.pi, i)
            
            # Entangle qubits
            for i in range(self.num_qubits - 1):
                qc.cx(i, i + 1)
            
            # Superposition
            for i in range(self.num_qubits):
                qc.h(i)
            
            # Save statevector before measurement for analysis
            qc.save_statevector()
            
            # Add measurements
            qc.measure_all()
            
            # Execute circuit
            result = self.simulator.run(qc, shots=256).result()
            counts = result.get_counts()
            
            # Convert counts to probability distribution
            total_shots = sum(counts.values())
            quasi_dists = {bitstring: count/total_shots for bitstring, count in counts.items()}
            
            # Extract enhanced frequencies
            enhanced = self._enhance_frequencies(frequencies, quasi_dists, enhancement_level)
            
            # Estimate detection distance
            distance = self._estimate_distance(frequencies, enhanced, enhancement_level)
            
            # Calculate confidence
            confidence = max(quasi_dists.values()) if quasi_dists else 0.0
            
            return {
                'enhanced': enhanced,
                'distance': distance,
                'confidence': min(1.0, confidence * 2.0),
                'circuit_depth': qc.depth()
            }
            
        except Exception as e:
            print(f"Quantum processing error: {e}")
            return {
                'enhanced': frequencies,
                'distance': None,
                'confidence': 0.0,
                'circuit_depth': 0
            }
    
    def _enhance_frequencies(self, original: np.ndarray, quasi_dists: Dict, level: float) -> np.ndarray:
        """Enhance frequencies using quantum measurements"""
        enhanced = original.copy()
        
        for bitstring, probability in quasi_dists.items():
            binary_val = int(bitstring, 2) if isinstance(bitstring, str) else bitstring
            factor = 1.0 + (probability * level * 0.5)
            
            for i in range(min(len(enhanced), self.num_qubits)):
                if binary_val & (1 << i):
                    enhanced[i] = min(1.0, enhanced[i] * factor)
        
        return enhanced
    
    def _estimate_distance(self, original: np.ndarray, enhanced: np.ndarray, level: float) -> Optional[float]:
        """Estimate detection distance from signal"""
        original_energy = np.mean(original)
        
        if original_energy < 0.1:
            return None
        
        enhanced_energy = np.mean(enhanced)
        energy_ratio = enhanced_energy / (original_energy + 1e-6)
        
        base_distance = 50.0
        max_distance = 300.0 + (level * 200.0)
        
        distance_factor = 1.0 / (energy_ratio ** 0.5)
        estimated = base_distance * distance_factor
        
        return min(max(estimated, base_distance), max_distance)


class AudioAnalyzer:
    """Analyzes audio from microphone"""
    
    def __init__(self):
        self.p = pyaudio.PyAudio()
        self.stream = None
        self.running = False
        self.audio_queue = queue.Queue(maxsize=10)
        
    def start(self):
        """Start audio capture"""
        try:
            self.stream = self.p.open(
                format=FORMAT,
                channels=CHANNELS,
                rate=RATE,
                input=True,
                frames_per_buffer=CHUNK,
                stream_callback=self._audio_callback
            )
            self.stream.start_stream()
            self.running = True
            print("Audio capture started")
        except Exception as e:
            print(f"Failed to start audio: {e}")
            
    def _audio_callback(self, in_data, frame_count, time_info, status):
        """Audio stream callback"""
        try:
            audio_data = np.frombuffer(in_data, dtype=np.int16)
            if not self.audio_queue.full():
                self.audio_queue.put(audio_data)
        except Exception as e:
            print(f"Audio callback error: {e}")
        return (in_data, pyaudio.paContinue)
    
    def get_audio_data(self) -> Optional[np.ndarray]:
        """Get latest audio data"""
        try:
            return self.audio_queue.get_nowait()
        except queue.Empty:
            return None
    
    def stop(self):
        """Stop audio capture"""
        if self.stream:
            self.stream.stop_stream()
            self.stream.close()
        self.p.terminate()
        self.running = False


class QuantumSonarVisualizer:
    """Main sonar visualization application"""
    
    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
        pygame.display.set_caption("Quantum Audio Sonar - Live Environmental Mapping")
        self.clock = pygame.time.Clock()
        self.font = pygame.font.Font(None, 24)
        self.font_small = pygame.font.Font(None, 18)
        
        self.center_x = WINDOW_WIDTH // 2
        self.center_y = WINDOW_HEIGHT // 2
        
        self.pulses: List[Pulse] = []
        self.detections: List[Detection] = []
        self.particles = self._init_particles()
        
        self.audio_analyzer = AudioAnalyzer()
        self.quantum_processor = QuantumAudioProcessor()
        
        self.last_beat_time = 0
        self.beat_threshold = 5000  # Amplitude threshold for beat detection
        self.quantum_enabled = True
        self.enhancement_level = 0.5
        self.max_detection_range = 0
        
        self.quantum_status = "Idle"
        self.audio_level = 0
        self.processing_time = 0
        
    def _init_particles(self) -> List[Dict]:
        """Initialize background particles"""
        particles = []
        for _ in range(100):
            particles.append({
                'x': np.random.uniform(-400, 400),
                'y': np.random.uniform(-400, 400),
                'vx': np.random.uniform(-0.5, 0.5),
                'vy': np.random.uniform(-0.5, 0.5),
                'alpha': np.random.uniform(0.3, 0.8)
            })
        return particles
    
    def draw_grid(self):
        """Draw background grid"""
        grid_size = 50
        alpha = 30
        
        for i in range(-10, 11):
            x = self.center_x + i * grid_size
            y = self.center_y + i * grid_size
            
            # Vertical lines
            pygame.draw.line(self.screen, GRID_COLOR, 
                           (x, 0), (x, WINDOW_HEIGHT), 1)
            # Horizontal lines
            pygame.draw.line(self.screen, GRID_COLOR,
                           (0, y), (WINDOW_WIDTH, y), 1)
        
        # Range circles
        for i in range(1, 6):
            radius = i * 80
            pygame.draw.circle(self.screen, GRID_COLOR,
                             (self.center_x, self.center_y), radius, 1)
    
    def draw_particles(self):
        """Draw background particles"""
        for particle in self.particles:
            particle['x'] += particle['vx']
            particle['y'] += particle['vy']
            
            # Wrap around
            if abs(particle['x']) > 400:
                particle['x'] = -particle['x']
            if abs(particle['y']) > 400:
                particle['y'] = -particle['y']
            
            px = int(self.center_x + particle['x'])
            py = int(self.center_y + particle['y'])
            
            color = (*PULSE_COLOR[:3], int(particle['alpha'] * 100))
            pygame.draw.circle(self.screen, PULSE_COLOR, (px, py), 2)
    
    def draw_pulses(self, current_time: float):
        """Draw sonar pulses"""
        self.pulses = [p for p in self.pulses if p.is_alive(current_time)]
        
        for pulse in self.pulses:
            radius = pulse.get_radius(current_time)
            age = current_time - pulse.start_time
            
            # Fade out as pulse expands
            fade_start = pulse.max_distance * 0.7
            if radius > fade_start:
                fade_progress = (radius - fade_start) / (pulse.max_distance - fade_start)
                alpha = int(255 * pulse.intensity * (1 - fade_progress))
            else:
                alpha = int(255 * pulse.intensity)
            
            # Main ring
            color = (*PULSE_COLOR, min(alpha, 255))
            pygame.draw.circle(self.screen, PULSE_COLOR,
                             (int(pulse.x), int(pulse.y)), int(radius), 2)
            
            # Scan line effect
            scan_angle = age * 2
            end_x = pulse.x + math.cos(scan_angle) * radius
            end_y = pulse.y + math.sin(scan_angle) * radius
            pygame.draw.line(self.screen, PULSE_COLOR,
                           (pulse.x, pulse.y), (end_x, end_y), 2)
    
    def draw_frequency_bars(self, frequencies: np.ndarray):
        """Draw frequency visualization around center"""
        if len(frequencies) == 0:
            return
        
        bar_count = min(64, len(frequencies))
        angle_step = (2 * math.pi) / bar_count
        inner_radius = 30
        
        for i in range(bar_count):
            idx = int(i * len(frequencies) / bar_count)
            value = frequencies[idx]
            bar_height = value * 100
            angle = i * angle_step
            
            x1 = self.center_x + math.cos(angle) * inner_radius
            y1 = self.center_y + math.sin(angle) * inner_radius
            x2 = self.center_x + math.cos(angle) * (inner_radius + bar_height)
            y2 = self.center_y + math.sin(angle) * (inner_radius + bar_height)
            
            alpha = int(value * 255)
            color = (*PULSE_COLOR, min(alpha, 255))
            pygame.draw.line(self.screen, PULSE_COLOR, (x1, y1), (x2, y2), 2)
    
    def draw_hud(self):
        """Draw heads-up display"""
        y_offset = 20
        
        # Audio level
        text = self.font_small.render(f"Audio Level: {int(self.audio_level * 100)}%", True, TEXT_COLOR)
        self.screen.blit(text, (20, y_offset))
        y_offset += 30
        
        # Pulse count
        text = self.font_small.render(f"Active Pulses: {len(self.pulses)}", True, TEXT_COLOR)
        self.screen.blit(text, (20, y_offset))
        y_offset += 30
        
        # Quantum status
        status_color = DETECTION_COLOR if self.quantum_status == "Ready" else TEXT_COLOR
        text = self.font_small.render(f"Quantum: {self.quantum_status}", True, status_color)
        self.screen.blit(text, (20, y_offset))
        y_offset += 30
        
        # Detection range
        text = self.font_small.render(f"Max Range: {int(self.max_detection_range)}px", True, TEXT_COLOR)
        self.screen.blit(text, (20, y_offset))
        
        # Instructions
        instructions = [
            "Space: Toggle Quantum Enhancement",
            "+/-: Adjust Enhancement Level",
            "ESC: Exit"
        ]
        
        y_pos = WINDOW_HEIGHT - 80
        for instruction in instructions:
            text = self.font_small.render(instruction, True, TEXT_COLOR)
            self.screen.blit(text, (20, y_pos))
            y_pos += 25
    
    def draw_center_indicator(self):
        """Draw center position indicator"""
        # Pulsing glow
        glow_radius = 10 + math.sin(time.time() * 3) * 3
        pygame.draw.circle(self.screen, PULSE_COLOR,
                         (self.center_x, self.center_y), int(glow_radius), 0)
        
        # Center dot
        pygame.draw.circle(self.screen, ACCENT_COLOR,
                         (self.center_x, self.center_y), 4, 0)
    
    def process_audio(self, audio_data: np.ndarray):
        """Process audio data and create pulses"""
        # Normalize
        normalized = audio_data.astype(np.float32) / 32768.0
        
        # Calculate volume
        volume = np.mean(np.abs(normalized))
        self.audio_level = volume
        
        # FFT for frequencies
        fft = np.fft.rfft(normalized)
        frequencies = np.abs(fft) / len(fft)
        frequencies = frequencies[:len(frequencies)//2]  # Use lower half
        
        # Normalize frequencies
        if np.max(frequencies) > 0:
            frequencies = frequencies / np.max(frequencies)
        
        # Beat detection
        amplitude = np.max(np.abs(audio_data))
        current_time = time.time()
        
        if amplitude > self.beat_threshold and current_time - self.last_beat_time > 0.25:
            self.last_beat_time = current_time
            
            # Process through quantum circuit if enabled
            if self.quantum_enabled:
                self.quantum_status = "Processing"
                start = time.time()
                
                result = self.quantum_processor.process_frequencies(
                    frequencies, self.enhancement_level
                )
                
                self.processing_time = (time.time() - start) * 1000
                self.quantum_status = "Ready"
                
                # Create pulse with quantum-enhanced range
                max_dist = 200 + (self.enhancement_level * 300)
                if result['distance']:
                    max_dist = result['distance']
                    self.max_detection_range = max(self.max_detection_range, max_dist)
                
                pulse = Pulse(
                    x=self.center_x,
                    y=self.center_y,
                    start_time=current_time,
                    max_distance=max_dist,
                    intensity=0.8 + result['confidence'] * 0.2
                )
                self.pulses.append(pulse)
                
                # Create detection if distance found
                if result['distance']:
                    detection = Detection(
                        angle=np.random.uniform(0, 2 * np.pi),
                        distance=result['distance'],
                        strength=result['confidence'],
                        timestamp=current_time
                    )
                    self.detections.append(detection)
                    self.detections = self.detections[-5:]  # Keep last 5
            else:
                # Simple pulse without quantum enhancement
                pulse = Pulse(
                    x=self.center_x,
                    y=self.center_y,
                    start_time=current_time,
                    max_distance=300,
                    intensity=0.8
                )
                self.pulses.append(pulse)
        
        return frequencies
    
    def run(self):
        """Main application loop"""
        print("Starting Quantum Audio Sonar...")
        print("Initializing audio capture...")
        
        self.audio_analyzer.start()
        
        if not self.audio_analyzer.running:
            print("Failed to start audio. Please check microphone permissions.")
            return
        
        print("Ready! Make sounds to create sonar pulses.")
        print("Quantum enhancement: ENABLED")
        
        running = True
        frequencies = np.array([])
        
        while running:
            current_time = time.time()
            
            # Handle events
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_ESCAPE:
                        running = False
                    elif event.key == pygame.K_SPACE:
                        self.quantum_enabled = not self.quantum_enabled
                        status = "ENABLED" if self.quantum_enabled else "DISABLED"
                        print(f"Quantum enhancement: {status}")
                    elif event.key == pygame.K_PLUS or event.key == pygame.K_EQUALS:
                        self.enhancement_level = min(1.0, self.enhancement_level + 0.1)
                        print(f"Enhancement level: {int(self.enhancement_level * 100)}%")
                    elif event.key == pygame.K_MINUS:
                        self.enhancement_level = max(0.0, self.enhancement_level - 0.1)
                        print(f"Enhancement level: {int(self.enhancement_level * 100)}%")
            
            # Process audio
            audio_data = self.audio_analyzer.get_audio_data()
            if audio_data is not None:
                frequencies = self.process_audio(audio_data)
            
            # Draw
            self.screen.fill(BG_COLOR)
            self.draw_grid()
            self.draw_particles()
            self.draw_pulses(current_time)
            self.draw_frequency_bars(frequencies)
            self.draw_center_indicator()
            self.draw_hud()
            
            pygame.display.flip()
            self.clock.tick(FPS)
        
        # Cleanup
        self.audio_analyzer.stop()
        pygame.quit()
        print("Quantum Audio Sonar terminated.")


def main():
    """Entry point"""
    try:
        app = QuantumSonarVisualizer()
        app.run()
    except KeyboardInterrupt:
        print("\nShutting down...")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
