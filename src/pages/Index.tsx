import { useState, useCallback, useRef, useEffect } from 'react';
import { AmbientField } from '@/components/AmbientField';
import { ReactiveOverlay } from '@/components/ReactiveOverlay';
import { SemanticLayer } from '@/components/SemanticLayer';
import { StateManager } from '@/components/StateManager';
import { AudioVisualizer, mapFrequencyToHue, mapAmplitudeToIntensity } from '@/lib/audioVisualization';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ContextState = 'intro' | 'active' | 'immersive' | 'reflection';

const Index = () => {
  const { toast } = useToast();
  const [interactionFrequency, setInteractionFrequency] = useState(0);
  const [motionIntensity, setMotionIntensity] = useState(0);
  const [contextState, setContextState] = useState<ContextState>('intro');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioHue, setAudioHue] = useState(0);
  const [audioAmplitude, setAudioAmplitude] = useState(0);
  const visualizerRef = useRef<AudioVisualizer | null>(null);
  
  const handleInteraction = useCallback(() => {
    setInteractionFrequency(prev => Math.min(10, prev + 1));
    
    // Decay interaction frequency over time
    setTimeout(() => {
      setInteractionFrequency(prev => Math.max(0, prev - 0.5));
    }, 2000);
  }, []);
  
  const handleMotionChange = useCallback((intensity: number) => {
    setMotionIntensity(intensity);
  }, []);
  
  const handleStateChange = useCallback((newState: ContextState) => {
    setContextState(newState);
  }, []);
  
  const toggleAudioVisualization = useCallback(async () => {
    if (!audioEnabled) {
      try {
        const visualizer = new AudioVisualizer((amplitude, frequency) => {
          // Map amplitude to motion intensity
          const intensity = mapAmplitudeToIntensity(amplitude);
          setMotionIntensity(prev => Math.min(10, prev + intensity * 0.5));
          
          // Map frequency to color hue
          const hue = mapFrequencyToHue(frequency);
          setAudioHue(hue);
          
          // Store amplitude for brightness
          setAudioAmplitude(amplitude);
          
          // Increase interaction frequency based on audio level
          if (amplitude > 0.1) {
            setInteractionFrequency(prev => Math.min(10, prev + amplitude * 2));
          }
        });
        
        await visualizer.start();
        visualizerRef.current = visualizer;
        setAudioEnabled(true);
        
        toast({
          title: "Audio Visualization Active",
          description: "Ambient sound is now influencing the visual experience",
        });
      } catch (error) {
        toast({
          title: "Microphone Access Denied",
          description: "Please allow microphone access to enable audio visualization",
          variant: "destructive",
        });
      }
    } else {
      visualizerRef.current?.stop();
      visualizerRef.current = null;
      setAudioEnabled(false);
      setAudioHue(0);
      setAudioAmplitude(0);
      
      toast({
        title: "Audio Visualization Disabled",
        description: "Visual experience is no longer affected by ambient sound",
      });
    }
  }, [audioEnabled, toast]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      visualizerRef.current?.stop();
    };
  }, []);
  
  return (
    <main className="relative w-screen h-screen overflow-hidden">
      {/* Layer 1: Ambient Field */}
      <AmbientField 
        motionIntensity={motionIntensity} 
        audioHue={audioHue}
        audioAmplitude={audioAmplitude}
      />
      
      {/* Layer 2: Reactive Overlay */}
      <ReactiveOverlay 
        onInteraction={handleInteraction}
        interactionFrequency={interactionFrequency}
        motionIntensity={motionIntensity}
        onMotionChange={handleMotionChange}
      />
      
      {/* Layer 3: Semantic Layer */}
      {contextState !== 'intro' && contextState !== 'reflection' && (
        <SemanticLayer 
          interactionFrequency={interactionFrequency}
          onHover={handleInteraction}
        />
      )}
      
      {/* State Management & Overlays */}
      <StateManager 
        interactionFrequency={interactionFrequency}
        contextState={contextState}
        onStateChange={handleStateChange}
      />
      
      {/* Audio Visualization Toggle */}
      {contextState !== 'intro' && (
        <div className="fixed bottom-8 right-8 z-50">
          <Button
            onClick={toggleAudioVisualization}
            variant={audioEnabled ? "default" : "outline"}
            size="icon"
            className="w-14 h-14 rounded-full shadow-lg transition-all duration-300"
            style={{
              background: audioEnabled ? 'hsl(var(--aurora-cyan) / 0.3)' : 'hsl(var(--background) / 0.8)',
              backdropFilter: 'blur(10px)',
              border: audioEnabled ? '2px solid hsl(var(--aurora-cyan))' : '1px solid hsl(var(--border))',
            }}
          >
            {audioEnabled ? (
              <Mic className="w-6 h-6" style={{ color: 'hsl(var(--aurora-cyan))' }} />
            ) : (
              <MicOff className="w-6 h-6" />
            )}
          </Button>
        </div>
      )}
    </main>
  );
};

export default Index;
