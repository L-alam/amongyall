// lib/wavelengthService.ts (FIXED VERSION with better offline handling)
import { authService } from './authService';
import { offlineStorageService } from './offlineStorageService';
import { supabase } from './supabase';

const ANONYMOUS_PAIR_LIMIT = 10;
const AUTHENTICATED_PAIR_LIMIT = 10;

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

export const getAllWavelengthPairsWithOffline = async (): Promise<WavelengthPair[]> => {
  try {
    // Always try offline first
    const offlineBasicPairs = await offlineStorageService.getBasicPairs();
    const offlineCustomPairs = await offlineStorageService.getCustomPairs();
    
    console.log(`Found ${offlineBasicPairs.length} offline basic pairs and ${offlineCustomPairs.length} offline custom pairs`);
    
    // Check if we're online
    const online = await isOnline();
    
    if (!online) {
      console.log('Offline mode - using only locally stored pairs');
      // Return offline pairs only
      return [...offlineBasicPairs, ...offlineCustomPairs];
    }
    
    // We're online - try to get online custom pairs and merge
    try {
      const onlineCustomPairs = await getUserCustomPairs();
      console.log(`Found ${onlineCustomPairs.length} online custom pairs`);
      
      // If we have offline basic pairs, use those + online custom pairs
      if (offlineBasicPairs.length > 0) {
        console.log('Using offline basic pairs + online custom pairs');
        const combinedPairs: WavelengthPair[] = [];
        const offlineCustomIds = new Set(offlineCustomPairs.map(p => p.id));
        
        // Add offline basic pairs
        combinedPairs.push(...offlineBasicPairs);
        
        // Add offline custom pairs
        combinedPairs.push(...offlineCustomPairs);
        
        // Add online custom pairs that aren't already offline
        onlineCustomPairs.forEach(onlinePair => {
          if (!offlineCustomIds.has(onlinePair.id)) {
            combinedPairs.push(onlinePair);
          }
        });
        
        return combinedPairs;
      } else {
        // No offline basic pairs, get online basic + custom
        console.log('No offline basic pairs, using online data');
        const onlineBasicPairs = await getAllWavelengthPairs();
        return [...onlineBasicPairs, ...onlineCustomPairs];
      }
    } catch (onlineError) {
      console.error('Error getting online custom pairs, falling back to offline only:', onlineError);
      // Fall back to offline pairs only
      return [...offlineBasicPairs, ...offlineCustomPairs];
    }
  } catch (error) {
    console.error('Error in getAllWavelengthPairsWithOffline:', error);
    // Final fallback - try online only if we can't get offline data
    try {
      const online = await isOnline();
      if (online) {
        return await getAllWavelengthPairs();
      } else {
        // We're offline and can't get offline data - return empty array
        console.log('Offline and no cached data available');
        return [];
      }
    } catch (finalError) {
      console.error('Final fallback failed:', finalError);
      return [];
    }
  }
};

