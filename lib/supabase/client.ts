import { createClient as supabaseCreateClient } from "@supabase/supabase-js"

export function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return supabaseCreateClient(supabaseUrl, supabaseAnonKey)
}

export function createClient() {
  return createSupabaseClient()
}

// Legacy export for compatibility
export const createSupabaseClientLegacy = createSupabaseClient
