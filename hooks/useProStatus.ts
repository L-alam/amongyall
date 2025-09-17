// hooks/useProStatus.ts
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export interface ProStatus {
  isPro: boolean;
  proExpiresAt: string | null;
  proActivatedAt: string | null;
  proCancelledAt: string | null;
  isLoading: boolean;
}

export const useProStatus = (): ProStatus => {
  const { user, isLoading: authLoading } = useAuth();
  const [proStatus, setProStatus] = useState<ProStatus>({
    isPro: false,
    proExpiresAt: null,
    proActivatedAt: null,
    proCancelledAt: null,
    isLoading: true,
  });

  const fetchProStatus = async () => {
    if (!user?.id) {
      setProStatus({
        isPro: false,
        proExpiresAt: null,
        proActivatedAt: null,
        proCancelledAt: null,
        isLoading: false,
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('is_pro, pro_expires_at, pro_activated_at, pro_cancelled_at')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching pro status:', error);
        setProStatus(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Check if pro subscription is still valid
      const now = new Date();
      const expiresAt = data.pro_expires_at ? new Date(data.pro_expires_at) : null;
      const isProValid = data.is_pro && (!expiresAt || expiresAt > now);

      setProStatus({
        isPro: isProValid,
        proExpiresAt: data.pro_expires_at,
        proActivatedAt: data.pro_activated_at,
        proCancelledAt: data.pro_cancelled_at,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error checking pro status:', error);
      setProStatus(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchProStatus();
    }
  }, [user?.id, authLoading]);

  // Subscribe to real-time changes in user_profiles
  useEffect(() => {
    if (!user?.id) return;

    const subscription = supabase
      .channel('user_profiles_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Pro status updated:', payload);
          fetchProStatus();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  return proStatus;
};