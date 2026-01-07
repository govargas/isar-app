import { useEffect, useCallback, useRef } from 'react';
import { useIceStore } from '@/stores/iceStore';
import {
  getLakesWithStatus,
  subscribeToIceUpdates,
  subscribeToUserReports,
  supabase,
  isDataStale,
  refreshIceData,
} from '@/lib/supabase';
import { MOCK_LAKES, isMockMode } from '@/lib/mockData';
import type { LakeWithStatus } from '@/types';
import { toast } from 'sonner';

export function useIceData() {
  const {
    lakes,
    loading,
    error,
    setLakes,
    updateLake,
    setLoading,
    setError,
  } = useIceStore();
  
  const hasAutoRefreshed = useRef(false);

  // Fetch initial data
  const fetchLakes = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Use mock data if Supabase is not configured
    if (isMockMode()) {
      console.log('Using mock data (Supabase not configured)');
      setLakes(MOCK_LAKES);
      setLoading(false);
      return;
    }

    try {
      const data = await getLakesWithStatus();
      setLakes(data);
      
      // Stale-while-revalidate: Check if data is stale and auto-refresh once
      if (!hasAutoRefreshed.current) {
        const stale = await isDataStale();
        if (stale) {
          hasAutoRefreshed.current = true;
          console.log('Data is stale, auto-refreshing in background...');
          toast.loading('Updating ice conditions...', { id: 'auto-refresh', duration: 10000 });
          
          // Refresh in background
          refreshIceData().then(async (result) => {
            if (result.success) {
              toast.success('Ice conditions updated!', { id: 'auto-refresh' });
              // Refetch to show new data
              const freshData = await getLakesWithStatus();
              setLakes(freshData);
            } else {
              toast.dismiss('auto-refresh');
            }
          });
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch lakes';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [setLakes, setLoading, setError]);

  // Set up realtime subscriptions
  useEffect(() => {
    // Initial fetch
    fetchLakes();

    // Skip subscriptions in mock mode
    if (isMockMode()) {
      return;
    }

    // Subscribe to ice report updates
    const iceChannel = subscribeToIceUpdates(async (payload) => {
      if (payload.new) {
        // Refetch the specific lake to get updated status
        const { data } = await supabase
          .from('lake_current_status')
          .select('*')
          .eq('id', payload.new.lake_id)
          .single();

        if (data) {
          updateLake(data as LakeWithStatus);
          toast.success(`${data.name} status updated!`, {
            description: `New status: ${data.status}`,
          });
        }
      }
    });

    // Subscribe to user report updates
    const userChannel = subscribeToUserReports(async (payload) => {
      if (payload.new) {
        // Refetch to update report count
        const { data } = await supabase
          .from('lake_current_status')
          .select('*')
          .eq('id', payload.new.lake_id)
          .single();

        if (data) {
          updateLake(data as LakeWithStatus);
          toast.info('New community report added!');
        }
      }
    });

    // Cleanup subscriptions
    return () => {
      iceChannel.unsubscribe();
      userChannel.unsubscribe();
    };
  }, [fetchLakes, updateLake]);

  return {
    lakes,
    loading,
    error,
    refetch: fetchLakes,
  };
}

