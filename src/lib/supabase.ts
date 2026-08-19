import { createClient } from '@supabase/supabase-js'

import type { Database } from '../types/database'

const url = import.meta.env.VITE_SUPABASE_URL

// Supabase now issues `sb_publishable_...` keys and calls them publishable keys
// in the dashboard, so this matches that name rather than the legacy "anon key".
// Safe to ship in the browser bundle: RLS is what actually restricts access.
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/** False when .env.local is missing or incomplete. App renders setup help. */
export const supabaseConfigured = Boolean(url && publishableKey)

// Deliberately does not throw at import time: a module-level throw here means
// React never mounts and the whole app is a blank white page with the reason
// buried in the console. createClient rejects an empty URL, so fall back to a
// syntactically valid placeholder that never gets queried — App checks
// supabaseConfigured first and renders SetupNotice instead of the routes.
//
// Typing the client with Database is what makes every .from() call return real
// row types instead of any.
export const supabase = createClient<Database>(
  url || 'http://unconfigured.invalid',
  publishableKey || 'unconfigured',
  { auth: { persistSession: false } },
)
