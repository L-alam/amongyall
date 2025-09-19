// lib/subscriptionService.ts
import { supabase } from './supabase';

export interface CancelSubscriptionResult {
  success: boolean;
  error?: string;
  message?: string;
}

class SubscriptionService {
  async cancelSubscription(): Promise<CancelSubscriptionResult> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return {
          success: false,
          error: 'You must be logged in to cancel your subscription',
        };
      }

      // Call the cancel subscription function
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: {
          userId: user.id,
        },
      });

      if (error) {
        console.error('Error cancelling subscription:', error);
        return {
          success: false,
          error: error.message || 'Failed to cancel subscription. Please try again.',
        };
      }

      if (data.success) {
        return {
          success: true,
          message: data.message || 'Subscription cancelled successfully',
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to cancel subscription',
        };
      }
    } catch (error) {
      console.error('Subscription cancellation error:', error);
      return {
        success: false,
        error: 'Failed to cancel subscription. Please try again.',
      };
    }
  }

  // You can add more subscription-related methods here in the future
  // async getSubscriptionStatus(): Promise<SubscriptionStatus> { ... }
  // async updateSubscription(priceId: string): Promise<UpdateResult> { ... }
}

export const subscriptionService = new SubscriptionService();