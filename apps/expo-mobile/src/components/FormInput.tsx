import { View, Text, TextInput, StyleSheet, type TextInputProps } from 'react-native';
import { useThemeColors, type ThemeColors } from '@/lib/theme';

interface FormInputProps extends TextInputProps {
  label: string;
}

/**
 * Reusable form input component with label
 */
export function FormInput({ label, style, ...props }: FormInputProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={colors.muted}
        {...props}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { gap: 8 },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
});
