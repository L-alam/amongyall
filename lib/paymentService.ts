// lib/paymentService.ts
import { useStripe } from '@stripe/stripe-react-native';
import { Alert, Platform } from 'react-native';
import { storeKitService } from './storeKitService';
import { supabase } from './supabase';

export interface PaymentService {
  createSubscription: () => Promise<boolean>;
  isApplePaySupported: () => Promise<boolean>;
}

const PRO_SUBSCRIPTION_PRICE_ID = "price_1S99dHHCGWxH2Kw4YywerHsy"; 

export const usePaymentService = (): PaymentService => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  // iOS uses StoreKit, web/Android uses Stripe
  const createSubscription = async (): Promise<boolean> => {
    // On iOS, use StoreKit (Apple's IAP)
    if (Platform.OS === 'ios') {
      return await createAppleSubscription();
    }
    
    // On web/Android, use Stripe
    return await createStripeSubscription();
  };

  const createAppleSubscription = async (): Promise<boolean> => {
    try {
      console.log('Starting Apple subscription...');
      
      // Initialize StoreKit if not already done
      const initialized = await storeKitService.initialize();
      if (!initialized) {
        Alert.alert('Error', 'Failed to initialize payment system');
        return false;
      }

      // Get product info to show price
      const product = await storeKitService.getSubscriptionProduct();
      if (!product) {
        Alert.alert('Error', 'Subscription not available');
        return false;
      }

      console.log('Product found:', product);

      // Show confirmation with price
      return new Promise((resolve) => {
        Alert.alert(
          'Subscribe to Pro',
          `Unlock all premium features for ${product.localizedPrice}/month`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve(false),
            },
            {
              text: 'Subscribe',
              onPress: async () => {
                const success = await storeKitService.purchaseSubscription();
                resolve(success);
              },
            },
          ]
        );
      });
    } catch (error) {
      console.error('Error creating Apple subscription:', error);
      Alert.alert('Error', 'Failed to start subscription');
      return false;
    }
  };

  const createStripeSubscription = async (): Promise<boolean> => {
    try {
      console.log('Starting Stripe subscription...');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('Error', 'You must be logged in to subscribe');
        return false;
      }
  
      console.log('Creating subscription for user:', user.id);
  
      // Call your backend to create a subscription
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          priceId: PRO_SUBSCRIPTION_PRICE_ID,
          userId: user.id,
        },
      });
  
      if (error) {
        console.error('Error creating subscription:', error);
        Alert.alert('Error', `Failed to create subscription: ${error.message || 'Unknown error'}`);
        return false;
      }
  
      console.log('Subscription created, initializing payment sheet...', data);
  
      const { clientSecret } = data;
  
      if (!clientSecret) {
        console.error('No client secret received');
        Alert.alert('Error', 'Invalid response from server');
        return false;
      }
  
      // Initialize payment sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'AmongYall Pro',
        paymentIntentClientSecret: clientSecret,
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          name: user.user_metadata?.full_name || user.email,
          email: user.email,
        },
        applePay: Platform.OS === 'ios' ? {
          merchantCountryCode: 'US',
        } : undefined,
        googlePay: Platform.OS === 'android' ? {
          merchantCountryCode: 'US',
          testEnv: false,
          currencyCode: 'USD',
        } : undefined,
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
      Alert.alert('Success', 'Your Pro subscription is now active!');
      return true;
    } catch (error: any) {
      console.error('Unexpected error:', error);
      Alert.alert('Error', error.message || 'An unexpected error occurred');
      return false;
    }
  };

  const isApplePaySupported = async (): Promise<boolean> => {
    // On iOS, always return true since we use StoreKit
    if (Platform.OS === 'ios') {
      return true;
    }
    
    // On other platforms, check Stripe's Apple Pay support
    // (This would be for web users on Safari)
    return false;
  };

  return {
    createSubscription,
    isApplePaySupported,
  };
};