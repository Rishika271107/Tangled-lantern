function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

export function GET() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    || process.env.SUPABASE_ANON_KEY;

  if (!url || !publishableKey) {
    return json({ error: 'Realtime needs SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY.' }, 503);
  }

  // A publishable/anon key is designed for browser use; never return the server secret key here.
  return json({ url, publishableKey });
}
