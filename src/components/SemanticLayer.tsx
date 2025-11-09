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

const EMOTION_LIBRARY = [
  'transcend', 'shimmer', 'bloom', 'breathe', 'dissolve',
  'echo', 'ripple', 'float', 'drift', 'cascade',
  'resonate', 'illuminate', 'whisper', 'embrace', 'merge',
  'radiate', 'flutter', 'harmonize', 'luminous', 'ethereal',
  'essence', 'wavelength', 'vibration', 'frequency', 'aura',
  'celestial', 'prismatic', 'ephemeral', 'immerse', 'converge'
];

export const SemanticLayer = ({ interactionFrequency, onHover }: SemanticLayerProps) => {
  const [words, setWords] = useState<Word[]>([]);
  const [phraseMode, setPhraseMode] = useState(false);
  const [generatedPhrase, setGeneratedPhrase] = useState('');
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Generate word on movement if frequency is high enough
      if (interactionFrequency > 2 && words.length < 5 && Math.random() > 0.97) {
        onHover();
        const randomWord = EMOTION_LIBRARY[Math.floor(Math.random() * EMOTION_LIBRARY.length)];
        const newWord: Word = {
          id: Date.now(),
          text: randomWord,
          x: e.clientX,
          y: e.clientY,
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
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [interactionFrequency, words.length, onHover]);
  
  // Generate phrase after sustained interaction
  useEffect(() => {
    if (interactionFrequency > 8 && !phraseMode && words.length >= 3) {
      setPhraseMode(true);
      
      const selectedWords = words.slice(-3).map(w => w.text);
      const phrases = [
        `${selectedWords[0]} into ${selectedWords[1]}`,
        `where ${selectedWords[0]} meets ${selectedWords[2]}`,
        `to ${selectedWords[0]} is to ${selectedWords[1]}`,
        `${selectedWords[0]}, ${selectedWords[1]}, ${selectedWords[2]}`,
      ];
      
      setGeneratedPhrase(phrases[Math.floor(Math.random() * phrases.length)]);
      
      setTimeout(() => {
        setPhraseMode(false);
        setGeneratedPhrase('');
      }, 6000);
    }
  }, [interactionFrequency, words, phraseMode]);
  
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
