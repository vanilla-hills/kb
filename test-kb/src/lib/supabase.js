import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getProfile(id) {
  if (!id) return null;

  // Use maybeSingle() so "0 rows" is not treated as an error.
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) return null;
  if (data) return data;

  // If the profile row doesn't exist yet (e.g., older users created before trigger),
  // create a default one. RLS policy should allow INSERT for the authenticated user.
  const { data: inserted, error: insertError } = await supabase
    .from('profiles')
    .insert({ id })
    .select('*')
    .single();

  if (insertError) return null;
  return inserted;
}
