import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    console.log('[SORA] Starting video generation request...');
    const body = await req.json();
    const { prompt, imageUrl, aspectRatio = 'landscape', nFrames = '10' } = body;

    if (!prompt || !imageUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'prompt and imageUrl are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const kieApiKey = Deno.env.get('KIE_API_KEY');
    if (!kieApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'KIE_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    console.log('[SORA] Calling Kie.ai API...');
    const kieResponse = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${kieApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sora-2-image-to-video',
        input: {
          prompt,
          image_urls: [imageUrl],
          aspect_ratio: aspectRatio,
          n_frames: nFrames,
          remove_watermark: true,
        },
      }),
    });

    const kieData = await kieResponse.json();
    console.log('[SORA] Kie.ai response:', kieData);

    if (!kieResponse.ok || kieData.code !== 200) {
      throw new Error(kieData.msg || 'Failed to create video generation task');
    }

    const taskId = kieData.data?.taskId;
    if (!taskId) {
      throw new Error('No taskId received from Kie.ai');
    }

    console.log('[SORA] Task created:', taskId);
    console.log('[SORA] Saving task to database...');

    const dbResponse = await fetch(
      `${supabaseUrl}/rest/v1/video_generation_tasks`,
      {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          task_id: taskId,
          user_prompt: prompt,
          image_url: imageUrl,
          aspect_ratio: aspectRatio,
          n_frames: nFrames,
          state: 'waiting',
        }),
      }
    );

    if (!dbResponse.ok) {
      const errorText = await dbResponse.text();
      console.error('[SORA] Database error:', errorText);
      throw new Error('Failed to save task to database');
    }

    const savedTask = await dbResponse.json();
    console.log('[SORA] Task saved successfully');

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          taskId,
          id: savedTask[0]?.id,
          message: 'Video generation started. Poll status to get results.',
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[SORA ERROR]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});