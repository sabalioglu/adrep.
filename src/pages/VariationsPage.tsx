import { TrendingUp, Sparkles } from 'lucide-react';
import { useScrapedAds } from '../hooks/useScrapedAds';

export function VariationsPage() {
  const { ads, loading } = useScrapedAds();
  const analyzedAds = ads.filter(ad => ad.ai_prompts);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-8 border border-purple-200">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-purple-900">Generate Variations</h2>
            <p className="text-purple-700">Prompts & copy variations instantly</p>
          </div>
        </div>
        <p className="text-sm text-purple-800 leading-relaxed">
          Access AI-generated prompts and copy variations for all analyzed ads.
          Create multiple versions with different tones, styles, and targeting approaches.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Generated Variations</h3>
          <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm">
            <span className="text-sm font-semibold text-gray-900">{analyzedAds.length}</span>
            <span className="text-sm text-gray-600 ml-1">analyzed ads</span>
          </div>
        </div>

        {loading && analyzedAds.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : analyzedAds.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No variations yet</h4>
            <p className="text-gray-600 max-w-md mx-auto">
              Analyze ads on the Analysis page to generate prompts and variations.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {analyzedAds.map((ad) => (
              <div key={ad.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg mb-1">
                        {ad.advertiser_name || 'Unknown Advertiser'}
                      </h4>
                      {ad.title && <p className="text-sm text-gray-600">{ad.title}</p>}
                    </div>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full flex-shrink-0">
                      {ad.platform}
                    </span>
                  </div>
                  {ad.ad_copy && (
                    <p className="text-sm text-gray-700 mt-3 line-clamp-2">{ad.ad_copy}</p>
                  )}
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <h5 className="text-lg font-semibold text-gray-900">AI-Generated Prompts & Variations</h5>
                  </div>

                  {ad.ai_prompts && Object.entries(ad.ai_prompts).map(([key, value]) => (
                    <div key={key} className="bg-white rounded-lg p-5 border border-purple-200 shadow-sm">
                      <h6 className="text-sm font-bold text-purple-700 uppercase tracking-wide mb-3">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </h6>
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
