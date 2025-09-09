import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Color palette - Gaming-optimized with psychological impact
export const colors = {
  // Primary colors - Based on your Royal Blue foundation
  primary: '#03256C',        // Royal Blue - Trust, stability, focus
  primaryLight: '#2541B2',   // Persian Blue - Confidence, intelligence
  primaryDark: '#021A4A',    // Darker Royal Blue - Depth, premium feel
  
  // Secondary colors - Your Green Blue for balance
  secondary: '#1768AC',      // Green Blue - Balance of trust and growth
  secondaryLight: '#06BEE1', // Aero - Energy, freshness, excitement
  secondaryDark: '#0F4C75',  // Deeper Green Blue - Sophisticated contrast
  
  // Accent colors - High-energy gaming colors
  accent: '#FF6B35',         // Energetic Orange - Action, excitement, CTAs
  accentLight: '#FF8F65',    // Softer Orange - Approachable energy
  accentDark: '#E54B1C',     // Deep Orange - Urgency, competition
  
  // Complementary gaming colors
  highlight: '#FFE66D',      // Bright Yellow - Achievement, rewards, attention
  highlightLight: '#FFF094', // Soft Yellow - Gentle highlights
  highlightDark: '#E6CC4A',  // Golden Yellow - Premium rewards
  
  // Neutral colors - Enhanced with blue undertones
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#DADFF7',         // Your Lavender - Soft, calming background
  gray100: '#C8D1F0',        // Light blue-gray - Gentle surfaces
  gray200: '#B0BEE8',        // Medium blue-gray - Subtle borders
  gray300: '#98ACE0',        // Blue-tinted gray - Inactive elements
  gray400: '#7A8FD8',        // Muted blue - Secondary text
  gray500: '#5C72D0',        // Medium blue - Icons, dividers
  gray600: '#4A5FA8',        // Darker blue - Active text
  gray700: '#384780',        // Deep blue-gray - Headers
  gray800: '#262F58',        // Dark blue - Strong contrast
  gray900: '#141830',        // Very dark blue - Maximum contrast
  
  // Semantic colors - Gaming-appropriate
  success: '#00D564',        // Bright Green - Clear wins, achievements
  successLight: '#4AE584',   // Soft Green - Positive feedback
  successDark: '#00A84D',    // Deep Green - Strong success states
  
  warning: '#FFA726',        // Warm Orange - Caution, time running out
  warningLight: '#FFB74D',   // Light Orange - Gentle warnings
  warningDark: '#FF8F00',    // Deep Orange - Strong warnings
  
  error: '#FF4757',          // Vibrant Red - Clear errors, elimination
  errorLight: '#FF6B7A',     // Soft Red - Gentle error states
  errorDark: '#E53E3E',      // Deep Red - Critical errors
  
  info: '#06BEE1',           // Your Aero - Information, tips, guidance
  infoLight: '#4DD0EA',      // Light Aero - Subtle information
  infoDark: '#0590A8',       // Deep Aero - Important information
  
  // Background colors - Enhanced depth and warmth
  background: '#FAFBFF',     // Very light blue-white - Warm, inviting
  surface: '#F5F7FF',        // Light blue surface - Clean, modern
  surfaceElevated: '#FFFFFF', // Pure white - Elevated cards, modals
  overlay: 'rgba(3, 37, 108, 0.6)', // Royal blue overlay - Consistent with brand
  overlayLight: 'rgba(3, 37, 108, 0.3)', // Light overlay - Subtle effects
  
  // Game-specific colors - Enhanced with your palette
  chameleon: '#00D564',      // Bright success green - Matches semantic success
  chameleonLight: '#4AE584', // Light green accent
  chameleonDark: '#00A84D',  // Deep green for contrast
  
  wavelength: '#2541B2',     // Your Persian Blue - Perfect for wavelength theme
  wavelengthLight: '#4A63C8', // Light Persian Blue
  wavelengthDark: '#1A2E85', // Dark Persian Blue
  
  // Interactive states - Gaming-optimized
  hover: 'rgba(255, 107, 53, 0.1)',     // Orange hover - Warm, inviting
  pressed: 'rgba(3, 37, 108, 0.1)',     // Royal blue pressed - Consistent feedback
  focus: 'rgba(6, 190, 225, 0.2)',      // Aero focus - Clear focus states
  disabled: 'rgba(152, 172, 224, 0.5)', // Blue-gray disabled - Consistent with palette
  
  // Special gaming colors
  winner: '#FFE66D',         // Golden yellow - Victory, first place
  player: '#06BEE1',         // Aero - Player identification
  spy: '#FF4757',            // Error red - Spy/chameleon identification
  neutral: '#98ACE0',        // Medium blue-gray - Neutral elements


  scale50: '#FAFAFA',
  scale100: '#F5F5F5',
  scale200: '#E5E5E5',
  scale300: '#D4D4D4',
  scale400: '#A3A3A3',
  scale500: '#737373',
  scale600: '#525252',
  scale700: '#404040',
  scale800: '#262626',
  scale900: '#171717',
  
  // Gradient stops for advanced effects
  gradientPrimary: ['#03256C', '#2541B2'],     // Royal to Persian Blue
  gradientSecondary: ['#1768AC', '#06BEE1'],   // Green Blue to Aero
  gradientAccent: ['#FF6B35', '#FFE66D'],      // Orange to Yellow energy
  gradientSuccess: ['#00D564', '#4AE584'],     // Green success gradient
  gradientSurface: ['#FAFBFF', '#F5F7FF'],     // Subtle surface gradient
} as const;

