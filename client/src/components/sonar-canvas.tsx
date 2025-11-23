import { useEffect, useRef, useState } from 'react';
import type { AudioAnalysis, Pulse } from '@shared/schema';

interface SonarCanvasProps {
  audioAnalysis: AudioAnalysis | null;
  onPulseCreate?: (pulse: Pulse) => void;
  maxPulseDistance?: number;
  gridOpacity?: number;
  pulseIntensity?: number;
}

export function SonarCanvas({ 
  audioAnalysis,
  onPulseCreate,
  maxPulseDistance = 100,
  gridOpacity = 0.2,
  pulseIntensity = 0.8 
}: SonarCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<any>(null);
  const pulsesRef = useRef<Array<Pulse & { mesh?: any }>>([]);
  const lastBeatTimeRef = useRef(0);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const initScene = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const THREE = await import('three');
      const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0f14);
      scene.fog = new THREE.FogExp2(0x0a0f14, 0.01);

      const camera = new THREE.PerspectiveCamera(
        60,
        canvas.clientWidth / canvas.clientHeight,
        0.1,
        500
      );
      camera.position.set(0, 15, 25);

      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
      });
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const controls = new OrbitControls(camera, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 5;
      controls.maxDistance = 100;

      // Create grid floor
      const gridHelper = new THREE.GridHelper(200, 100, 0x00ffff, 0x003344);
      (gridHelper.material as THREE.Material).transparent = true;
      (gridHelper.material as THREE.Material).opacity = gridOpacity;
      scene.add(gridHelper);

      // Create ambient light
      const ambientLight = new THREE.AmbientLight(0x00ffff, 0.1);
      scene.add(ambientLight);

      // Create point light at camera
      const pointLight = new THREE.PointLight(0x00ffff, 0.5, 50);
      scene.add(pointLight);

      sceneRef.current = { THREE, scene, camera, renderer, controls, pointLight };

      const handleResize = () => {
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        renderer.dispose();
        controls.dispose();
      };
    };

    initScene();
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;

    const { THREE, scene, gridHelper } = sceneRef.current;
    if (gridHelper) {
      (gridHelper.material as THREE.Material).opacity = gridOpacity;
    }
  }, [gridOpacity]);

  useEffect(() => {
    if (!sceneRef.current || !audioAnalysis) return;

    const { THREE, scene, camera } = sceneRef.current;
    const now = Date.now();

    // Create pulse on beat detection
    if (audioAnalysis.isBeat && now - lastBeatTimeRef.current > 250) {
      lastBeatTimeRef.current = now;

      const pulse: Pulse & { mesh?: any } = {
        id: `pulse-${now}`,
        position: { x: camera.position.x, y: 0, z: camera.position.z },
        startTime: now,
        speed: 15,
        intensity: pulseIntensity,
        maxDistance
      };

      // Create ring mesh
      const ringGeometry = new THREE.RingGeometry(0.5, 1, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: pulseIntensity,
        side: THREE.DoubleSide
      });
      const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
      ringMesh.rotation.x = -Math.PI / 2;
      ringMesh.position.set(pulse.position.x, pulse.position.y, pulse.position.z);
      scene.add(ringMesh);

      pulse.mesh = ringMesh;
      pulsesRef.current.push(pulse);

      if (onPulseCreate) {
        onPulseCreate(pulse);
      }
    }
  }, [audioAnalysis, onPulseCreate, maxPulseDistance, pulseIntensity]);

  useEffect(() => {
    if (!sceneRef.current) return;

    const { scene, camera, renderer, controls, pointLight } = sceneRef.current;

    const animate = () => {
      const now = Date.now();

      // Update controls
      controls.update();

      // Update point light position
      pointLight.position.copy(camera.position);

      // Update pulses
      pulsesRef.current = pulsesRef.current.filter(pulse => {
        if (!pulse.mesh) return false;

        const age = (now - pulse.startTime) / 1000;
        const radius = age * pulse.speed;

        if (radius > (pulse.maxDistance || 100)) {
          scene.remove(pulse.mesh);
          pulse.mesh.geometry.dispose();
          pulse.mesh.material.dispose();
          return false;
        }

        // Update ring size and opacity
        const scale = radius / 0.75;
        pulse.mesh.scale.set(scale, scale, 1);
        
        const fadeStart = (pulse.maxDistance || 100) * 0.7;
        if (radius > fadeStart) {
          const fadeProgress = (radius - fadeStart) / ((pulse.maxDistance || 100) - fadeStart);
          pulse.mesh.material.opacity = pulse.intensity * (1 - fadeProgress);
        }

        return true;
      });

      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-testid="canvas-sonar"
      className="w-full h-full"
      style={{ display: 'block' }}
    />
  );
}
