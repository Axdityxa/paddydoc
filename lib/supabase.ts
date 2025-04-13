import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import 'react-native-url-polyfill/auto'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env'

// Replace with your Supabase URL and anon key
const supabaseUrl = SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
}) 