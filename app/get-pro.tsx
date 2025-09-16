import { Ionicons } from '@expo/vector-icons';
import { StripeProvider } from '@stripe/stripe-react-native';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePaymentService } from '../lib/paymentService';
import { STRIPE_CONFIG } from '../lib/stripeConfig';

// You'll need to import these from your existing files
// import { colors, layout, layoutStyles } from '../path/to/your/styles';

interface GetProScreenProps {
  navigation: any; // Replace with proper navigation type
}

const GetProScreen: React.FC<GetProScreenProps> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const paymentService = usePaymentService();
  
  const handleUpgradeToPro = async () => {
    setIsLoading(true);
    try {
      // Initialize payment sheet with $3 amount
      const initialized = await paymentService.initializePaymentSheet(3, 'usd');
      
      if (initialized) {
        // Present the payment sheet
        const success = await paymentService.presentPaymentSheet();
        
        if (success) {
          // Navigate back to home screen after successful payment
          handleGoBack();
        }
      }
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    router.push('/');
  };

  return (
    <StripeProvider publishableKey={STRIPE_CONFIG.publishableKey}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FEF3E2" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleGoBack}
        >
          <Ionicons 
            name="arrow-back" 
            size={24} 
            color="#374151" 
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upgrade to Pro</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Pro Badge */}
        <View style={styles.badgeContainer}>
          <View style={styles.diamondBadge}>
            <Ionicons 
              name="diamond" 
              size={40} 
              color="#FFFFFF" 
            />
          </View>
          <Text style={styles.badgeTitle}>Go Pro</Text>
          <Text style={styles.badgeSubtitle}>Unlock the full potential of your app</Text>
        </View>

        {/* Benefits Card */}
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>Pro Benefits</Text>
          
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <View style={styles.checkIcon}>
                <Ionicons name="checkmark" size={16} color="#059669" />
              </View>
              <Text style={styles.benefitText}>No Ads</Text>
            </View>
            
            <View style={styles.benefitItem}>
              <View style={styles.checkIcon}>
                <Ionicons name="checkmark" size={16} color="#059669" />
              </View>
              <Text style={styles.benefitText}>Unlimited Custom Themes/Pairs</Text>
            </View>
            
            <View style={styles.benefitItem}>
              <View style={styles.checkIcon}>
                <Ionicons name="checkmark" size={16} color="#059669" />
              </View>
              <Text style={styles.benefitText}>Download Items for Offline Use</Text>
            </View>
          </View>
        </View>

        {/* Pricing */}
        <View style={styles.pricingContainer}>
          <Text style={styles.priceAmount}>$3</Text>
          <Text style={styles.pricePeriod}>per month</Text>
        </View>

        {/* Upgrade Button */}
        <TouchableOpacity 
          style={[styles.upgradeButton, isLoading && styles.upgradeButtonDisabled]} 
          onPress={handleUpgradeToPro}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Cancel anytime. Terms and conditions apply.
        </Text>
      </ScrollView>
    </SafeAreaView>
    </StripeProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEF3E2', // Light amber background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginLeft: -32, // Offset the back button width
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  badgeContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  diamondBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F59E0B', // Amber gradient start
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  badgeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  badgeSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  benefitsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  benefitsList: {
    gap: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  benefitText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  pricingContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  priceAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  pricePeriod: {
    fontSize: 16,
    color: '#6B7280',
  },
  upgradeButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  upgradeButtonDisabled: {
    opacity: 0.6,
  },
  upgradeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disclaimer: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 32,
  },
});

export default GetProScreen;