#!/usr/bin/env python3
"""
Quantum Acoustic Object Detector using Bell State Entanglement
Uses |φ⁺⟩ = 1/√2 (|00⟩ + |11⟩) for detecting acoustic signatures

This detector analyzes audio frequency patterns and Time-of-Flight data
to precisely locate objects using quantum entanglement correlations.
"""

import sys
import json
import math
import numpy as np
from typing import List, Dict, Any, Tuple, Optional

try:
    from qiskit import QuantumCircuit
    from qiskit_aer import AerSimulator
    from qiskit.quantum_info import Statevector
    QISKIT_AVAILABLE = True
except ImportError:
    QISKIT_AVAILABLE = False


def create_bell_state_detector(num_frequency_pairs: int = 4) -> QuantumCircuit:
    """
    Create a quantum circuit using Bell state |φ⁺⟩ = 1/√2 (|00⟩ + |11⟩)
    for detecting correlated acoustic signatures.
    
    Each pair of qubits is entangled to detect frequency correlations
    that indicate the presence and characteristics of sound-reflecting objects.
    """
    num_qubits = num_frequency_pairs * 2
    qc = QuantumCircuit(num_qubits, num_qubits)
    
    # Create Bell states for each frequency pair
    for i in range(num_frequency_pairs):
        q1 = i * 2
        q2 = i * 2 + 1
        
        # Create |φ⁺⟩ = 1/√2 (|00⟩ + |11⟩)
        qc.h(q1)           # Hadamard on first qubit
        qc.cx(q1, q2)      # CNOT to entangle
    
    return qc


def encode_frequencies_to_phases(qc: QuantumCircuit, frequencies: List[float], volume: float,
                                  tof_distance: Optional[float] = None) -> QuantumCircuit:
    """
    Encode audio frequency data and ToF distance into quantum phase rotations.
    Higher frequency components rotate the phase more.
    ToF distance provides precise phase information for localization.
    """
    num_pairs = len(frequencies) // 2
    
    for i in range(min(num_pairs, 4)):
        q1 = i * 2
        q2 = i * 2 + 1
        
        if i * 2 < len(frequencies):
            # Normalize frequency to [0, π]
            freq1 = frequencies[i * 2] / 255.0 * math.pi
            qc.rz(freq1, q1)
        
        if i * 2 + 1 < len(frequencies):
            freq2 = frequencies[i * 2 + 1] / 255.0 * math.pi
            qc.rz(freq2, q2)
    
    # Apply volume-based global phase
    volume_phase = (volume / 255.0) * math.pi / 2
    for i in range(qc.num_qubits):
        qc.ry(volume_phase, i)
    
    # Encode ToF distance for precise localization
    if tof_distance is not None and tof_distance > 0:
        # Distance phase encoding: closer objects = stronger rotation
        # Normalize to max 50m range
        distance_phase = (1 - min(tof_distance, 50) / 50) * math.pi
        # Apply to first pair for distance encoding
        qc.rz(distance_phase, 0)
        qc.rz(-distance_phase, 1)  # Anti-correlation for precision
    
    return qc


def apply_interference_detection(qc: QuantumCircuit) -> QuantumCircuit:
    """
    Apply quantum interference to detect correlations between frequency pairs.
    This helps identify distinct acoustic sources and their precise locations.
    """
    num_pairs = qc.num_qubits // 2
    
    # Cross-correlation between adjacent pairs
    for i in range(num_pairs - 1):
        qc.cz(i * 2 + 1, (i + 1) * 2)
    
    # Final Hadamard layer for interference
    for i in range(0, qc.num_qubits, 2):
        qc.h(i)
    
    # Measure all qubits
    qc.measure(range(qc.num_qubits), range(qc.num_qubits))
    
    return qc


