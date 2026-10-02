import { Tabs } from 'expo-router';
import { Brand } from '@/constants/theme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Brand.surface,
          borderTopColor: Brand.border,
        },
        tabBarActiveTintColor: Brand.accent,
        tabBarInactiveTintColor: Brand.faint,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} color={color} name="house.fill" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={24} color={color} name="person.crop.circle" />
          ),
        }}
      />
    </Tabs>
  );
}
