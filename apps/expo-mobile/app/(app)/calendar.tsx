import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, addDays, subDays } from 'date-fns';
import { useTimeBlocks } from '@/hooks/useTimeBlocks';
import { Timeline } from '@/components/Timeline';

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
            <Text style={styles.dateSubtext}>{format(selectedDate, 'yyyy')}</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity onPress={goToNextDay} style={styles.navButton}>
          <Text style={styles.navButtonText}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      {/* Timeline */}
      <Timeline
        timeBlocks={timeBlocks}
        isLoading={isLoading}
        isRefetching={isRefetching}
        onRefresh={refetch}
        isToday={isToday}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
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
  navButtonText: { fontSize: 18, fontWeight: '600', color: '#6b7280' },
  dateButton: { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  dateText: { fontSize: 18, fontWeight: '600', color: '#1f2937' },
  dateSubtext: { fontSize: 12, color: '#6b7280', marginTop: 2 },
});
