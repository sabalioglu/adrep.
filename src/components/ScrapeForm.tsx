import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface ScrapeFormProps {
  onJobStarted: (jobId: string) => void;
}

export function ScrapeForm({ onJobStarted }: ScrapeFormProps) {
  const [platform, setPlatform] = useState<'facebook' | 'tiktok'>('facebook');
  const [searchType, setSearchType] = useState<'keyword' | 'url'>('keyword');
  const [searchQuery, setSearchQuery] = useState('');
  const [maxResults, setMaxResults] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scrape-ads`;

      const requestBody = searchType === 'url'
        ? { platform, pageUrl: searchQuery, maxResults }
        : { platform, searchQuery, maxResults };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to start scraping job');
      }

      onJobStarted(data.jobId);
      setSearchQuery('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
          <Search className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Scrape Competitor Ads</h2>
          <p className="text-sm text-gray-600">Search for ads from Facebook or TikTok ad libraries</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPlatform('facebook')}
              className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                platform === 'facebook'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              Facebook
            </button>
            <button
              type="button"
              onClick={() => setPlatform('tiktok')}
              className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                platform === 'tiktok'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              TikTok
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Search Type</label>
          <div className="flex gap-3 mb-4">
            <button
              type="button"
              onClick={() => setSearchType('keyword')}
              className={`flex-1 py-2 px-4 rounded-lg border-2 font-medium text-sm transition-all ${
                searchType === 'keyword'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              Keyword Search
            </button>
            <button
              type="button"
              onClick={() => setSearchType('url')}
              className={`flex-1 py-2 px-4 rounded-lg border-2 font-medium text-sm transition-all ${
                searchType === 'url'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              Page URL
            </button>
          </div>
          <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 mb-2">
            {searchType === 'keyword' ? 'Search Query' : 'Ad Library Page URL'}
          </label>
          <input
            type="text"
            id="searchQuery"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              searchType === 'keyword'
                ? 'Enter brand name, keyword, or advertiser...'
                : 'Paste Facebook Ad Library URL...'
            }
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            required
          />
          {searchType === 'url' && (
            <p className="text-xs text-gray-500 mt-2">
              Example: https://www.facebook.com/ads/library/?active_status=active&search_type=page&view_all_page_id=...
            </p>
          )}
        </div>

        <div>
          <label htmlFor="maxResults" className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Results: {maxResults}
          </label>
          <input
            type="range"
            id="maxResults"
            min="10"
            max="100"
            step="10"
            value={maxResults}
            onChange={(e) => setMaxResults(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>10</span>
            <span>100</span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !searchQuery.trim()}
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Starting Scrape...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Start Scraping
            </>
          )}
        </button>
      </form>
    </div>
  );
}
