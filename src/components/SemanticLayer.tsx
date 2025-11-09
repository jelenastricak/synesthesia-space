import { useState, useEffect } from 'react';

interface Word {
  id: number;
  text: string;
  x: number;
  y: number;
  opacity: number;
}

interface SemanticLayerProps {
  interactionFrequency: number;
  onHover: () => void;
}

// Thematic word clusters for context-aware generation
const WORD_CLUSTERS = {
  light: [
    'luminous', 'radiate', 'shimmer', 'glow', 'illuminate', 'gleam', 'sparkle',
    'glimmer', 'incandescent', 'phosphorescent', 'prismatic', 'iridescent', 'opalescent'
  ],
  motion: [
    'float', 'drift', 'cascade', 'ripple', 'flow', 'surge', 'spiral', 'swirl',
    'undulate', 'oscillate', 'revolve', 'orbit', 'gyrate', 'meander', 'wander'
  ],
  transformation: [
    'transcend', 'bloom', 'dissolve', 'emerge', 'evolve', 'morph', 'transmute',
    'metamorphose', 'unfold', 'crystallize', 'coalesce', 'fragment', 'disperse'
  ],
  resonance: [
    'echo', 'resonate', 'harmonize', 'vibrate', 'pulse', 'hum', 'reverberate',
    'oscillate', 'frequency', 'wavelength', 'amplitude', 'cadence', 'rhythm'
  ],
  essence: [
    'breathe', 'whisper', 'embrace', 'essence', 'aura', 'spirit', 'soul',
    'quintessence', 'ethereal', 'ephemeral', 'transient', 'fleeting', 'momentary'
  ],
  cosmic: [
    'celestial', 'stellar', 'nebula', 'cosmos', 'infinite', 'eternal', 'astral',
    'galactic', 'void', 'expanse', 'universe', 'constellation', 'aurora'
  ],
  connection: [
    'merge', 'converge', 'intertwine', 'weave', 'fuse', 'unite', 'synthesize',
    'integrate', 'harmonize', 'synchronize', 'attune', 'align', 'resonate'
  ],
  perception: [
    'witness', 'observe', 'perceive', 'sense', 'feel', 'experience', 'discover',
    'unveil', 'reveal', 'manifest', 'emerge', 'appear', 'materialize'
  ],
  emotion: [
    'flutter', 'tremble', 'quiver', 'shiver', 'thrill', 'stir', 'kindle',
    'ignite', 'awaken', 'inspire', 'enchant', 'mesmerize', 'captivate'
  ],
  nature: [
    'verdant', 'flourish', 'blossom', 'germinate', 'cultivate', 'nurture', 'grow',
    'harvest', 'wither', 'decay', 'renew', 'regenerate', 'rebirth'
  ],
  texture: [
    'velvet', 'silk', 'gossamer', 'crystalline', 'liquid', 'vaporous', 'ethereal',
    'tangible', 'palpable', 'delicate', 'gossamer', 'diaphanous', 'translucent'
  ],
  time: [
    'linger', 'suspend', 'pause', 'halt', 'freeze', 'accelerate', 'decelerate',
    'eternal', 'temporal', 'timeless', 'perpetual', 'infinite', 'endless'
  ]
};

// Flatten all words for random selection
const EMOTION_LIBRARY = Object.values(WORD_CLUSTERS).flat();

// Phrase templates for different interaction patterns
const PHRASE_TEMPLATES = {
  meditative: [
    '{0} and {1}',
    'to {0} is to {1}',
    'when {0} becomes {1}',
    '{0}, then {1}',
  ],
  kinetic: [
    '{0} into {1} into {2}',
    'where {0} meets {1} meets {2}',
    'through {0}, beyond {1}, into {2}',
    '{0} transforms {1} reveals {2}',
  ],
  poetic: [
    'in the space between {0} and {1}',
    '{0}: a way of {1}',
    'all {0} must {1}',
    'before {0}, after {1}',
  ],
  rhythmic: [
    '{0}, {1}, {2}',
    '{0} — {1} — {2}',
    '{0} / {1} / {2}',
    '{0} · {1} · {2}',
  ],
};

  // Check if a position overlaps with existing words
  const checkOverlap = (x: number, y: number, text: string, existingWords: Word[]) => {
    const estimatedWidth = text.length * 16; // Approximate width based on text-2xl tracking-widest
    const estimatedHeight = 40; // Approximate height for text-2xl
    const padding = 20; // Extra spacing
    
    return existingWords.some(word => {
      const wordWidth = word.text.length * 16;
      const wordHeight = 40;
      
      return (
        x < word.x + wordWidth + padding &&
        x + estimatedWidth + padding > word.x &&
        y < word.y + wordHeight + padding &&
        y + estimatedHeight + padding > word.y
      );
    });
  };

// Helper to find which cluster a word belongs to
const findWordCluster = (word: string): string | null => {
  for (const [cluster, wordList] of Object.entries(WORD_CLUSTERS)) {
    if (wordList.includes(word)) return cluster;
  }
  return null;
};

// Helper to select words from same or related clusters
const selectContextualWords = (recentWords: string[]): string[] => {
  const clusters = recentWords.map(findWordCluster).filter(Boolean);
  const dominantCluster = clusters[0]; // Use most recent word's cluster
  
  // Try to find words from the same cluster
  const clusteredWords = recentWords.filter(w => findWordCluster(w) === dominantCluster);
  
  // If we have enough from same cluster, use those, otherwise mix
  return clusteredWords.length >= 2 ? clusteredWords.slice(0, 3) : recentWords.slice(0, 3);
};

