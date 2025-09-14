// lib/stripeConfig.ts
import { initStripe } from '@stripe/stripe-react-native';

// Your Stripe publishable key (from Stripe Dashboard)
const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_...'; // Replace with your key

export const initializeStripe = async () => {
  try {
    await initStripe({
      publishableKey: STRIPE_PUBLISHABLE_KEY,
      merchantIdentifier: 'merchant.com.yourapp.amongyall', // Replace with your Apple merchant ID
      urlScheme: 'amongyall', // Your app's URL scheme
    });
    console.log('Stripe initialized successfully');
  } catch (error) {
    console.error('Error initializing Stripe:', error);
  }
};

export const STRIPE_CONFIG = {
  publishableKey: STRIPE_PUBLISHABLE_KEY,
  merchantIdentifier: 'merchant.com.yourapp.amongyall',
  urlScheme: 'amongyall',
};