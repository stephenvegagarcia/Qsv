import { Mic, MicOff, Volume2, VolumeX, Loader2, WifiOff, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useVoiceAssistant } from '@/hooks/use-voice-assistant';
import type { Detection, AudioAnalysis, FusedWeather } from '@shared/schema';

interface VoiceAssistantProps {
  detections: Detection[];
  audioAnalysis: AudioAnalysis | null;
  weather: FusedWeather | null;
  detectionRange: number;
  quantumStatus: string;
}

export function VoiceAssistant({
  detections,
  audioAnalysis,
  weather,
  detectionRange,
  quantumStatus,
}: VoiceAssistantProps) {
  const assistant = useVoiceAssistant({
    detections,
    audioAnalysis,
    weather,
    detectionRange,
    quantumStatus,
  });

  const {
    isListening,
    isSpeaking,
    isProcessing,
    transcript,
    response,
    error,
    isConnected,
    toggleListening,
    stopSpeaking,
  } = assistant;

  const isActive = isListening || isProcessing || isSpeaking;

  return (
    <div className="fixed bottom-8 right-24 flex flex-col items-end gap-2 z-10">
      {(transcript || response || error) && (
        <Card 
          className="max-w-xs p-3 bg-card/90 backdrop-blur-sm border-card-border animate-in fade-in slide-in-from-bottom-2"
          data-testid="card-assistant-response"
        >
          {transcript && (
            <div className="mb-2" data-testid="section-transcript">
              <p className="text-xs text-muted-foreground mb-1">You said:</p>
              <p className="text-sm" data-testid="text-transcript">{transcript}</p>
            </div>
          )}
          
          {isProcessing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="status-processing">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Thinking...</span>
            </div>
          )}
          
          {response && !isProcessing && (
            <div data-testid="section-response">
              <p className="text-xs text-muted-foreground mb-1">Assistant:</p>
              <p className="text-sm" data-testid="text-response">{response}</p>
            </div>
          )}
          
          {error && (
            <div className="text-sm text-destructive" data-testid="text-error">
              {error}
            </div>
          )}
        </Card>
      )}

      <div className="flex items-center gap-2">
        {!isConnected && (
          <div 
            className="flex items-center gap-1 text-xs text-muted-foreground bg-card/70 backdrop-blur-sm px-2 py-1 rounded-md border border-card-border"
            data-testid="status-offline"
          >
            <WifiOff className="w-3 h-3" />
            <span>AI Offline</span>
          </div>
        )}

        {isSpeaking && (
          <Button
            size="icon"
            variant="ghost"
            onClick={stopSpeaking}
            className="backdrop-blur-sm bg-card/70 border border-card-border"
            data-testid="button-stop-speaking"
          >
            <VolumeX className="w-5 h-5" />
          </Button>
        )}

        <Button
          size="icon"
          variant={isListening ? "default" : "ghost"}
          onClick={toggleListening}
          disabled={isProcessing}
          className={`backdrop-blur-sm border border-card-border ${
            isListening 
              ? 'bg-primary text-primary-foreground animate-pulse' 
              : 'bg-card/70'
          }`}
          data-testid="button-voice-assistant"
        >
          {isProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isListening ? (
            <Mic className="w-5 h-5" />
          ) : (
            <MessageCircle className="w-5 h-5" />
          )}
        </Button>
      </div>

      {!isActive && !response && !error && (
        <p 
          className="text-xs text-muted-foreground text-right max-w-[150px]"
          data-testid="text-voice-hint"
        >
          Ask about detections
        </p>
      )}
    </div>
  );
}
