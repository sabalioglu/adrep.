import { useState } from 'react';
import { Zap, Eye } from 'lucide-react';
import { ScrapeForm } from '../components/ScrapeForm';
import { JobStatus } from '../components/JobStatus';
import { useScrapedAds } from '../hooks/useScrapedAds';
import { AdCard } from '../components/AdCard';

export function ScrapingPage() {
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const { ads, loading, refetch } = useScrapedAds(false);

  function handleJobStarted(jobId: string) {
    setCurrentJobId(jobId);
  }

  function handleJobCompleted() {
    setCurrentJobId(null);
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

    alert('✨ Analysis complete! Check the "Deep Analysis" page to view full insights and AI prompts.');

    return data;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-8 border border-blue-200">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-blue-900">Automated Scraping</h2>
            <p className="text-blue-700">Collect ads from Facebook & TikTok ad libraries</p>
          </div>
        </div>
        <p className="text-sm text-blue-800 leading-relaxed">
          Enter a search query to scrape competitor ads from major ad platforms.
          The system will automatically collect ad creatives, copy, targeting information, and performance metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ScrapeForm onJobStarted={handleJobStarted} />
        </div>
        <div>
          {currentJobId && (
            <JobStatus jobId={currentJobId} onCompleted={handleJobCompleted} />
          )}
        </div>
      </div>

      {ads.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Eye className="w-6 h-6 text-blue-600" />
              Scraped Ads
            </h3>
            <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
              <span className="text-sm font-semibold text-gray-900">{ads.length}</span>
              <span className="text-sm text-gray-600 ml-1">total ads</span>
            </div>
          </div>

          <div className="grid gap-6">
            {ads.map((ad) => (
              <div key={ad.id} className="relative">
                <AdCard ad={ad} onAnalyze={handleAnalyze} onRefetch={refetch} />
                {ad.analyzed && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg">
                      ✓ ANALYZED
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && ads.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <Zap className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">No ads yet</h4>
          <p className="text-gray-600">Start scraping to collect competitor ads</p>
        </div>
      )}
    </div>
  );
}
