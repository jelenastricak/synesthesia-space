import { useEffect, useState, useRef } from 'react';

interface SpectrumVisualizerProps {
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  audioHue: number;
}

export const SpectrumVisualizer = ({ audioContext, analyser, audioHue }: SpectrumVisualizerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null);

  useEffect(() => {
    if (!analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    setFrequencyData(dataArray);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser]);

  useEffect(() => {
    if (!canvasRef.current || !analyser || !frequencyData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const numBars = 32; // Number of frequency bars to display
    const barWidth = rect.width / numBars;
    const barGap = 2;

    const draw = () => {
      // @ts-expect-error - Web Audio API type mismatch
      analyser.getByteFrequencyData(frequencyData);

      // Clear canvas
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Sample frequency data (take every nth element for visualization)
      const step = Math.floor(frequencyData.length / numBars);

      for (let i = 0; i < numBars; i++) {
        const dataIndex = i * step;
        const value = frequencyData[dataIndex];
        const normalizedValue = value / 255;
        
        // Bar height (inverted so it grows upward)
        const barHeight = normalizedValue * rect.height * 0.9;
        
        // Position
        const x = i * barWidth;
        const y = rect.height - barHeight;
        
        // Create gradient for each bar with aurora colors
        const gradient = ctx.createLinearGradient(x, y, x, rect.height);
        
        // Use audio hue with aurora color variations
        const hue = (audioHue + i * 3) % 360; // Vary hue across bars
        const saturation = 70 + normalizedValue * 30;
        const lightness = 50 + normalizedValue * 20;
        
        gradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.9)`);
        gradient.addColorStop(0.5, `hsla(${hue}, ${saturation}%, ${lightness - 10}%, 0.7)`);
        gradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${lightness - 20}%, 0.5)`);
        
        // Draw bar
        ctx.fillStyle = gradient;
        ctx.fillRect(x + barGap / 2, y, barWidth - barGap, barHeight);
        
        // Add glow effect for active bars
        if (normalizedValue > 0.3) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.8)`;
          ctx.fillRect(x + barGap / 2, y, barWidth - barGap, barHeight);
          ctx.shadowBlur = 0;
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, frequencyData, audioHue]);

  return (
    <div className="fixed bottom-8 left-8 z-40 animate-fadeInBlur">
      <div 
        className="rounded-lg p-4 backdrop-blur-md transition-all duration-300"
        style={{
          background: 'hsl(var(--background) / 0.3)',
          border: '1px solid hsl(var(--border) / 0.3)',
          boxShadow: '0 8px 32px hsl(var(--aurora-purple) / 0.2)',
        }}
      >
        <div className="mb-2 text-xs font-light tracking-widest opacity-70" style={{ color: 'hsl(var(--foreground))' }}>
          SPECTRUM
        </div>
        <canvas
          ref={canvasRef}
          className="rounded"
          style={{
            width: '280px',
            height: '120px',
          }}
        />
      </div>
    </div>
  );
};
