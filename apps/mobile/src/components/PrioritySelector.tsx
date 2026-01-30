import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import type { TaskPriority } from '@open-sunsama/types';

const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'P0', label: 'Critical', color: '#ef4444' },
  { value: 'P1', label: 'High', color: '#f97316' },
  { value: 'P2', label: 'Medium', color: '#6366f1' },
  { value: 'P3', label: 'Low', color: '#6b7280' },
];

interface PrioritySelectorProps {
  value: TaskPriority;
  onChange: (priority: TaskPriority) => void;
}

/**
 * Priority selector component for task forms
 */
export function PrioritySelector({ value, onChange }: PrioritySelectorProps) {
  return (
    <View style={styles.container}>
      {PRIORITIES.map((p) => (
        <TouchableOpacity
          key={p.value}
          style={[
            styles.button,
            value === p.value && styles.buttonActive,
            value === p.value && { borderColor: p.color },
          ]}
          onPress={() => onChange(p.value)}
        >
          <View style={[styles.dot, { backgroundColor: p.color }]} />
          <Text
            style={[
              styles.label,
              value === p.value && { color: p.color },
            ]}
          >
            {p.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
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
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  buttonActive: {
    backgroundColor: '#f9fafb',
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
    color: '#6b7280',
  },
});
