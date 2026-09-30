import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import type { TaskPriority } from '@open-sunsama/types';
import { useThemeColors, type ThemeColors } from '@/lib/theme';

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  P0: "P0",
  P1: "P1",
  P2: "P2",
  P3: "P3",
};

const PRIORITIES: TaskPriority[] = [
  'P0', 'P1', 'P2', 'P3',
];

export function getPriorityColor(priority: TaskPriority, colors: ThemeColors): string {
  switch (priority) {
    case 'P0': return colors.danger;
    case 'P1': return colors.warning;
    case 'P2': return colors.accent;
    case 'P3': return colors.secondary;
  }
}

interface PrioritySelectorProps {
  value: TaskPriority;
  onChange: (priority: TaskPriority) => void;
}

/**
 * Priority selector component for task forms
 */
export function PrioritySelector({ value, onChange }: PrioritySelectorProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  return (
    <View style={styles.container}>
      {PRIORITIES.map((priority) => (
        <TouchableOpacity
          key={priority}
          style={[
            styles.button,
            value === priority && styles.buttonActive,
            value === priority && { borderColor: getPriorityColor(priority, colors) },
          ]}
          onPress={() => onChange(priority)}
        >
          <View style={[styles.dot, { backgroundColor: getPriorityColor(priority, colors) }]} />
          <Text
            style={[
              styles.label,
              value === priority && { color: getPriorityColor(priority, colors) },
            ]}
          >
            {PRIORITY_LABELS[priority]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  buttonActive: {
    backgroundColor: colors.raised,
    borderWidth: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.secondary,
  },
});
