// Microphone audio visualization and amplitude detection

export class AudioVisualizer {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private animationId: number | null = null;
  private onAmplitudeChange: (amplitude: number, frequency: number) => void;
  
  constructor(onAmplitudeChange: (amplitude: number, frequency: number) => void) {
    this.onAmplitudeChange = onAmplitudeChange;
  }
  
  async start() {
    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Create audio context and analyser
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      
      // Connect microphone to analyser
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.source.connect(this.analyser);
      
      // Create data array for frequency data
      const bufferLength = this.analyser.frequencyBinCount;
      const buffer = new ArrayBuffer(bufferLength);
      this.dataArray = new Uint8Array(buffer);
      
      // Start analyzing
      this.analyze();
      
      return true;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      throw new Error('Microphone access denied or unavailable');
    }
  }
  
  private analyze = () => {
    if (!this.analyser || !this.dataArray) return;
    
    // Get frequency data
    // @ts-expect-error - Web Audio API type mismatch between ArrayBuffer and ArrayBufferLike
    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Calculate average amplitude (0-1)
    const sum = Array.from(this.dataArray).reduce((acc, val) => acc + val, 0);
    const average = sum / this.dataArray.length;
    const normalizedAmplitude = average / 255;
    
    // Calculate dominant frequency
    let maxValue = 0;
    let maxIndex = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      if (this.dataArray[i] > maxValue) {
        maxValue = this.dataArray[i];
        maxIndex = i;
      }
    }
    
    // Convert index to frequency (Hz)
    const nyquist = this.audioContext!.sampleRate / 2;
    const dominantFrequency = (maxIndex / this.dataArray.length) * nyquist;
    
    // Emit amplitude and frequency data
    this.onAmplitudeChange(normalizedAmplitude, dominantFrequency);
    
    // Continue analyzing
    this.animationId = requestAnimationFrame(this.analyze);
  };
  
  stop() {
    // Stop animation loop
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // Disconnect and clean up
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.analyser = null;
    this.dataArray = null;
  }
  
  // Get current audio level (for UI display)
  getCurrentLevel(): number {
    if (!this.analyser || !this.dataArray) return 0;
    
    // @ts-expect-error - Web Audio API type mismatch between ArrayBuffer and ArrayBufferLike
    this.analyser.getByteFrequencyData(this.dataArray);
    const sum = Array.from(this.dataArray).reduce((acc, val) => acc + val, 0);
    const average = sum / this.dataArray.length;
    return average / 255;
  }
}

// Utility to map frequency to color hue (for aurora effect)
export const mapFrequencyToHue = (frequency: number): number => {
  // Map frequency range (20-20000 Hz) to hue (0-360)
  const minFreq = 20;
  const maxFreq = 2000; // Focus on voice/music range
  
  const clampedFreq = Math.max(minFreq, Math.min(maxFreq, frequency));
  const normalizedFreq = (clampedFreq - minFreq) / (maxFreq - minFreq);
  
  // Map to hue: low freq = red/purple, high freq = blue/cyan
  return 270 + (normalizedFreq * 120); // 270-390 (wraps to 30)
};

// Utility to map amplitude to motion intensity
export const mapAmplitudeToIntensity = (amplitude: number): number => {
  // Exponential scaling for better response
  const scaled = Math.pow(amplitude, 0.7) * 10;
  return Math.min(10, scaled);
};