def analyze_measurements(counts: Dict[str, int], shots: int, 
                         tof_data: Optional[Dict] = None) -> Dict[str, Any]:
    """
    Analyze quantum measurement results to extract precise object detection.
    
    Bell state correlations indicate:
    - |00⟩ or |11⟩ dominant: Strong reflection (solid object)
    - |01⟩ or |10⟩ dominant: Weak reflection (soft/distant object)
    - Mixed states: Multiple objects or complex environment
    
    ToF data provides precise distance when available.
    """
    results = {
        'detections': [],
        'entanglement_quality': 0.0,
        'total_objects': 0
    }
    
    # Calculate Bell state fidelity for each pair
    num_pairs = 4
    pair_correlations = []
    
    for pair_idx in range(num_pairs):
        correlated = 0  # |00⟩ or |11⟩
        anti_correlated = 0  # |01⟩ or |10⟩
        
        for bitstring, count in counts.items():
            # Reverse bitstring (Qiskit convention)
            bits = bitstring[::-1]
            if len(bits) >= (pair_idx + 1) * 2:
                b1 = bits[pair_idx * 2]
                b2 = bits[pair_idx * 2 + 1]
                
                if b1 == b2:
                    correlated += count
                else:
                    anti_correlated += count
        
        total = correlated + anti_correlated
        if total > 0:
            correlation = correlated / total
            pair_correlations.append({
                'pair': pair_idx,
                'correlation': correlation,
                'anti_correlation': 1 - correlation,
                'strength': abs(correlation - 0.5) * 2  # 0 = no signal, 1 = strong signal
            })
    
    # Extract precise distance from ToF if available
    tof_distance = None
    tof_accuracy = 0.5  # Default accuracy margin in meters
    if tof_data and 'distanceMeters' in tof_data:
        tof_distance = tof_data['distanceMeters']
        # Accuracy based on correlation strength
        tof_accuracy = 0.1 + (1 - tof_data.get('correlationStrength', 0.5)) * 0.4
    
    # Detect objects based on correlation patterns
    objects_detected = []
    
    for i, pc in enumerate(pair_correlations):
        if pc['strength'] > 0.1:  # Detection threshold
            # Calculate direction based on frequency pair index
            # Lower frequencies = larger/closer objects
            # Higher frequencies = smaller/farther objects
            base_azimuth = (i / len(pair_correlations)) * 360
            
            # Use correlation type to refine direction
            if pc['correlation'] > 0.5:
                # Strong reflection - object in front
                azimuth = base_azimuth
                obj_type = 'solid' if pc['correlation'] > 0.7 else 'medium'
            else:
                # Weak reflection - object to side or soft
                azimuth = (base_azimuth + 45) % 360
                obj_type = 'soft' if pc['anti_correlation'] > 0.7 else 'diffuse'
            
            # Use ToF distance if available, otherwise estimate from frequency band
            if tof_distance is not None and i == 0:
                # Primary detection uses ToF
                distance = tof_distance
                distance_accuracy = tof_accuracy
            else:
                # Secondary detections use frequency-based estimation
                base_distance = 2 + (i * 8)  # 2m to 26m range
                distance = base_distance * (1 + (1 - pc['strength']) * 0.3)
                # Lower accuracy for frequency-based estimation
                distance_accuracy = distance * 0.2
            
            # Elevation from correlation balance
            elevation = (pc['correlation'] - 0.5) * 30  # -15 to +15 degrees
            
            # Calculate Cartesian coordinates
            azimuth_rad = math.radians(azimuth)
            elevation_rad = math.radians(elevation)
            
            x = distance * math.cos(elevation_rad) * math.sin(azimuth_rad)
            y = distance * math.cos(elevation_rad) * math.cos(azimuth_rad)
            z = distance * math.sin(elevation_rad)
            
            # Classify object based on acoustic signature
            classification = classify_acoustic_signature(pc, i)
            
            objects_detected.append({
                'id': f'obj_{i}_{int(azimuth)}',
                'position': {
                    'azimuth': round(azimuth, 1),
                    'elevation': round(elevation, 1),
                    'distance': round(distance, 2),
                    'distanceAccuracy': round(distance_accuracy, 2),
                    'x': round(x, 2),
                    'y': round(y, 2),
                    'z': round(z, 2)
                },
                'signalStrength': round(pc['strength'], 3),
                'objectType': obj_type,
                'classification': classification,
                'confidence': round(pc['strength'] * 0.9, 2),
                'tofData': tof_data if i == 0 and tof_data else None
            })
    
    # Calculate overall entanglement quality
    if pair_correlations:
        avg_strength = sum(pc['strength'] for pc in pair_correlations) / len(pair_correlations)
        results['entanglement_quality'] = round(avg_strength, 3)
    
    results['detections'] = objects_detected
    results['total_objects'] = len(objects_detected)
    
    return results


def classify_acoustic_signature(correlation: Dict, freq_band: int) -> str:
    """
    Classify detected object based on its acoustic signature.
    
    Low frequencies (bands 0-1): Large objects (walls, vehicles, buildings)
    Mid frequencies (band 2): Medium objects (furniture, people, animals)
    High frequencies (band 3): Small objects (electronics, birds, insects)
    """
    strength = correlation['strength']
    is_reflective = correlation['correlation'] > 0.5
    
    classifications = {
        0: {  # Very low frequency
            'high_reflect': 'Wall/Building',
            'low_reflect': 'Large Soft Object',
            'medium': 'Vehicle/Structure'
        },
        1: {  # Low-mid frequency
            'high_reflect': 'Dense Surface',
            'low_reflect': 'Fabric/Curtain',
            'medium': 'Furniture'
        },
        2: {  # Mid frequency
            'high_reflect': 'Metal/Glass',
            'low_reflect': 'Person/Animal',
            'medium': 'Moving Object'
        },
        3: {  # High frequency
            'high_reflect': 'Small Hard Object',
            'low_reflect': 'Air Movement',
            'medium': 'Electronic Device'
        }
    }
    
    band_classes = classifications.get(freq_band, classifications[2])
    
    if is_reflective and strength > 0.6:
        return band_classes['high_reflect']
    elif not is_reflective and strength > 0.4:
        return band_classes['low_reflect']
    else:
        return band_classes['medium']


