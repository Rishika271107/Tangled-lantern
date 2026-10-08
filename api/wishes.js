import { createClient } from '@supabase/supabase-js';

const MAX_WISH_LENGTH = 100;
const WISH_PAGE_SIZE = 500;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

async function handler(request) {
  if (request.method !== 'GET' && request.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405);
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseSecretKey) {
    return json({ error: 'Supabase storage is not configured.' }, 503);
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseSecretKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    if (request.method === 'GET') {
      const allRows = [];
      for (let offset = 0; ; offset += WISH_PAGE_SIZE) {
        const { data, error } = await supabase
          .from('lantern_wishes')
          .select('id, wish, x, rest, size, sway, delay')
          .order('id', { ascending: true })
          .range(offset, offset + WISH_PAGE_SIZE - 1);
        if (error) throw error;
        allRows.push(...data);
        if (data.length < WISH_PAGE_SIZE) break;
      }
      return json(allRows.map(({ wish, ...row }) => ({ ...row, text: wish })));
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Request body must be valid JSON.' }, 400);
    }

    const wish = typeof body?.text === 'string' ? body.text.trim() : '';
    if (!wish || wish.length > MAX_WISH_LENGTH) {
      return json({ error: `Wish must be between 1 and ${MAX_WISH_LENGTH} characters.` }, 400);
    }

    const x = Number(body.x);
    const rest = Number(body.rest);
    const size = Number(body.size);
    const sway = Number(body.sway);
    const delay = Number(body.delay) || 0;
    if (![x, rest, size, sway, delay].every(Number.isFinite) || x < 22 || x > 96 || rest < 68 || rest > 93 || size < 34 || size > 48 || sway < 4 || sway > 6 || delay < -3 || delay > 0) {
      return json({ error: 'Invalid lantern placement.' }, 400);
    }

    const { data, error } = await supabase
      .from('lantern_wishes')
      .insert({ wish, x, rest, size, sway, delay })
      .select('id, wish, x, rest, size, sway, delay')
      .single();
    if (error) throw error;
    const { wish: savedWish, ...saved } = data;
    return json({ ...saved, text: savedWish }, 201);
  } catch (error) {
    console.error('Wish storage error:', error);
    const code = typeof error?.code === 'string' ? error.code : String(error?.status || 'UNKNOWN');
    let message = 'Supabase returned an error. Check the Vercel function logs for this request.';
    if (code === '42P01' || code === 'PGRST205') {
      message = 'The lantern_wishes table was not found in the Supabase project connected to Vercel. Run supabase/schema.sql in that same project.';
    } else if (code === 'PGRST125') {
      message = 'SUPABASE_URL must be the base project URL, such as https://your-project.supabase.co. Remove any /rest/v1 path or other suffix.';
    } else if (code === '42501') {
      message = 'Supabase denied access to lantern_wishes. Run the GRANT statements in supabase/schema.sql in the connected project.';
    } else if (code === '401' || code === '403') {
      message = 'Supabase rejected the API key. Check that SUPABASE_URL and SUPABASE_SECRET_KEY belong to the same project.';
    }
    return json({ error: message, code }, 500);
  }
}

export function GET(request) {
  return handler(request);
}

export function POST(request) {
  return handler(request);
}
