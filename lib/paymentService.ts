// lib/paymentService.ts
import { PlatformPay, usePlatformPay, useStripe } from '@stripe/stripe-react-native';
import { Alert, Platform } from 'react-native';
import { supabase } from './supabase';

export interface PaymentService {
  createSubscription: (priceId?: string) => Promise<boolean>;
  createApplePaySubscription: (priceId?: string) => Promise<boolean>;
  isApplePaySupported: () => Promise<boolean>;
}

// Replace this with your actual Price ID from Stripe Dashboard
const PRO_SUBSCRIPTION_PRICE_ID = "price_1S99dHHCGWxH2Kw4YywerHsy"; 

export const usePaymentService = (): PaymentService => {
  const { initPaymentSheet, presentPaymentSheet, confirmPayment } = useStripe();
  const { isPlatformPaySupported, confirmPlatformPayPayment } = usePlatformPay();

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
          testEnv: false, 
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

  const createApplePaySubscription = async (priceId: string = PRO_SUBSCRIPTION_PRICE_ID): Promise<boolean> => {
    try {
      console.log('Starting Apple Pay subscription...');

      // Check if Apple Pay is supported
      if (Platform.OS !== 'ios') {
        Alert.alert('Error', 'Apple Pay is only available on iOS devices');
        return false;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('Error', 'You must be logged in to subscribe');
        return false;
      }

      console.log('Creating Apple Pay subscription for user:', user.id);

      // Call your backend to create a subscription with Apple Pay intent
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          priceId,
          userId: user.id,
          paymentMethod: 'apple_pay',
        },
      });

      if (error) {
        console.error('Error creating Apple Pay subscription:', error);
        Alert.alert('Error', `Failed to create subscription: ${error.message || 'Unknown error'}`);
        return false;
      }

      console.log('Apple Pay subscription created, presenting Apple Pay...', data);

      const { clientSecret, subscriptionId } = data;

      if (!clientSecret) {
        console.error('No client secret received for Apple Pay');
        Alert.alert('Error', 'Invalid response from server');
        return false;
      }

      // Present Apple Pay using PlatformPay
      const { error: platformPayError } = await PlatformPay.presentApplePay({
        cartItems: [
          {
            label: 'AmongYall Pro - Monthly',
            amount: '3.00',
            paymentType: PlatformPay.PaymentType.Immediate,
          },
        ],
        country: 'US',
        currency: 'USD',
        merchantIdentifier: 'merchant.com.lalam.amongyall',
      });

      if (platformPayError) {
        console.error('Apple Pay presentation error:', platformPayError);
        if (platformPayError.code !== 'Canceled') {
          Alert.alert('Apple Pay Error', platformPayError.message);
        }
        return false;
      }

      // Confirm the Apple Pay payment
      const { error: confirmError } = await confirmPlatformPayPayment(
        clientSecret,
        {
          applePay: {
            cartItems: [
              {
                label: 'AmongYall Pro - Monthly',
                amount: '3.00',
                paymentType: PlatformPay.PaymentType.Immediate,
              },
            ],
            merchantIdentifier: 'merchant.com.lalam.amongyall',
            country: 'US',
            currency: 'USD',
          },
        }
      );

      if (confirmError) {
        console.error('Apple Pay confirmation error:', confirmError);
        Alert.alert('Payment Error', confirmError.message);
        return false;
      }

      console.log('Apple Pay subscription confirmed successfully!');

      Alert.alert(
        'Subscription Active!', 
        'Welcome to AmongYall Pro! Your monthly subscription is now active and will renew automatically for $3/month.',
        [{ text: 'OK' }]
      );

      await refreshUserProStatus();
      return true;

    } catch (error) {
      console.error('Apple Pay subscription error:', error);
      Alert.alert('Error', 'Apple Pay subscription failed');
      return false;
    }
  };

  const isApplePaySupported = async (): Promise<boolean> => {
    try {
      if (Platform.OS !== 'ios') {
        return false;
      }

      const isSupported = await isPlatformPaySupported({ applePay: true });
      console.log('Apple Pay supported:', isSupported);
      return isSupported;
    } catch (error) {
      console.error('Error checking Apple Pay support:', error);
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
    createApplePaySubscription,
    isApplePaySupported,
  };
};