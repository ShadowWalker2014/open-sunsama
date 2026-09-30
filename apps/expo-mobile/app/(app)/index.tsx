import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, addDays, subDays } from 'date-fns';
import { Lucide } from '@react-native-vector-icons/lucide';
import { useTasks } from '@/hooks/useTasks';
import { TaskCard } from '@/components/TaskCard';
import { CreateTaskModal } from '@/components/CreateTaskModal';
import { useThemeColors, type ThemeColors } from '@/lib/theme';
import type { Task } from '@open-sunsama/types';

/**
 * Tasks screen - shows tasks for the selected date
 */
export default function TasksScreen() {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  
  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const { data: tasks, isLoading, refetch, isRefetching } = useTasks({
    scheduledDate: dateString,
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

  const renderTask = useCallback(({ item }: { item: Task }) => (
    <TaskCard task={item} />
  ), []);

  const handleCreateTask = useCallback(() => {
    setIsCreateModalVisible(true);
  }, []);

  const handleCloseCreateModal = useCallback(() => {
    setIsCreateModalVisible(false);
  }, []);

  // Sort tasks: incomplete first (by position), then completed
  const sortedTasks = tasks?.slice().sort((a, b) => {
    if (a.completedAt && !b.completedAt) return 1;
    if (!a.completedAt && b.completedAt) return -1;
    return a.position - b.position;
  }) ?? [];

  const incompleteTasks = sortedTasks.filter((t) => !t.completedAt);
  const completedTasks = sortedTasks.filter((t) => t.completedAt);

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
            <Text style={styles.dateSubtext}>
              {format(selectedDate, 'yyyy')}
            </Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity onPress={goToNextDay} style={styles.navButton} accessibilityRole="button" accessibilityLabel="Next day">
          <Lucide name="chevron-right" size={22} color={colors.secondary} />
        </TouchableOpacity>
      </View>

      {/* Task Stats */}
      <View style={styles.stats}>
        <Text style={styles.statsText}>
          {incompleteTasks.length} task{incompleteTasks.length !== 1 ? 's' : ''} remaining
          {completedTasks.length > 0 && ` | ${completedTasks.length} done`}
        </Text>
      </View>

      {/* Task List */}
      <FlatList
        data={sortedTasks}
        renderItem={renderTask}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.accent}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No tasks for this day</Text>
              <Text style={styles.emptySubtitle}>
                Tap the + button to add a task
              </Text>
            </View>
          ) : null
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleCreateTask}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Create Task Modal */}
      <Modal
        visible={isCreateModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseCreateModal}
      >
        <CreateTaskModal
          onClose={handleCloseCreateModal}
          defaultDate={dateString}
        />
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
  dateButton: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  dateSubtext: {
    fontSize: 12,
    color: colors.secondary,
    marginTop: 2,
  },
  stats: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  statsText: {
    fontSize: 13,
    color: colors.secondary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  separator: {
    height: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.secondary,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentFill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  fabText: {
    fontSize: 28,
    fontWeight: '400',
    color: '#fff',
    marginTop: -2,
  },
});
