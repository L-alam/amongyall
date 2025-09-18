// lib/themeService.ts (FIXED VERSION)
import { authService } from './authService';
import { offlineStorageService } from './offlineStorageService';
import { supabase } from './supabase';

const ANONYMOUS_THEME_LIMIT = 10; // Updated to 10
const AUTHENTICATED_THEME_LIMIT = 10; // New limit for authenticated users

export interface Theme {
  words: any;
  id: string;
  name: string;
  is_premium: boolean;
  is_custom: boolean;
  created_by?: string;
  created_at?: string;
}

export interface ThemeWord {
  id: string;
  theme_id: string;
  word: string;
  created_at?: string;
}

export interface ThemeWithWords extends Theme {
  words: string[];
}

// Get all themes (ONLY built-in themes for main feed)
export const getAllThemes = async (): Promise<Theme[]> => {
  const { data, error } = await supabase
    .from('themes')
    .select('*')
    // FIXED: Only return built-in themes (NULL created_at and created_by OR is_custom = false)
    .or('is_custom.is.null,is_custom.eq.false')
    .order('name');

  if (error) {
    console.error('Error fetching themes:', error);
    throw error;
  }

  return data || [];
};

// NEW: Get only built-in themes explicitly
export const getBuiltInThemes = async (): Promise<Theme[]> => {
  const { data, error } = await supabase
    .from('themes')
    .select('*')
    .or('is_custom.is.null,is_custom.eq.false')
    .order('name');

  if (error) {
    console.error('Error fetching built-in themes:', error);
    throw error;
  }

  return data || [];
};

// Get all theme names (ONLY built-in themes for dropdown)
export const getAllThemeNames = async (): Promise<string[]> => {
  try {
    // First check if we have offline themes
    const offlineThemes = await offlineStorageService.getBasicThemes();
    
    if (offlineThemes.length > 0) {
      console.log('Using offline basic themes');
      return offlineThemes.map(theme => theme.name);
    }
    
    // Check if we're online before trying Supabase
    const online = await isOnline();
    if (!online) {
      console.log('Offline and no cached themes available');
      return [];
    }
    
    // Fallback to online if no offline themes
    console.log('No offline themes, fetching from Supabase');
    const themes = await getBuiltInThemes();
    return themes.map(theme => theme.name);
  } catch (error) {
    console.error('Error getting theme names:', error);
    return []; // Return empty array instead of throwing
  }
};


// Get words for a specific theme by name
export const getWordsByThemeName = async (themeName: string): Promise<string[]> => {
  try {
    // First check offline basic themes
    const offlineBasicThemes = await offlineStorageService.getBasicThemes();
    const offlineBasicTheme = offlineBasicThemes.find(theme => theme.name === themeName);
    
    if (offlineBasicTheme) {
      console.log(`Using offline words for theme: ${themeName}`);
      return offlineBasicTheme.words;
    }
    
    // Then check offline custom themes
    const offlineCustomThemes = await offlineStorageService.getCustomThemes();
    const offlineCustomTheme = offlineCustomThemes.find(theme => theme.name === themeName);
    
    if (offlineCustomTheme) {
      console.log(`Using offline custom words for theme: ${themeName}`);
      return offlineCustomTheme.words;
    }
    
    // Check if online before trying Supabase
    const online = await isOnline();
    if (!online) {
      console.log(`No offline data for theme: ${themeName} and device is offline`);
      return [];
    }
    
    // Fallback to online
    console.log(`No offline data for theme: ${themeName}, fetching from Supabase`);
    return await getOriginalWordsByThemeName(themeName);
  } catch (error) {
    console.error('Error getting words by theme name:', error);
    return []; // Return empty array instead of throwing
  }
};


const getOriginalWordsByThemeName = async (themeName: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('themes')
    .select(`
      id,
      theme_words (
        word
      )
    `)
    .eq('name', themeName)
    .single();

  if (error) {
    console.error('Error fetching theme words:', error);
    throw error;
  }

  if (!data || !data.theme_words) {
    return [];
  }

  return data.theme_words.map((item: any) => item.word);
};



// Get words for a specific theme by ID
export const getWordsByThemeId = async (themeId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('theme_words')
    .select('word')
    .eq('theme_id', themeId)
    .order('word');

  if (error) {
    console.error('Error fetching theme words:', error);
    throw error;
  }

  return data?.map(item => item.word) || [];
};

