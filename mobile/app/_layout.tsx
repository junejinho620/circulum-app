import { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../src/store/auth.store';
import { socketService } from '../src/services/socket';
import {
  registerForPushNotifications,
  savePushToken,
  removePushToken,
} from '../src/services/notifications';
import { Colors } from '../src/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,  // 2 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout() {
  const { loadUser, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    loadUser();
  }, []);

  // ─── Socket connection ──────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated) {
      socketService.connect();
    } else {
      socketService.disconnect();
    }
  }, [isAuthenticated]);

  // ─── Push notifications ─────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    // Register and save token
    registerForPushNotifications().then((token) => {
      if (token) savePushToken(token);
    });

    // Foreground notification listener
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        // Update badge count or refresh queries as needed
        const data = notification.request.content.data;
        if (data?.type) {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      },
    );

    // Notification tap handler — deep link to relevant screen
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        if (!data) return;

        switch (data.type) {
          case 'comment_reply':
          case 'post_comment':
          case 'vote_milestone':
            if (data.postId) router.push(`/post/${data.postId}` as any);
            break;
          case 'new_message':
          case 'message_request':
            if (data.conversationId) router.push(`/conversation/${data.conversationId}` as any);
            break;
          default:
            router.push('/(tabs)/inbox' as any);
        }
      },
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [isAuthenticated]);

  // ─── Clear push token on logout ─────────────────────────────
  useEffect(() => {
    if (!isAuthenticated) {
      removePushToken();
    }
  }, [isAuthenticated]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="post/[id]" options={{ presentation: 'card' }} />
            <Stack.Screen name="board/[id]" options={{ presentation: 'card' }} />
            <Stack.Screen name="community/[id]" options={{ presentation: 'card' }} />
            <Stack.Screen name="conversation/[id]" options={{ presentation: 'card' }} />
            <Stack.Screen name="timetable" options={{ presentation: 'card' }} />
            <Stack.Screen name="courses" options={{ presentation: 'card' }} />
            <Stack.Screen name="course/[id]" options={{ presentation: 'card' }} />
            <Stack.Screen name="professors" options={{ presentation: 'card' }} />
            <Stack.Screen name="professor/[id]" options={{ presentation: 'card' }} />
            <Stack.Screen name="study-buddy" options={{ presentation: 'card' }} />
            <Stack.Screen name="campus-map" options={{ presentation: 'card' }} />
            <Stack.Screen name="polls" options={{ presentation: 'card' }} />
            <Stack.Screen name="settings" options={{ presentation: 'card' }} />
            <Stack.Screen name="edit-profile" options={{ presentation: 'card' }} />
            <Stack.Screen name="profile/[id]" options={{ presentation: 'card' }} />
            <Stack.Screen name="dm/[id]" options={{ presentation: 'card' }} />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
});
