import { useEffect, useRef } from 'react';
import type { AudioAnalysis, Pulse } from '@shared/schema';

interface SonarCanvas2DProps {
  audioAnalysis: AudioAnalysis | null;
  onPulseCreate?: (pulse: Pulse) => void;
  maxPulseDistance?: number;
  gridOpacity?: number;
  pulseIntensity?: number;
}

export function SonarCanvas2D({ 
  audioAnalysis,
  onPulseCreate,
  maxPulseDistance = 100,
  gridOpacity = 0.2,
  pulseIntensity = 0.8 
}: SonarCanvas2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pulsesRef = useRef<Array<Pulse>>([]);
  const lastBeatTimeRef = useRef(0);
  const animationFrameRef = useRef<number>();
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; alpha: number }>>([]);

  // Initialize particles
  useEffect(() => {
    const particles = [];
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * 100 - 50,
        y: Math.random() * 100 - 50,
        vx: (Math.random() - 0.5) * 0.02,
        vy: (Math.random() - 0.5) * 0.02,
        alpha: Math.random() * 0.5
      });
    }
    particlesRef.current = particles;
  }, []);

  // Handle pulse creation
  useEffect(() => {
    if (!audioAnalysis) return;

    const now = Date.now();
    if (audioAnalysis.isBeat && now - lastBeatTimeRef.current > 250) {
      lastBeatTimeRef.current = now;

      const pulse: Pulse = {
        id: `pulse-${now}`,
        position: { x: 0, y: 0, z: 0 },
        startTime: now,
        speed: 15,
        intensity: pulseIntensity,
        maxDistance
      };

      pulsesRef.current.push(pulse);

      if (onPulseCreate) {
        onPulseCreate(pulse);
      }
    }
  }, [audioAnalysis, onPulseCreate, maxPulseDistance, pulseIntensity]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.clientWidth * window.devicePixelRatio;
      canvas.height = canvas.clientHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resize();
    window.addEventListener('resize', resize);

    const centerX = canvas.clientWidth / 2;
    const centerY = canvas.clientHeight / 2;
    const scale = Math.min(canvas.clientWidth, canvas.clientHeight) / 100;

    const animate = () => {
      const now = Date.now();

      // Clear canvas
      ctx.fillStyle = 'rgba(10, 15, 20, 0.1)';
      ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

      // Draw grid
      ctx.strokeStyle = `rgba(0, 255, 255, ${gridOpacity})`;
      ctx.lineWidth = 0.5;
      
      const gridSize = 10 * scale;
      const gridCount = 10;
      
      for (let i = -gridCount; i <= gridCount; i++) {
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(centerX + i * gridSize, centerY - gridCount * gridSize);
        ctx.lineTo(centerX + i * gridSize, centerY + gridCount * gridSize);
        ctx.stroke();
        
        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(centerX - gridCount * gridSize, centerY + i * gridSize);
        ctx.lineTo(centerX + gridCount * gridSize, centerY + i * gridSize);
        ctx.stroke();
      }

      // Draw concentric range rings
      ctx.strokeStyle = `rgba(0, 255, 255, ${gridOpacity * 0.5})`;
      for (let i = 1; i <= 5; i++) {
        const radius = i * 15 * scale;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw particles
      particlesRef.current.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Wrap around
        if (Math.abs(particle.x) > 50) particle.x = -particle.x;
        if (Math.abs(particle.y) > 50) particle.y = -particle.y;
        
        const px = centerX + particle.x * scale;
        const py = centerY + particle.y * scale;
        
        ctx.fillStyle = `rgba(0, 255, 255, ${particle.alpha * gridOpacity})`;
        ctx.fillRect(px - 1, py - 1, 2, 2);
      });

      // Draw pulses
      pulsesRef.current = pulsesRef.current.filter(pulse => {
        const age = (now - pulse.startTime) / 1000;
        const radius = age * pulse.speed * scale;

        if (radius > (pulse.maxDistance || 100) * scale) {
          return false;
        }

        // Draw pulse ring
        const fadeStart = ((pulse.maxDistance || 100) * 0.7) * scale;
        let opacity = pulse.intensity;
        
        if (radius > fadeStart) {
          const fadeProgress = (radius - fadeStart) / (((pulse.maxDistance || 100) * scale) - fadeStart);
          opacity = pulse.intensity * (1 - fadeProgress);
        }

        // Main pulse ring
        ctx.strokeStyle = `rgba(0, 255, 255, ${opacity})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner glow
        ctx.strokeStyle = `rgba(0, 255, 255, ${opacity * 0.3})`;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Scan lines effect (rotating)
        const scanAngle = age * 2;
        const gradient = ctx.createLinearGradient(
          centerX, centerY,
          centerX + Math.cos(scanAngle) * radius,
          centerY + Math.sin(scanAngle) * radius
        );
        gradient.addColorStop(0, `rgba(0, 255, 255, ${opacity * 0.5})`);
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(scanAngle) * radius,
          centerY + Math.sin(scanAngle) * radius
        );
        ctx.stroke();

        return true;
      });

      // Draw frequency visualization
      if (audioAnalysis && audioAnalysis.frequencyData.length > 0) {
        const barCount = Math.min(32, audioAnalysis.frequencyData.length);
        const angleStep = (Math.PI * 2) / barCount;
        const innerRadius = 5 * scale;

        for (let i = 0; i < barCount; i++) {
          const value = audioAnalysis.frequencyData[Math.floor(i * audioAnalysis.frequencyData.length / barCount)];
          const barHeight = (value / 255) * 30 * scale;
          const angle = i * angleStep;

          const x1 = centerX + Math.cos(angle) * innerRadius;
          const y1 = centerY + Math.sin(angle) * innerRadius;
          const x2 = centerX + Math.cos(angle) * (innerRadius + barHeight);
          const y2 = centerY + Math.sin(angle) * (innerRadius + barHeight);

          const alpha = (value / 255) * pulseIntensity;
          ctx.strokeStyle = `rgba(0, 255, 255, ${alpha})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }

      // Draw center indicator
      ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
      ctx.fill();

      // Pulsing center glow
      const glowRadius = 8 + Math.sin(now / 200) * 3;
      const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowRadius);
      glowGradient.addColorStop(0, 'rgba(0, 255, 255, 0.4)');
      glowGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioAnalysis, gridOpacity, pulseIntensity]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="canvas-sonar"
      className="w-full h-full"
      style={{ display: 'block' }}
    />
  );
}
