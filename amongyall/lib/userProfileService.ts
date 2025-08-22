// lib/userProfileService.ts
import { supabase } from './supabase';
import { authService } from './authService';

export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  games_played: number;
  themes_created: number;
  questions_created: number;
  pairs_created: number;
}

class UserProfileService {
  
  // Get current user's profile
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    const userId = authService.getUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  }

  // Update user profile
  async updateUserProfile(updates: Partial<Pick<UserProfile, 'display_name' | 'avatar_url'>>): Promise<UserProfile | null> {
    const userId = authService.getUserId();
    if (!userId) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }

    return data;
  }

  // Get user statistics
  async getUserStats(): Promise<UserStats> {
    const userId = authService.getUserId();
    if (!userId) {
      return {
        games_played: 0,
        themes_created: 0,
        questions_created: 0,
        pairs_created: 0,
      };
    }

    try {
      // Count themes created by user
      const { count: themesCount } = await supabase
        .from('themes')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', userId)
        .eq('is_custom', true);

      // Count question sets created by user
      const { count: questionsCount } = await supabase
        .from('question_set')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', userId);

      // Count pairs created by user
      const { count: pairsCount } = await supabase
        .from('pairs')
        .select('id', { count: 'exact', head: true })
        .eq('created_by', userId)
        .eq('is_custom', true);

      return {
        games_played: 0, // You can implement game tracking later
        themes_created: themesCount || 0,
        questions_created: questionsCount || 0,
        pairs_created: pairsCount || 0,
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return {
        games_played: 0,
        themes_created: 0,
        questions_created: 0,
        pairs_created: 0,
      };
    }
  }

  // Convert anonymous account to permanent after social login
  async convertAnonymousAccount(): Promise<void> {
    const userId = authService.getUserId();
    if (!userId) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('user_profiles')
      .update({ is_anonymous: false })
      .eq('id', userId);

    if (error) {
      console.error('Error converting anonymous account:', error);
      throw error;
    }
  }

  // Delete user account and all associated data
  async deleteUserAccount(): Promise<void> {
    const userId = authService.getUserId();
    if (!userId) throw new Error('User not authenticated');

    // This will cascade delete all user data due to foreign key constraints
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      console.error('Error deleting user account:', error);
      throw error;
    }
  }

  // Check if user has created any content
  async hasUserContent(): Promise<boolean> {
    const stats = await this.getUserStats();
    return stats.themes_created > 0 || stats.questions_created > 0 || stats.pairs_created > 0;
  }
}

export const userProfileService = new UserProfileService();