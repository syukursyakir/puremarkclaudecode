/**
 * PureMark Theme - Monochrome color palette
 */

import { Platform } from 'react-native';

// Monochrome palette
export const Colors = {
  // Primary colors
  black: '#000000',
  white: '#FFFFFF',
  
  // Grays
  gray100: '#F7F7F7',
  gray200: '#E5E5E5',
  gray300: '#D4D4D4',
  gray400: '#A3A3A3',
  gray500: '#737373',
  gray600: '#525252',
  gray700: '#404040',
  gray800: '#262626',
  gray900: '#171717',

  // Semantic colors (for status indicators)
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  
  // Theme variants
  light: {
    text: '#000000',
    textSecondary: '#525252',
    textMuted: '#737373',
    background: '#FFFFFF',
    surface: '#F7F7F7',
    border: '#E5E5E5',
    tint: '#000000',
    icon: '#525252',
    tabIconDefault: '#737373',
    tabIconSelected: '#000000',
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#A3A3A3',
    textMuted: '#737373',
    background: '#000000',
    surface: '#171717',
    border: '#262626',
    tint: '#FFFFFF',
    icon: '#A3A3A3',
    tabIconDefault: '#737373',
    tabIconSelected: '#FFFFFF',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'Georgia',
    mono: 'Menlo',
  },
  android: {
    sans: 'Roboto',
    serif: 'serif',
    mono: 'monospace',
  },
  default: {
    sans: 'System',
    serif: 'Georgia',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Typography = {
  // Headings
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  // Body
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  // Caption
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  // Button
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
};
