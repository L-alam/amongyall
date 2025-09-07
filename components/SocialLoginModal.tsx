// components/SocialLoginModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';

interface SocialLoginModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export const SocialLoginModal: React.FC<SocialLoginModalProps> = ({
  visible,
  onClose,
  title = "Sign In to Save Your Progress",
  subtitle = "Link your account to sync your data across devices"
}) => {
  const { linkToSocial, isAnonymous } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSocialLogin = async (provider: 'google' | 'apple' | 'facebook') => {
    setLoading(provider);
    
    try {
      const { user, error } = await linkToSocial(provider);
      
      if (error) {
        Alert.alert('Sign In Error', error.message || 'Failed to sign in');
      } else if (user) {
        Alert.alert(
          'Success!', 
          isAnonymous 
            ? 'Your anonymous account has been linked! Your progress is now saved.'
            : 'Successfully signed in!'
        );
        onClose();
      }
    } catch (error) {
      console.error('Social login error:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(null);
    }
  };

  const renderSocialButton = (
    provider: 'google' | 'apple' | 'facebook',
    text: string,
    backgroundColor: string,
    textColor: string = '#FFFFFF'
  ) => (
    <TouchableOpacity
      style={[styles.socialButton, { backgroundColor }]}
      onPress={() => handleSocialLogin(provider)}
      disabled={loading !== null}
    >
      {loading === provider ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.socialButtonText, { color: textColor }]}>
          {text}
        </Text>
      )}
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
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          <View style={styles.buttonsContainer}>
            {renderSocialButton('google', 'Continue with Google', '#4285F4')}
            {/* Apple and Facebook temporarily disabled - focus on Google first */}
            {/* {renderSocialButton('apple', 'Continue with Apple', '#000000')} */}
            {/* {renderSocialButton('facebook', 'Continue with Facebook', '#1877F2')} */}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Maybe Later</Text>
            </TouchableOpacity>
            
            {isAnonymous && (
              <Text style={styles.disclaimerText}>
                You can continue playing anonymously. Your progress will be saved locally.
              </Text>
            )}
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
  },
  buttonsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  socialButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
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