import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/');
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        toast({
          title: "Account created",
          description: "You can now sign in.",
        });
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'hsl(var(--background))' }}
    >
      <div 
        className="w-full max-w-sm p-8 rounded-2xl"
        style={{
          background: 'hsl(var(--background) / 0.95)',
          border: '1px solid hsl(var(--border) / 0.5)',
          boxShadow: '0 20px 60px hsl(var(--aurora-purple) / 0.3)',
        }}
      >
        <h1 
          className="text-2xl font-light tracking-widest text-center mb-8"
          style={{ color: 'hsl(var(--foreground))' }}
        >
          {isSignUp ? 'SIGN UP' : 'SIGN IN'}
        </h1>

        <form onSubmit={handleAuth} className="space-y-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-transparent border-border/50"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="bg-transparent border-border/50"
          />
          <Button
            type="submit"
            disabled={loading}
            className="w-full"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--aurora-purple) / 0.3), hsl(var(--aurora-pink) / 0.3))',
              border: '1px solid hsl(var(--aurora-purple) / 0.5)',
            }}
          >
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </Button>
        </form>

        <p 
          className="text-sm text-center mt-6 opacity-60"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="underline hover:opacity-80"
            style={{ color: 'hsl(var(--aurora-cyan))' }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