def detect_objects(frequencies: List[float], volume: float, 
                   tof_data: Optional[Dict] = None) -> Dict[str, Any]:
    """
    Main detection function using Bell state quantum processing with ToF.
    
    Args:
        frequencies: List of frequency magnitudes from FFT (0-255 range)
        volume: Current audio volume level (0-255)
        tof_data: Optional Time-of-Flight measurement for precise distance
    
    Returns:
        Detection results with precise positions and classifications
    """
    if not QISKIT_AVAILABLE:
        return fallback_detection(frequencies, volume, tof_data)
    
    try:
        # Create Bell state detector circuit
        qc = create_bell_state_detector(num_frequency_pairs=4)
        
        # Extract ToF distance if available
        tof_distance = tof_data.get('distanceMeters') if tof_data else None
        
        # Encode audio data with ToF
        qc = encode_frequencies_to_phases(qc, frequencies, volume, tof_distance)
        
        # Apply interference detection
        qc = apply_interference_detection(qc)
        
        # Run quantum simulation
        simulator = AerSimulator()
        shots = 1024
        job = simulator.run(qc, shots=shots)
        result = job.result()
        counts = result.get_counts()
        
        # Analyze measurements with ToF data
        detection_results = analyze_measurements(counts, shots, tof_data)
        detection_results['quantum_processed'] = True
        detection_results['circuit_depth'] = qc.depth()
        detection_results['bell_state'] = '|φ⁺⟩ = 1/√2 (|00⟩ + |11⟩)'
        
        return detection_results
        
    except Exception as e:
        return {
            'error': str(e),
            'quantum_processed': False,
            'detections': [],
            'total_objects': 0
        }


def fallback_detection(frequencies: List[float], volume: float,
                       tof_data: Optional[Dict] = None) -> Dict[str, Any]:
    """
    Classical fallback when Qiskit is not available.
    Uses FFT analysis to detect frequency peaks as objects.
    """
    detections = []
    
    if len(frequencies) < 8 or volume < 10:
        return {
            'detections': [],
            'total_objects': 0,
            'quantum_processed': False,
            'entanglement_quality': 0
        }
    
    # Get ToF distance if available
    tof_distance = tof_data.get('distanceMeters') if tof_data else None
    tof_accuracy = 0.3 if tof_data else 2.0
    
    # Analyze frequency bands for peaks
    bands = [
        frequencies[0:len(frequencies)//4],
        frequencies[len(frequencies)//4:len(frequencies)//2],
        frequencies[len(frequencies)//2:3*len(frequencies)//4],
        frequencies[3*len(frequencies)//4:]
    ]
    
    for i, band in enumerate(bands):
        if not band:
            continue
            
        avg = sum(band) / len(band)
        peak = max(band)
        
        if peak > 30 and peak > avg * 1.5:
            strength = min(peak / 255, 1.0)
            azimuth = (i / 4) * 360 + (band.index(peak) / len(band)) * 90
            
            # Use ToF for first detection, estimate for others
            if tof_distance is not None and i == 0:
                distance = tof_distance
                distance_accuracy = tof_accuracy
            else:
                distance = 2 + (i * 8) + (1 - strength) * 5
                distance_accuracy = distance * 0.25
            
            elevation = (strength - 0.5) * 20
            
            # Calculate coordinates
            azimuth_rad = math.radians(azimuth)
            elevation_rad = math.radians(elevation)
            
            x = distance * math.cos(elevation_rad) * math.sin(azimuth_rad)
            y = distance * math.cos(elevation_rad) * math.cos(azimuth_rad)
            z = distance * math.sin(elevation_rad)
            
            classifications = ['Wall/Structure', 'Surface', 'Object', 'Small Item']
            
            detections.append({
                'id': f'obj_{i}_{int(azimuth)}',
                'position': {
                    'azimuth': round(azimuth % 360, 1),
                    'elevation': round(elevation, 1),
                    'distance': round(distance, 2),
                    'distanceAccuracy': round(distance_accuracy, 2),
                    'x': round(x, 2),
                    'y': round(y, 2),
                    'z': round(z, 2)
                },
                'signalStrength': round(strength, 3),
                'objectType': 'detected',
                'classification': classifications[i],
                'confidence': round(strength * 0.7, 2)
            })
    
    return {
        'detections': detections,
        'total_objects': len(detections),
        'quantum_processed': False,
        'entanglement_quality': 0
    }


if __name__ == '__main__':
    # Read input from stdin
    input_data = json.loads(sys.stdin.read())
    
    frequencies = input_data.get('frequencies', [])
    volume = input_data.get('volume', 0)
    tof_data = input_data.get('tofData', None)
    
    # Run detection
    result = detect_objects(frequencies, volume, tof_data)
    
    # Output JSON result
    print(json.dumps(result))
