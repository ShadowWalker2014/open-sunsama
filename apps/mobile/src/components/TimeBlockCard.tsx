import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import type { TimeBlock } from '@open-sunsama/types';

interface TimeBlockCardProps {
  timeBlock: TimeBlock;
}

/**
 * Get a color for the time block
 */
function getBlockColor(color: string | null): string {
  if (color) return color;
  return '#6366f1'; // default indigo
}

/**
 * Time block card component for calendar view
 */
export function TimeBlockCard({ timeBlock }: TimeBlockCardProps) {
  const startTime = timeBlock.startTime instanceof Date
    ? timeBlock.startTime
    : new Date(timeBlock.startTime);
  const endTime = timeBlock.endTime instanceof Date
    ? timeBlock.endTime
    : new Date(timeBlock.endTime);

  const color = getBlockColor(timeBlock.color);
  const timeLabel = `${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}`;

  return (
    <View style={[styles.container, { borderLeftColor: color, backgroundColor: `${color}10` }]}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderLeftWidth: 4,
    borderRadius: 6,
    padding: 8,
    backgroundColor: '#f3f4f6',
    minHeight: 30,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  time: {
    fontSize: 11,
    color: '#6b7280',
  },
  notes: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
});
