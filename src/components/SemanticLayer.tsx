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