// Typography system - Enhanced for gaming
export const typography = {
  // Font sizes - Optimized for mobile gaming
  fontSize: {
    xs: 12,    // Small labels, fine print
    sm: 14,    // Secondary text, captions
    base: 16,  // Body text, standard content
    lg: 18,    // Emphasized text, larger body
    xl: 20,    // Small headings, important text
    '2xl': 24, // Section headings, card titles
    '3xl': 30, // Page titles, game titles
    '4xl': 36, // Large game elements, scores
    '5xl': 48, // Hero text, main game displays
    '6xl': 64, // Extra large displays, countdowns
  },
  
  // Font weights - Gaming-appropriate hierarchy
  fontWeight: {
    light: '300' as const,     // Subtle text, descriptions
    normal: '400' as const,    // Body text, standard content
    medium: '500' as const,    // Slightly emphasized text
    semibold: '600' as const,  // Headings, important labels
    bold: '700' as const,      // Strong headings, CTAs
    extrabold: '800' as const, // Game titles, scores
    black: '900' as const,     // Hero text, major displays
  },
  
  // Line heights - Optimized for readability and gaming
  lineHeight: {
    tight: 1.1,    // Large displays, titles
    snug: 1.25,    // Headings, emphasized text
    normal: 1.4,   // Body text, standard content
    relaxed: 1.6,  // Longer text, descriptions
    loose: 1.8,    // Very readable text, instructions
  },
  
  // Letter spacing - Enhanced visual appeal
  letterSpacing: {
    tighter: -1,   // Large headings
    tight: -0.5,   // Headings
    normal: 0,     // Body text
    wide: 0.5,     // Emphasized text
    wider: 1,      // Buttons, labels
    widest: 2,     // Spaced out text, game elements
  },
} as const;

// Spacing system - Gaming-optimized (based on 8px grid)
export const spacing = {
  xs: 4,     // Tight spacing, small gaps
  sm: 8,     // Small spacing, compact layouts
  md: 16,    // Standard spacing, comfortable gaps
  lg: 24,    // Large spacing, section separation
  xl: 32,    // Extra large spacing, major sections
  '2xl': 40, // Very large spacing, page sections
  '3xl': 48, // Huge spacing, dramatic separation
  '4xl': 64, // Massive spacing, full section breaks
  '5xl': 80, // Extra massive spacing
  '6xl': 96, // Maximum spacing for major layouts
} as const;

