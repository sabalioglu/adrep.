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
    const url = new URL(req.url);
    const taskId = url.searchParams.get('taskId');

    if (!taskId) {
      return new Response(
        JSON.stringify({ success: false, error: 'taskId is required' }),
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

    console.log('[VIDEO-STATUS] Checking status for task:', taskId);

    const kieResponse = await fetch(
      `https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`,
      {
        headers: {
          'Authorization': `Bearer ${kieApiKey}`,
        },
      }
    );

    const kieData = await kieResponse.json();
    console.log('[VIDEO-STATUS] Kie.ai response:', kieData);

    if (!kieResponse.ok || kieData.code !== 200) {
      throw new Error(kieData.msg || 'Failed to check video status');
    }

    const taskData = kieData.data;
    const state = taskData.state;

    const updateData: any = {
      state,
    };

    if (state === 'success') {
      const resultJson = JSON.parse(taskData.resultJson || '{}');
      const resultUrls = resultJson.resultUrls || [];

      updateData.result_url = resultUrls[0] || null;
      updateData.cost_time = taskData.costTime;
      updateData.completed_at = new Date(taskData.completeTime).toISOString();
    } else if (state === 'fail') {
      updateData.fail_message = taskData.failMsg || 'Unknown error';
      updateData.completed_at = new Date().toISOString();
    }

    console.log('[VIDEO-STATUS] Updating database...');
    const dbResponse = await fetch(
      `${supabaseUrl}/rest/v1/video_generation_tasks?task_id=eq.${taskId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(updateData),
      }
    );

    if (!dbResponse.ok) {
      const errorText = await dbResponse.text();
      console.error('[VIDEO-STATUS] Database update error:', errorText);
    }

    const updatedTasks = await dbResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          state,
          task: updatedTasks[0] || null,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[VIDEO-STATUS ERROR]:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});