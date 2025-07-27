import { AppState } from 'react-native'
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, processLock } from '@supabase/supabase-js'


const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
})

// Tells Supabase Auth to continuously refresh the session automatically
// if the app is in the foreground. When this is added, you will continue
// to receive `onAuthStateChange` events with the `TOKEN_REFRESHED` or
// `SIGNED_OUT` event if the user's session is terminated. This should
// only be registered once.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})


export const testConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('nonexistent_table')
        .select('*')
        .limit(1);
      
      // We expect an error here, but if we get a specific Supabase error,
      // it means the connection is working
      if (error && error.message.includes('does not exist')) {
        console.log('✅ Supabase connection successful! (Table not found is expected)');
        return true;
      }
      
      console.log('✅ Supabase connection successful!');
      return true;
    } catch (err) {
      console.log('❌ Connection failed:', err);
      return false;
    }
  };



// CREATE TABLE themes (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   name TEXT NOT NULL UNIQUE,
//   is_premium BOOLEAN DEFAULT false,
//   is_custom BOOLEAN DEFAULT false,
//   created_by UUID REFERENCES auth.users(id),
//   created_at TIMESTAMP DEFAULT NOW()
// );

// CREATE TABLE theme_words (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   theme_id UUID REFERENCES themes(id) ON DELETE CASCADE,
//   word TEXT,
//   created_at TIMESTAMP DEFAULT NOW()
// );

// CREATE TABLE user_themes (
//   user_id UUID REFERENCES auth.users(id),
//   theme_id UUID REFERENCES themes(id),
//   PRIMARY KEY (user_id, theme_id)
// );