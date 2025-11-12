import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, Image, FileText, Sparkles, Loader2, TrendingUp, Clock, Users, Target, Info, ExternalLink, Calendar, Hash, Brain, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { ScrapedAd, AdAnalysis, GeneratedPrompt } from '../types';

interface AdCardProps {
  ad: ScrapedAd;
  onAnalyze: (adId: string) => Promise<{ analysis: AdAnalysis; prompts: GeneratedPrompt }>;
  onRefetch?: () => void;
}

export function AdCard({ ad, onAnalyze, onRefetch }: AdCardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeepAnalysis, setShowDeepAnalysis] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [deepAnalyzing, setDeepAnalyzing] = useState(false);

  const currentPage = location.pathname;

  function replacePlaceholders(text: string): string {
    if (!text) return text;

    let result = text;

    if (ad.raw_data?.snapshot?.cards?.[0]) {
      const card = ad.raw_data.snapshot.cards[0];

      if (card.title) {
        result = result.replace(/\{\{product\.name\}\}/g, card.title);
      }

      if (card.body) {
        result = result.replace(/\{\{product\.brand\}\}/g, card.body);
      }
    }

    if (ad.advertiser_name && ad.advertiser_name !== 'Unknown Advertiser') {
      result = result.replace(/\{\{product\.brand\}\}/g, ad.advertiser_name);
    }

    if (ad.title) {
      result = result.replace(/\{\{product\.name\}\}/g, ad.title);
    }

    result = result.replace(/\{\{[^}]+\}\}/g, '');

    return result;
  }

  const displayAdCopy = replacePlaceholders(ad.ad_copy);
  const displayTitle = replacePlaceholders(ad.title || '');

  async function handleAnalyze() {
    if (currentPage === '/analysis') {
      setAnalyzing(true);
      try {
        await onAnalyze(ad.id);
        setExpanded(true);
      } catch (err) {
        console.error('Error analyzing ad:', err);
      } finally {
        setAnalyzing(false);
      }
    } else {
      navigate(`/analysis?adId=${ad.id}`);
    }
  }

  async function handleDeepAnalysis() {
    setDeepAnalyzing(true);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deep-analyze-ad`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adId: ad.id }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to perform deep analysis');
      }

      // Refresh the ad data to get the updated deep_analysis
      if (onRefetch) {
        setTimeout(() => {
          onRefetch();
        }, 500);
      }

      setShowDeepAnalysis(true);
      alert('✨ Deep analysis complete! Click "Show Results" to view the detailed breakdown.');
    } catch (err) {
      console.error('Error performing deep analysis:', err);
      alert('Failed to perform deep analysis. Please try again.');
    } finally {
      setDeepAnalyzing(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {(ad.thumbnail || ad.download_url) && (
        <div className="relative bg-gray-900">
          {ad.type === 'video' && ad.download_url ? (
            <video
              src={ad.download_url}
              poster={ad.thumbnail}
              controls
              className="w-full max-h-96 object-contain"
            />
          ) : (
            <img
              src={ad.thumbnail || ad.ad_creative_url}
              alt={ad.advertiser_name}
              className="w-full max-h-96 object-contain"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3C/svg%3E';
              }}
            />
          )}
          {ad.download_url && (
            <a
              href={ad.download_url}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="absolute bottom-4 right-4 px-4 py-2 bg-white/90 hover:bg-white text-gray-900 rounded-lg font-medium text-sm shadow-lg transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </a>
          )}
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start gap-4">

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">{ad.advertiser_name || 'Unknown Advertiser'}</h3>
                {displayTitle && <p className="text-sm text-gray-600">{displayTitle}</p>}
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full flex-shrink-0">
                  {ad.platform}
                </span>
                {ad.performance_score !== undefined && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-green-600">
                    <TrendingUp className="w-3 h-3" />
                    {ad.performance_score}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3 text-xs text-gray-600">
              {ad.active_hours !== undefined && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {ad.active_hours}h active
                </div>
              )}
              {ad.variants !== undefined && ad.variants > 1 && (
                <div className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  {ad.variants} variants
                </div>
              )}
              {ad.page_likes !== undefined && ad.page_likes > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {ad.page_likes.toLocaleString()} likes
                </div>
              )}
            </div>

            {displayAdCopy && (
              <p className="text-sm text-gray-700 line-clamp-3 mb-3">
                {displayAdCopy}
              </p>
            )}

            {ad.cta_text && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 mb-3">
                <Eye className="w-4 h-4" />
                {ad.cta_text}
              </div>
            )}

            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                    showDetails
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Info className="w-4 h-4" />
                  Details
                </button>

                {currentPage !== '/analysis' && (
                  <button
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-semibold rounded-lg hover:from-green-700 hover:to-green-800 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all shadow-md"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="w-5 h-5" />
                        Analyze
                      </>
                    )}
                  </button>
                )}
              </div>

              {currentPage === '/analysis' && (
                <div className="flex gap-2 flex-wrap">
                  {ad.type === 'video' && ad.download_url && !ad.deep_analysis && (
                    <button
                      onClick={handleDeepAnalysis}
                      disabled={deepAnalyzing}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-semibold rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all shadow-md"
                    >
                      {deepAnalyzing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Analyzing Video...
                        </>
                      ) : (
                        <>
                          <Eye className="w-5 h-5" />
                          Deep Analysis
                        </>
                      )}
                    </button>
                  )}

                  {ad.deep_analysis && (
                    <div className="flex-1 flex gap-2">
                      <button
                        onClick={() => setShowDeepAnalysis(!showDeepAnalysis)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-100 text-purple-700 text-sm font-semibold rounded-lg hover:bg-purple-200 transition-colors"
                      >
                        {showDeepAnalysis ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        {showDeepAnalysis ? 'Hide' : 'Show'} Results
                      </button>
                      <button
                        onClick={handleDeepAnalysis}
                        disabled={deepAnalyzing}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-orange-100 text-orange-700 text-sm font-semibold rounded-lg hover:bg-orange-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {deepAnalyzing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Re-analyzing...
                          </>
                        ) : (
                          <>
                            <Brain className="w-4 h-4" />
                            Re-analyze
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => navigate('/create-ad', { state: { ad } })}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-semibold rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-md"
                      >
                        <Copy className="w-5 h-5" />
                        REPLICATE
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="border-t border-gray-200 bg-gray-50 p-6">
          <h4 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <Info className="w-5 h-5 text-blue-600" />
            Ad Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">ID</p>
              <p className="text-sm text-gray-900 font-mono break-all">{ad.ad_id || ad.id}</p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Platform</p>
              <p className="text-sm text-gray-900 font-medium">{ad.platform}</p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Type</p>
              <p className="text-sm text-gray-900 font-medium capitalize">{ad.type || 'N/A'}</p>
            </div>

            {ad.url && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Ad URL</p>
                <a href={ad.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 truncate">
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">View Ad</span>
                </a>
              </div>
            )}

            {ad.download_url && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Download URL</p>
                <a href={ad.download_url} target="_blank" rel="noopener noreferrer" download className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 truncate">
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">Download Media</span>
                </a>
              </div>
            )}

            {ad.landing_url && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Landing URL</p>
                <a href={ad.landing_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 truncate">
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">Visit Landing Page</span>
                </a>
              </div>
            )}

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Active Status</p>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                ad.active_status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {ad.active_status || 'Unknown'}
              </span>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Active Hours</p>
              <p className="text-sm text-gray-900 font-medium">{ad.active_hours || 0}h ({Math.round((ad.active_hours || 0) / 24)}d)</p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Variants</p>
              <p className="text-sm text-gray-900 font-medium">{ad.variants || 1}</p>
            </div>

            {ad.platforms_used && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Platforms Used</p>
                <p className="text-sm text-gray-900">{ad.platforms_used}</p>
              </div>
            )}

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Page Likes</p>
              <p className="text-sm text-gray-900 font-medium">{ad.page_likes?.toLocaleString() || 0}</p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Verified</p>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                ad.verified === 'Yes' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {ad.verified || 'No'}
              </span>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Performance Score</p>
              <p className="text-2xl text-green-600 font-bold">{ad.performance_score || 0}</p>
            </div>

            {ad.est_reach && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Est. Reach</p>
                <p className="text-sm text-gray-900">{ad.est_reach}</p>
              </div>
            )}

            {ad.ad_format && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Ad Format</p>
                <p className="text-sm text-gray-900">{ad.ad_format}</p>
              </div>
            )}

            {ad.created_at && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Created At</p>
                <p className="text-sm text-gray-900 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(ad.created_at).toLocaleDateString()}
                </p>
              </div>
            )}

            {ad.scraped_at && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Scraped At</p>
                <p className="text-sm text-gray-900 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(ad.scraped_at).toLocaleDateString()}
                </p>
              </div>
            )}

            {ad.advertiser_name && (
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Author</p>
                <p className="text-sm text-gray-900 font-medium">{ad.advertiser_name}</p>
              </div>
            )}
          </div>

          {ad.hashtags && (
            <div className="mt-4 bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Hash className="w-4 h-4" />
                Hashtags
              </p>
              <div className="flex flex-wrap gap-2">
                {ad.hashtags.split(', ').filter(tag => tag).map((tag, idx) => (
                  <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {displayAdCopy && (
            <div className="mt-4 bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Full Caption</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{displayAdCopy}</p>
            </div>
          )}
        </div>
      )}

      {expanded && ad.ai_prompts && (
        <div className="border-t border-gray-200 bg-gradient-to-br from-green-50 to-blue-50 p-6 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-green-600" />
            <h4 className="text-lg font-semibold text-gray-900">AI-Generated Marketing Prompts</h4>
          </div>

          {Object.entries(ad.ai_prompts).map(([key, value]) => (
            <div key={key} className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm">
              <h5 className="text-sm font-bold text-blue-700 uppercase tracking-wide mb-3">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </h5>
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {value as string}
              </div>
            </div>
          ))}

          {ad.analyzed_at && (
            <div className="text-xs text-gray-500 italic">
              Analyzed: {new Date(ad.analyzed_at).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {showDeepAnalysis && ad.deep_analysis && (
        <div className="border-t border-gray-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-6 h-6 text-purple-600" />
            <h4 className="text-xl font-bold text-gray-900">Deep Frame-by-Frame Analysis</h4>
          </div>

          <details className="bg-white rounded-lg border border-purple-200 shadow-sm overflow-hidden">
            <summary className="px-5 py-4 cursor-pointer hover:bg-purple-50 transition-colors flex items-center justify-between font-semibold text-gray-900">
              <span className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-600" />
                Video Concept & Strategy
              </span>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </summary>
            <div className="px-5 py-4 border-t border-purple-100 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {ad.deep_analysis.concept}
            </div>
          </details>

          <details className="bg-white rounded-lg border border-purple-200 shadow-sm overflow-hidden">
            <summary className="px-5 py-4 cursor-pointer hover:bg-purple-50 transition-colors flex items-center justify-between font-semibold text-gray-900">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                Caption Analysis
              </span>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </summary>
            <div className="px-5 py-4 border-t border-purple-100 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {ad.deep_analysis.captionAnalysis}
            </div>
          </details>

          <details className="bg-white rounded-lg border border-purple-200 shadow-sm overflow-hidden">
            <summary className="px-5 py-4 cursor-pointer hover:bg-purple-50 transition-colors flex items-center justify-between font-semibold text-gray-900">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                Title Analysis
              </span>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </summary>
            <div className="px-5 py-4 border-t border-purple-100 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {ad.deep_analysis.titleAnalysis}
            </div>
          </details>

          <details className="bg-white rounded-lg border border-purple-200 shadow-sm overflow-hidden">
            <summary className="px-5 py-4 cursor-pointer hover:bg-purple-50 transition-colors flex items-center justify-between font-semibold text-gray-900">
              <span className="flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-600" />
                CTA Analysis
              </span>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </summary>
            <div className="px-5 py-4 border-t border-purple-100 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {ad.deep_analysis.ctaAnalysis}
            </div>
          </details>

          <details className="bg-white rounded-lg border border-purple-200 shadow-sm overflow-hidden">
            <summary className="px-5 py-4 cursor-pointer hover:bg-purple-50 transition-colors flex items-center justify-between font-semibold text-gray-900">
              <span className="flex items-center gap-2">
                <Image className="w-4 h-4 text-purple-600" />
                Frame-by-Frame Breakdown
              </span>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </summary>
            <div className="px-5 py-4 border-t border-purple-100 space-y-4">
              {ad.deep_analysis.frames?.map((frame: any, idx: number) => (
                <div key={idx} className="border-l-4 border-purple-400 pl-4">
                  <p className="text-xs font-bold text-purple-600 mb-1">
                    {frame.timestamp || `Frame ${idx + 1}`}
                  </p>
                  <p className="text-sm text-gray-700">{frame.description}</p>
                </div>
              ))}
            </div>
          </details>

          <details className="bg-white rounded-lg border border-purple-200 shadow-sm overflow-hidden">
            <summary className="px-5 py-4 cursor-pointer hover:bg-purple-50 transition-colors flex items-center justify-between font-semibold text-gray-900">
              <span className="flex items-center gap-2">
                <Copy className="w-4 h-4 text-purple-600" />
                Detailed Replication Guide
              </span>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </summary>
            <div className="px-5 py-4 border-t border-purple-100 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {ad.deep_analysis.replicationPrompts}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
