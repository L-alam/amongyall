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