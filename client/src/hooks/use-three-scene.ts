import { useEffect, useRef, useState } from 'react';

interface ThreeSceneConfig {
  antialias?: boolean;
  alpha?: boolean;
}

export function useThreeScene(config: ThreeSceneConfig = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const sceneRef = useRef<any>(null);
  const rendererRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    // Dynamically import three.js only on client side
    const initScene = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      try {
        const THREE = await import('three');
        
        // Setup scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0a0f14);
        scene.fog = new THREE.FogExp2(0x0a0f14, 0.015);

        // Setup camera
        const camera = new THREE.PerspectiveCamera(
          60,
          canvas.clientWidth / canvas.clientHeight,
          0.1,
          1000
        );
        camera.position.set(0, 5, 10);
        camera.lookAt(0, 0, 0);

        // Setup renderer
        const renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: config.antialias !== false,
          alpha: config.alpha || false,
        });
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        sceneRef.current = { THREE, scene, camera, renderer };
        rendererRef.current = renderer;
        cameraRef.current = camera;
        
        setIsReady(true);

        // Handle resize
        const handleResize = () => {
          if (!canvas) return;
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
        };
      } catch (error) {
        console.error('Failed to initialize Three.js scene:', error);
      }
    };

    initScene();
  }, [config.antialias, config.alpha]);

  return {
    canvasRef,
    isReady,
    scene: sceneRef.current,
  };
}
