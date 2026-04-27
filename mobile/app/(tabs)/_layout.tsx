import { Tabs } from 'expo-router';
import { Theme } from '../../src/constants/Theme';
import { Ionicons } from '@expo/vector-icons'; // Assuming Expo comes with it, if not it will fallback seamlessly usually or cause error, but it's built-in expo

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ 
      headerShown: true, 
      headerStyle: { backgroundColor: Theme.colors.surface1 },
      headerTintColor: Theme.colors.brandPrimary,
      headerTitleStyle: { fontFamily: Theme.fonts.title, letterSpacing: 2 },
      tabBarStyle: { backgroundColor: Theme.colors.surface1, borderTopColor: Theme.colors.borderStrong },
      tabBarActiveTintColor: Theme.colors.brandPrimary,
      tabBarInactiveTintColor: Theme.colors.textMuted,
      tabBarLabelStyle: { fontFamily: Theme.fonts.ui }
    }}>
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'HUB',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="problems" 
        options={{ 
          title: 'BATTLES',
          tabBarIcon: ({ color }) => <Ionicons name="list" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="duels" 
        options={{ 
          title: 'ARENA',
          tabBarIcon: ({ color }) => <Ionicons name="flash" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'PROFILE',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="leaderboard" 
        options={{ 
          title: 'RANKS',
          tabBarIcon: ({ color }) => <Ionicons name="trophy" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="more" 
        options={{ 
          title: 'MORE',
          tabBarIcon: ({ color }) => <Ionicons name="grid" size={24} color={color} />
        }} 
      />
    </Tabs>
  );
}


