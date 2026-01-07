import { Link } from 'react-router-dom';
import { useIceStore } from '@/stores/iceStore';
import { supabase, getLastRefreshTime, refreshIceData } from '@/lib/supabase';
import { useEffect, useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import type { User } from '@supabase/supabase-js';

export function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lakes = useIceStore((state) => state.lakes);
  
  const safeLakes = lakes.filter((l) => l.status === 'safe').length;

  // Fetch last refresh time
  const fetchLastRefresh = useCallback(async () => {
    const time = await getLastRefreshTime();
    setLastRefresh(time);
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    // Fetch last refresh time
    fetchLastRefresh();

    // Update last refresh time every minute
    const interval = setInterval(fetchLastRefresh, 60000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [fetchLastRefresh]);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    toast.loading('Refreshing ice data...', { id: 'refresh' });
    
    try {
      const result = await refreshIceData();
      
      if (result.success) {
        toast.success('Data refreshed!', { id: 'refresh' });
        await fetchLastRefresh();
        // Trigger a page reload to get fresh data
        window.location.reload();
      } else {
        toast.error(result.message, { id: 'refresh' });
      }
    } catch (error) {
      toast.error('Failed to refresh', { id: 'refresh' });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-[var(--color-frost-dim)]/10">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-ice-primary)] to-[var(--color-ice-glow)] flex items-center justify-center">
            <span className="font-bold text-[var(--color-bg-deep)] text-sm">IS</span>
          </div>
          <span className="font-semibold text-[var(--color-frost-white)] text-lg tracking-tight">
            ISAR
          </span>
          {safeLakes > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--color-safe)]/20 text-[var(--color-safe)]">
              {safeLakes} safe
            </span>
          )}
        </Link>

        {/* Center: Last Updated + Refresh */}
        <div className="hidden md:flex items-center gap-2">
          {lastRefresh && (
            <span className="text-xs text-[var(--color-frost-dim)]">
              Updated {formatDistanceToNow(lastRefresh, { addSuffix: true })}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium
              border border-[var(--color-frost-dim)]/30 
              hover:border-[var(--color-ice-primary)]/50 hover:bg-[var(--color-ice-primary)]/10
              transition-all
              ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            title="Refresh ice conditions from Stockholm municipality"
          >
            <svg 
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
            <span className="text-[var(--color-frost-muted)]">
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-4">
          {/* Mobile refresh button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="md:hidden p-2 rounded-lg hover:bg-[var(--color-frost-dim)]/10 transition-colors"
            title="Refresh"
          >
            <svg 
              className={`w-4 h-4 text-[var(--color-frost-muted)] ${isRefreshing ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
          </button>

          <Link
            to="/"
            className="text-sm text-[var(--color-frost-muted)] hover:text-[var(--color-frost-white)] transition-colors"
          >
            Map
          </Link>
          <Link
            to="/about"
            className="text-sm text-[var(--color-frost-muted)] hover:text-[var(--color-frost-white)] transition-colors"
          >
            About
          </Link>

          {/* Auth */}
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--color-frost-dim)] hidden sm:inline">
                {user.email?.split('@')[0]}
              </span>
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 rounded-lg text-xs font-medium
                  text-[var(--color-frost-muted)] hover:text-[var(--color-frost-white)]
                  border border-[var(--color-frost-dim)]/30 hover:border-[var(--color-frost-dim)]/50
                  transition-all"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="px-3 py-1.5 rounded-lg text-xs font-medium
                bg-[var(--color-ice-primary)]/10 text-[var(--color-ice-primary)]
                hover:bg-[var(--color-ice-primary)]/20 transition-all"
            >
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
