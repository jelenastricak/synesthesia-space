// Ambient Soundscape - Reactive drone tones and atmospheric textures

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let convolver: ConvolverNode | null = null;
let isPlaying = false;

// Drone layers
interface DroneLayer {
  oscillator: OscillatorNode;
  gainNode: GainNode;
  filter: BiquadFilterNode;
  lfo: OscillatorNode;
  lfoGain: GainNode;
}

let droneLayers: DroneLayer[] = [];
let subBass: { oscillator: OscillatorNode; gain: GainNode } | null = null;
let noiseNode: { source: AudioBufferSourceNode; gain: GainNode; filter: BiquadFilterNode } | null = null;

// Current state for reactive updates
let currentState = {
  hue: 0,
  amplitude: 0,
  motion: 0,
  interaction: 0,
};

// Initialize audio context
const initAudioContext = () => {
  if (!audioContext) {
    audioContext = new AudioContext();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0;
    
    // Create reverb
    convolver = audioContext.createConvolver();
    const reverbBuffer = createReverbImpulse(audioContext, 3, 2);
    convolver.buffer = reverbBuffer;
    
    // Wet/dry mix
    const dryGain = audioContext.createGain();
    const wetGain = audioContext.createGain();
    dryGain.gain.value = 0.6;
    wetGain.gain.value = 0.4;
    
    masterGain.connect(dryGain);
    masterGain.connect(convolver);
    convolver.connect(wetGain);
    
    dryGain.connect(audioContext.destination);
    wetGain.connect(audioContext.destination);
  }
  return audioContext;
};

