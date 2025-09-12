// lib/wavelengthService.ts (FIXED VERSION)
import { authService } from './authService';
import { supabase } from './supabase';

const ANONYMOUS_PAIR_LIMIT = 10; // Updated to 10
const AUTHENTICATED_PAIR_LIMIT = 10; // New limit for authenticated users

export interface WavelengthPair {
  id: string;
  term_0: string;
  term_1: string;
  is_custom: boolean;
  created_by?: string;
  created_at?: string;
}

export interface WordPairs {
  positive: string;
  negative: string;
}

// Get all wavelength pairs (ONLY built-in pairs for main feed)
export const getAllWavelengthPairs = async (): Promise<WavelengthPair[]> => {
  const { data, error } = await supabase
    .from('pairs')
    .select('*')
    // FIXED: Only return built-in pairs (is_custom = false OR NULL)
    .or('is_custom.is.null,is_custom.eq.false')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching wavelength pairs:', error);
    throw error;
  }

  return data || [];
};

// Get only built-in (non-custom) pairs - EXPLICIT function for main feed
export const getBuiltInPairs = async (): Promise<WavelengthPair[]> => {
  const { data, error } = await supabase
    .from('pairs')
    .select('*')
    .or('is_custom.is.null,is_custom.eq.false')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching built-in pairs:', error);
    throw error;
  }

  return data || [];
};

// REMOVED: getCustomPairs function that returned ALL custom pairs
// This was causing the privacy issue where users could see each other's custom pairs

// Check pair limit for ALL users (anonymous and authenticated)
export const checkPairLimit = async (): Promise<{ canCreate: boolean; count: number; limit: number }> => {
  const userId = authService.getUserId();
  
  let query = supabase
    .from('pairs')
    .select('*', { count: 'exact', head: true })
    .eq('is_custom', true);

  if (userId) {
    query = query.eq('created_by', userId);
  } else {
    query = query.is('created_by', null);
  }

  const { count, error } = await query; // Fixed: use count instead of data

  if (error) {
    console.error('Error checking pair count:', error);
    const limit = userId ? AUTHENTICATED_PAIR_LIMIT : ANONYMOUS_PAIR_LIMIT;
    return { canCreate: false, count: 0, limit };
  }

  const actualCount = count || 0;
  const limit = userId ? AUTHENTICATED_PAIR_LIMIT : ANONYMOUS_PAIR_LIMIT;
  
  return {
    canCreate: actualCount < limit,
    count: actualCount,
    limit
  };
};

// Legacy function name - kept for compatibility but updated logic
export const checkAnonymousPairLimit = checkPairLimit;

// Get user's custom pairs (works for both anonymous and authenticated users)
export const getUserCustomPairs = async (): Promise<WavelengthPair[]> => {
  const userId = authService.getUserId();
  
  if (!userId) {
    // If no user ID, return anonymous pairs (pairs with created_by = null)
    console.log('No user ID - returning anonymous pairs');
    
    const { data, error } = await supabase
      .from('pairs')
      .select('*')
      .eq('is_custom', true)
      .is('created_by', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching anonymous custom pairs:', error);
      throw error;
    }

    return data || [];
  }

  // User is authenticated - return their pairs
  const { data, error } = await supabase
    .from('pairs')
    .select('*')
    .eq('is_custom', true)
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user custom pairs:', error);
    throw error;
  }

  return data || [];
};

// Get anonymous custom pairs (created_by is null) - ADMIN USE ONLY
export const getAnonymousCustomPairs = async (): Promise<WavelengthPair[]> => {
  const { data, error } = await supabase
    .from('pairs')
    .select('*')
    .eq('is_custom', true)
    .is('created_by', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching anonymous custom pairs:', error);
    throw error;
  }

  return data || [];
};

// Get a random pair from built-in pairs only (for main feed)
export const getRandomPair = async (): Promise<WordPairs | null> => {
  try {
    const builtInPairs = await getBuiltInPairs(); // FIXED: Use built-in pairs only
    
    if (builtInPairs.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * builtInPairs.length);
    const selectedPair = builtInPairs[randomIndex];
    
    return {
      positive: selectedPair.term_0,
      negative: selectedPair.term_1
    };
  } catch (error) {
    console.error('Error getting random pair:', error);
    return null;
  }
};

// Get a random pair from built-in pairs only
export const getRandomBuiltInPair = async (): Promise<WordPairs | null> => {
  try {
    const builtInPairs = await getBuiltInPairs();
    
    if (builtInPairs.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * builtInPairs.length);
    const selectedPair = builtInPairs[randomIndex];
    
    return {
      positive: selectedPair.term_0,
      negative: selectedPair.term_1
    };
  } catch (error) {
    console.error('Error getting random built-in pair:', error);
    return null;
  }
};

