import { useColorScheme } from 'react-native';

const lightColors = {
  background: '#f9fafb',
  surface: '#ffffff',
  raised: '#f3f4f6',
  border: '#e5e7eb',
  inputBorder: '#d1d5db',
  text: '#1f2937',
  secondary: '#6b7280',
  muted: '#9ca3af',
  accent: '#6366f1',
  accentFill: '#6366f1',
  accentTint: '#eef2ff',
  priorityAlpha: '15',
  danger: '#ef4444',
  warning: '#f97316',
};

const darkColors: typeof lightColors = {
  background: '#0b1220',
  surface: '#111827',
  raised: '#1f2937',
  border: '#374151',
  inputBorder: '#4b5563',
  text: '#f9fafb',
  secondary: '#9ca3af',
  muted: '#9ca3af',
  accent: '#818cf8',
  accentFill: '#6366f1',
  accentTint: '#312e81',
  priorityAlpha: '30',
  danger: '#f87171',
  warning: '#fb923c',
};

export type ThemeColors = typeof lightColors;

export function useThemeColors(): ThemeColors {
  return useColorScheme() === 'dark' ? darkColors : lightColors;
}
