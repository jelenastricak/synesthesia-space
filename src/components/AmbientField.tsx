import { useEffect, useState } from 'react';

interface AmbientFieldProps {
  motionIntensity: number;
  audioHue?: number;
  audioAmplitude?: number;
}

export const AmbientField = ({ motionIntensity, audioHue = 0, audioAmplitude = 0 }: AmbientFieldProps) => {
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
  
  // Audio-reactive brightness and color shift - more dramatic
  const audioBrightness = 0.5 + (audioAmplitude * 0.8); // Increased from 0.4 to 0.8 for more dramatic effect
  const audioColorFilter = audioHue > 0 ? `hue-rotate(${audioHue}deg) saturate(${1 + audioAmplitude * 0.5})` : 'none';
  
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Base aurora gradient layer */}
      <div 
        className="absolute inset-0 animate-breathe transition-all duration-300"
        style={{
          background: `radial-gradient(circle at ${gradientPosition.x}% ${gradientPosition.y}%, 
            hsl(var(--aurora-teal) / 0.4), 
            hsl(var(--aurora-purple) / 0.3) 40%, 
            hsl(var(--aurora-pink) / 0.2) 70%,
            transparent 100%)`,
          animationDuration: `${animationSpeed}s`,
          opacity: audioBrightness,
          filter: audioColorFilter,
        }}
      />
      
      {/* Secondary gradient layer */}
      <div 
        className="absolute inset-0 animate-breathe transition-all duration-300"
        style={{
          background: `radial-gradient(circle at ${100 - gradientPosition.x}% ${100 - gradientPosition.y}%, 
            hsl(var(--aurora-blue) / 0.3), 
            hsl(var(--aurora-cyan) / 0.25) 50%, 
            transparent 90%)`,
          animationDuration: `${animationSpeed + 2}s`,
          animationDelay: '1s',
          opacity: audioBrightness * 0.8,
          filter: audioColorFilter,
        }}
      />
      
      {/* Floating orbs */}
      <div 
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl animate-float"
        style={{
          background: 'hsl(var(--aurora-purple) / 0.2)',
          animationDelay: '0s',
        }}
      />
      <div 
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl animate-float"
        style={{
          background: 'hsl(var(--aurora-teal) / 0.2)',
          animationDelay: '2s',
        }}
      />
    </div>
  );
};
