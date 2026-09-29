import { Tabs } from 'expo-router';
import { Lucide } from '@react-native-vector-icons/lucide';
import { StyleSheet, useColorScheme } from 'react-native';

/**
 * App layout - tab navigator for main screens
 */
export default function AppLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDark ? '#818cf8' : '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: isDark ? styles.tabBarDark : styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        headerStyle: isDark ? styles.headerDark : styles.header,
        headerTitleStyle: isDark ? styles.headerTitleDark : styles.headerTitle,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size }) => <Lucide name="list-todo" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => <Lucide name="calendar-days" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Lucide name="settings" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopColor: '#e5e7eb',
    borderTopWidth: 1,
  },
  tabBarDark: {
    backgroundColor: '#111827',
    borderTopColor: '#374151',
    borderTopWidth: 1,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  header: {
    backgroundColor: '#ffffff',
  },
  headerDark: {
    backgroundColor: '#111827',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  headerTitleDark: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f9fafb',
  },
});
