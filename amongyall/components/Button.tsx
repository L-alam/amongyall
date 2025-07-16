import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createButtonStyle, createButtonTextStyle } from '../utils/styles';
import { colors, spacing } from '../constants/theme';

interface ButtonProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
  style?: any;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  onPress,
  style,
}) => {
  const buttonStyle = createButtonStyle(variant, size);
  const textStyle = createButtonTextStyle(variant, size);

  const iconSize = size === 'sm' ? 16 : size === 'md' ? 20 : 24;
  const iconColor = variant === 'primary' || variant === 'secondary' ? colors.white : colors.primary;

  return (
    <TouchableOpacity
      style={[
        buttonStyle,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {icon && iconPosition === 'left' && (
        <Ionicons 
          name={icon} 
          size={iconSize} 
          color={iconColor} 
          style={styles.iconLeft} 
        />
      )}
      
      <Text style={[textStyle, disabled && styles.disabledText]}>
        {loading ? 'Loading...' : title}
      </Text>
      
      {icon && iconPosition === 'right' && (
        <Ionicons 
          name={icon} 
          size={iconSize} 
          color={iconColor} 
          style={styles.iconRight} 
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
});