// Create reverb impulse response
const createReverbImpulse = (ctx: AudioContext, duration: number, decay: number) => {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const impulse = ctx.createBuffer(2, length, sampleRate);
  
  for (let channel = 0; channel < 2; channel++) {
    const channelData = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  
  return impulse;
};

// Create pink noise buffer
const createNoiseBuffer = (ctx: AudioContext) => {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  // Pink noise approximation
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  
  return buffer;
};

// Map hue to musical key (pentatonic scale frequencies)
const hueToFrequencies = (hue: number): number[] => {
  // Map hue (0-360) to different harmonic bases
  const baseFreq = 55 + (hue / 360) * 55; // A1 to A2 range
  
  // Pentatonic ratios for pleasant harmonics
  const ratios = [1, 1.125, 1.333, 1.5, 1.667, 2]; // Pentatonic intervals
  
  return ratios.map(r => baseFreq * r);
};

// Create a drone layer
const createDroneLayer = (ctx: AudioContext, frequency: number, type: OscillatorType): DroneLayer => {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  
  // Oscillator setup
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  oscillator.detune.value = (Math.random() - 0.5) * 15;
  
  // Filter setup - lowpass for warmth
  filter.type = 'lowpass';
  filter.frequency.value = 800;
  filter.Q.value = 1;
  
  // LFO for subtle movement
  lfo.type = 'sine';
  lfo.frequency.value = 0.1 + Math.random() * 0.2;
  lfoGain.gain.value = frequency * 0.02; // Subtle pitch wobble
  
  // Gain envelope
  gainNode.gain.value = 0;
  
  // Connect
  lfo.connect(lfoGain);
  lfoGain.connect(oscillator.frequency);
  oscillator.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(masterGain!);
  
  return { oscillator, gainNode, filter, lfo, lfoGain };
};

// Start the ambient soundscape
export const startAmbientSoundscape = () => {
  if (isPlaying) return;
  
  const ctx = initAudioContext();
  const now = ctx.currentTime;
  
  // Create drone layers at different frequencies
  const frequencies = hueToFrequencies(currentState.hue);
  
  frequencies.forEach((freq, i) => {
    const types: OscillatorType[] = ['sine', 'triangle', 'sine', 'triangle', 'sine', 'sine'];
    const layer = createDroneLayer(ctx, freq, types[i]);
    
    // Staggered fade in
    layer.gainNode.gain.setValueAtTime(0, now);
    layer.gainNode.gain.linearRampToValueAtTime(0.03 - i * 0.003, now + 2 + i * 0.5);
    
    layer.oscillator.start(now);
    layer.lfo.start(now);
    
    droneLayers.push(layer);
  });
  
  // Sub bass drone
  const subOsc = ctx.createOscillator();
  const subGain = ctx.createGain();
  subOsc.type = 'sine';
  subOsc.frequency.value = 55;
  subGain.gain.setValueAtTime(0, now);
  subGain.gain.linearRampToValueAtTime(0.08, now + 3);
  subOsc.connect(subGain);
  subGain.connect(masterGain!);
  subOsc.start(now);
  subBass = { oscillator: subOsc, gain: subGain };
  
  // Atmospheric noise layer
  const noiseBuffer = createNoiseBuffer(ctx);
  const noiseSource = ctx.createBufferSource();
  const noiseGain = ctx.createGain();
  const noiseFilter = ctx.createBiquadFilter();
  
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true;
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = 400;
  noiseFilter.Q.value = 0.5;
  noiseGain.gain.setValueAtTime(0, now);
  noiseGain.gain.linearRampToValueAtTime(0.015, now + 4);
  
  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(masterGain!);
  noiseSource.start(now);
  
  noiseNode = { source: noiseSource, gain: noiseGain, filter: noiseFilter };
  
  // Fade in master
  masterGain!.gain.setValueAtTime(0, now);
  masterGain!.gain.linearRampToValueAtTime(0.25, now + 2);
  
  isPlaying = true;
  console.log('Ambient soundscape started');
};

// Stop the ambient soundscape
export const stopAmbientSoundscape = () => {
  if (!isPlaying || !audioContext) return;
  
  const now = audioContext.currentTime;
  const fadeTime = 2;
  
  // Fade out master
  masterGain!.gain.cancelScheduledValues(now);
  masterGain!.gain.setValueAtTime(masterGain!.gain.value, now);
  masterGain!.gain.linearRampToValueAtTime(0, now + fadeTime);
  
  setTimeout(() => {
    // Stop all drone layers
    droneLayers.forEach(layer => {
      try {
        layer.oscillator.stop();
        layer.lfo.stop();
      } catch (e) {}
    });
    droneLayers = [];
    
    // Stop sub bass
    if (subBass) {
      try { subBass.oscillator.stop(); } catch (e) {}
      subBass = null;
    }
    
    // Stop noise
    if (noiseNode) {
      try { noiseNode.source.stop(); } catch (e) {}
      noiseNode = null;
    }
    
    isPlaying = false;
    console.log('Ambient soundscape stopped');
  }, fadeTime * 1000 + 100);
};

// Update soundscape based on visual state
export const updateSoundscape = (hue: number, amplitude: number, motion: number, interaction: number) => {
  if (!isPlaying || !audioContext) return;
  
  currentState = { hue, amplitude, motion, interaction };
  const now = audioContext.currentTime;
  
  // Normalize values
  const normalizedMotion = Math.min(1, motion / 10);
  const normalizedInteraction = Math.min(1, interaction / 10);
  const combinedIntensity = (amplitude * 0.4 + normalizedMotion * 0.35 + normalizedInteraction * 0.25);
  
  // Update drone layer filters and gains based on intensity
  droneLayers.forEach((layer, i) => {
    // Filter frequency responds to intensity - opens up with more activity
    const baseFilterFreq = 400 + combinedIntensity * 1600;
    layer.filter.frequency.setTargetAtTime(baseFilterFreq + i * 100, now, 0.3);
    
    // Gain responds to amplitude
    const baseGain = 0.02 + combinedIntensity * 0.04;
    layer.gainNode.gain.setTargetAtTime(Math.max(0.01, baseGain - i * 0.005), now, 0.5);
    
    // LFO speed increases with interaction
    const lfoSpeed = 0.1 + normalizedInteraction * 0.3;
    layer.lfo.frequency.setTargetAtTime(lfoSpeed, now, 0.5);
    
    // Pitch shift based on hue
    const newFreqs = hueToFrequencies(hue);
    if (newFreqs[i]) {
      layer.oscillator.frequency.setTargetAtTime(newFreqs[i], now, 2);
    }
  });
  
  // Sub bass responds to low-frequency content
  if (subBass) {
    const subFreq = 45 + amplitude * 20;
    subBass.oscillator.frequency.setTargetAtTime(subFreq, now, 0.5);
    subBass.gain.gain.setTargetAtTime(0.05 + combinedIntensity * 0.1, now, 0.3);
  }
  
  // Noise responds to motion - more hiss with more movement
  if (noiseNode) {
    const noiseFreq = 300 + normalizedMotion * 800 + hue;
    noiseNode.filter.frequency.setTargetAtTime(noiseFreq, now, 0.2);
    noiseNode.gain.gain.setTargetAtTime(0.01 + normalizedMotion * 0.04, now, 0.3);
  }
  
  // Master gain pulses slightly with amplitude
  if (masterGain) {
    const masterVol = 0.2 + combinedIntensity * 0.15;
    masterGain.gain.setTargetAtTime(masterVol, now, 0.1);
  }
};

// Set master volume
export const setSoundscapeVolume = (volume: number) => {
  if (masterGain && audioContext) {
    masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), audioContext.currentTime, 0.1);
  }
};

// Check if playing
export const isSoundscapePlaying = () => isPlaying;
