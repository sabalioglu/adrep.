import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { AdCard } from '../components/AdCard';
import { useScrapedAds } from '../hooks/useScrapedAds';
import { supabase } from '../lib/supabase';

export function AnalysisPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { ads, loading, refetch } = useScrapedAds(true);
  const hasAnalyzed = useRef(false);

  useEffect(() => {
    const adId = searchParams.get('adId');
    if (adId && !hasAnalyzed.current) {
      hasAnalyzed.current = true;
      analyzeNewAd(adId);
    }
  }, [searchParams]);

  async function analyzeNewAd(adId: string) {
    try {
      await supabase
        .from('scraped_ads')
        .update({ analyzed: true })
        .eq('id', adId);

      await handleAnalyze(adId);

      setSearchParams({});

      setTimeout(() => {
        refetch();
      }, 500);
    } catch (error) {
      console.error('Error analyzing ad:', error);
    }
  }

  async function handleAnalyze(adId: string) {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-ad`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ adId }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      const errorMessage = data.error || 'Failed to analyze ad';
      throw new Error(errorMessage);
    }

    setTimeout(() => {
      refetch();
    }, 500);

    return data;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-8 border border-green-200">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-green-900">Deep Analysis</h2>
            <p className="text-green-700">Visual, copy, tone & audience insights</p>
          </div>
        </div>
        <p className="text-sm text-green-800 leading-relaxed">
          AI-powered analysis of ad creatives, including visual elements, copywriting style, tone,
          target audience identification, and strategic recommendations. For video ads, get frame-by-frame breakdowns.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Collected Ads</h3>
          <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
            <span className="text-sm font-semibold text-gray-900">{ads.length}</span>
            <span className="text-sm text-gray-600 ml-1">ads</span>
          </div>
        </div>

        {loading && ads.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Brain className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600">Loading ads...</p>
          </div>
        ) : ads.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Brain className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No ads yet</h4>
            <p className="text-gray-600 max-w-md mx-auto">
              Go to the Scraping page to collect competitor ads first.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {ads.map((ad) => (
              <AdCard key={ad.id} ad={ad} onAnalyze={handleAnalyze} onRefetch={refetch} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
