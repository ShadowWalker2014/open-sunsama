import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import type { Task } from '@open-sunsama/types';
import { useCompleteTask } from '@/hooks/useTasks';
import { PRIORITY_LABELS, getPriorityColor } from './PrioritySelector';
import { useThemeColors, type ThemeColors } from '@/lib/theme';

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
}

/**
 * Task card component
 */
export function TaskCard({ task, onPress }: TaskCardProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const completeTask = useCompleteTask();
  const isCompleted = !!task.completedAt;

  const handleToggleComplete = () => {
    completeTask.mutate({ id: task.id, completed: !isCompleted });
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        isCompleted && styles.containerCompleted,
        pressed && styles.containerPressed,
      ]}
      onPress={onPress}
    >
      {/* Checkbox */}
      <TouchableOpacity
        style={[
          styles.checkbox,
          isCompleted && styles.checkboxCompleted,
        ]}
        onPress={handleToggleComplete}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {isCompleted && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>
        <Text
          style={[styles.title, isCompleted && styles.titleCompleted]}
          numberOfLines={2}
        >
          {task.title}
        </Text>

        <View style={styles.meta}>
          {/* Priority badge */}
          <View
            style={[
              styles.priority,
              { backgroundColor: `${getPriorityColor(task.priority, colors)}${colors.priorityAlpha}` },
            ]}
          >
            <Text
              style={[styles.priorityText, { color: getPriorityColor(task.priority, colors) }]}
            >
              {PRIORITY_LABELS[task.priority]}
            </Text>
          </View>

          {/* Estimated time */}
          {task.estimatedMins && (
            <View style={styles.estimate}>
              <Text style={styles.estimateText}>{task.estimatedMins}m</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  containerCompleted: {
    opacity: 0.7,
  },
  containerPressed: {
    backgroundColor: colors.raised,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxCompleted: {
    backgroundColor: colors.accentFill,
    borderColor: colors.accentFill,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.muted,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priority: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  estimate: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.raised,
    borderRadius: 4,
  },
  estimateText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.secondary,
  },
});
