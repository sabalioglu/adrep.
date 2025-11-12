const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  console.log('Test function called');
  
  return new Response(
    JSON.stringify({ success: true, message: 'Test OK' }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});