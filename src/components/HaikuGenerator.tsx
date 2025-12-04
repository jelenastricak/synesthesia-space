import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Heart, Trash2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface SavedHaiku {
  id: string;
  haiku: string;
  theme: string | null;
  created_at: string;
}

interface HaikuGeneratorProps {
  isVisible: boolean;
  onClose: () => void;
}

export const HaikuGenerator = ({ isVisible, onClose }: HaikuGeneratorProps) => {
  const [haiku, setHaiku] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [favorites, setFavorites] = useState<SavedHaiku[]>([]);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user && showFavorites) {
      fetchFavorites();
    }
  }, [user, showFavorites]);

  const fetchFavorites = async () => {
    const { data, error } = await supabase
      .from('saved_haikus')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setFavorites(data);
    }
  };

  const saveHaiku = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save haikus.",
      });
      navigate('/auth');
      return;
    }

    if (!haiku) return;

    setIsSaving(true);
    const { error } = await supabase
      .from('saved_haikus')
      .insert({ user_id: user.id, haiku });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save haiku.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Saved",
        description: "Haiku added to favorites.",
      });
    }
    setIsSaving(false);
  };

  const deleteHaiku = async (id: string) => {
    const { error } = await supabase
      .from('saved_haikus')
      .delete()
      .eq('id', id);

    if (!error) {
      setFavorites(favorites.filter(f => f.id !== id));
      toast({ title: "Deleted", description: "Haiku removed." });
    }
  };

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
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFavorites(!showFavorites)}
            className="opacity-60 hover:opacity-100"
          >
            <BookOpen className="w-4 h-4 mr-1" />
            {showFavorites ? 'New' : 'Favorites'}
          </Button>
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5" style={{ color: 'hsl(var(--aurora-pink))' }} />
            <h2 
              className="text-2xl font-light tracking-widest"
              style={{ color: 'hsl(var(--foreground))' }}
            >
              HAIKU
            </h2>
          </div>
          <div className="w-20" />
        </div>

        {showFavorites ? (
          /* Favorites View */
          <div className="min-h-[200px] max-h-[300px] overflow-y-auto space-y-4 mb-6">
            {!user ? (
              <p className="text-center opacity-50" style={{ color: 'hsl(var(--muted-foreground))' }}>
                <button onClick={() => navigate('/auth')} className="underline" style={{ color: 'hsl(var(--aurora-cyan))' }}>
                  Sign in
                </button>{' '}to view favorites
              </p>
            ) : favorites.length === 0 ? (
              <p className="text-center opacity-50" style={{ color: 'hsl(var(--muted-foreground))' }}>
                No saved haikus yet
              </p>
            ) : (
              favorites.map((fav) => (
                <div 
                  key={fav.id} 
                  className="p-4 rounded-lg relative group"
                  style={{ background: 'hsl(var(--muted) / 0.3)' }}
                >
                  {fav.haiku.split('\n').map((line, i) => (
                    <p key={i} className="text-sm" style={{ color: 'hsl(var(--foreground))' }}>{line}</p>
                  ))}
                  <button
                    onClick={() => deleteHaiku(fav.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" style={{ color: 'hsl(var(--destructive))' }} />
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <>
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

            {/* Action Buttons */}
            <div className="flex justify-center gap-3">
              <Button
                onClick={generateHaiku}
                disabled={isLoading}
                className="px-6 py-3 rounded-full transition-all duration-300"
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
                {haiku ? 'New' : 'Generate'}
              </Button>
              {haiku && (
                <Button
                  onClick={saveHaiku}
                  disabled={isSaving}
                  variant="outline"
                  className="px-4 py-3 rounded-full"
                  style={{
                    border: '1px solid hsl(var(--aurora-pink) / 0.5)',
                    color: 'hsl(var(--foreground))',
                  }}
                >
                  <Heart className="w-4 h-4" />
                </Button>
              )}
            </div>
          </>
        )}

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