// Get random words from a theme
export const getRandomWordsFromTheme = async (themeName: string, count: number): Promise<string[]> => {
  const words = await getWordsByThemeName(themeName);
  
  if (words.length === 0) return [];
  
  // Shuffle the array and take the requested count
  const shuffled = [...words].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, words.length));
};

// Get a theme with all its words
export const getThemeWithWords = async (themeName: string): Promise<ThemeWithWords | null> => {
  const { data, error } = await supabase
    .from('themes')
    .select(`
      *,
      theme_words (
        word
      )
    `)
    .eq('name', themeName)
    .single();

  if (error) {
    console.error('Error fetching theme with words:', error);
    throw error;
  }

  if (!data) return null;

  return {
    ...data,
    words: data.theme_words?.map((item: any) => item.word) || []
  };
};

// Check theme limit for ALL users (anonymous and authenticated)
export const checkThemeLimit = async (): Promise<{ canCreate: boolean; count: number; limit: number }> => {
  const userId = authService.getUserId();
  
  let query = supabase
    .from('themes')
    .select('*', { count: 'exact', head: true }) // Changed from 'id' to '*'
    .eq('is_custom', true);

  // Apply user-specific filter
  if (userId) {
    query = query.eq('created_by', userId);
  } else {
    query = query.is('created_by', null);
  }

  const { count, error } = await query; // Use 'count' instead of 'data'

  if (error) {
    console.error('Error checking theme count:', error);
    const limit = userId ? AUTHENTICATED_THEME_LIMIT : ANONYMOUS_THEME_LIMIT;
    return { canCreate: false, count: 0, limit };
  }

  const actualCount = count || 0; // Use the count directly
  const limit = userId ? AUTHENTICATED_THEME_LIMIT : ANONYMOUS_THEME_LIMIT;
  
  console.log(`Theme count check - User: ${userId || 'anonymous'}, Count: ${actualCount}, Limit: ${limit}`);
  
  return {
    canCreate: actualCount < limit,
    count: actualCount,
    limit
  };
};

export const getUserCustomThemesWithOffline = async (): Promise<Theme[]> => {
  try {
    // Always try offline first
    const offlineCustomThemes = await offlineStorageService.getCustomThemes();
    console.log(`Found ${offlineCustomThemes.length} offline custom themes`);
    
    // Check if we're online
    const online = await isOnline();
    
    if (!online) {
      console.log('Offline mode - using only locally stored custom themes');
      return offlineCustomThemes;
    }
    
    // We're online - try to get online custom themes and merge
    try {
      const onlineCustomThemes = await getUserCustomThemes();
      console.log(`Found ${onlineCustomThemes.length} online custom themes`);
      
      // Combine both, prioritizing offline versions if they exist
      const combinedThemes: Theme[] = [];
      const offlineIds = new Set(offlineCustomThemes.map(t => t.id));
      
      // Add offline themes first
      combinedThemes.push(...offlineCustomThemes);
      
      // Add online themes that aren't already offline
      onlineCustomThemes.forEach(onlineTheme => {
        if (!offlineIds.has(onlineTheme.id)) {
          combinedThemes.push(onlineTheme);
        }
      });
      
      return combinedThemes;
    } catch (onlineError) {
      console.error('Error getting online custom themes, falling back to offline only:', onlineError);
      return offlineCustomThemes;
    }
  } catch (error) {
    console.error('Error getting custom themes with offline:', error);
    // Final fallback - try online only if offline fails
    try {
      const online = await isOnline();
      if (online) {
        return await getUserCustomThemes();
      } else {
        console.log('Offline and no cached custom themes available');
        return [];
      }
    } catch (finalError) {
      console.error('Final fallback for custom themes failed:', finalError);
      return [];
    }
  }
};


// Legacy function name - kept for compatibility but updated logic
export const checkAnonymousThemeLimit = checkThemeLimit;

// Get user's custom themes (works for both anonymous and authenticated users)
export const getUserCustomThemes = async (): Promise<Theme[]> => {
  const userId = authService.getUserId();
  
  if (!userId) {
    // If no user ID, return anonymous themes (themes with created_by = null)
    console.log('No user ID - fetching anonymous themes');
    
    const { data, error } = await supabase
      .from('themes')
      .select('*')
      .eq('is_custom', true)
      .is('created_by', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching anonymous custom themes:', error);
      throw error;
    }

    console.log('Found anonymous themes:', data?.length || 0);
    return data || [];
  }

  // User is authenticated - return their themes
  console.log('Fetching themes for user:', userId);
  const { data, error } = await supabase
    .from('themes')
    .select('*')
    .eq('is_custom', true)
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user custom themes:', error);
    throw error;
  }

  console.log('Found user themes:', data?.length || 0);
  return data || [];
};

