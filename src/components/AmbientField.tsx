import { useEffect, useState } from 'react';

interface AmbientFieldProps {
  motionIntensity: number;
  audioHue?: number;
  audioAmplitude?: number;
  audioEnabled?: boolean;
}

export const AmbientField = ({ motionIntensity, audioHue = 0, audioAmplitude = 0, audioEnabled = false }: AmbientFieldProps) => {
  const [gradientPosition, setGradientPosition] = useState({ x: 50, y: 50 });
  
  useEffect(() => {
    const interval = setInterval(() => {
      // Subtle autonomous movement
      setGradientPosition(prev => ({
        x: 50 + Math.sin(Date.now() / 3000) * 20,
        y: 50 + Math.cos(Date.now() / 4000) * 20,
      }));
    }, 50);
    
    return () => clearInterval(interval);
  }, []);
  
  const animationSpeed = 8 - (motionIntensity * 0.5);
  
  // LISTENING MODE: Dramatic visual changes when microphone is active
  const listeningModeActive = audioEnabled;
  const baseOpacity = listeningModeActive ? 0.9 : 0.6;
  const baseSaturation = listeningModeActive ? 1.5 : 1;
  const baseContrast = listeningModeActive ? 1.3 : 1;
  const glowIntensity = listeningModeActive ? 'drop-shadow(0 0 40px hsl(var(--aurora-cyan) / 0.6))' : 'none';

  // Audio-reactive tuning
  const reactiveSaturation = baseSaturation + (listeningModeActive ? audioAmplitude * 0.6 : 0);
  const reactiveContrast = baseContrast + (listeningModeActive ? audioAmplitude * 0.4 : 0);
  const reactiveHue = ((audioHue % 360) + 360) % 360;
  const reactiveHue2 = (reactiveHue + 40) % 360;
  const hueRotate = listeningModeActive ? (reactiveHue - 180) : 0;
  const orbScale = 1 + (listeningModeActive ? audioAmplitude * 0.4 : 0);
  const speedFactor = listeningModeActive ? Math.max(0.4, 1 - audioAmplitude * 0.6) : 1;
  
  return (
    <div 
      className="fixed inset-0 overflow-hidden pointer-events-none transition-all duration-1000"
      style={{
        filter: `saturate(${reactiveSaturation}) contrast(${reactiveContrast}) ${glowIntensity} hue-rotate(${hueRotate}deg)`,
      }}
    >
      {/* Base aurora gradient layer - LISTENING MODE COLORS */}
      <div 
        className="absolute inset-0 animate-breathe transition-all duration-1000"
        style={{
          background: listeningModeActive 
            ? `radial-gradient(circle at ${gradientPosition.x}% ${gradientPosition.y}%, 
                hsla(${reactiveHue}, 85%, 60%, ${0.5 + audioAmplitude * 0.3}), 
                hsl(var(--aurora-cyan) / 0.7) 20%, 
                hsl(var(--aurora-blue) / 0.6) 40%, 
                hsl(var(--aurora-purple) / 0.5) 65%,
                hsl(var(--aurora-pink) / 0.3) 85%,
                transparent 100%)`
            : `radial-gradient(circle at ${gradientPosition.x}% ${gradientPosition.y}%, 
                hsl(var(--aurora-teal) / 0.4), 
                hsl(var(--aurora-purple) / 0.3) 40%, 
                hsl(var(--aurora-pink) / 0.2) 70%,
                transparent 100%)`,
          animationDuration: `${animationSpeed * speedFactor}s`,
          opacity: baseOpacity,
        }}
      />
      
      {/* Secondary gradient layer - LISTENING MODE COLORS */}
      <div 
        className="absolute inset-0 animate-breathe transition-all duration-1000"
        style={{
          background: listeningModeActive
            ? `radial-gradient(circle at ${100 - gradientPosition.x}% ${100 - gradientPosition.y}%, 
                hsla(${reactiveHue2}, 80%, 65%, ${0.45 + audioAmplitude * 0.25}), 
                hsl(var(--aurora-purple) / 0.5) 40%,
                hsl(var(--aurora-teal) / 0.4) 70%, 
                transparent 90%)`
            : `radial-gradient(circle at ${100 - gradientPosition.x}% ${100 - gradientPosition.y}%, 
                hsl(var(--aurora-blue) / 0.3), 
                hsl(var(--aurora-cyan) / 0.25) 50%, 
                transparent 90%)`,
          animationDuration: `${animationSpeed * Math.max(0.8, speedFactor)}s`,
          animationDelay: '1s',
          opacity: baseOpacity * 0.85,
        }}
      />
      
      {/* Floating orbs - MORE VIBRANT IN LISTENING MODE */}
      <div 
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-float transition-all duration-1000"
        style={{
          background: listeningModeActive 
            ? `hsla(${reactiveHue}, 80%, 60%, ${0.4 + audioAmplitude * 0.4})` 
            : 'hsl(var(--aurora-purple) / 0.2)',
          animationDelay: '0s',
          opacity: listeningModeActive ? 0.8 : 0.5,
          transform: `scale(${orbScale})`,
        }}
      />
      <div 
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl animate-float transition-all duration-1000"
        style={{
          background: listeningModeActive 
            ? `hsla(${reactiveHue2}, 80%, 65%, ${0.4 + audioAmplitude * 0.4})` 
            : 'hsl(var(--aurora-teal) / 0.2)',
          animationDelay: '2s',
          opacity: listeningModeActive ? 0.8 : 0.5,
          transform: `scale(${orbScale})`,
        }}
      />
      
      {/* Additional orb only visible in listening mode */}
      {listeningModeActive && (
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl animate-pulse"
          style={{
            background: `radial-gradient(circle, hsla(${reactiveHue2}, 85%, 65%, ${0.25 + audioAmplitude * 0.35}), transparent 70%)`,
            animationDuration: `${Math.max(1.2, 3 - audioAmplitude * 1.5)}s`,
          }}
        />
      )}
    </div>
  );
};
