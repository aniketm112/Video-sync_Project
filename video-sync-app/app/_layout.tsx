import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/lib/auth';
import { Brand } from '@/constants/theme';

/**
 * Route protection lives here, once. Screens inside `(tabs)` and `video/[id]`
 * only exist for signed-in users; `(auth)` screens only for signed-out users.
 * Per-screen <Redirect> guards caused a navigation state loop on logout
 * ("Maximum update depth exceeded"), so they are deliberately avoided here.
 */
function RootNavigator() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={Brand.accent} />
      </View>
    );
  }

  const signedIn = Boolean(user);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Brand.bg },
      }}>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="video/[id]" />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function Layout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = {
  splash: {
    flex: 1,
    backgroundColor: Brand.bg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
};
