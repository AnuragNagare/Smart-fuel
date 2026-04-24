import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Expo Go no longer supports remote push notifications in SDK 53+.
// Check if we're running inside Expo Go to skip remote token registration.
const isExpoGo = Constants.executionEnvironment === 'storeClient';

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    if (isExpoGo) {
      // Remote push notifications are not supported in Expo Go (SDK 53+).
      // Use a development build or standalone app for full push notification support.
      console.log('ℹ️ Push token skipped: Remote notifications are not supported in Expo Go (SDK 53+). Use a dev build for full support.');
      return;
    }

    // In SDK 51+, we need to provide the projectId explicitly
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    try {
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log('Expo Push Token:', token);
    } catch (e) {
      console.log('Error getting push token:', e);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

export async function scheduleLocalNotification(title: string, body: string, data?: any) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null, // send immediately
  });
}

export async function scheduleDailyReminder(hour: number, minute: number) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🍕 Time for your NutriBot Scan!",
      body: "Consistency is key to reaching your goals. Log your next meal now!",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
    },
  });
}
