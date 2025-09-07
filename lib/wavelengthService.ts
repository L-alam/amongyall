import { supabase } from './supabase';
import { authService } from './authService';

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

// Get all wavelength pairs
export const getAllWavelengthPairs = async (): Promise<WavelengthPair[]> => {
  const { data, error } = await supabase
    .from('pairs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching wavelength pairs:', error);
    throw error;
  }

  return data || [];
};

// Get only built-in (non-custom) pairs
export const getBuiltInPairs = async (): Promise<WavelengthPair[]> => {
  const { data, error } = await supabase
    .from('pairs')
    .select('*')
    .eq('is_custom', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching built-in pairs:', error);
    throw error;
  }

  return data || [];
};

// Get only custom pairs
export const getCustomPairs = async (): Promise<WavelengthPair[]> => {
  const { data, error } = await supabase
    .from('pairs')
    .select('*')
    .eq('is_custom', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching custom pairs:', error);
    throw error;
  }

  return data || [];
};

// Get user's custom pairs (authenticated users only)
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

// Get anonymous custom pairs (created_by is null)
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

// Get a random pair from all pairs
export const getRandomPair = async (): Promise<WordPairs | null> => {
  try {
    const allPairs = await getAllWavelengthPairs();
    
    if (allPairs.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * allPairs.length);
    const selectedPair = allPairs[randomIndex];
    
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

// Get multiple random pairs
export const getRandomPairs = async (count: number, customOnly: boolean = false): Promise<WordPairs[]> => {
  try {
    const allPairs = customOnly ? await getCustomPairs() : await getAllWavelengthPairs();
    
    if (allPairs.length === 0) return [];
    
    // Shuffle and take requested count
    const shuffled = [...allPairs].sort(() => Math.random() - 0.5);
    const selectedPairs = shuffled.slice(0, Math.min(count, allPairs.length));
    
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

  console.log('Pair created successfully:', `${newPair.term_0} / ${newPair.term_1}`);
  return newPair;
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
  // If not authenticated, allow deleting anonymous pairs
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

// Update a custom pair
export const updateCustomPair = async (pairId: string, term0: string, term1: string): Promise<WavelengthPair> => {
  // Validate input
  if (!term0?.trim() || !term1?.trim()) {
    throw new Error('Both terms must be provided and cannot be empty');
  }

  const userId = authService.getUserId();

  // Build the update query
  let query = supabase
    .from('pairs')
    .update({
      term_0: term0.trim(),
      term_1: term1.trim(),
    })
    .eq('id', pairId)
    .eq('is_custom', true);

  // Ensure user can only update their own pairs
  if (userId) {
    query = query.eq('created_by', userId);
  } else {
    query = query.is('created_by', null);
  }

  const { data: updatedPair, error } = await query.select().single();

  if (error) {
    console.error('Error updating custom pair:', error);
    throw error;
  }

  if (!updatedPair) {
    throw new Error('Pair not found or you do not have permission to update it');
  }

  return updatedPair;
};

// Check if a pair already exists
export const pairExists = async (term0: string, term1: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('pairs')
    .select('id')
    .or(`and(term_0.eq.${term0.trim()},term_1.eq.${term1.trim()}),and(term_0.eq.${term1.trim()},term_1.eq.${term0.trim()})`)
    .single();

  if (error && error.code === 'PGRST116') { // Not found
    return false;
  }

  if (error) {
    console.error('Error checking pair existence:', error);
    throw error;
  }

  return !!data;
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