import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import type { TimeBlock } from '@open-sunsama/types';
import { useThemeColors, type ThemeColors } from '@/lib/theme';

interface TimeBlockCardProps {
  timeBlock: TimeBlock;
}

/**
 * Get a color for the time block
 */
function getBlockColor(color: string | null, colors: ThemeColors): string {
  if (color) return color;
  return colors.accent;
}

/**
 * Time block card component for calendar view
 */
export function TimeBlockCard({ timeBlock }: TimeBlockCardProps) {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const startTime = timeBlock.startTime instanceof Date
    ? timeBlock.startTime
    : new Date(timeBlock.startTime);
  const endTime = timeBlock.endTime instanceof Date
    ? timeBlock.endTime
    : new Date(timeBlock.endTime);

  const color = getBlockColor(timeBlock.color, colors);
  const timeLabel = `${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}`;

  return (
    <View style={[styles.container, { borderLeftColor: color, backgroundColor: `${color}20` }]}>
      <Text style={styles.title} numberOfLines={2}>
        {timeBlock.title}
      </Text>
      <Text style={styles.time}>{timeLabel}</Text>
      {timeBlock.notes && (
        <Text style={styles.notes} numberOfLines={1}>
          {timeBlock.notes}
        </Text>
      )}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    borderLeftWidth: 4,
    borderRadius: 6,
    padding: 8,
    backgroundColor: colors.raised,
    minHeight: 30,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  time: {
    fontSize: 11,
    color: colors.secondary,
  },
  notes: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
});