// Border radius system - Modern, gaming-friendly
export const borderRadius = {
  none: 0,    // Sharp edges, modern look
  xs: 2,      // Subtle rounding
  sm: 4,      // Small rounding, buttons
  md: 8,      // Standard rounding, cards
  lg: 12,     // Large rounding, major elements
  xl: 16,     // Extra large rounding, special cards
  '2xl': 20,  // Very large rounding, hero elements
  '3xl': 24,  // Huge rounding, decorative elements
  '4xl': 32,  // Massive rounding, special effects
  full: 9999, // Perfect circles, avatars
} as const;

// Shadow system - Enhanced depth and gaming feel
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  sm: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  xl: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  '2xl': {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },
  // Special gaming shadows
  glow: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 0,
  },
  success: {
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  warning: {
    shadowColor: colors.warning,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  error: {
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
} as const;

// Layout constants - Gaming-optimized
export const layout = {
  screenWidth,
  screenHeight,
  headerHeight: 64,      // Slightly taller for better presence
  tabBarHeight: 84,      // Taller for better touch targets
  buttonHeight: 52,      // Slightly taller for better gaming UX
  inputHeight: 48,       // Taller for easier interaction
  cardMinHeight: 120,    // Minimum card height for content
  gameCardHeight: 200,   // Standard game card height
  iconSize: {
    xs: 16,   // Small icons, indicators
    sm: 20,   // Standard small icons
    md: 24,   // Standard medium icons
    lg: 28,   // Large icons, primary actions
    xl: 32,   // Extra large icons, hero elements
    '2xl': 40, // Very large icons, game elements
    '3xl': 48, // Huge icons, major game displays
  },
} as const;

// Animation timings - Gaming-optimized for snappy feel
export const animation = {
  instant: 0,     // Immediate changes
  fastest: 100,   // Very quick transitions
  fast: 150,      // Quick transitions, micro-interactions
  normal: 250,    // Standard transitions, UI changes
  slow: 350,      // Slower transitions, major changes
  slower: 500,    // Very slow transitions, dramatic effects
  slowest: 750,   // Maximum timing for special effects
} as const;

// Breakpoints for responsive design
export const breakpoints = {
  xs: 320,   // Very small phones
  sm: 380,   // Small phones
  md: 768,   // Tablets
  lg: 1024,  // Large tablets, small laptops
  xl: 1280,  // Laptops
} as const;

// Z-index system - Enhanced for gaming modals and overlays
export const zIndex = {
  base: 0,          // Base layer
  behind: -1,       // Behind base (rare use)
  elevated: 10,     // Slightly elevated elements
  dropdown: 1000,   // Dropdowns, selects
  sticky: 1020,     // Sticky elements
  overlay: 1030,    // Background overlays
  modal: 1040,      // Modals, dialogs
  popover: 1050,    // Popovers, tooltips
  toast: 1060,      // Toast notifications
  tooltip: 1070,    // Tooltips (highest interactive)
  debug: 9999,      // Debug overlays
} as const;

// Game-specific constants
export const gameConstants = {
  // Card dimensions and spacing
  cardAspectRatio: 1.4,     // Height to width ratio for game cards
  cardSpacing: spacing.md,   // Spacing between cards
  
  // Player avatars and indicators
  avatarSize: {
    sm: 32,    // Small avatar in lists
    md: 48,    // Standard avatar size
    lg: 64,    // Large avatar for profiles
    xl: 96,    // Extra large for game displays
  },
  
  // Game timing and feedback
  feedbackDuration: animation.fast,     // Quick feedback animations
  cardFlipDuration: animation.slow,     // Card flip animations
  countdownDuration: animation.normal,  // Countdown transitions
  
  // Touch targets for mobile gaming
  minimumTouchTarget: 44,   // iOS minimum touch target
  recommendedTouchTarget: 48, // Recommended for gaming
  largeTouchTarget: 56,     // Large touch targets for primary actions
} as const;