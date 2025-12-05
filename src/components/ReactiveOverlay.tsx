import { useEffect, useState } from 'react';

interface ReactiveOverlayProps {
  onInteraction: () => void;
  interactionFrequency: number;
  motionIntensity: number;
  onMotionChange: (intensity: number) => void;
}

export const ReactiveOverlay = ({ 
  onInteraction, 
  interactionFrequency,
  motionIntensity,
  onMotionChange 
}: ReactiveOverlayProps) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [pulses, setPulses] = useState<Array<{ id: number; x: number; y: number }>>([]);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      
      // Update motion intensity based on movement speed
      const movement = Math.hypot(e.movementX, e.movementY);
      onMotionChange(Math.min(10, motionIntensity + movement * 0.01));
    };
    
    const handleClick = (e: MouseEvent) => {
      onInteraction();
      
      // Create pulse effect
      const newPulse = { id: Date.now(), x: e.clientX, y: e.clientY };
      setPulses(prev => [...prev, newPulse]);
      
      setTimeout(() => {
        setPulses(prev => prev.filter(p => p.id !== newPulse.id));
      }, 2000);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
    };
  }, [onInteraction, motionIntensity, onMotionChange]);
  
  // Decay motion intensity over time
  useEffect(() => {
    const interval = setInterval(() => {
      onMotionChange(Math.max(0, motionIntensity - 0.1));
    }, 100);
    
    return () => clearInterval(interval);
  }, [motionIntensity, onMotionChange]);
  
  const overlayOpacity = 0.15 + (interactionFrequency * 0.08); // Increased from 0.1 and 0.05 for more visible overlay
  
  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Reactive gradient following cursor */}
      <div 
        className="absolute w-[600px] h-[600px] rounded-full blur-3xl transition-all duration-300"
        style={{
          left: mousePosition.x - 300,
          top: mousePosition.y - 300,
          background: `radial-gradient(circle, 
            hsl(var(--aurora-pink) / ${overlayOpacity}),
            hsl(var(--aurora-purple) / ${overlayOpacity * 0.7}) 50%,
            transparent 70%)`,
        }}
      />
      
      {/* Click pulse effects */}
      {pulses.map(pulse => (
        <div
          key={pulse.id}
          className="absolute w-32 h-32 rounded-full animate-dissolve"
          style={{
            left: pulse.x - 64,
            top: pulse.y - 64,
            background: 'radial-gradient(circle, hsl(var(--aurora-cyan) / 0.6), transparent 70%)',
            boxShadow: '0 0 60px hsl(var(--aurora-cyan) / 0.8)',
          }}
        />
      ))}
      
      {/* Custom cursor */}
      <div
        className="absolute w-4 h-4 rounded-full transition-transform duration-150"
        style={{
          left: mousePosition.x - 8,
          top: mousePosition.y - 8,
          background: 'hsl(var(--foreground))',
          boxShadow: '0 0 20px hsl(var(--aurora-cyan) / 0.8)',
          transform: interactionFrequency > 0 ? 'scale(1.5)' : 'scale(1)',
        }}
      />
    </div>
  );
};
