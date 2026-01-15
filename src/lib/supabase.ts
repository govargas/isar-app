import { createClient } from '@supabase/supabase-js';
import type { Lake, IceReport, UserReport, LakeWithStatus } from '@/types';

// Supabase configuration - these should be set in environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

// Create Supabase client (will fail gracefully in mock mode)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for Supabase
export type Database = {
  public: {
    Tables: {
      lakes: {
        Row: Lake;
        Insert: Omit<Lake, 'id' | 'created_at' | 'centroid'>;
        Update: Partial<Omit<Lake, 'id' | 'created_at' | 'centroid'>>;
      };
      ice_reports: {
        Row: IceReport;
        Insert: Omit<IceReport, 'id' | 'created_at'>;
        Update: Partial<Omit<IceReport, 'id' | 'created_at'>>;
      };
      user_reports: {
        Row: UserReport;
        Insert: Omit<UserReport, 'id' | 'created_at' | 'upvotes'>;
        Update: Partial<Omit<UserReport, 'id' | 'created_at'>>;
      };
    };
    Views: {
      lake_current_status: {
        Row: LakeWithStatus;
      };
    };
  };
};

// Helper functions for common queries
export async function getLakesWithStatus(): Promise<LakeWithStatus[]> {
  const { data, error } = await supabase
    .from('lake_current_status')
    .select('*');

  if (error) {
    console.error('Error fetching lakes:', error);
    return [];
  }

  return data || [];
}

export async function getLakeBySlug(slug: string): Promise<LakeWithStatus | null> {
  const { data, error } = await supabase
    .from('lake_current_status')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching lake:', error);
    return null;
  }

  return data;
}

export async function getLakeReports(lakeId: string): Promise<IceReport[]> {
  const { data, error } = await supabase
    .from('ice_reports')
    .select('*')
    .eq('lake_id', lakeId)
    .order('scraped_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching reports:', error);
    return [];
  }

  return data || [];
}

export async function getUserReports(lakeId: string, includeExpired: boolean = true): Promise<UserReport[]> {
  let query = supabase
    .from('user_reports')
    .select('*')
    .eq('lake_id', lakeId)
    .order('reported_at', { ascending: false });
  
  // Optionally filter out expired reports (but default is to include them)
  if (!includeExpired) {
    query = query.gt('expires_at', new Date().toISOString());
  }
  
  // Limit to last 30 days to prevent loading too much historical data
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  query = query.gt('reported_at', thirtyDaysAgo);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching user reports:', error);
    return [];
  }

  return data || [];
}

export async function createUserReport(
  report: Omit<UserReport, 'id' | 'created_at' | 'upvotes'>
): Promise<UserReport | null> {
  const { data, error } = await supabase
    .from('user_reports')
    .insert(report)
    .select()
    .single();

  if (error) {
    console.error('Error creating report:', error);
    return null;
  }

  return data;
}

// Realtime subscription helper
export function subscribeToIceUpdates(
  callback: (payload: { new: IceReport; old: IceReport | null }) => void
) {
  return supabase
    .channel('ice-updates')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'ice_reports' },
      (payload) => {
        callback(payload as unknown as { new: IceReport; old: IceReport | null });
      }
    )
    .subscribe();
}

export function subscribeToUserReports(
  callback: (payload: { new: UserReport; old: UserReport | null }) => void
) {
  return supabase
    .channel('user-reports')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'user_reports' },
      (payload) => {
        callback(payload as unknown as { new: UserReport; old: UserReport | null });
      }
    )
    .subscribe();
}

// ============================================
// DATA REFRESH FUNCTIONS
// ============================================

const STALE_THRESHOLD_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Get the timestamp of the most recent ice report (last refresh time)
 */
export async function getLastRefreshTime(): Promise<Date | null> {
  const { data, error } = await supabase
    .from('ice_reports')
    .select('scraped_at')
    .order('scraped_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return new Date(data.scraped_at);
}

/**
 * Check if data is stale (older than threshold)
 */
export async function isDataStale(): Promise<boolean> {
  const lastRefresh = await getLastRefreshTime();
  if (!lastRefresh) return true;
  
  const now = new Date();
  const age = now.getTime() - lastRefresh.getTime();
  return age > STALE_THRESHOLD_MS;
}

/**
 * Trigger a manual refresh of ice data by calling the scraper Edge Function
 */
export async function refreshIceData(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await supabase.functions.invoke('scrape-isarna', {
      method: 'POST',
      body: {},
    });

    if (response.error) {
      console.error('Refresh error:', response.error);
      return { 
        success: false, 
        message: response.error.message || 'Failed to refresh data' 
      };
    }

    return { 
      success: true, 
      message: response.data?.message || 'Data refreshed successfully' 
    };
  } catch (error) {
    console.error('Refresh error:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Stale-while-revalidate: Return cached data immediately, refresh in background if stale
 */
export async function getLakesWithStaleRevalidate(
  onRefreshStart?: () => void,
  onRefreshComplete?: (success: boolean) => void
): Promise<LakeWithStatus[]> {
  // Get cached data immediately
  const lakes = await getLakesWithStatus();
  
  // Check if data is stale
  const stale = await isDataStale();
  
  if (stale) {
    // Refresh in background (don't await)
    onRefreshStart?.();
    refreshIceData().then((result) => {
      onRefreshComplete?.(result.success);
    });
  }
  
  return lakes;
}