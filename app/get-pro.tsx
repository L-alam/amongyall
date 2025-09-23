// app/get-pro.tsx
import { Ionicons } from '@expo/vector-icons';
import { StripeProvider, useApplePay } from '@stripe/stripe-react-native';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PaymentMethodModal } from '../components/PaymentMethodModal';
import { usePaymentService } from '../lib/paymentService';
import { STRIPE_CONFIG } from '../lib/stripeConfig';
import { supabase } from '../lib/supabase';

export default function GetProScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [proLoading, setProLoading] = useState(true);
  const [isAlreadyPro, setIsAlreadyPro] = useState(false);
  const [proExpiresAt, setProExpiresAt] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { createSubscription, createApplePaySubscription } = usePaymentService();
  const { presentApplePay, confirmApplePayPayment } = useApplePay();

  useEffect(() => {
    checkProStatus();
  }, []);

  const checkProStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_pro, pro_expires_at, subscription_status')
        .eq('id', user.id)
        .single();

      if (profile) {
        console.log('Current pro status:', profile);
        
        // Check if pro subscription is still valid
        const now = new Date();
        const expiresAt = profile.pro_expires_at ? new Date(profile.pro_expires_at) : null;
        const isProValid = profile.is_pro && (!expiresAt || expiresAt > now);
        
        setIsAlreadyPro(isProValid);
        setProExpiresAt(profile.pro_expires_at);
      }
    } catch (error) {
      console.error('Error checking pro status:', error);
    } finally {
      setProLoading(false);
    }
  };

  const handleSubscribeCheck = async () => {
    try {
      console.log('Checking user authentication status...');
      
      // Check if user is signed in
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        Alert.alert(
          "Sign In Required",
          "You must sign in to continue",
          [{ text: "OK" }]
        );
        return;
      }

      // Check the auth user's is_anonymous property directly
      const isAnonymousUser = user.is_anonymous === true;
      
      console.log('Auth check results:', {
        userId: user.id,
        isAnonymous: isAnonymousUser,
        userEmail: user.email,
        userMetadata: user.user_metadata
      });

      if (isAnonymousUser) {
        Alert.alert(
          "Sign In Required",
          "You must sign in to continue",
          [{ text: "OK" }]
        );
        return;
      }
      
      // If we get here, user is properly authenticated, show payment modal
      console.log('User authentication passed, showing payment modal');
      setShowPaymentModal(true);
    } catch (error) {
      console.error('Error checking authentication:', error);
      Alert.alert(
        "Error",
        "Something went wrong. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const handleStripePayment = async () => {
    setIsLoading(true);
    try {
      console.log('Starting Stripe subscription process...');
      
      const success = await createSubscription();
      
      if (success) {
        console.log('Stripe subscription successful, refreshing status...');
        // Wait a moment for webhook to process
        setTimeout(async () => {
          await checkProStatus();
          router.push('/');
        }, 2000);
      }
    } catch (error) {
      console.error('Stripe subscription error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplePayment = async () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Error', 'Apple Pay is only available on iOS devices');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Starting Apple Pay subscription process...');
      
      // Check if Apple Pay is available
      const { isApplePaySupported } = await presentApplePay({
        cartItems: [{
          label: 'Pro Subscription',
          amount: '3.00',
          paymentType: 'Immediate',
        }],
        country: 'US',
        currency: 'USD',
        merchantIdentifier: 'merchant.com.lalam.amongyall',
      });

      if (!isApplePaySupported) {
        Alert.alert('Error', 'Apple Pay is not supported on this device');
        return;
      }

      // If you have a separate Apple Pay subscription method
      const success = await createApplePaySubscription();
      
      if (success) {
        console.log('Apple Pay subscription successful, refreshing status...');
        // Wait a moment for webhook to process
        setTimeout(async () => {
          await checkProStatus();
          router.push('/');
        }, 2000);
      }
    } catch (error) {
      console.error('Apple Pay subscription error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  // Show loading while checking pro status
  if (proLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#F59E0B" />
        <Text style={{ marginTop: 16, color: '#6B7280' }}>Checking subscription status...</Text>
      </SafeAreaView>
    );
  }

  // If already pro, show status
  if (isAlreadyPro) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FEF3E2" />
        
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pro Status</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.proStatusContainer}>
          <View style={styles.diamondBadge}>
            <Ionicons name="diamond" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.proStatusTitle}>You're Already Pro! 🎉</Text>
          <Text style={styles.proStatusSubtitle}>
            Your subscription is active and will renew monthly.
          </Text>
          {proExpiresAt && (
            <Text style={styles.expiryText}>
              Next billing: {new Date(proExpiresAt).toLocaleDateString()}
            </Text>
          )}
          
          <TouchableOpacity style={styles.continueButton} onPress={() => router.push('/')}>
            <Text style={styles.continueButtonText}>Continue to App</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <StripeProvider 
      publishableKey={STRIPE_CONFIG.publishableKey}
      merchantIdentifier="merchant.com.lalam.amongyall"
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FEF3E2" />
      
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Pro Badge */}
          <View style={styles.badgeContainer}>
            <View style={styles.diamondBadge}>
              <Ionicons name="diamond" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.badgeTitle}>Go Pro</Text>
          </View>

          {/* Features List */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>What's Included:</Text>
            
            <View style={styles.feature}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text style={styles.featureText}>Unlimited custom games</Text>
            </View>
            
            <View style={styles.feature}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text style={styles.featureText}>Unlimited themes & questions</Text>
            </View>
            
            <View style={styles.feature}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text style={styles.featureText}>No ads</Text>
            </View>
            
            <View style={styles.feature}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text style={styles.featureText}>Priority support</Text>
            </View>
          </View>

          {/* Pricing */}
          <View style={styles.pricingContainer}>
            <Text style={styles.pricingTitle}>Monthly Subscription</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceAmount}>$3.00</Text>
              <Text style={styles.pricePeriod}>/month</Text>
            </View>
            <Text style={styles.pricingSubtitle}>
              Renews automatically • Cancel anytime
            </Text>
          </View>

          {/* Subscribe Button */}
          <TouchableOpacity
            style={[styles.subscribeButton, isLoading && styles.subscribeButtonDisabled]}
            onPress={handleSubscribeCheck}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="diamond" size={20} color="#FFFFFF" />
                <Text style={styles.subscribeButtonText}>Get Pro Now</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            By subscribing, you agree to automatic monthly billing of $3.00. 
            You can cancel anytime in your account settings.
          </Text>
        </ScrollView>

        {/* Payment Method Modal */}
        <PaymentMethodModal
          visible={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onStripePayment={handleStripePayment}
          onApplePayment={handleApplePayment}
          title="Choose Payment Method"
          subtitle="Select how you'd like to pay for your Pro subscription"
          price="$3.00/month"
        />
      </SafeAreaView>
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF3E2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FEF3E2',
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  badgeContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  diamondBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  badgeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  badgeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  featuresContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#4B5563',
    marginLeft: 12,
    flex: 1,
  },
  pricingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  pricingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  priceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  pricePeriod: {
    fontSize: 18,
    color: '#6B7280',
    marginLeft: 4,
  },
  pricingSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  subscribeButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  disclaimer: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 16,
  },
  proStatusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  proStatusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  proStatusSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  expiryText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 32,
  },
  continueButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});