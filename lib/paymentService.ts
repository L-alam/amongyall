// lib/paymentService.ts
import { useStripe } from '@stripe/stripe-react-native';
import { Alert } from 'react-native';
import { supabase } from './supabase';


export interface PaymentService {
  createSubscription: (priceId?: string) => Promise<boolean>;
}

// Replace this with your actual Price ID from Stripe Dashboard
const PRO_SUBSCRIPTION_PRICE_ID = "price_1S8mpCHCGWxH2Kw4LWeqCmP9";

export const usePaymentService = (): PaymentService => {
  const { initPaymentSheet, presentPaymentSheet, confirmPayment } = useStripe();

  const createSubscription = async (priceId: string = PRO_SUBSCRIPTION_PRICE_ID): Promise<boolean> => {
    try {
      console.log('Starting subscription creation...');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('Error', 'You must be logged in to subscribe');
        return false;
      }
  
      console.log('Creating subscription for user:', user.id);
  
      // Call your backend to create a subscription
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          priceId,
          userId: user.id,
        },
      });
  
      if (error) {
        console.error('Error creating subscription:', error);
        Alert.alert('Error', `Failed to create subscription: ${error.message || 'Unknown error'}`);
        return false;
      }
  
      console.log('Subscription created, initializing payment sheet...', data);
  
      const { clientSecret, subscriptionId } = data;
  
      if (!clientSecret) {
        console.error('No client secret received');
        Alert.alert('Error', 'Invalid response from server');
        return false;
      }
  
      // Initialize payment sheet with the subscription's client secret
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'AmongYall Pro',
        paymentIntentClientSecret: clientSecret,
        allowsDelayedPaymentMethods: true,
        returnURL: 'amongyall://stripe-redirect', 
        defaultBillingDetails: {
          name: user.user_metadata?.full_name || user.email,
          email: user.email,
        },
        applePay: {
          merchantCountryCode: 'US',
        },
        googlePay: {
          merchantCountryCode: 'US',
          testEnv: true, // Set to false for production
          currencyCode: 'USD',
        },
      });
  
      if (initError) {
        console.error('Error initializing payment sheet:', initError);
        Alert.alert('Error', 'Failed to initialize payment');
        return false;
      }
  
      console.log('Payment sheet initialized, presenting...');
  
      // Present payment sheet
      const { error: presentError } = await presentPaymentSheet();
  
      if (presentError) {
        if (presentError.code !== 'Canceled') {
          console.error('Payment presentation error:', presentError);
          Alert.alert('Payment Error', presentError.message);
        }
        return false;
      }
  
      console.log('Payment confirmed successfully!');
  
      Alert.alert(
        'Subscription Active!', 
        'Welcome to AmongYall Pro! Your monthly subscription is now active and will renew automatically for $3/month.',
        [{ text: 'OK' }]
      );
  
      await refreshUserProStatus();
      return true;
  
    } catch (error) {
      console.error('Subscription error:', error);
      Alert.alert('Error', 'Subscription failed');
      return false;
    }
  };

  const refreshUserProStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Trigger a refresh of user metadata or pro status
        await supabase.auth.refreshSession();
        
        // Fetch updated user profile data
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        console.log('Updated user profile after subscription:', profile);
      }
    } catch (error) {
      console.error('Error refreshing user status:', error);
    }
  };

  return {
    createSubscription,
  };
};