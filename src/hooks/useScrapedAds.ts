import { useEffect, useState } from 'react';
import { ScrapedAd } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useScrapedAds(onlyAnalyzed: boolean = false) {
  const [ads, setAds] = useState<ScrapedAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAds();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchAds, 5000);
    
    return () => clearInterval(interval);
  }, [onlyAnalyzed]);

  async function fetchAds() {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/ads${onlyAnalyzed ? '?analyzed=true' : ''}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch ads');
      }
      
      const data = await response.json();
      setAds(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return { ads, loading, error, refetch: fetchAds };
}