export const SemanticLayer = ({ interactionFrequency, onHover }: SemanticLayerProps) => {
  const [words, setWords] = useState<Word[]>([]);
  const [phraseMode, setPhraseMode] = useState(false);
  const [generatedPhrase, setGeneratedPhrase] = useState('');
  const [usedClusters, setUsedClusters] = useState<string[]>([]);
  const [interactionPattern, setInteractionPattern] = useState<'meditative' | 'kinetic' | 'poetic' | 'rhythmic'>('meditative');
  
  // Track interaction patterns
  useEffect(() => {
    if (interactionFrequency > 7) {
      setInteractionPattern('kinetic');
    } else if (interactionFrequency > 5) {
      setInteractionPattern('rhythmic');
    } else if (interactionFrequency > 3) {
      setInteractionPattern('poetic');
    } else {
      setInteractionPattern('meditative');
    }
  }, [interactionFrequency]);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Generate word on movement if frequency is high enough
      if (interactionFrequency > 2 && words.length < 5 && Math.random() > 0.95) { // Lowered from 0.97 to 0.95 for more frequent generation
        onHover();
        
        // Context-aware word selection: prefer words from underused clusters
        let selectedWord: string;
        const clusterKeys = Object.keys(WORD_CLUSTERS);
        const availableClusters = clusterKeys.filter(c => !usedClusters.includes(c));
        
        if (availableClusters.length > 0 && Math.random() > 0.3) {
          // Pick from an unused cluster
          const cluster = availableClusters[Math.floor(Math.random() * availableClusters.length)];
          const clusterWords = WORD_CLUSTERS[cluster as keyof typeof WORD_CLUSTERS];
          selectedWord = clusterWords[Math.floor(Math.random() * clusterWords.length)];
          setUsedClusters(prev => [...prev, cluster].slice(-4)); // Keep last 4 clusters
        } else {
          // Random selection
          selectedWord = EMOTION_LIBRARY[Math.floor(Math.random() * EMOTION_LIBRARY.length)];
        }
        
        const randomWord = selectedWord;
        
        // Check for overlap and adjust position if needed
        let x = e.clientX;
        let y = e.clientY;
        let attempts = 0;
        const maxAttempts = 10;
        
        while (checkOverlap(x, y, randomWord, words) && attempts < maxAttempts) {
          x = e.clientX + (Math.random() - 0.5) * 200;
          y = e.clientY + (Math.random() - 0.5) * 200;
          attempts++;
        }
        
        // Only spawn if a valid position was found
        if (attempts < maxAttempts) {
          const newWord: Word = {
            id: Date.now(),
            text: randomWord,
            x,
            y,
            opacity: 0,
          };
          
          setWords(prev => [...prev, newWord]);
          
          // Fade in
          setTimeout(() => {
            setWords(prev => prev.map(w => 
              w.id === newWord.id ? { ...w, opacity: 1 } : w
            ));
          }, 50);
          
          // Auto-fade after time
          setTimeout(() => {
            setWords(prev => prev.filter(w => w.id !== newWord.id));
          }, 8000);
        }
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [interactionFrequency, words.length, onHover]);
  
  // Generate sophisticated, context-aware phrases
  useEffect(() => {
    if (interactionFrequency > 8 && !phraseMode && words.length >= 3) {
      setPhraseMode(true);
      
      const recentWords = words.slice(-5).map(w => w.text);
      const contextualWords = selectContextualWords(recentWords);
      
      // Select template based on interaction pattern
      const templates = PHRASE_TEMPLATES[interactionPattern];
      let template = templates[Math.floor(Math.random() * templates.length)];
      
      // Generate phrase by replacing placeholders
      let phrase = template;
      contextualWords.forEach((word, i) => {
        phrase = phrase.replace(`{${i}}`, word);
      });
      
      setGeneratedPhrase(phrase);
      
      setTimeout(() => {
        setPhraseMode(false);
        setGeneratedPhrase('');
      }, 6000);
    }
  }, [interactionFrequency, words, phraseMode, interactionPattern]);
  
  const handleWordClick = (id: number) => {
    setWords(prev => prev.map(w => 
      w.id === id ? { ...w, opacity: 0 } : w
    ));
    setTimeout(() => {
      setWords(prev => prev.filter(w => w.id !== id));
    }, 1500);
  };
  
  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Individual words */}
      {words.map(word => (
        <div
          key={word.id}
          onClick={() => handleWordClick(word.id)}
          className="absolute text-2xl font-light tracking-widest cursor-pointer pointer-events-auto transition-all duration-1500"
          style={{
            left: word.x,
            top: word.y,
            opacity: word.opacity,
            color: 'hsl(var(--foreground))',
            textShadow: '0 0 20px hsl(var(--aurora-cyan) / 0.6)',
            filter: `blur(${word.opacity === 0 ? '20px' : '0px'})`,
            transform: `scale(${word.opacity === 0 ? 0.7 : 1})`,
          }}
        >
          {word.text}
        </div>
      ))}
      
      {/* Generated phrase */}
      {phraseMode && (
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl font-extralight tracking-widest text-center animate-fadeInBlur"
          style={{
            color: 'hsl(var(--foreground))',
            textShadow: '0 0 40px hsl(var(--aurora-pink) / 0.8)',
            maxWidth: '80vw',
          }}
        >
          {generatedPhrase}
        </div>
      )}
    </div>
  );
};
