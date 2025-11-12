export interface ScrapedAd {
  id: string;
  platform: 'facebook' | 'tiktok';
  ad_id: string;
  advertiser_name: string;
  ad_creative_url: string;
  ad_copy: string;
  cta_text: string;
  raw_data: any;
  scraped_at: string;
  created_at: string;
  type?: string;
  url?: string;
  download_url?: string;
  thumbnail?: string;
  title?: string;
  landing_url?: string;
  active_status?: string;
  active_hours?: number;
  variants?: number;
  platforms_used?: string;
  page_likes?: number;
  verified?: string;
  performance_score?: number;
  est_reach?: string;
  ad_format?: string;
  hashtags?: string;
  ai_visual_analysis?: string | null;
  ai_prompts?: Record<string, string> | null;
  analyzed_at?: string | null;
  deep_analysis?: {
    concept: string;
    captionAnalysis: string;
    titleAnalysis: string;
    ctaAnalysis: string;
    frames: Array<{
      timestamp: string;
      description: string;
    }>;
    replicationPrompts: string;
  } | null;
  deep_analyzed_at?: string | null;
}

export interface AdAnalysis {
  id: string;
  ad_id: string;
  visual_analysis: string;
  copy_analysis: string;
  tone_and_style: string;
  target_audience: string;
  key_elements: {
    hasVideo: boolean;
    hasImage: boolean;
    hasCTA: boolean;
    ctaText: string;
    copyLength: number;
    usesUrgency: boolean;
    highlightsBenefits: boolean;
    emotionalAppeal: boolean;
    conversational: boolean;
    advertiser: string;
    platform: string;
  };
  analyzed_at: string;
  created_at: string;
}

export interface GeneratedPrompt {
  id: string;
  analysis_id: string;
  image_generation_prompt: string;
  ad_copy_variations: Array<{
    headline: string;
    body: string;
    cta: string;
    style: string;
  }>;
  style_guide: string;
  generated_at: string;
  created_at: string;
}

export interface ScrapingJob {
  id: string;
  apify_run_id: string;
  platform: 'facebook' | 'tiktok';
  search_query: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  total_ads_found: number;
  started_at: string;
  completed_at: string;
  created_at: string;
}
