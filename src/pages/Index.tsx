import { useState, useCallback } from 'react';
import { AmbientField } from '@/components/AmbientField';
import { ReactiveOverlay } from '@/components/ReactiveOverlay';
import { SemanticLayer } from '@/components/SemanticLayer';
import { StateManager } from '@/components/StateManager';

type ContextState = 'intro' | 'active' | 'immersive' | 'reflection';

const Index = () => {
  const [interactionFrequency, setInteractionFrequency] = useState(0);
  const [motionIntensity, setMotionIntensity] = useState(0);
  const [contextState, setContextState] = useState<ContextState>('intro');
  
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
  
  return (
    <main className="relative w-screen h-screen overflow-hidden">
      {/* Layer 1: Ambient Field */}
      <AmbientField motionIntensity={motionIntensity} />
      
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
    </main>
  );
};

export default Index;
