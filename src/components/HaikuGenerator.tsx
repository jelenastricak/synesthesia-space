import { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface HaikuGeneratorProps {
  isVisible: boolean;
  onClose: () => void;
}

export const HaikuGenerator = ({ isVisible, onClose }: HaikuGeneratorProps) => {
  const [haiku, setHaiku] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateHaiku = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-haiku', {
        body: {}
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        toast({
          title: "Generation Failed",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setHaiku(data?.haiku || null);
    } catch (error) {
      console.error('Haiku generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate haiku. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeInBlur">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-xl"
        style={{ background: 'hsl(var(--background) / 0.85)' }}
        onClick={onClose}
      />

      {/* Container */}
      <div 
        className="relative w-full max-w-lg rounded-2xl overflow-hidden p-8"
        style={{
          background: 'hsl(var(--background) / 0.95)',
          border: '1px solid hsl(var(--border) / 0.5)',
          boxShadow: '0 20px 60px hsl(var(--aurora-purple) / 0.3)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <Sparkles className="w-5 h-5" style={{ color: 'hsl(var(--aurora-pink))' }} />
          <h2 
            className="text-2xl font-light tracking-widest"
            style={{ color: 'hsl(var(--foreground))' }}
          >
            HAIKU
          </h2>
        </div>

        {/* Haiku Display */}
        <div className="min-h-[140px] flex items-center justify-center mb-8">
          {haiku ? (
            <div 
              className="text-center space-y-2 animate-fadeInBlur"
              style={{ color: 'hsl(var(--foreground))' }}
            >
              {haiku.split('\n').map((line, i) => (
                <p 
                  key={i} 
                  className="text-xl font-light tracking-wide"
                  style={{
                    textShadow: '0 0 30px hsl(var(--aurora-cyan) / 0.5)',
                  }}
                >
                  {line}
                </p>
              ))}
            </div>
          ) : (
            <p 
              className="text-lg font-light tracking-wide opacity-50"
              style={{ color: 'hsl(var(--muted-foreground))' }}
            >
              {isLoading ? 'Composing...' : 'Generate a haiku'}
            </p>
          )}
        </div>

        {/* Generate Button */}
        <div className="flex justify-center">
          <Button
            onClick={generateHaiku}
            disabled={isLoading}
            className="px-8 py-3 rounded-full transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--aurora-purple) / 0.3), hsl(var(--aurora-pink) / 0.3))',
              border: '1px solid hsl(var(--aurora-purple) / 0.5)',
              color: 'hsl(var(--foreground))',
            }}
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {haiku ? 'Generate Another' : 'Generate Haiku'}
          </Button>
        </div>

        {/* Close hint */}
        <p 
          className="text-xs text-center mt-6 opacity-40"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          Click outside to close
        </p>
      </div>
    </div>
  );
};
