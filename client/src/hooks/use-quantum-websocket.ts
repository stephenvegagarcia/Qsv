import { useEffect, useRef, useState, useCallback } from 'react';
import type { AudioAnalysis, QuantumResult, Settings, WSMessage } from '@shared/schema';

interface UseQuantumWebSocketReturn {
  isConnected: boolean;
  sendAudioData: (audioData: AudioAnalysis) => void;
  sendSettings: (settings: Partial<Settings>) => void;
  quantumResult: QuantumResult | null;
  error: string | null;
}

export function useQuantumWebSocket(): UseQuantumWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [quantumResult, setQuantumResult] = useState<QuantumResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Quantum WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          
          if (message.type === 'quantum_result') {
            setQuantumResult(message.payload);
          } else if (message.type === 'detection') {
            // Could handle detection events here if needed
            console.log('Detection received:', message.payload);
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
      };

      ws.onclose = () => {
        console.log('Quantum WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;

        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setError('Failed to establish connection');
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendAudioData = useCallback((audioData: AudioAnalysis) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message: WSMessage = {
        type: 'audio_data',
        payload: audioData,
      };
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const sendSettings = useCallback((settings: Partial<Settings>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message: WSMessage = {
        type: 'settings_update',
        payload: settings,
      };
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  return {
    isConnected,
    sendAudioData,
    sendSettings,
    quantumResult,
    error,
  };
}
