import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase credentials not set (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: { params: { eventsPerSecond: 10 } },
});

export type SupabaseMessage = {
  id?: number;
  from_id: string;
  to_id: string;
  participants?: string[];
  text: string;
  created_at?: string;
};

export default supabase;

// Auth helpers
export async function signInWithMagicLink(email: string) {
  return supabase.auth.signInWithOtp({ email });
}

export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user ?? null;
}

export async function signOut() {
  return supabase.auth.signOut();
}
