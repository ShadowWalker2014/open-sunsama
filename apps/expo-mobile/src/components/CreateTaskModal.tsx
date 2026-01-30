import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { TaskPriority } from '@open-sunsama/types';
import { useCreateTask } from '@/hooks/useTasks';
import { PrioritySelector } from './PrioritySelector';

interface CreateTaskModalProps {
  onClose: () => void;
  defaultDate?: string;
}

/**
 * Create task modal component
 */
export function CreateTaskModal({ onClose, defaultDate }: CreateTaskModalProps) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('P2');
  const [estimatedMins, setEstimatedMins] = useState('');
  
  const createTask = useCreateTask();

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    try {
      await createTask.mutateAsync({
        title: title.trim(),
        notes: notes.trim() || undefined,
        priority,
        scheduledDate: defaultDate,
        estimatedMins: estimatedMins ? parseInt(estimatedMins, 10) : undefined,
      });
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create task';
      Alert.alert('Error', message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Task</Text>
          <TouchableOpacity
            onPress={handleCreate}
            style={[styles.saveButton, !title.trim() && styles.saveButtonDisabled]}
            disabled={createTask.isPending || !title.trim()}
          >
            {createTask.isPending ? (
              <ActivityIndicator size="small" color="#6366f1" />
            ) : (
              <Text style={[styles.saveText, !title.trim() && styles.saveTextDisabled]}>
                Create
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="What needs to be done?"
              placeholderTextColor="#9ca3af"
              value={title}
              onChangeText={setTitle}
              autoFocus
              multiline
              maxLength={200}
            />
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Add any details or context..."
              placeholderTextColor="#9ca3af"
              value={notes}
              onChangeText={setNotes}
              multiline
              maxLength={1000}
            />
          </View>

          {/* Priority */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Priority</Text>
            <PrioritySelector value={priority} onChange={setPriority} />
          </View>

          {/* Estimated time */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Estimated Time (minutes)</Text>
            <TextInput
              style={styles.input}
              placeholder="30"
              placeholderTextColor="#9ca3af"
              value={estimatedMins}
              onChangeText={setEstimatedMins}
              keyboardType="number-pad"
              maxLength={4}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  keyboardView: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cancelButton: { padding: 8 },
  cancelText: { fontSize: 16, color: '#6b7280' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#1f2937' },
  saveButton: { padding: 8, minWidth: 60, alignItems: 'center' },
  saveButtonDisabled: { opacity: 0.5 },
  saveText: { fontSize: 16, fontWeight: '600', color: '#6366f1' },
  saveTextDisabled: { color: '#9ca3af' },
  form: { flex: 1, padding: 16 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  titleInput: {
    fontSize: 18,
    color: '#1f2937',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    minHeight: 48,
  },
  notesInput: {
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#fff',
  },
});
