// app/get-pro.tsx
import { Ionicons } from '@expo/vector-icons';
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
  View
} from 'react-native';
import { supabase } from '../lib/supabase';

// Dynamically import StoreKit to avoid crashes in Expo Go
let storeKitService: any = null;
try {
  const storeKit = require('../lib/storeKitService');
  storeKitService = storeKit.storeKitService;
} catch (error) {
  console.log('StoreKit not available (Expo Go mode)');
}

export default function GetProScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [proLoading, setProLoading] = useState(true);
  const [isAlreadyPro, setIsAlreadyPro] = useState(false);
  const [proExpiresAt, setProExpiresAt] = useState<string | null>(null);
  const [productPrice, setProductPrice] = useState<string>('$2.99');

  useEffect(() => {
    checkProStatus();
    loadProductPrice();
  }, []);

  const loadProductPrice = async () => {
    if (Platform.OS === 'ios' && storeKitService) {
      try {
        await storeKitService.initialize();
        const product = await storeKitService.getSubscriptionProduct();
        if (product?.localizedPrice) {
          setProductPrice(product.localizedPrice);
        }
      } catch (error) {
        console.error('Error loading product price:', error);
      }
    }
  };

  const checkProStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setProLoading(false);
        return;
      }

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
        
        const isActive = profile.is_pro && 
                        profile.subscription_status === 'active' &&
                        (!expiresAt || expiresAt > now);
        
        setIsAlreadyPro(isActive);
        setProExpiresAt(profile.pro_expires_at);
      }
    } catch (error) {
      console.error('Error checking pro status:', error);
    } finally {
      setProLoading(false);
    }
  };

  const handleSubscribePress = async () => {
    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to subscribe to Pro.');
      return;
    }

    // Check if we're in Expo Go or StoreKit not available
    if (!storeKitService) {
      Alert.alert(
        'Development Mode',
        'In-App Purchases require a development or production build. This feature is not available in Expo Go.\n\nPlease build the app with:\nnpx expo prebuild\neas build',
        [{ text: 'OK' }]
      );
      return;
    }

    // iOS - Use Apple IAP
    if (Platform.OS === 'ios') {
      handleAppleIAP();
    } else {
      // Android/Web - you can add Stripe here or show message
      Alert.alert(
        'Coming Soon',
        'Subscriptions on this platform are coming soon. Please use the iOS app to subscribe.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleAppleIAP = async () => {
    setIsLoading(true);
    try {
      // Initialize StoreKit
      const initialized = await storeKitService.initialize();
      if (!initialized) {
        Alert.alert('Error', 'Failed to initialize payment system. Please try again.');
        setIsLoading(false);
        return;
      }

      // Get product to verify it exists
      const product = await storeKitService.getSubscriptionProduct();
      if (!product) {
        Alert.alert('Error', 'Subscription not available. Please try again later.');
        setIsLoading(false);
        return;
      }

      console.log('Purchasing product:', product);

      // Purchase the subscription
      const success = await storeKitService.purchaseSubscription();
      
      if (success) {
        console.log('Apple IAP subscription successful');
        // Wait for receipt verification to complete
        setTimeout(async () => {
          await checkProStatus();
          router.push('/');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Apple IAP error:', error);
      Alert.alert(
        'Subscription Error',
        error.message || 'Failed to process your subscription. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    if (!storeKitService) {
      Alert.alert('Error', 'Restore is only available in production builds.');
      return;
    }

    setIsLoading(true);
    try {
      await storeKitService.restorePurchases();
      await checkProStatus();
      Alert.alert('Success', 'Purchases restored successfully!');
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
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
              Renews: {new Date(proExpiresAt).toLocaleDateString()}
            </Text>
          )}
          <TouchableOpacity style={styles.continueButton} onPress={() => router.push('/')}>
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Main subscription screen
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FEF3E2" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upgrade to Pro</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Pro Badge */}
        <View style={styles.badgeContainer}>
          <View style={styles.diamondBadge}>
            <Ionicons name="diamond" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.badgeTitle}>Go Pro</Text>
          <Text style={styles.badgeSubtitle}>Unlock all premium features</Text>
        </View>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>What You Get:</Text>
          
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.featureText}>Unlimited custom themes</Text>
          </View>
          
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.featureText}>Create your own word lists</Text>
          </View>
          
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.featureText}>AI-generated game themes</Text>
          </View>
          
          <View style={styles.feature}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.featureText}>Offline game mode</Text>
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
            <Text style={styles.priceAmount}>{productPrice}</Text>
            <Text style={styles.pricePeriod}>/month</Text>
          </View>
          <Text style={styles.pricingSubtitle}>
            Renews automatically • Cancel anytime
          </Text>
          <Text style={styles.paymentNote}>
            Payment will be charged to your Apple ID
          </Text>
        </View>

        {/* Subscribe Button */}
        <TouchableOpacity
          style={[styles.subscribeButton, isLoading && styles.subscribeButtonDisabled]}
          onPress={handleSubscribePress}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="diamond" size={20} color="#FFFFFF" />
              <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Restore Purchases Button */}
        {Platform.OS === 'ios' && (
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestorePurchases}
            disabled={isLoading}
          >
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.disclaimer}>
          Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current period. 
          Your account will be charged for renewal within 24 hours prior to the end of the current period. 
          You can manage and cancel your subscriptions in your App Store account settings.
        </Text>
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
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
  },
  scrollContent: {
    padding: 20,
  },
  badgeContainer: {
    alignItems: 'center',
    marginBottom: 24,
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
    marginBottom: 8,
  },
  paymentNote: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  subscribeButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
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
  restoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  restoreButtonText: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '500',
  },
  disclaimer: {
    fontSize: 11,
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