import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ScrapedAd } from '../types';

export function useScrapedAds(onlyAnalyzed: boolean = false) {
  const [ads, setAds] = useState<ScrapedAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAds();

    const subscription = supabase
      .channel('scraped_ads_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scraped_ads' }, () => {
        fetchAds();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [onlyAnalyzed]);

  async function fetchAds() {
    try {
      setLoading(true);
      let query = supabase
        .from('scraped_ads')
        .select('*')
        .order('scraped_at', { ascending: false });

      if (onlyAnalyzed) {
        query = query.eq('analyzed', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAds(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return { ads, loading, error, refetch: fetchAds };
}
