import { StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows} from '../constants/theme';


// Common text styles
export const textStyles = StyleSheet.create({
  // Headings
  h1: {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    lineHeight: typography.fontSize['4xl'] * typography.lineHeight.tight,
  } as TextStyle,
  
  h2: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    lineHeight: typography.fontSize['3xl'] * typography.lineHeight.tight,
  } as TextStyle,
  
  h3: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    lineHeight: typography.fontSize['2xl'] * typography.lineHeight.normal,
  } as TextStyle,
  
  h4: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    lineHeight: typography.fontSize.xl * typography.lineHeight.normal,
  } as TextStyle,
  
  // Body text
  body: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    color: colors.gray700,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
  } as TextStyle,
  
  bodySmall: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.normal,
    color: colors.gray600,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
  } as TextStyle,
  
  // Special text styles
  caption: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.normal,
    color: colors.gray500,
    lineHeight: typography.fontSize.xs * typography.lineHeight.normal,
  } as TextStyle,
  
  subtitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray600,
    lineHeight: typography.fontSize.lg * typography.lineHeight.normal,
  } as TextStyle,
  
  // App-specific text styles
  appTitle: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    letterSpacing: typography.letterSpacing.widest,
    lineHeight: typography.fontSize['3xl'] * typography.lineHeight.tight,
  } as TextStyle,
});

// Button style factory
export const createButtonStyle = (
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' = 'primary',
  size: 'sm' | 'md' | 'lg' = 'md'
): ViewStyle => {
  const baseStyle: ViewStyle = {
    borderRadius: borderRadius['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  };

  // Size variations
  const sizeStyles = {
    sm: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      minHeight: 40,
    },
    md: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      minHeight: 50,
    },
    lg: {
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing['2xl'],
      minHeight: 56,
    },
  };

  // Variant styles
  const variantStyles = {
    primary: {
      backgroundColor: colors.primary,
      ...shadows.md,
    },
    secondary: {
      backgroundColor: colors.secondary,
      ...shadows.md,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
  };

  return {
    ...baseStyle,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };
};

// Button text style factory
export const createButtonTextStyle = (
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' = 'primary',
  size: 'sm' | 'md' | 'lg' = 'md'
): TextStyle => {
  const sizeStyles = {
    sm: { fontSize: typography.fontSize.sm },
    md: { fontSize: typography.fontSize.base },
    lg: { fontSize: typography.fontSize.lg },
  };

  const variantStyles = {
    primary: { color: colors.white },
    secondary: { color: colors.white },
    outline: { color: colors.primary },
    ghost: { color: colors.primary },
  };

  return {
    fontWeight: typography.fontWeight.semibold,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };
};

// Input style factory
export const createInputStyle = (
  variant: 'default' | 'filled' | 'underlined' = 'default',
  hasError: boolean = false
): ViewStyle => {
  const baseStyle: ViewStyle = {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.gray900,
  };

  const variantStyles = {
    default: {
      borderWidth: 1,
      borderColor: hasError ? colors.error : colors.gray300,
      borderRadius: borderRadius.md,
      backgroundColor: colors.white,
    },
    filled: {
      backgroundColor: hasError ? colors.error + '10' : colors.gray100,
      borderRadius: borderRadius.md,
      borderWidth: 0,
    },
    underlined: {
      borderBottomWidth: 1,
      borderBottomColor: hasError ? colors.error : colors.gray300,
      backgroundColor: 'transparent',
      borderRadius: 0,
    },
  };

  return {
    ...baseStyle,
    ...variantStyles[variant],
  };
};

// Card style factory
export const createCardStyle = (elevation: 'sm' | 'md' | 'lg' = 'md'): ViewStyle => ({
  backgroundColor: colors.white,
  borderRadius: borderRadius.lg,
  padding: spacing.lg,
  ...shadows[elevation],
});

// Common layout styles
export const layoutStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  } as ViewStyle,
  
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  
  spaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing['3xl'],
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  } as ViewStyle,
  
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  } as ViewStyle,
  
  section: {
    marginBottom: spacing.xl,
  } as ViewStyle,
  
  // Safe area styles
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  } as ViewStyle,
});

// Game-specific styles
export const gameStyles = StyleSheet.create({
  gameCard: {
    ...createCardStyle('md'),
    backgroundColor: colors.primary,
    marginBottom: spacing.lg,
  } as ViewStyle,
  
  gameButton: {
    ...createButtonStyle('primary', 'lg'),
    marginBottom: spacing.lg,
    width: '100%',
  } as ViewStyle,
  
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  
  themeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  } as ViewStyle,
  
  themeSelectorActive: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondary + '10',
  } as ViewStyle,
});

// Utility functions for responsive styles
export const responsive = {
  // Scale font size based on screen size
  scaledFont: (size: number): number => {
    const scale = screenWidth / 375; // Base on iPhone X width
    return Math.round(size * scale);
  },
  
  // Scale spacing based on screen size
  scaledSpacing: (space: number): number => {
    const scale = screenWidth / 375;
    return Math.round(space * scale);
  },
  
  // Check if device is tablet
  isTablet: (): boolean => screenWidth >= 768,
  
  // Get responsive value
  getResponsiveValue: <T>(phone: T, tablet: T): T => {
    return screenWidth >= 768 ? tablet : phone;
  },
};

// Helper function to combine styles safely
export const combineStyles = (...styles: any[]) => {
  return StyleSheet.flatten(styles.filter(Boolean));
};