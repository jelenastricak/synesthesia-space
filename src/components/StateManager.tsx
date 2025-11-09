import { useEffect, useState } from 'react';

type ContextState = 'intro' | 'active' | 'immersive' | 'reflection';

interface StateManagerProps {
  interactionFrequency: number;
  contextState: ContextState;
  onStateChange: (state: ContextState) => void;
}

export const StateManager = ({ 
  interactionFrequency, 
  contextState,
  onStateChange 
}: StateManagerProps) => {
  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());
  const [introComplete, setIntroComplete] = useState(false);
  
  // Handle intro state
  useEffect(() => {
    if (contextState === 'intro') {
      const timer = setTimeout(() => {
        setIntroComplete(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [contextState]);
  
  // Track interaction frequency changes
  useEffect(() => {
    if (interactionFrequency > 0) {
      setLastInteractionTime(Date.now());
    }
  }, [interactionFrequency]);
  
  // State transitions based on interaction
  useEffect(() => {
    const checkState = () => {
      const timeSinceInteraction = Date.now() - lastInteractionTime;
      
      // Transition to reflection after 60s of no interaction
      if (timeSinceInteraction > 60000 && contextState !== 'reflection' && contextState !== 'intro') {
        onStateChange('reflection');
        return;
      }
      
      // Active state transitions
      if (introComplete && interactionFrequency === 0 && contextState === 'intro') {
        onStateChange('active');
      } else if (interactionFrequency > 0 && interactionFrequency <= 5 && contextState !== 'active') {
        onStateChange('active');
      } else if (interactionFrequency > 5 && contextState !== 'immersive') {
        onStateChange('immersive');
      }
    };
    
    const interval = setInterval(checkState, 1000);
    return () => clearInterval(interval);
  }, [interactionFrequency, lastInteractionTime, contextState, introComplete, onStateChange]);
  
  return (
    <>
      {/* Intro overlay */}
      {contextState === 'intro' && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none animate-fadeInBlur">
          <div className="text-center space-y-8">
            <h1 
              className="text-6xl font-extralight tracking-widest"
              style={{
                color: 'hsl(var(--foreground))',
                textShadow: '0 0 40px hsl(var(--aurora-purple) / 0.6)',
              }}
            >
              synesthesia.space
            </h1>
            <p 
              className="text-xl font-light tracking-wide opacity-70"
              style={{
                color: 'hsl(var(--muted-foreground))',
              }}
            >
              Move slowly. Listen to the colors.
            </p>
          </div>
        </div>
      )}
      
      {/* Reflection state overlay */}
      {contextState === 'reflection' && (
        <div className="fixed inset-0 flex items-center justify-center animate-fadeInBlur">
          <div 
            className="text-center space-y-6 cursor-pointer pointer-events-auto"
            onClick={() => {
              onStateChange('intro');
              window.location.reload();
            }}
          >
            <p 
              className="text-3xl font-extralight tracking-widest"
              style={{
                color: 'hsl(var(--foreground))',
                textShadow: '0 0 30px hsl(var(--aurora-teal) / 0.6)',
              }}
            >
              breathe
            </p>
            <p 
              className="text-sm font-light tracking-wide opacity-50"
              style={{
                color: 'hsl(var(--muted-foreground))',
              }}
            >
              click to begin again
            </p>
          </div>
        </div>
      )}
    </>
  );
};
