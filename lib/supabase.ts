// lib/supabase.ts - Crash-Resistant Version
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'
import { AppState } from 'react-native'
import 'react-native-url-polyfill/auto'

// Define the database schema types for better type safety
export interface Database {
  public: {
    Tables: {
      themes: {
        Row: {
          id: string
          name: string
          created_by: string | null
          is_custom: boolean
          // ... other fields
        }
      }
      // ... other tables
    }
  }
}

// Configuration interface
interface SupabaseConfig {
  url: string
  anonKey: string
  isConfigured: boolean
}

// Validate URL format
const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'https:' && urlObj.hostname.includes('supabase')
  } catch {
    return false
  }
}

// Validate Supabase key format
const isValidSupabaseKey = (key: string): boolean => {
  // Supabase keys are typically JWT tokens starting with 'eyJ'
  return typeof key === 'string' && key.length > 20 && (
    key.startsWith('eyJ') || // JWT format
    key.includes('.') // Basic JWT structure check
  )
}

// Get Supabase configuration with multiple fallback methods
const getSupabaseConfig = (): SupabaseConfig => {
  let supabaseUrl: string | undefined
  let supabaseAnonKey: string | undefined
  
  try {
    // Method 1: Environment variables
    supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
    supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    
    // Method 2: Expo Constants (for builds)
    if (!supabaseUrl || !supabaseAnonKey) {
      const expoConfig = Constants.expoConfig || Constants.manifest
      supabaseUrl = supabaseUrl || expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL
      supabaseAnonKey = supabaseAnonKey || expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY
    }
    
    // Method 3: Expo Constants manifest2
    if (!supabaseUrl || !supabaseAnonKey) {
      const manifest2 = Constants.manifest2
      supabaseUrl = supabaseUrl || manifest2?.extra?.expoClient?.extra?.EXPO_PUBLIC_SUPABASE_URL
      supabaseAnonKey = supabaseAnonKey || manifest2?.extra?.expoClient?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY
    }
    
  } catch (error) {
    console.warn('Error accessing Supabase configuration:', error)
  }
  
  // Validate configuration
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase configuration missing - app will run in offline mode')
    return {
      url: '',
      anonKey: '',
      isConfigured: false
    }
  }
  
  // Validate URL format
  if (!isValidUrl(supabaseUrl)) {
    console.error('Invalid Supabase URL format:', supabaseUrl)
    return {
      url: '',
      anonKey: '',
      isConfigured: false
    }
  }
  
  // Validate key format
  if (!isValidSupabaseKey(supabaseAnonKey)) {
    console.error('Invalid Supabase anonymous key format')
    return {
      url: '',
      anonKey: '',
      isConfigured: false
    }
  }
  
  return {
    url: supabaseUrl.trim(),
    anonKey: supabaseAnonKey.trim(),
    isConfigured: true
  }
}

// Create a safe AsyncStorage wrapper that handles errors
const createSafeAsyncStorage = () => {
  return {
    getItem: async (key: string): Promise<string | null> => {
      try {
        return await AsyncStorage.getItem(key)
      } catch (error) {
        console.warn(`AsyncStorage getItem failed for key ${key}:`, error)
        return null
      }
    },
    setItem: async (key: string, value: string): Promise<void> => {
      try {
        await AsyncStorage.setItem(key, value)
      } catch (error) {
        console.warn(`AsyncStorage setItem failed for key ${key}:`, error)
        // Don't throw - just log the warning
      }
    },
    removeItem: async (key: string): Promise<void> => {
      try {
        await AsyncStorage.removeItem(key)
      } catch (error) {
        console.warn(`AsyncStorage removeItem failed for key ${key}:`, error)
        // Don't throw - just log the warning
      }
    }
  }
}

// Create mock client for offline mode
const createMockSupabaseClient = (): SupabaseClient<Database> => {
  const mockClient = {
    auth: {
      signInAnonymously: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Offline mode') }),
      signInWithOAuth: () => Promise.resolve({ data: { url: null, provider: null }, error: new Error('Offline mode') }),
      signOut: () => Promise.resolve({ error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: null }, error: null }),
      startAutoRefresh: () => {},
      stopAutoRefresh: () => {},
    },
    from: () => ({
      select: () => ({ 
        data: [], 
        error: null,
        eq: () => ({ data: [], error: null }),
        is: () => ({ data: [], error: null }),
        order: () => ({ data: [], error: null }),
        limit: () => ({ data: [], error: null })
      }),
      insert: () => ({ data: null, error: new Error('Offline mode - cannot insert data') }),
      update: () => ({ data: null, error: new Error('Offline mode - cannot update data') }),
      delete: () => ({ data: null, error: new Error('Offline mode - cannot delete data') }),
    }),
  } as any
  
  return mockClient
}

// Initialize Supabase configuration
const config = getSupabaseConfig()

// Create the Supabase client or mock client
let supabase: SupabaseClient<Database>

if (config.isConfigured) {
  try {
    console.log('Initializing Supabase client...')
    
    supabase = createClient<Database>(config.url, config.anonKey, {
      auth: {
        storage: createSafeAsyncStorage(),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          'x-application-name': 'amongyall-app',
        },
      },
      db: {
        schema: 'public',
      },
      realtime: {
        params: {
          eventsPerSecond: 5, // Rate limit realtime events
        },
      },
    })
    
    console.log('Supabase client initialized successfully')
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error)
    supabase = createMockSupabaseClient()
  }
} else {
  console.warn('Supabase not configured - using mock client (offline mode)')
  supabase = createMockSupabaseClient()
}

// App state management with error handling
let appStateListener: any = null

const handleAppStateChange = (state: string) => {
  try {
    if (config.isConfigured && supabase?.auth) {
      if (state === 'active') {
        supabase.auth.startAutoRefresh()
      } else {
        supabase.auth.stopAutoRefresh()
      }
    }
  } catch (error) {
    console.warn('Error handling app state change:', error)
  }
}

// Set up app state listener with cleanup
try {
  appStateListener = AppState.addEventListener('change', handleAppStateChange)
} catch (error) {
  console.warn('Failed to set up app state listener:', error)
}

// Utility functions for safe Supabase operations
export const isSupabaseConfigured = (): boolean => config.isConfigured

export const safeSupabaseQuery = async <T>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> => {
  if (!config.isConfigured) {
    return { 
      data: null, 
      error: { message: 'Supabase not configured - running in offline mode' }
    }
  }
  
  try {
    const result = await queryFn()
    return result
  } catch (error) {
    console.error('Supabase query failed:', error)
    return { 
      data: null, 
      error: { message: 'Database query failed', details: error }
    }
  }
}

// Clean up function for testing or app shutdown
export const cleanupSupabase = () => {
  try {
    if (appStateListener) {
      appStateListener.remove()
      appStateListener = null
    }
    
    if (config.isConfigured && supabase?.auth) {
      supabase.auth.stopAutoRefresh()
    }
  } catch (error) {
    console.warn('Error during Supabase cleanup:', error)
  }
}

export { supabase }
export type { Database }