// Check pair limit for ALL users (anonymous and authenticated)
export const checkPairLimit = async (): Promise<{ canCreate: boolean; count: number; limit: number }> => {
  const userId = authService.getUserId();
  const limit = userId ? AUTHENTICATED_PAIR_LIMIT : ANONYMOUS_PAIR_LIMIT;

  try {
    // First check if we're online
    const online = await isOnline();
    
    if (!online) {
      console.log('Offline mode - checking custom pairs limit from local storage');
      // When offline, count custom pairs from local storage
      const offlineCustomPairs = await offlineStorageService.getCustomPairs();
      const actualCount = offlineCustomPairs.length;
      
      return {
        canCreate: actualCount < limit,
        count: actualCount,
        limit
      };
    }

    // We're online - check via Supabase
    let query = supabase
      .from('pairs')
      .select('*', { count: 'exact', head: true })
      .eq('is_custom', true);

    if (userId) {
      query = query.eq('created_by', userId);
    } else {
      query = query.is('created_by', null);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error checking pair count online:', error);
      // Fall back to offline count if online check fails
      const offlineCustomPairs = await offlineStorageService.getCustomPairs();
      const actualCount = offlineCustomPairs.length;
      
      return {
        canCreate: actualCount < limit,
        count: actualCount,
        limit
      };
    }

    const actualCount = count || 0;
    
    return {
      canCreate: actualCount < limit,
      count: actualCount,
      limit
    };
  } catch (error) {
    console.error('Error in checkPairLimit:', error);
    // Final fallback - try to count offline pairs, otherwise allow creation
    try {
      const offlineCustomPairs = await offlineStorageService.getCustomPairs();
      const actualCount = offlineCustomPairs.length;
      
      return {
        canCreate: actualCount < limit,
        count: actualCount,
        limit
      };
    } catch (offlineError) {
      console.error('Could not check offline pairs either:', offlineError);
      // Ultimate fallback - allow creation with conservative approach
      return { canCreate: true, count: 0, limit };
    }
  }
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

export const getUserCustomPairsWithOffline = async (): Promise<WavelengthPair[]> => {
  try {
    // Always try offline first
    const offlineCustomPairs = await offlineStorageService.getCustomPairs();
    console.log(`Found ${offlineCustomPairs.length} offline custom pairs`);
    
    // Check if we're online
    const online = await isOnline();
    
    if (!online) {
      console.log('Offline mode - using only locally stored custom pairs');
      return offlineCustomPairs;
    }
    
    // We're online - try to get online custom pairs and merge
    try {
      const onlineCustomPairs = await getUserCustomPairs();
      console.log(`Found ${onlineCustomPairs.length} online custom pairs`);
      
      // Combine both, prioritizing offline versions if they exist
      const combinedPairs: WavelengthPair[] = [];
      const offlineIds = new Set(offlineCustomPairs.map(p => p.id));
      
      // Add offline pairs first
      combinedPairs.push(...offlineCustomPairs);
      
      // Add online pairs that aren't already offline
      onlineCustomPairs.forEach(onlinePair => {
        if (!offlineIds.has(onlinePair.id)) {
          combinedPairs.push(onlinePair);
        }
      });
      
      return combinedPairs;
    } catch (onlineError) {
      console.error('Error getting online custom pairs, falling back to offline only:', onlineError);
      return offlineCustomPairs;
    }
  } catch (error) {
    console.error('Error getting custom pairs with offline:', error);
    // Final fallback - try online only if offline fails
    try {
      const online = await isOnline();
      if (online) {
        return await getUserCustomPairs();
      } else {
        console.log('Offline and no cached custom pairs available');
        return [];
      }
    } catch (finalError) {
      console.error('Final fallback for custom pairs failed:', finalError);
      return [];
    }
  }
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
    const builtInPairs = await getBuiltInPairs();
    
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

export const getRandomPairWithOffline = async (): Promise<WordPairs | null> => {
  try {
    // First try offline basic pairs
    const offlineBasicPairs = await offlineStorageService.getBasicPairs();
    
    if (offlineBasicPairs.length > 0) {
      console.log('Using offline basic pairs for random selection');
      const randomIndex = Math.floor(Math.random() * offlineBasicPairs.length);
      const selectedPair = offlineBasicPairs[randomIndex];
      
      return {
        positive: selectedPair.term_0,
        negative: selectedPair.term_1
      };
    }
    
    // Check if we're online before trying online fallback
    const online = await isOnline();
    if (online) {
      console.log('No offline pairs, using online for random selection');
      return await getRandomPair();
    } else {
      console.log('Offline and no cached pairs for random selection');
      return null;
    }
  } catch (error) {
    console.error('Error getting random pair with offline:', error);
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
    const builtInPairs = await getBuiltInPairs();
    
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
  try {
    const userId = authService.getUserId();
    
    // First check built-in pairs (available to everyone)
    const { data: builtInData, error: builtInError } = await supabase
      .from('pairs')
      .select('id')
      .or('is_custom.is.null,is_custom.eq.false')
      .or(`and(term_0.eq.${term0},term_1.eq.${term1}),and(term_0.eq.${term1},term_1.eq.${term0})`)
      .limit(1);

    if (builtInError) {
      console.error('Error checking built-in pairs:', builtInError);
      return false;
    }

    if (builtInData && builtInData.length > 0) {
      return true; // Found in built-in pairs
    }

    // Then check current user's custom pairs
    let customQuery = supabase
      .from('pairs')
      .select('id')
      .eq('is_custom', true)
      .or(`and(term_0.eq.${term0},term_1.eq.${term1}),and(term_0.eq.${term1},term_1.eq.${term0})`)
      .limit(1);

    // Filter by current user's pairs
    if (userId) {
      customQuery = customQuery.eq('created_by', userId);
    } else {
      customQuery = customQuery.is('created_by', null);
    }

    const { data: customData, error: customError } = await customQuery;

    if (customError) {
      console.error('Error checking user custom pairs:', customError);
      return false;
    }

    return (customData && customData.length > 0) ?? false;
  } catch (error) {
    console.error('Error in pairExists:', error);
    return false;
  }
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

export const isOnline = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('pairs')
      .select('id')
      .limit(1);
    return !error;
  } catch {
    return false;
  }
};