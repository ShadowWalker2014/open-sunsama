import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, addDays, subDays, setHours, setMinutes } from 'date-fns';
import { useTimeBlocks } from '@/hooks/useTimeBlocks';
import { TimeBlockCard } from '@/components/TimeBlockCard';
import type { TimeBlock } from '@open-sunsama/types';

// Generate hour labels for the timeline
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 60;

/**
 * Calendar screen - shows time blocks for the selected date
 */
export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const { data: timeBlocks, isLoading, refetch, isRefetching } = useTimeBlocks({
    date: dateString,
  });

  const goToPreviousDay = useCallback(() => {
    setSelectedDate((prev) => subDays(prev, 1));
  }, []);

  const goToNextDay = useCallback(() => {
    setSelectedDate((prev) => addDays(prev, 1));
  }, []);

  const goToToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  const isToday = format(new Date(), 'yyyy-MM-dd') === dateString;

  // Calculate time block position and height
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

  // Calculate current time indicator position
  const now = new Date();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  const showTimeIndicator = isToday;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      {/* Date Navigation */}
      <View style={styles.dateNav}>
        <TouchableOpacity onPress={goToPreviousDay} style={styles.navButton}>
          <Text style={styles.navButtonText}>{'<'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={goToToday} style={styles.dateButton}>
          <Text style={styles.dateText}>
            {isToday ? 'Today' : format(selectedDate, 'EEE, MMM d')}
          </Text>
          {!isToday && (
            <Text style={styles.dateSubtext}>
              {format(selectedDate, 'yyyy')}
            </Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity onPress={goToNextDay} style={styles.navButton}>
          <Text style={styles.navButtonText}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      {/* Timeline */}
      <ScrollView
        style={styles.timeline}
        contentContainerStyle={styles.timelineContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#6366f1"
          />
        }
      >
        {/* Hour lines */}
        {HOURS.map((hour) => (
          <View key={hour} style={[styles.hourRow, { top: hour * HOUR_HEIGHT }]}>
            <Text style={styles.hourLabel}>
              {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
            </Text>
            <View style={styles.hourLine} />
          </View>
        ))}

        {/* Current time indicator */}
        {showTimeIndicator && (
          <View style={[styles.currentTime, { top: currentHour * HOUR_HEIGHT }]}>
            <View style={styles.currentTimeDot} />
            <View style={styles.currentTimeLine} />
          </View>
        )}

        {/* Time blocks */}
        <View style={styles.blocksContainer}>
          {timeBlocks?.map((block) => {
            const blockStyle = getBlockStyle(block);
            return (
              <View
                key={block.id}
                style={[styles.blockWrapper, blockStyle]}
              >
                <TimeBlockCard timeBlock={block} />
              </View>
            );
          })}
        </View>

        {/* Empty state */}
        {!isLoading && (!timeBlocks || timeBlocks.length === 0) && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No time blocks</Text>
            <Text style={styles.emptySubtitle}>
              Schedule tasks from the Tasks tab
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
  },
  dateButton: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  dateSubtext: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  timeline: {
    flex: 1,
  },
  timelineContent: {
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
  hourLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
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
  currentTimeLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#ef4444',
  },
  blocksContainer: {
    position: 'absolute',
    left: 62,
    right: 16,
    top: 20,
    bottom: 0,
  },
  blockWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  emptyState: {
    position: 'absolute',
    top: 200,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
});