// Get multiple random pairs from built-in pairs only
export const getRandomPairs = async (count: number): Promise<WordPairs[]> => {
  try {
    const builtInPairs = await getBuiltInPairs(); // FIXED: Use built-in pairs only
    
    if (builtInPairs.length === 0) return [];
    
    // Shuffle and take requested count
    const shuffled = [...builtInPairs].sort(() => Math.random() - 0.5);
    const selectedPairs = shuffled.slice(0, Math.min(count, builtInPairs.length));
    
    return selectedPairs.map(pair => ({
      positive: pair.term_0,
      negative: pair.term_1
    }));
  } catch (error) {
    console.error('Error getting random pairs:', error);
    return [];
  }
};

// Create a new custom pair (works with or without authentication)
export const createCustomPair = async (term0: string, term1: string): Promise<WavelengthPair> => {
  // Check pair limit for ALL users
  const limitCheck = await checkPairLimit();
  
  if (!limitCheck.canCreate) {
    throw new Error(`PAIR_LIMIT_REACHED:${limitCheck.count}:${limitCheck.limit}`);
  }

  // Validate input
  if (!term0?.trim() || !term1?.trim()) {
    throw new Error('Both terms must be provided and cannot be empty');
  }

  // Get current user ID if available
  const userId = authService.getUserId();
  
  console.log('Creating pair with user ID:', userId || 'anonymous');

  // Check if pair already exists (in either direction)
  const exists = await pairExists(term0.trim(), term1.trim());
  if (exists) {
    throw new Error('This pair already exists');
  }

  // Create the pair data
  const pairData: any = {
    term_0: term0.trim(),
    term_1: term1.trim(),
    is_custom: true,
  };

  // Only add created_by if we have a user ID
  if (userId) {
    pairData.created_by = userId;
  }

  const { data: newPair, error } = await supabase
    .from('pairs')
    .insert(pairData)
    .select()
    .single();

  if (error) {
    console.error('Error creating custom pair:', error);
    throw error;
  }

  console.log('Pair created successfully');
  return newPair;
};

// Check if a pair already exists
export const pairExists = async (term0: string, term1: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('pairs')
    .select('id')
    .or(`and(term_0.eq.${term0},term_1.eq.${term1}),and(term_0.eq.${term1},term_1.eq.${term0})`)
    .limit(1);

  if (error) {
    console.error('Error checking if pair exists:', error);
    return false;
  }

  return (data && data.length > 0) ?? false;
};

// Delete a custom pair
export const deleteCustomPair = async (pairId: string): Promise<void> => {
  const userId = authService.getUserId();
  
  // Build the delete query
  let query = supabase
    .from('pairs')
    .delete()
    .eq('id', pairId)
    .eq('is_custom', true);

  // If user is authenticated, only allow deleting their own pairs
  // If not authenticated, allow deleting anonymous pairs (created_by is null)
  if (userId) {
    query = query.eq('created_by', userId);
  } else {
    query = query.is('created_by', null);
  }

  const { error } = await query;

  if (error) {
    console.error('Error deleting custom pair:', error);
    throw error;
  }
};

// Get pairs count
export const getPairsCount = async (): Promise<{ total: number; custom: number; builtin: number }> => {
  const { data: totalData, error: totalError } = await supabase
    .from('pairs')
    .select('id', { count: 'exact', head: true });

  const { data: customData, error: customError } = await supabase
    .from('pairs')
    .select('id', { count: 'exact', head: true })
    .eq('is_custom', true);

  if (totalError || customError) {
    console.error('Error getting pairs count:', totalError || customError);
    throw totalError || customError;
  }

  const total = totalData?.length || 0;
  const custom = customData?.length || 0;
  const builtin = total - custom;

  return { total, custom, builtin };
};

// Helper function to check if current user can delete a pair
export const canDeletePair = (pair: WavelengthPair): boolean => {
  const userId = authService.getUserId();
  
  // If user is authenticated, they can delete their own pairs
  if (userId && pair.created_by === userId) {
    return true;
  }
  
  // If user is not authenticated, they can delete anonymous pairs
  if (!userId && !pair.created_by) {
    return true;
  }
  
  return false;
};

// Convert database pair to game format (maintaining compatibility with existing code)
export const convertToWordPairs = (pair: WavelengthPair): WordPairs => {
  return {
    positive: pair.term_0,
    negative: pair.term_1
  };
};

// Convert multiple database pairs to game format
export const convertToWordPairsArray = (pairs: WavelengthPair[]): WordPairs[] => {
  return pairs.map(convertToWordPairs);
};