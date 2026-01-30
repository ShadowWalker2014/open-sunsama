import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { TimeBlockCard } from '@/components/TimeBlockCard';
import type { TimeBlock } from '@open-sunsama/types';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
export const HOUR_HEIGHT = 60;

interface TimelineProps {
  timeBlocks: TimeBlock[] | undefined;
  isLoading: boolean;
  isRefetching: boolean;
  onRefresh: () => void;
  isToday: boolean;
}

/**
 * Timeline component for displaying time blocks
 */
export function Timeline({ timeBlocks, isLoading, isRefetching, onRefresh, isToday }: TimelineProps) {
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;

  const getBlockStyle = (block: TimeBlock) => {
    const startDate = block.startTime instanceof Date ? block.startTime : new Date(block.startTime);
    const endDate = block.endTime instanceof Date ? block.endTime : new Date(block.endTime);
    const startHour = startDate.getHours() + startDate.getMinutes() / 60;
    const endHour = endDate.getHours() + endDate.getMinutes() / 60;
    const duration = endHour - startHour;
    return {
      top: startHour * HOUR_HEIGHT,
      height: Math.max(duration * HOUR_HEIGHT, 30),
    };
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  return (
    <ScrollView
      style={styles.timeline}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor="#6366f1" />
      }
    >
      {HOURS.map((hour) => (
        <View key={hour} style={[styles.hourRow, { top: hour * HOUR_HEIGHT }]}>
          <Text style={styles.hourLabel}>{formatHour(hour)}</Text>
          <View style={styles.hourLine} />
        </View>
      ))}

      {isToday && (
        <View style={[styles.currentTime, { top: currentHour * HOUR_HEIGHT }]}>
          <View style={styles.currentTimeDot} />
          <View style={styles.currentTimeLine} />
        </View>
      )}

      <View style={styles.blocksContainer}>
        {timeBlocks?.map((block) => (
          <View key={block.id} style={[styles.blockWrapper, getBlockStyle(block)]}>
            <TimeBlockCard timeBlock={block} />
          </View>
        ))}
      </View>

      {!isLoading && (!timeBlocks || timeBlocks.length === 0) && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No time blocks</Text>
          <Text style={styles.emptySubtitle}>Schedule tasks from the Tasks tab</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  timeline: { flex: 1 },
  content: {
    position: 'relative',
    height: HOURS.length * HOUR_HEIGHT + 40,
    paddingTop: 20,
    paddingBottom: 40,
  },
  hourRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    height: 1,
  },
  hourLabel: {
    width: 54,
    fontSize: 11,
    color: '#9ca3af',
    textAlign: 'right',
    paddingRight: 8,
  },
  hourLine: { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
  currentTime: {
    position: 'absolute',
    left: 54,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 100,
  },
  currentTimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
    marginLeft: -4,
  },
  currentTimeLine: { flex: 1, height: 2, backgroundColor: '#ef4444' },
  blocksContainer: {
    position: 'absolute',
    left: 62,
    right: 16,
    top: 20,
    bottom: 0,
  },
  blockWrapper: { position: 'absolute', left: 0, right: 0 },
  emptyState: {
    position: 'absolute',
    top: 200,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#6b7280' },
});
