import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Color palette - easily changeable for different themes
export const colors = {
  // Primary colors
  primary: '#333333',
  primaryLight: '#666666',
  primaryDark: '#1a1a1a',
  
  // Secondary colors
  secondary: '#007AFF',
  secondaryLight: '#4DA6FF',
  secondaryDark: '#0051CC',
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  gray100: '#F5F5F5',
  gray200: '#E5E5E5',
  gray300: '#D4D4D4',
  gray400: '#A3A3A3',
  gray500: '#737373',
  gray600: '#525252',
  gray700: '#404040',
  gray800: '#262626',
  gray900: '#171717',
  
  // Semantic colors
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Background colors
  background: '#FFFFFF',
  surface: '#F9F9F9',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Game-specific colors
  chameleon: '#10B981', // Green for chameleon theme
  wavelength: '#8B5CF6', // Purple for wavelength theme
} as const;

// Typography system
export const typography = {
  // Font sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  // Font weights
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
  
  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 2,
  },
} as const;

// Spacing system (based on 8px grid)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
  '4xl': 64,
  '5xl': 80,
  '6xl': 96,
} as const;

// Border radius system
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const;

// Shadow system
export const shadows = {
  sm: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// Layout constants
export const layout = {
  screenWidth,
  screenHeight,
  headerHeight: 60,
  tabBarHeight: 80,
  buttonHeight: 50,
  inputHeight: 44,
  iconSize: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
  },
} as const;

// Animation timings
export const animation = {
  fast: 150,
  normal: 250,
  slow: 350,
} as const;

// Breakpoints for responsive design
export const breakpoints = {
  sm: 380,
  md: 768,
  lg: 1024,
} as const;

// Z-index system
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  modal: 1030,
  popover: 1040,
  tooltip: 1050,
  overlay: 1060,
} as const;

// ############################## Example Questions ########################

// ############################## Wavelength Pairs ########################


export interface WordPairs {
  positive: string;
  negative: string;
}

export const wordPairs: WordPairs[] = [
  { positive: 'Good', negative: 'Bad' },
  { positive: 'Highly addictive', negative: 'Mildly addictive' },
  { positive: 'Cold', negative: 'Hot' },
  { positive: 'Weird', negative: 'Normal' },
  { positive: 'Colorful', negative: 'Colorless' },
  { positive: 'High calorie', negative: 'Low calorie' },
  { positive: 'Feels good', negative: 'Feels bad' },
  { positive: 'Essential', negative: 'Inessential' },
  { positive: 'Expensive', negative: 'Cheap' },
  { positive: 'Overrated weapon', negative: 'Underrated weapon' },
  { positive: 'Common', negative: 'Rare' },
  { positive: 'Hard subject', negative: 'Easy subject' },
  { positive: 'Famous', negative: 'Unknown' },
  { positive: 'Easy to use', negative: 'Difficult to use' },
  { positive: 'Wired', negative: 'Normal' },
  { positive: 'Clean', negative: 'Dirty' },
  { positive: 'Requires skill', negative: 'Requires luck' },
  { positive: 'Flavorful', negative: 'Flavorless' },
  { positive: 'Fascinating topic', negative: 'Boring topic' },
  { positive: 'Good actors', negative: 'Bad actor' },
  { positive: 'Hipster', negative: 'Basic' },
  { positive: 'Safe job', negative: 'Dangerous job' },
  { positive: 'Sci-Fi', negative: 'Fantasy' },
  { positive: 'Formal', negative: 'Casual' },
  { positive: 'Overpaid', negative: 'Underpaid' },
  { positive: 'Wet', negative: 'Dry' },
  { positive: 'Overrated skill', negative: 'Underrated skill' },
  { positive: 'Encouraged', negative: 'Forbidden' },
  { positive: 'Happy song', negative: 'Sad song' },
  { positive: 'Durable', negative: 'Fragile' },
  { positive: 'Dork', negative: 'Geek' },
  { positive: 'Evil', negative: 'Good' },
  { positive: 'Best day of the year', negative: 'Worst day of the year' },
  { positive: 'Good habit', negative: 'Bad habit' },
  { positive: 'Dog person', negative: 'Cat person' },
  { positive: 'Openly love', negative: 'Guilty pleasure' },
  { positive: 'Talented', negative: 'Untalented' },
  { positive: 'Light', negative: 'Dark' },
  { positive: 'Overrated actor', negative: 'Underrated actor' },
  { positive: 'Easy to find', negative: 'Hard to find' },
  { positive: 'Beautiful man', negative: 'Ugly man' },
  { positive: 'Easy to remember', negative: 'Hard to remember' },
  { positive: 'Highbrow', negative: 'Lowbrow' },
  { positive: 'Healthy', negative: 'Unhealthy' },
  { positive: 'Good man', negative: 'Bad man' },
  { positive: 'Historically irrelevant', negative: 'Historically important' },
  { positive: 'Hairy', negative: 'Hairless' }
];


// Utility functions for Wavelength Pairs

export const getRandomPair = (): WordPairs | undefined => {
  if (wordPairs.length === 0) return undefined;
  const index = Math.floor(Math.random() * wordPairs.length);
  return wordPairs[index];
};

export const getAllPairs = (): WordPairs[] => {
  return [...wordPairs];
};
