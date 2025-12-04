import { useState, useCallback, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { Mic, MicOff, BarChart3, Camera, Image as ImageIcon, Sparkles } from 'lucide-react';

import { AmbientField } from '@/components/AmbientField';
import { ReactiveOverlay } from '@/components/ReactiveOverlay';
import { SemanticLayer } from '@/components/SemanticLayer';
import { StateManager } from '@/components/StateManager';
import { SpectrumVisualizer } from '@/components/SpectrumVisualizer';
import { ScreenshotGallery, saveScreenshot } from '@/components/ScreenshotGallery';
import { HaikuGenerator } from '@/components/HaikuGenerator';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AudioVisualizer, mapFrequencyToHue, mapAmplitudeToIntensity } from '@/lib/audioVisualization';
import { supabase } from '@/integrations/supabase/client';

type ContextState = 'intro' | 'active' | 'immersive' | 'reflection';
type SensitivityMode = 'subtle' | 'balanced' | 'explosive';

const SENSITIVITY_PRESETS = {
  subtle: { threshold: 0.85, cooldown: 8000, label: 'Subtle', description: 'Rare captures' },
  balanced: { threshold: 0.7, cooldown: 5000, label: 'Balanced', description: 'Moderate captures' },
  explosive: { threshold: 0.55, cooldown: 3000, label: 'Explosive', description: 'Frequent captures' },
};

