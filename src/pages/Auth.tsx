import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type AuthMode = 'signin' | 'signup';

export function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        toast.success('Check your email!', {
          description: 'We sent you a confirmation link.',
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast.success('Welcome back!');
        navigate('/');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-14 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-ice-primary)] to-[var(--color-ice-glow)] flex items-center justify-center">
              <span className="font-bold text-[var(--color-bg-deep)] text-xl">IS</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-[var(--color-frost-white)] mt-4">
            {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-sm text-[var(--color-frost-muted)] mt-2">
            {mode === 'signin'
              ? 'Sign in to submit ice reports'
              : 'Join the ISAR community'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[var(--color-frost-white)] mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-surface)] 
                border border-[var(--color-frost-dim)]/20 text-[var(--color-frost-white)]
                placeholder:text-[var(--color-frost-dim)] focus:outline-none 
                focus:border-[var(--color-ice-primary)]/50 focus:ring-1 focus:ring-[var(--color-ice-primary)]/20
                transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[var(--color-frost-white)] mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg-surface)] 
                border border-[var(--color-frost-dim)]/20 text-[var(--color-frost-white)]
                placeholder:text-[var(--color-frost-dim)] focus:outline-none 
                focus:border-[var(--color-ice-primary)]/50 focus:ring-1 focus:ring-[var(--color-ice-primary)]/20
                transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg font-medium
              bg-[var(--color-ice-primary)] text-[var(--color-bg-deep)]
              hover:bg-[var(--color-ice-glow)] disabled:opacity-50 disabled:cursor-not-allowed
              transition-all"
          >
            {loading
              ? 'Loading...'
              : mode === 'signin'
              ? 'Sign In'
              : 'Create Account'}
          </button>
        </form>

        {/* Mode toggle */}
        <p className="text-center text-sm text-[var(--color-frost-muted)] mt-6">
          {mode === 'signin' ? (
            <>
              Don't have an account?{' '}
              <button
                onClick={() => setMode('signup')}
                className="text-[var(--color-ice-primary)] hover:underline"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                onClick={() => setMode('signin')}
                className="text-[var(--color-ice-primary)] hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </p>

        {/* Back to map */}
        <Link
          to="/"
          className="block text-center text-sm text-[var(--color-frost-dim)] mt-8 hover:text-[var(--color-frost-muted)]"
        >
          ← Back to map
        </Link>
      </div>
    </div>
  );
}

