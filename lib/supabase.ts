import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Reviews talk to Supabase straight from the browser with a public
// publishable key — the same "public capability-scoped key, no server route"
// shape as FeedbackForm's Web3Forms integration. Row Level Security on the
// `reviews` table (see supabase/schema.sql) is what keeps that safe: the
// publishable key can only do what the policies allow, not arbitrary
// database access. Set both in .env.local:
//
//   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
//   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
//
// (Supabase's dashboard calls this the "publishable key" now — it replaced
// the old "anon key" naming, same role: safe to ship to the browser.)
//
// Until both are set, `supabase` is null and SpotReviews renders its
// "not configured yet" state instead of failing on submit.
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!)
  : null;
