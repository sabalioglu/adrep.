import { TrendingUp, Clock, Target, Award, Video, Image as ImageIcon, Hash, ExternalLink } from 'lucide-react';
import { ScrapedAd } from '../types';

interface AggregateInsightsProps {
  ads: ScrapedAd[];
}

export function AggregateInsights({ ads }: AggregateInsightsProps) {
  if (ads.length === 0) return null;

  const videoAds = ads.filter(ad => ad.type === 'video');
  const imageAds = ads.filter(ad => ad.type === 'image');

  const longestRunning = [...ads]
    .sort((a, b) => (b.active_hours || 0) - (a.active_hours || 0))
    .slice(0, 5);

  const mostTested = [...ads]
    .sort((a, b) => (b.variants || 0) - (a.variants || 0))
    .slice(0, 5);

  const topPerformers = [...ads]
    .sort((a, b) => (b.performance_score || 0) - (a.performance_score || 0))
    .slice(0, 5);

  const ctaAnalysis = ads.reduce((acc, ad) => {
    if (ad.cta_text) {
      acc[ad.cta_text] = (acc[ad.cta_text] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const topCTAs = Object.entries(ctaAnalysis)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const platformDistribution = ads.reduce((acc, ad) => {
    if (ad.platforms_used) {
      ad.platforms_used.split(', ').forEach(platform => {
        acc[platform] = (acc[platform] || 0) + 1;
      });
    }
    return acc;
  }, {} as Record<string, number>);

  const allHashtags = ads
    .filter(ad => ad.hashtags)
    .flatMap(ad => ad.hashtags!.split(', '))
    .filter(tag => tag);

  const hashtagFrequency = allHashtags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topHashtags = Object.entries(hashtagFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const avgActiveHours = ads.length > 0
    ? Math.round(ads.reduce((sum, ad) => sum + (ad.active_hours || 0), 0) / ads.length)
    : 0;

  const avgVariants = ads.length > 0
    ? (ads.reduce((sum, ad) => sum + (ad.variants || 1), 0) / ads.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Aggregate Analysis</h2>
        <p className="text-blue-100">Comprehensive insights across all {ads.length} scraped ads</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Video className="w-8 h-8 text-blue-600" />
            <span className="text-3xl font-bold text-gray-900">{videoAds.length}</span>
          </div>
          <p className="text-sm text-gray-600">Video Ads</p>
          <p className="text-xs text-gray-500 mt-1">{((videoAds.length / ads.length) * 100).toFixed(0)}% of total</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <ImageIcon className="w-8 h-8 text-green-600" />
            <span className="text-3xl font-bold text-gray-900">{imageAds.length}</span>
          </div>
          <p className="text-sm text-gray-600">Image Ads</p>
          <p className="text-xs text-gray-500 mt-1">{((imageAds.length / ads.length) * 100).toFixed(0)}% of total</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-orange-600" />
            <span className="text-3xl font-bold text-gray-900">{avgActiveHours}h</span>
          </div>
          <p className="text-sm text-gray-600">Avg Active Time</p>
          <p className="text-xs text-gray-500 mt-1">~{Math.round(avgActiveHours / 24)} days</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Target className="w-8 h-8 text-purple-600" />
            <span className="text-3xl font-bold text-gray-900">{avgVariants}</span>
          </div>
          <p className="text-sm text-gray-600">Avg Variants</p>
          <p className="text-xs text-gray-500 mt-1">Per ad creative</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Top Performing Ads
          </h3>
          <div className="space-y-3">
            {topPerformers.map((ad, idx) => (
              <div key={ad.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {idx + 1}
                </div>
                {ad.thumbnail && (
                  <img src={ad.thumbnail} alt="" className="w-12 h-12 rounded object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{ad.advertiser_name}</p>
                  <p className="text-xs text-gray-600 truncate">{ad.title || ad.ad_copy?.substring(0, 40)}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">{ad.performance_score}</p>
                  <p className="text-xs text-gray-500">score</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <Clock className="w-5 h-5 text-orange-600" />
            Longest Running Ads
          </h3>
          <div className="space-y-3">
            {longestRunning.map((ad, idx) => (
              <div key={ad.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {idx + 1}
                </div>
                {ad.thumbnail && (
                  <img src={ad.thumbnail} alt="" className="w-12 h-12 rounded object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{ad.advertiser_name}</p>
                  <p className="text-xs text-gray-600 truncate">{ad.title || ad.ad_copy?.substring(0, 40)}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-orange-600">{ad.active_hours}h</p>
                  <p className="text-xs text-gray-500">{Math.round((ad.active_hours || 0) / 24)}d</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <Target className="w-5 h-5 text-purple-600" />
            Most Tested Ads
          </h3>
          <div className="space-y-3">
            {mostTested.map((ad, idx) => (
              <div key={ad.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {idx + 1}
                </div>
                {ad.thumbnail && (
                  <img src={ad.thumbnail} alt="" className="w-12 h-12 rounded object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{ad.advertiser_name}</p>
                  <p className="text-xs text-gray-600 truncate">{ad.title || ad.ad_copy?.substring(0, 40)}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-purple-600">{ad.variants}</p>
                  <p className="text-xs text-gray-500">variants</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <Award className="w-5 h-5 text-blue-600" />
            Top CTAs
          </h3>
          <div className="space-y-3">
            {topCTAs.map(([cta, count], idx) => (
              <div key={cta} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {idx + 1}
                  </div>
                  <p className="text-sm font-medium text-gray-900">{cta}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">{count}</p>
                  <p className="text-xs text-gray-500">ads</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {topHashtags.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <Hash className="w-5 h-5 text-blue-600" />
            Popular Hashtags
          </h3>
          <div className="flex flex-wrap gap-2">
            {topHashtags.map(([tag, count]) => (
              <div key={tag} className="px-3 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                {tag} <span className="text-blue-500">({count})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {Object.keys(platformDistribution).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-4">
            <ExternalLink className="w-5 h-5 text-blue-600" />
            Platform Distribution
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Object.entries(platformDistribution).map(([platform, count]) => (
              <div key={platform} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-sm text-gray-600 mt-1">{platform}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
