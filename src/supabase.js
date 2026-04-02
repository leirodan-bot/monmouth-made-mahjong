import { createClient } from '@supabase/supabase-js'
import { Capacitor } from '@capacitor/core'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use implicit flow on native iOS so OAuth returns tokens directly in the URL
    // fragment instead of a PKCE code that requires exchange (which breaks when
    // the app is backgrounded during Safari OAuth).
    ...(Capacitor.isNativePlatform() ? { flowType: 'implicit' } : {}),
  },
})
