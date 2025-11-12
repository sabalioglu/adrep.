import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Copy, Loader2, Sparkles, Eye, FileText, Video, Play, CheckCircle, XCircle, Clock, Target } from 'lucide-react';
import { ScrapedAd } from '../types';

export function CreateAdPage() {
  const location = useLocation();
  const sourceAd = location.state?.ad as ScrapedAd | undefined;

  function replacePlaceholders(text: string): string {
    if (!text || !sourceAd) return text;

    let result = text;

    if (sourceAd.raw_data?.snapshot?.cards?.[0]) {
      const card = sourceAd.raw_data.snapshot.cards[0];
      if (card.title) {
        result = result.replace(/\{\{product\.name\}\}/g, card.title);
      }
      if (card.body) {
        result = result.replace(/\{\{product\.brand\}\}/g, card.body);
      }
    }

    if (sourceAd.advertiser_name && sourceAd.advertiser_name !== 'Unknown Advertiser') {
      result = result.replace(/\{\{product\.brand\}\}/g, sourceAd.advertiser_name);
    }

    if (sourceAd.title) {
      result = result.replace(/\{\{product\.name\}\}/g, sourceAd.title);
    }

    result = result.replace(/\{\{[^}]+\}\}/g, '');

    return result;
  }

  const [formData, setFormData] = useState({
    salesPointUrl: '',
    brandName: '',
    productDescription: '',
    keyBenefit: '',
    targetAudience: 'Women',
    ageRange: '25-34',
    category: 'Beauty & Skincare',
  });
  const [productImage, setProductImage] = useState<File | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedAd, setGeneratedAd] = useState<any>(null);
  const [videoGenerating, setVideoGenerating] = useState(false);
  const [videoTaskId, setVideoTaskId] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<'waiting' | 'success' | 'fail' | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoPrompt, setVideoPrompt] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProductImage(file);

      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  useEffect(() => {
    if (!videoTaskId || videoStatus === 'success' || videoStatus === 'fail') {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-video-status`;
        const response = await fetch(`${apiUrl}?taskId=${videoTaskId}`, {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        });

        const data = await response.json();

        if (data.success && data.data) {
          setVideoStatus(data.data.state);

          if (data.data.state === 'success') {
            setVideoUrl(data.data.task?.result_url || null);
            setVideoGenerating(false);
          } else if (data.data.state === 'fail') {
            setVideoGenerating(false);
            alert('Video generation failed. Please try again.');
          }
        }
      } catch (error) {
        console.error('Error polling video status:', error);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [videoTaskId, videoStatus]);

  async function handleGenerateVideo() {
    if (!uploadedImageUrl) {
      alert('Please upload a product image first');
      return;
    }

    if (!videoPrompt.trim()) {
      alert('Please enter a video prompt');
      return;
    }

    setVideoGenerating(true);
    setVideoStatus('waiting');
    setVideoUrl(null);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-video-sora`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: videoPrompt,
          imageUrl: uploadedImageUrl,
          aspectRatio: 'landscape',
          nFrames: '10',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to start video generation');
      }

      setVideoTaskId(data.data.taskId);
    } catch (error) {
      console.error('Error generating video:', error);
      alert('Failed to start video generation. Please try again.');
      setVideoGenerating(false);
      setVideoStatus(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!productImage) {
      alert('Please upload a product image');
      return;
    }

    setGenerating(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(productImage);

      reader.onload = async () => {
        const base64Image = reader.result as string;

        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-custom-ad`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            productImage: base64Image,
            sourceAdAnalysis: sourceAd?.deep_analysis || null,
            sourceAdId: sourceAd?.id || null,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to generate ad');
        }

        setGeneratedAd(data.ad);
        alert('✨ Your custom ad has been generated! Check the results below.');

      };
    } catch (error) {
      console.error('Error generating ad:', error);
      alert('Failed to generate ad. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-8 border border-orange-200">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
            <Copy className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-orange-900">Create Your Ad</h2>
            <p className="text-orange-700">Clone successful ad strategies for your product</p>
          </div>
        </div>
        <p className="text-sm text-orange-800 leading-relaxed">
          {sourceAd
            ? `Replicating strategies from ${sourceAd.advertiser_name}'s successful ad. Fill in your product details below.`
            : 'Create a high-performing ad based on proven strategies. Fill in your product details below.'}
        </p>
      </div>

      {sourceAd && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-orange-600" />
            Source Ad Reference
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {sourceAd.media_url && (
              <div className="lg:col-span-1">
                {sourceAd.type === 'video' ? (
                  <video
                    src={sourceAd.media_url}
                    controls
                    className="w-full rounded-lg border border-gray-200"
                  />
                ) : (
                  <img
                    src={sourceAd.media_url}
                    alt="Ad creative"
                    className="w-full rounded-lg border border-gray-200"
                  />
                )}
              </div>
            )}
            <div className="lg:col-span-2 space-y-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Advertiser</p>
                <p className="text-gray-900 font-medium">{sourceAd.advertiser_name}</p>
              </div>
              {sourceAd.title && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Title</p>
                  <p className="text-gray-900">{replacePlaceholders(sourceAd.title)}</p>
                </div>
              )}
              {sourceAd.ad_copy && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Caption</p>
                  <p className="text-gray-900 line-clamp-3">{replacePlaceholders(sourceAd.ad_copy)}</p>
                </div>
              )}
              {sourceAd.cta_text && (
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">CTA</p>
                  <p className="text-gray-900 font-medium">{replacePlaceholders(sourceAd.cta_text)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Sales Point URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              name="salesPointUrl"
              value={formData.salesPointUrl}
              onChange={handleChange}
              placeholder="Amazon, Etsy, eBay, Walmart, Shopify, etc."
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Where customers can purchase your product</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Brand Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="brandName"
              value={formData.brandName}
              onChange={handleChange}
              placeholder="Nike, Reebok, etc."
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description Of Your Product <span className="text-red-500">*</span>
            </label>
            <textarea
              name="productDescription"
              value={formData.productDescription}
              onChange={handleChange}
              placeholder="Describe your product in as much detail as possible..."
              required
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Key Benefit <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="keyBenefit"
              value={formData.keyBenefit}
              onChange={handleChange}
              placeholder="Fast Results, Smooth Skin, etc."
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Your Target Audience <span className="text-red-500">*</span>
              </label>
              <select
                name="targetAudience"
                value={formData.targetAudience}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="Men">Men</option>
                <option value="Women">Women</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Age Range
              </label>
              <select
                name="ageRange"
                value={formData.ageRange}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="18-24">18-24</option>
                <option value="25-34">25-34</option>
                <option value="35-44">35-44</option>
                <option value="45-54">45-54</option>
                <option value="55+">55+</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="Health & Wellness">Health & Wellness</option>
              <option value="Beauty & Skincare">Beauty & Skincare</option>
              <option value="Fitness & Sports">Fitness & Sports</option>
              <option value="Home & Garden">Home & Garden</option>
              <option value="Tech & Gadgets">Tech & Gadgets</option>
              <option value="Fashion & Accessories">Fashion & Accessories</option>
              <option value="Food & Beverages">Food & Beverages</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Image of Your Product <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleImageChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
            </div>
            {productImage && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {productImage.name}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-orange-600 to-orange-700 text-white text-lg font-semibold rounded-lg hover:from-orange-700 hover:to-orange-800 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Your Ad...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate My Custom Ad
              </>
            )}
          </button>
        </div>
      </form>

      {generatedAd && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Your Generated Ad</h3>
              <p className="text-sm text-gray-600">Copy and use these for your campaigns</p>
            </div>
          </div>

          <div className="space-y-4">
            {generatedAd.title && (
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h4 className="text-lg font-bold text-blue-900">Ad Title / Headline</h4>
                </div>
                <p className="text-gray-900 text-lg font-medium leading-relaxed">{generatedAd.title}</p>
                <button
                  onClick={() => navigator.clipboard.writeText(generatedAd.title)}
                  className="mt-3 flex items-center gap-2 px-4 py-2 bg-white text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-50 transition-colors border border-blue-200"
                >
                  <Copy className="w-4 h-4" />
                  Copy Title
                </button>
              </div>
            )}

            {generatedAd.caption && (
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-green-600" />
                  <h4 className="text-lg font-bold text-green-900">Ad Caption / Copy</h4>
                </div>
                <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">{generatedAd.caption}</p>
                <button
                  onClick={() => navigator.clipboard.writeText(generatedAd.caption)}
                  className="mt-3 flex items-center gap-2 px-4 py-2 bg-white text-green-700 text-sm font-medium rounded-lg hover:bg-green-50 transition-colors border border-green-200"
                >
                  <Copy className="w-4 h-4" />
                  Copy Caption
                </button>
              </div>
            )}

            {generatedAd.cta && (
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 border border-orange-200">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-orange-600" />
                  <h4 className="text-lg font-bold text-orange-900">Call-to-Action (CTA)</h4>
                </div>
                <p className="text-gray-900 text-lg font-semibold">{generatedAd.cta}</p>
                <button
                  onClick={() => navigator.clipboard.writeText(generatedAd.cta)}
                  className="mt-3 flex items-center gap-2 px-4 py-2 bg-white text-orange-700 text-sm font-medium rounded-lg hover:bg-orange-50 transition-colors border border-orange-200"
                >
                  <Copy className="w-4 h-4" />
                  Copy CTA
                </button>
              </div>
            )}

            {generatedAd.hashtags && (
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <h4 className="text-lg font-bold text-purple-900">Hashtags</h4>
                </div>
                <p className="text-gray-900">{generatedAd.hashtags}</p>
                <button
                  onClick={() => navigator.clipboard.writeText(generatedAd.hashtags)}
                  className="mt-3 flex items-center gap-2 px-4 py-2 bg-white text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-50 transition-colors border border-purple-200"
                >
                  <Copy className="w-4 h-4" />
                  Copy Hashtags
                </button>
              </div>
            )}

            {generatedAd.visualDirection && (
              <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg p-6 border border-pink-200">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-5 h-5 text-pink-600" />
                  <h4 className="text-lg font-bold text-pink-900">Visual Direction</h4>
                </div>
                <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">{generatedAd.visualDirection}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {generatedAd && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Generate Video with Sora 2</h3>
              <p className="text-sm text-gray-600">Turn your product image into an AI-generated video</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-violet-50 to-violet-100 rounded-lg p-6 border border-violet-200">
            <label className="block text-sm font-semibold text-violet-900 mb-3">
              Video Motion Prompt
            </label>
            <textarea
              value={videoPrompt}
              onChange={(e) => setVideoPrompt(e.target.value)}
              placeholder="Describe how you want your product to move in the video... (e.g., 'Product slowly rotates 360 degrees with smooth lighting transitions and sparkle effects')"
              rows={4}
              className="w-full px-4 py-3 border border-violet-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
              disabled={videoGenerating}
            />
            <button
              onClick={handleGenerateVideo}
              disabled={videoGenerating || !uploadedImageUrl || !videoPrompt.trim()}
              className="mt-4 w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-violet-700 text-white text-lg font-semibold rounded-lg hover:from-violet-700 hover:to-violet-800 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {videoGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Video...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Generate Video with Sora 2
                </>
              )}
            </button>
          </div>

          {videoStatus && (
            <div className={`rounded-lg p-6 border ${
              videoStatus === 'waiting' ? 'bg-blue-50 border-blue-200' :
              videoStatus === 'success' ? 'bg-green-50 border-green-200' :
              'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                {videoStatus === 'waiting' && <Clock className="w-6 h-6 text-blue-600 animate-pulse" />}
                {videoStatus === 'success' && <CheckCircle className="w-6 h-6 text-green-600" />}
                {videoStatus === 'fail' && <XCircle className="w-6 h-6 text-red-600" />}
                <div>
                  <h4 className={`text-lg font-bold ${
                    videoStatus === 'waiting' ? 'text-blue-900' :
                    videoStatus === 'success' ? 'text-green-900' :
                    'text-red-900'
                  }`}>
                    {videoStatus === 'waiting' && 'Generating Your Video...'}
                    {videoStatus === 'success' && 'Video Ready!'}
                    {videoStatus === 'fail' && 'Generation Failed'}
                  </h4>
                  <p className={`text-sm ${
                    videoStatus === 'waiting' ? 'text-blue-700' :
                    videoStatus === 'success' ? 'text-green-700' :
                    'text-red-700'
                  }`}>
                    {videoStatus === 'waiting' && 'This may take 1-2 minutes. Please wait...'}
                    {videoStatus === 'success' && 'Your AI-generated video is ready to download'}
                    {videoStatus === 'fail' && 'Something went wrong. Please try again.'}
                  </p>
                </div>
              </div>

              {videoUrl && videoStatus === 'success' && (
                <div className="mt-4">
                  <video
                    src={videoUrl}
                    controls
                    className="w-full rounded-lg border border-green-300 shadow-lg"
                  />
                  <div className="flex gap-3 mt-4">
                    <a
                      href={videoUrl}
                      download
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      Download Video
                    </a>
                    <button
                      onClick={() => navigator.clipboard.writeText(videoUrl)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-green-700 text-sm font-semibold rounded-lg hover:bg-green-50 transition-colors border border-green-300"
                    >
                      <Copy className="w-4 h-4" />
                      Copy URL
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
