import { supabase } from './supabase';

export interface WavelengthPair {
  id: string;
  term_0: string;
  term_1: string;
  is_custom: boolean;
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
    
    // Shuffle the array and take the requested count
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

// Create a custom pair
export const createCustomPair = async (term0: string, term1: string): Promise<WavelengthPair> => {
  // Validate input
  if (!term0.trim() || !term1.trim()) {
    throw new Error('Both terms must be provided and cannot be empty');
  }

  // Check if this exact pair already exists
  const { data: existingPair, error: checkError } = await supabase
    .from('pairs')
    .select('id')
    .eq('term_0', term0.trim())
    .eq('term_1', term1.trim())
    .single();

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
    console.error('Error checking pair existence:', checkError);
    throw checkError;
  }

  if (existingPair) {
    throw new Error(`Pair "${term0}" ↔ "${term1}" already exists`);
  }

  // Create the new pair
  const { data: newPair, error: createError } = await supabase
    .from('pairs')
    .insert({
      term_0: term0.trim(),
      term_1: term1.trim(),
      is_custom: true,
    })
    .select()
    .single();

  if (createError) {
    console.error('Error creating custom pair:', createError);
    throw createError;
  }

  return newPair;
};

// Delete a custom pair
export const deleteCustomPair = async (pairId: string): Promise<void> => {
  // Safety check to only delete custom pairs
  const { error } = await supabase
    .from('pairs')
    .delete()
    .eq('id', pairId)
    .eq('is_custom', true);

  if (error) {
    console.error('Error deleting custom pair:', error);
    throw error;
  }
};

// Update a custom pair
export const updateCustomPair = async (pairId: string, term0: string, term1: string): Promise<WavelengthPair> => {
  // Validate input
  if (!term0.trim() || !term1.trim()) {
    throw new Error('Both terms must be provided and cannot be empty');
  }

  // Update the pair (only if it's custom)
  const { data: updatedPair, error } = await supabase
    .from('pairs')
    .update({
      term_0: term0.trim(),
      term_1: term1.trim(),
    })
    .eq('id', pairId)
    .eq('is_custom', true)
    .select()
    .single();

  if (error) {
    console.error('Error updating custom pair:', error);
    throw error;
  }

  if (!updatedPair) {
    throw new Error('Pair not found or is not a custom pair');
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