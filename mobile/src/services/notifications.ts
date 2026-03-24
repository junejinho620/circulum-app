import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { api } from './api';

// ─── Configure notification behavior ────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ─── Register for push notifications ────────────────────────────────────────
export async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  // Get the Expo push token
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  });

  // Android: set notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#8B4DFF',
    });
  }

  return tokenData.data;
}

// ─── Send push token to backend ─────────────────────────────────────────────
export async function savePushToken(token: string): Promise<void> {
  try {
    await api.patch('/users/push-token', { pushToken: token });
  } catch (err) {
    console.error('Failed to save push token:', err);
  }
}

// ─── Remove push token on logout ────────────────────────────────────────────
export async function removePushToken(): Promise<void> {
  try {
    await api.patch('/users/push-token', { pushToken: null });
  } catch (err) {
    console.error('Failed to remove push token:', err);
  }
}

// ─── Get badge count ────────────────────────────────────────────────────────
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

// ─── Schedule a local notification (for testing) ────────────────────────────
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data, sound: true },
    trigger: null, // immediate
  });
}
