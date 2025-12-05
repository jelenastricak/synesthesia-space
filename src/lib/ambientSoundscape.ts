// Ambient Soundscape - Uses uploaded ambient tracks with reactive effects

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let isPlaying = false;

// Audio tracks
const TRACKS = [
  '/audio/meditation-flow.mp3',
  '/audio/morning-reverie.mp3',
  '/audio/ambient-meditation.mp3',
  '/audio/sunrise-sea.mp3',
];

interface AudioTrack {
  buffer: AudioBuffer | null;
  source: AudioBufferSourceNode | null;
  gainNode: GainNode;
  filter: BiquadFilterNode;
}

let tracks: AudioTrack[] = [];
let currentTrackIndex = 0;
let trackLoadPromise: Promise<void> | null = null;
let convolver: ConvolverNode | null = null;

// Current state for reactive updates
let currentState = {
  hue: 0,
  amplitude: 0,
  motion: 0,
  interaction: 0,
};

// Initialize audio context
const initAudioContext = async () => {
  if (!audioContext) {
    audioContext = new AudioContext();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0;
    
    // Create reverb
    convolver = audioContext.createConvolver();
    const reverbBuffer = createReverbImpulse(audioContext, 2.5, 2.5);
    convolver.buffer = reverbBuffer;
    
    // Wet/dry mix
    const dryGain = audioContext.createGain();
    const wetGain = audioContext.createGain();
    dryGain.gain.value = 0.7;
    wetGain.gain.value = 0.3;
    
    masterGain.connect(dryGain);
    masterGain.connect(convolver);
    convolver.connect(wetGain);
    
    dryGain.connect(audioContext.destination);
    wetGain.connect(audioContext.destination);
    
    // Initialize track slots
    tracks = TRACKS.map(() => ({
      buffer: null,
      source: null,
      gainNode: audioContext!.createGain(),
      filter: audioContext!.createBiquadFilter(),
    }));
    
    // Configure filters
    tracks.forEach((track, i) => {
      track.gainNode.gain.value = 0;
      track.filter.type = 'lowpass';
      track.filter.frequency.value = 2000;
      track.filter.Q.value = 0.5;
      track.filter.connect(track.gainNode);
      track.gainNode.connect(masterGain!);
    });
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

// Load audio tracks
const loadTracks = async () => {
  if (!audioContext || trackLoadPromise) return trackLoadPromise;
  
  trackLoadPromise = Promise.all(
    TRACKS.map(async (url, i) => {
      try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        tracks[i].buffer = await audioContext!.decodeAudioData(arrayBuffer);
        console.log(`Loaded track: ${url}`);
      } catch (error) {
        console.error(`Failed to load track ${url}:`, error);
      }
    })
  ).then(() => {
    console.log('All ambient tracks loaded');
  });
  
  return trackLoadPromise;
};

// Play a specific track
const playTrack = (index: number, fadeIn = true) => {
  if (!audioContext || !tracks[index]?.buffer) return;
  
  const track = tracks[index];
  const now = audioContext.currentTime;
  
  // Stop existing source if any
  if (track.source) {
    try {
      track.source.stop();
    } catch (e) {}
  }
  
  // Create new source
  track.source = audioContext.createBufferSource();
  track.source.buffer = track.buffer;
  track.source.loop = true;
  track.source.connect(track.filter);
  
  if (fadeIn) {
    track.gainNode.gain.setValueAtTime(0, now);
    track.gainNode.gain.linearRampToValueAtTime(0.5, now + 3);
  } else {
    track.gainNode.gain.setValueAtTime(0.5, now);
  }
  
  track.source.start(0);
};

// Crossfade to a different track
const crossfadeTo = (newIndex: number) => {
  if (!audioContext || newIndex === currentTrackIndex) return;
  
  const now = audioContext.currentTime;
  const fadeTime = 4;
  
  // Fade out current
  const currentTrack = tracks[currentTrackIndex];
  if (currentTrack.source) {
    currentTrack.gainNode.gain.cancelScheduledValues(now);
    currentTrack.gainNode.gain.setValueAtTime(currentTrack.gainNode.gain.value, now);
    currentTrack.gainNode.gain.linearRampToValueAtTime(0, now + fadeTime);
    
    setTimeout(() => {
      try {
        currentTrack.source?.stop();
        currentTrack.source = null;
      } catch (e) {}
    }, fadeTime * 1000 + 100);
  }
  
  // Start and fade in new track
  currentTrackIndex = newIndex;
  playTrack(newIndex, true);
};

// Start the ambient soundscape
export const startAmbientSoundscape = async () => {
  if (isPlaying) return;
  
  console.log('Starting ambient soundscape...');
  const ctx = await initAudioContext();
  
  // Resume audio context if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') {
    console.log('Resuming suspended audio context...');
    await ctx.resume();
  }
  
  await loadTracks();
  
  const now = ctx.currentTime;
  
  // Start with first available track
  const firstLoadedIndex = tracks.findIndex(t => t.buffer !== null);
  if (firstLoadedIndex === -1) {
    console.error('No tracks loaded');
    return;
  }
  
  currentTrackIndex = firstLoadedIndex;
  playTrack(currentTrackIndex, true);
  
  // Fade in master
  masterGain!.gain.setValueAtTime(0, now);
  masterGain!.gain.linearRampToValueAtTime(0.6, now + 2);
  
  isPlaying = true;
  console.log('Ambient soundscape started with uploaded tracks');
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
    // Stop all tracks
    tracks.forEach(track => {
      try {
        track.source?.stop();
        track.source = null;
      } catch (e) {}
    });
    
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
  
  // Select track based on hue (different moods)
  // 0-90: meditation-flow (index 0)
  // 90-180: morning-reverie (index 1)
  // 180-270: ambient-meditation (index 2)
  // 270-360: sunrise-sea (index 3)
  const loadedTracks = tracks.map((t, i) => t.buffer ? i : -1).filter(i => i >= 0);
  if (loadedTracks.length > 1) {
    const hueSection = Math.floor((hue / 360) * loadedTracks.length);
    const targetTrack = loadedTracks[Math.min(hueSection, loadedTracks.length - 1)];
    
    // Only crossfade if significantly different and not too frequent
    if (targetTrack !== currentTrackIndex) {
      crossfadeTo(targetTrack);
    }
  }
  
  // Update filter on current track - opens up with intensity
  const currentTrack = tracks[currentTrackIndex];
  if (currentTrack) {
    const filterFreq = 800 + combinedIntensity * 4000; // 800Hz to 4800Hz
    currentTrack.filter.frequency.setTargetAtTime(filterFreq, now, 0.3);
    
    // Subtle gain modulation with amplitude
    const trackGain = 0.4 + combinedIntensity * 0.3;
    currentTrack.gainNode.gain.setTargetAtTime(trackGain, now, 0.5);
  }
  
  // Master volume responds to combined intensity
  if (masterGain) {
    const masterVol = 0.4 + combinedIntensity * 0.3;
    masterGain.gain.setTargetAtTime(masterVol, now, 0.2);
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

// Get current track name for UI
export const getCurrentTrackName = () => {
  const names = ['Meditation Flow', 'Morning Reverie', 'Ambient Meditation', 'Sunrise Sea'];
  return names[currentTrackIndex] || 'Unknown';
};
