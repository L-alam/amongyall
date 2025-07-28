import { supabase } from './supabase';

export interface Theme {
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

// Get all themes
export const getAllThemes = async (): Promise<Theme[]> => {
  const { data, error } = await supabase
    .from('themes')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching themes:', error);
    throw error;
  }

  return data || [];
};

// Get all theme names
export const getAllThemeNames = async (): Promise<string[]> => {
  const themes = await getAllThemes();
  return themes.map(theme => theme.name);
};

// Get words for a specific theme by name
export const getWordsByThemeName = async (themeName: string): Promise<string[]> => {
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




// Create a custom theme with words
export const createCustomTheme = async (themeName: string, words: string[]): Promise<Theme> => {
  // First check if theme name already exists
  const { data: existingTheme, error: checkError } = await supabase
    .from('themes')
    .select('id')
    .eq('name', themeName)
    .single();

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
    console.error('Error checking theme name:', checkError);
    throw checkError;
  }

  if (existingTheme) {
    throw new Error(`Theme with name "${themeName}" already exists`);
  }

  // Create the theme
  const { data: newTheme, error: themeError } = await supabase
    .from('themes')
    .insert({
      name: themeName,
      is_premium: false,
      is_custom: true,
      // created_by will be set automatically if user is authenticated
    })
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

  return newTheme;
};

// Get user's custom themes (if you want to show user's created themes)
export const getUserCustomThemes = async (): Promise<Theme[]> => {
  const { data, error } = await supabase
    .from('themes')
    .select('*')
    .eq('is_custom', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user custom themes:', error);
    throw error;
  }

  return data || [];
};

// Delete a custom theme (if you want to allow deletion)
export const deleteCustomTheme = async (themeId: string): Promise<void> => {
  // Words will be deleted automatically due to CASCADE
  const { error } = await supabase
    .from('themes')
    .delete()
    .eq('id', themeId)
    .eq('is_custom', true); // Safety check to only delete custom themes

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