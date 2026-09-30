import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, addDays, subDays } from 'date-fns';
import { Lucide } from '@react-native-vector-icons/lucide';
import { useTimeBlocks } from '@/hooks/useTimeBlocks';
import { Timeline } from '@/components/Timeline';
import { useThemeColors, type ThemeColors } from '@/lib/theme';

/**
 * Calendar screen - shows time blocks for the selected date
 */
export default function CalendarScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
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
        <TouchableOpacity onPress={goToPreviousDay} style={styles.navButton} accessibilityRole="button" accessibilityLabel="Previous day">
          <Lucide name="chevron-left" size={22} color={colors.secondary} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={goToToday} style={styles.dateButton}>
          <Text style={styles.dateText}>
            {isToday ? 'Today' : format(selectedDate, 'EEE, MMM d')}
          </Text>
          {!isToday && (
            <Text style={styles.dateSubtext}>{format(selectedDate, 'yyyy')}</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity onPress={goToNextDay} style={styles.navButton} accessibilityRole="button" accessibilityLabel="Next day">
          <Lucide name="chevron-right" size={22} color={colors.secondary} />
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateButton: { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  dateText: { fontSize: 18, fontWeight: '600', color: colors.text },
  dateSubtext: { fontSize: 12, color: colors.secondary, marginTop: 2 },
});
