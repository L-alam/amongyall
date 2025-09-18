// lib/paymentService.ts
import { useStripe } from '@stripe/stripe-react-native';
import { Alert } from 'react-native';
import { supabase } from './supabase';

export interface PaymentService {
  initializePaymentSheet: (amount: number, currency: string) => Promise<boolean>;
  presentPaymentSheet: () => Promise<boolean>;
  createSubscription: (priceId: string) => Promise<boolean>;
}

export const usePaymentService = (): PaymentService => {
  const { initPaymentSheet, presentPaymentSheet, confirmPayment } = useStripe();

  const initializePaymentSheet = async (amount: number, currency = 'usd'): Promise<boolean> => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('Error', 'You must be logged in to make a payment');
        return false;
      }

      // Call your backend to create a payment intent
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        body: {
          amount: amount * 100, // Convert to cents
          currency,
          userId: user.id,
        },
      });

      if (error) {
        console.error('Error creating payment intent:', error);
        console.error('Error response:', error.details); // Add this line
        Alert.alert('Error', 'Failed to initialize payment');
        return false;
      }

      const { clientSecret, ephemeralKey, customer } = data;

      // Initialize the payment sheet
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'AmongYall Pro',
        paymentIntentClientSecret: clientSecret,
        customerEphemeralKeySecret: ephemeralKey,
        customerId: customer,
        allowsDelayedPaymentMethods: true,
        defaultBillingDetails: {
          name: user.user_metadata?.full_name || user.email,
          email: user.email,
        },
        returnURL: 'amongyall://stripe-redirect',
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

      return true;
    } catch (error) {
      console.error('Payment initialization error:', error);
      Alert.alert('Error', 'Failed to initialize payment');
      return false;
    }
  };

  const handlePaymentSheet = async (): Promise<boolean> => {
    try {
      const { error } = await presentPaymentSheet();

      if (error) {
        if (error.code !== 'Canceled') {
          Alert.alert('Payment Error', error.message);
        }
        return false;
      }

      // Payment succeeded
      Alert.alert(
        'Payment Successful!', 
        'Welcome to AmongYall Pro! Your premium features are now active.',
        [{ text: 'OK' }]
      );

      // Refresh user data to get updated pro status
      await refreshUserProStatus();
      
      return true;
    } catch (error) {
      console.error('Payment sheet error:', error);
      Alert.alert('Error', 'Payment failed');
      return false;
    }
  };

  const createSubscription = async (priceId: string): Promise<boolean> => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('Error', 'You must be logged in to subscribe');
        return false;
      }

      // Call your backend to create a subscription
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          priceId,
          userId: user.id,
        },
      });

      if (error) {
        console.error('Error creating subscription:', error);
        Alert.alert('Error', 'Failed to create subscription');
        return false;
      }

      const { clientSecret } = data;

      // Confirm the payment
      const { error: confirmError } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
      });

      if (confirmError) {
        Alert.alert('Payment Error', confirmError.message);
        return false;
      }

      Alert.alert(
        'Subscription Active!', 
        'Welcome to AmongYall Pro! Your subscription is now active.',
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
      }
    } catch (error) {
      console.error('Error refreshing user status:', error);
    }
  };

  return {
    initializePaymentSheet,
    presentPaymentSheet: handlePaymentSheet,
    createSubscription,
  };
};