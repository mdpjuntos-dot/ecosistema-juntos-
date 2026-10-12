import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Solo para uso en el servidor: la service role key nunca debe llegar al navegador.
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configurados');
    }
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}