const Index = () => {
  const { toast } = useToast();
  const [interactionFrequency, setInteractionFrequency] = useState(0);
  const [motionIntensity, setMotionIntensity] = useState(0);
  const [contextState, setContextState] = useState<ContextState>('intro');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [audioHue, setAudioHue] = useState(0);
  const [audioAmplitude, setAudioAmplitude] = useState(0);
  const [spectrumVisible, setSpectrumVisible] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [autoCaptureEnabled, setAutoCaptureEnabled] = useState(false);
  const [lastCaptureTime, setLastCaptureTime] = useState(0);
  const [sensitivityMode, setSensitivityMode] = useState<SensitivityMode>('balanced');
  const [haikuOpen, setHaikuOpen] = useState(false);
  const [backgroundHaiku, setBackgroundHaiku] = useState<string | null>(null);
  const [lastHaikuTime, setLastHaikuTime] = useState(0);
  const visualizerRef = useRef<AudioVisualizer | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const peakDetectionRef = useRef({ recentPeaks: [] as number[], threshold: 0.7 });

  // Generate haiku for background display
  const generateBackgroundHaiku = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-haiku', {
        body: {}
      });

      if (!error && data?.haiku) {
        setBackgroundHaiku(data.haiku);
        setLastHaikuTime(Date.now());
      }
    } catch (error) {
      console.error('Background haiku generation error:', error);
    }
  }, []);

  // Periodically generate haikus when audio is active
  useEffect(() => {
    if (!audioEnabled) return;

    // Generate initial haiku after a delay
    const initialTimer = setTimeout(() => {
      generateBackgroundHaiku();
    }, 10000);

    // Generate new haiku every 45-90 seconds
    const interval = setInterval(() => {
      const timeSinceLastHaiku = Date.now() - lastHaikuTime;
      if (timeSinceLastHaiku > 45000) {
        generateBackgroundHaiku();
      }
    }, 30000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [audioEnabled, lastHaikuTime, generateBackgroundHaiku]);
  
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
          // Map amplitude to motion intensity - much more aggressive
          const intensity = mapAmplitudeToIntensity(amplitude);
          setMotionIntensity(prev => Math.min(10, prev + intensity * 1.5)); // Increased from 0.5 to 1.5
          
          // Map frequency to color hue
          const hue = mapFrequencyToHue(frequency);
          setAudioHue(hue);
          
          // Store amplitude for brightness - amplified effect
          setAudioAmplitude(Math.min(1, amplitude * 2)); // Double the amplitude effect
          
          // Increase interaction frequency based on audio level - more sensitive
          if (amplitude > 0.05) { // Lowered threshold from 0.1 to 0.05
            setInteractionFrequency(prev => Math.min(10, prev + amplitude * 4)); // Increased from 2 to 4
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
      setSpectrumVisible(false);
      setAudioHue(0);
      setAudioAmplitude(0);
      
      toast({
        title: "Audio Visualization Disabled",
        description: "Visual experience is no longer affected by ambient sound",
      });
    }
  }, [audioEnabled, toast]);
  
  const captureScreenshot = useCallback(async () => {
    if (!mainRef.current) return;
    
    try {
      // Show flash animation
      setShowFlash(true);
      
      // Wait a brief moment for the flash to be visible
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Capture the screenshot with improved settings for CSS effects
      const canvas = await html2canvas(mainRef.current, {
        backgroundColor: '#000000',
        scale: window.devicePixelRatio || 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        imageTimeout: 0,
        onclone: (clonedDoc) => {
          // Force render blur effects as solid colors in clone
          const blurredElements = clonedDoc.querySelectorAll('[class*="blur"]');
          blurredElements.forEach((el) => {
            if (el instanceof HTMLElement) {
              el.style.filter = 'none';
              el.style.backdropFilter = 'none';
            }
          });
        },
      });
      
      // Convert to data URL and save to gallery
      const dataUrl = canvas.toDataURL('image/png');
      const saved = saveScreenshot(dataUrl);
      
      if (saved) {
        toast({
          title: "Screenshot Captured",
          description: "Saved to gallery and downloaded",
        });
        
        // Also download the image
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        link.download = `aurora-capture-${timestamp}.png`;
        link.href = dataUrl;
        link.click();
      } else {
        toast({
          title: "Screenshot Saved",
          description: "Downloaded but couldn't save to gallery (storage full)",
          variant: "destructive",
        });
        
        // Still download even if gallery save fails
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        link.download = `aurora-capture-${timestamp}.png`;
        link.href = dataUrl;
        link.click();
      }
      
      // Hide flash after a brief moment
      setTimeout(() => setShowFlash(false), 300);
    } catch (error) {
      console.error('Screenshot failed:', error);
      setShowFlash(false);
      toast({
        title: "Screenshot Failed",
        description: "Unable to capture the visualization",
        variant: "destructive",
      });
    }
  }, [toast]);
  
  // Auto-capture detection based on peaks
  useEffect(() => {
    if (!autoCaptureEnabled || !audioEnabled) return;

    const preset = SENSITIVITY_PRESETS[sensitivityMode];
    
    const detectPeak = () => {
      // Calculate composite intensity score (0-1)
      const audioScore = audioAmplitude; // 0-1
      const motionScore = Math.min(1, motionIntensity / 10); // normalize to 0-1
      const interactionScore = Math.min(1, interactionFrequency / 10); // normalize to 0-1
      
      // Weighted composite score (audio has most weight)
      const compositeScore = (audioScore * 0.5) + (motionScore * 0.3) + (interactionScore * 0.2);
      
      // Track recent peaks for adaptive threshold
      const peaks = peakDetectionRef.current.recentPeaks;
      peaks.push(compositeScore);
      if (peaks.length > 50) peaks.shift(); // Keep last 50 samples
      
      // Calculate dynamic threshold based on preset
      const avgPeak = peaks.reduce((a, b) => a + b, 0) / peaks.length;
      const dynamicThreshold = Math.max(preset.threshold - 0.1, Math.min(preset.threshold + 0.1, avgPeak + 0.1));
      
      // Check cooldown period based on preset
      const now = Date.now();
      const timeSinceLastCapture = now - lastCaptureTime;
      
      // Detect peak: high composite score, above threshold, and cooldown expired
      const isPeak = compositeScore > dynamicThreshold && timeSinceLastCapture > preset.cooldown;
      
      // Adjust significance threshold based on sensitivity
      const significanceThreshold = sensitivityMode === 'explosive' ? 0.5 : sensitivityMode === 'subtle' ? 0.8 : 0.7;
      const isSignificantMoment = audioAmplitude > significanceThreshold || (motionIntensity > (10 - significanceThreshold * 5) && interactionFrequency > (10 - significanceThreshold * 5));
      
      if (isPeak && isSignificantMoment) {
        console.log('Peak detected!', { 
          compositeScore: compositeScore.toFixed(2), 
          threshold: dynamicThreshold.toFixed(2),
          audio: audioAmplitude.toFixed(2),
          motion: motionIntensity.toFixed(2),
        });
        
        setLastCaptureTime(now);
        captureScreenshot();
        
        toast({
          title: "Auto-Captured",
          description: "Peak visual moment detected and captured",
          duration: 2000,
        });
      }
    };

    // Check for peaks every 500ms
    const interval = setInterval(detectPeak, 500);
    return () => clearInterval(interval);
  }, [autoCaptureEnabled, audioEnabled, audioAmplitude, motionIntensity, interactionFrequency, lastCaptureTime, captureScreenshot, toast, sensitivityMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      visualizerRef.current?.stop();
    };
  }, []);
  
  return (
    <main ref={mainRef} className="relative w-screen h-screen overflow-hidden">
      {/* Layer 1: Ambient Field */}
      <AmbientField 
        motionIntensity={motionIntensity} 
        audioHue={audioHue}
        audioAmplitude={audioAmplitude}
        audioEnabled={audioEnabled}
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
          displayHaiku={backgroundHaiku}
        />
      )}
      
      {/* State Management & Overlays */}
      <StateManager 
        interactionFrequency={interactionFrequency}
        contextState={contextState}
        onStateChange={handleStateChange}
      />
      
      {/* Flash overlay for screenshot */}
      {showFlash && (
        <div 
          className="fixed inset-0 z-[100] pointer-events-none animate-flash"
          style={{ background: 'white' }}
        />
      )}
      
      {/* Screenshot Gallery */}
      <ScreenshotGallery isOpen={galleryOpen} onClose={() => setGalleryOpen(false)} />
      
      {/* Haiku Generator */}
      <HaikuGenerator isVisible={haikuOpen} onClose={() => setHaikuOpen(false)} />
      
      {/* Audio Visualization Toggle */}
      {contextState !== 'intro' && (
        <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3">
          <Button
            onClick={() => setHaikuOpen(true)}
            variant="outline"
            size="icon"
            className="w-14 h-14 rounded-full shadow-lg transition-all duration-300"
            style={{
              background: 'hsl(var(--background) / 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid hsl(var(--border))',
            }}
          >
            <Sparkles className="w-6 h-6" style={{ color: 'hsl(var(--aurora-pink))' }} />
          </Button>
          
          <Button
            onClick={() => setGalleryOpen(true)}
            variant="outline"
            size="icon"
            className="w-14 h-14 rounded-full shadow-lg transition-all duration-300"
            style={{
              background: 'hsl(var(--background) / 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid hsl(var(--border))',
            }}
          >
            <ImageIcon className="w-6 h-6" />
          </Button>
          
          {audioEnabled && (
            <div className="relative">
              {autoCaptureEnabled && (
                <div 
                  className="absolute inset-0 rounded-full animate-pulse"
                  style={{
                    background: 'hsl(var(--aurora-pink) / 0.2)',
                    border: '2px solid hsl(var(--aurora-pink) / 0.4)',
                    animation: 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  }}
                />
              )}
              <Button
                onClick={() => {
                  setAutoCaptureEnabled(!autoCaptureEnabled);
                  toast({
                    title: autoCaptureEnabled ? "Auto-Capture Disabled" : "Auto-Capture Enabled",
                    description: autoCaptureEnabled 
                      ? "Manual capture only" 
                      : "Will capture peak visual moments automatically",
                  });
                }}
                variant={autoCaptureEnabled ? "default" : "outline"}
                size="icon"
                className="w-14 h-14 rounded-full shadow-lg transition-all duration-300 animate-fadeInBlur"
                style={{
                  background: autoCaptureEnabled ? 'hsl(var(--aurora-pink) / 0.3)' : 'hsl(var(--background) / 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: autoCaptureEnabled ? '2px solid hsl(var(--aurora-pink))' : '1px solid hsl(var(--border))',
                }}
              >
                <Camera 
                  className="w-6 h-6" 
                  style={{ 
                    color: autoCaptureEnabled ? 'hsl(var(--aurora-pink))' : 'hsl(var(--foreground))',
                  }} 
                />
              </Button>
            </div>
          )}
          
          {!audioEnabled && (
            <Button
              onClick={captureScreenshot}
              variant="outline"
              size="icon"
              className="w-14 h-14 rounded-full shadow-lg transition-all duration-300"
              style={{
                background: 'hsl(var(--background) / 0.8)',
                backdropFilter: 'blur(10px)',
                border: '1px solid hsl(var(--border))',
              }}
            >
              <Camera className="w-6 h-6" />
            </Button>
          )}
          
          {autoCaptureEnabled && (
            <div className="flex flex-col items-center gap-1 animate-fade-in">
              <span 
                className="text-xs uppercase tracking-wider text-center"
                style={{ 
                  color: 'hsl(var(--aurora-pink))',
                  opacity: 0.7,
                  textShadow: '0 0 10px hsl(var(--aurora-pink) / 0.5)'
                }}
              >
                Auto
              </span>
              <button
                onClick={() => {
                  const modes: SensitivityMode[] = ['subtle', 'balanced', 'explosive'];
                  const currentIndex = modes.indexOf(sensitivityMode);
                  const nextMode = modes[(currentIndex + 1) % modes.length];
                  setSensitivityMode(nextMode);
                  toast({
                    title: `${SENSITIVITY_PRESETS[nextMode].label} Mode`,
                    description: SENSITIVITY_PRESETS[nextMode].description,
                    duration: 2000,
                  });
                }}
                className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full transition-all hover:scale-105"
                style={{ 
                  color: 'hsl(var(--aurora-pink))',
                  background: 'hsl(var(--aurora-pink) / 0.1)',
                  border: '1px solid hsl(var(--aurora-pink) / 0.3)',
                }}
              >
                {SENSITIVITY_PRESETS[sensitivityMode].label}
              </button>
            </div>
          )}
          
          <div className="relative">
            {audioEnabled && (
              <div 
                className="absolute inset-0 rounded-full animate-pulse"
                style={{
                  background: 'hsl(var(--aurora-cyan) / 0.2)',
                  border: '2px solid hsl(var(--aurora-cyan) / 0.4)',
                  animation: 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                }}
              />
            )}
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
          
          {audioEnabled && (
            <span 
              className="text-xs uppercase tracking-wider text-center animate-fade-in"
              style={{ 
                color: 'hsl(var(--aurora-cyan))',
                opacity: 0.7,
                textShadow: '0 0 10px hsl(var(--aurora-cyan) / 0.5)'
              }}
            >
              Listening
            </span>
          )}
          
          {audioEnabled && (
            <Button
              onClick={() => setSpectrumVisible(!spectrumVisible)}
              variant={spectrumVisible ? "default" : "outline"}
              size="icon"
              className="w-14 h-14 rounded-full shadow-lg transition-all duration-300 animate-fadeInBlur"
              style={{
                background: spectrumVisible ? 'hsl(var(--aurora-purple) / 0.3)' : 'hsl(var(--background) / 0.8)',
                backdropFilter: 'blur(10px)',
                border: spectrumVisible ? '2px solid hsl(var(--aurora-purple))' : '1px solid hsl(var(--border))',
              }}
            >
              <BarChart3 
                className="w-6 h-6" 
                style={{ color: spectrumVisible ? 'hsl(var(--aurora-purple))' : 'hsl(var(--foreground))' }} 
              />
            </Button>
          )}
        </div>
      )}
      
      {/* Spectrum Visualizer */}
      {audioEnabled && spectrumVisible && (
        <SpectrumVisualizer
          audioContext={visualizerRef.current?.getAudioContext() || null}
          analyser={visualizerRef.current?.getAnalyser() || null}
          audioHue={audioHue}
        />
      )}
    </main>
  );
};

export default Index;