// REMOVED: getAllCustomThemes function that was causing the privacy issue
// This function was returning ALL custom themes, allowing users to see each other's items

// Get themes created by anonymous users (no created_by) - ADMIN USE ONLY
export const getAnonymousCustomThemes = async (): Promise<Theme[]> => {
  const { data, error } = await supabase
    .from('themes')
    .select('*')
    .eq('is_custom', true)
    .is('created_by', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching anonymous custom themes:', error);
    throw error;
  }

  return data || [];
};

export const createCustomTheme = async (themeName: string, words: string[]): Promise<Theme> => {
  // Check theme limit for ALL users
  const limitCheck = await checkThemeLimit();
  
  if (!limitCheck.canCreate) {
    throw new Error(`THEME_LIMIT_REACHED:${limitCheck.count}:${limitCheck.limit}`);
  }

  const userId = authService.getUserId();
  
  console.log('Creating theme with user ID:', userId || 'anonymous');

  // First check if theme name already exists
  const { data: existingTheme, error: checkError } = await supabase
    .from('themes')
    .select('id')
    .eq('name', themeName)
    .single();

  if (checkError && checkError.code !== 'PGRST116') {
    console.error('Error checking theme name:', checkError);
    throw checkError;
  }

  if (existingTheme) {
    throw new Error(`Theme with name "${themeName}" already exists`);
  }

  // Create the theme - allow null created_by for anonymous users
  const themeData: any = {
    name: themeName,
    is_premium: false,
    is_custom: true,
  };

  // Only add created_by if we have a user ID
  if (userId) {
    themeData.created_by = userId;
  }

  const { data: newTheme, error: themeError } = await supabase
    .from('themes')
    .insert(themeData)
    .select()
    .single();

  if (themeError) {
    console.error('Error creating theme:', themeError);
    throw themeError;
  }

  // Create theme words
  const wordEntries = words.map(word => ({
    theme_id: newTheme.id,
    word: word.trim()
  }));

  const { error: wordsError } = await supabase
    .from('theme_words')
    .insert(wordEntries);

  if (wordsError) {
    // If word creation fails, clean up the theme
    await supabase
      .from('themes')
      .delete()
      .eq('id', newTheme.id);
    
    console.error('Error creating theme words:', wordsError);
    throw wordsError;
  }

  console.log('Theme created successfully:', newTheme.name);
  return newTheme;
};

export const deleteCustomTheme = async (themeId: string): Promise<void> => {
  const userId = authService.getUserId();
  
  // Build the delete query
  let query = supabase
    .from('themes')
    .delete()
    .eq('id', themeId)
    .eq('is_custom', true);

  // If user is authenticated, only allow deleting their own themes
  // If not authenticated, allow deleting anonymous themes (created_by is null)
  if (userId) {
    query = query.eq('created_by', userId);
  } else {
    query = query.is('created_by', null);
  }

  const { error } = await query;

  if (error) {
    console.error('Error deleting custom theme:', error);
    throw error;
  }
};

// Check if theme name is available
export const isThemeNameAvailable = async (themeName: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('themes')
    .select('id')
    .eq('name', themeName)
    .single();

  if (error && error.code === 'PGRST116') { // Not found
    return true; // Name is available
  }

  if (error) {
    console.error('Error checking theme name availability:', error);
    throw error;
  }

  return false; // Name is taken
};

// Helper function to check if current user can delete a theme
export const canDeleteTheme = (theme: Theme): boolean => {
  const userId = authService.getUserId();
  
  // If user is authenticated, they can delete their own themes
  if (userId && theme.created_by === userId) {
    return true;
  }
  
  // If user is not authenticated, they can delete anonymous themes
  if (!userId && !theme.created_by) {
    return true;
  }
  
  return false;
};

export const hasOfflineFeatures = async (): Promise<boolean> => {
  try {
    const downloadStatus = await offlineStorageService.getDownloadStatus();
    return downloadStatus.basicPairsDownloaded || downloadStatus.basicThemesDownloaded;
  } catch (error) {
    return false;
  }
};

export const isOnline = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('themes')
      .select('id')
      .limit(1);
    return !error;
  } catch {
    return false;
  }
};