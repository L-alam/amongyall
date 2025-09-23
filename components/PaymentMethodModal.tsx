// components/PaymentMethodModal.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface PaymentMethodModalProps {
  visible: boolean;
  onClose: () => void;
  onStripePayment: () => Promise<void>;
  onApplePayment: () => Promise<void>;
  title?: string;
  subtitle?: string;
  price?: string;
}

export const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  visible,
  onClose,
  onStripePayment,
  onApplePayment,
  title = "Choose Payment Method",
  subtitle = "Select how you'd like to pay for your Pro subscription",
  price = "$3.00/month"
}) => {
  const [loading, setLoading] = useState<string | null>(null);

  const handlePaymentMethod = async (method: 'stripe' | 'apple') => {
    setLoading(method);
    
    try {
      if (method === 'stripe') {
        await onStripePayment();
      } else if (method === 'apple') {
        await onApplePayment();
      }
      onClose();
    } catch (error) {
      console.error(`${method} payment error:`, error);
      Alert.alert('Payment Error', 'An unexpected error occurred');
    } finally {
      setLoading(null);
    }
  };

  const renderPaymentButton = (
    method: 'stripe' | 'apple',
    text: string,
    icon: keyof typeof Ionicons.glyphMap,
    backgroundColor: string,
    textColor: string = '#FFFFFF'
  ) => (
    <TouchableOpacity
      style={[styles.paymentButton, { backgroundColor }]}
      onPress={() => handlePaymentMethod(method)}
      disabled={loading !== null}
    >
      <View style={styles.buttonContent}>
        {loading === method ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <>
            <Ionicons name={icon} size={20} color={textColor} />
            <Text style={[styles.paymentButtonText, { color: textColor }]}>
              {text}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={styles.proBadge}>
              <Ionicons name="diamond" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            <View style={styles.priceContainer}>
              <Text style={styles.priceText}>{price}</Text>
            </View>
          </View>

          <View style={styles.buttonsContainer}>
            {/* Apple Pay Button - only show on iOS */}
            {Platform.OS === 'ios' && (
              renderPaymentButton(
                'apple', 
                'Pay with Apple Pay', 
                'logo-apple', 
                '#000000'
              )
            )}
            
            {/* Stripe Payment Button */}
            {renderPaymentButton(
              'stripe', 
              'Pay with Card', 
              'card-outline', 
              '#635BFF'
            )}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <Text style={styles.disclaimerText}>
              Secure payment • Cancel anytime • No hidden fees
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    minWidth: 300,
    maxWidth: 400,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  proBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  priceContainer: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  paymentButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },
});