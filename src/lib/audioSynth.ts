// Web Audio API procedural sound synthesis utilities

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;

// Initialize audio context (call this on first user interaction)
export const initAudioContext = () => {
  if (!audioContext) {
    audioContext = new AudioContext();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.3; // Master volume
    masterGain.connect(audioContext.destination);
  }
  return audioContext;
};

// Get or create audio context
const getAudioContext = () => {
  if (!audioContext) {
    initAudioContext();
  }
  return audioContext!;
};

// Soft tone on hover - ethereal sine wave
export const playSoftTone = (frequency: number = 440, duration: number = 0.3) => {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  // Create oscillator
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, now);
  
  // Envelope: quick attack, gentle release
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.15, now + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
  
  oscillator.connect(gainNode);
  gainNode.connect(masterGain!);
  
  oscillator.start(now);
  oscillator.stop(now + duration);
};

// Harmonic chord on click - multiple oscillators creating harmony
export const playHarmonicChord = (baseFreq: number = 220, duration: number = 0.8) => {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  // Harmonic intervals: root, major third, perfect fifth, octave
  const intervals = [1, 1.25, 1.5, 2];
  
  intervals.forEach((interval, index) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(baseFreq * interval, now);
    
    // Staggered attack for each note
    const attackTime = index * 0.05;
    gainNode.gain.setValueAtTime(0, now + attackTime);
    gainNode.gain.linearRampToValueAtTime(0.08, now + attackTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(masterGain!);
    
    oscillator.start(now + attackTime);
    oscillator.stop(now + duration);
  });
};

// Sustained pad for reflection state - warm, evolving texture
let reflectionPad: {
  oscillators: OscillatorNode[];
  gains: GainNode[];
  lfo: OscillatorNode;
  lfoGain: GainNode;
} | null = null;

export const startReflectionPad = () => {
  if (reflectionPad) return; // Already playing
  
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  // Base frequencies for pad (ambient chord)
  const frequencies = [110, 146.83, 164.81, 220]; // A2, D3, E3, A3
  
  const oscillators: OscillatorNode[] = [];
  const gains: GainNode[] = [];
  
  // Create multiple detuned oscillators for richness
  frequencies.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.detune.setValueAtTime((Math.random() - 0.5) * 10, now); // Slight detune
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 2); // Slow fade in
    
    osc.connect(gain);
    gain.connect(masterGain!);
    
    osc.start(now);
    
    oscillators.push(osc);
    gains.push(gain);
  });
  
  // LFO for subtle modulation
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  
  lfo.frequency.setValueAtTime(0.2, now); // Slow modulation
  lfoGain.gain.setValueAtTime(3, now); // Modulation depth
  
  lfo.connect(lfoGain);
  oscillators.forEach(osc => lfoGain.connect(osc.frequency));
  
  lfo.start(now);
  
  reflectionPad = { oscillators, gains, lfo, lfoGain };
};

export const stopReflectionPad = () => {
  if (!reflectionPad) return;
  
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  const fadeOutTime = 1.5;
  
  // Fade out all oscillators
  reflectionPad.gains.forEach(gain => {
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0.001, now + fadeOutTime);
  });
  
  // Stop oscillators after fade out
  setTimeout(() => {
    if (reflectionPad) {
      reflectionPad.oscillators.forEach(osc => osc.stop());
      reflectionPad.lfo.stop();
      reflectionPad = null;
    }
  }, fadeOutTime * 1000 + 100);
};

// Word generation sound - quick sparkle
export const playWordSparkle = () => {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.type = 'sine';
  
  // Quick upward frequency sweep
  oscillator.frequency.setValueAtTime(800, now);
  oscillator.frequency.exponentialRampToValueAtTime(1600, now + 0.2);
  
  gainNode.gain.setValueAtTime(0.1, now);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
  
  oscillator.connect(gainNode);
  gainNode.connect(masterGain!);
  
  oscillator.start(now);
  oscillator.stop(now + 0.2);
};

// Set master volume (0 to 1)
export const setMasterVolume = (volume: number) => {
  if (masterGain) {
    masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), audioContext!.currentTime);
  }
};
