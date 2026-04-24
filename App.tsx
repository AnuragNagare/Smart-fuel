import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AppNavigator from './src/navigation/AppNavigator';
import { registerForPushNotificationsAsync } from './src/services/notification';
import { initializePurchases, checkPremiumStatus, getOfferings } from './src/services/purchase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  React.useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        console.log('App registered for notifications:', token);
        // In a real app, you would send this token to your backend/Supabase
      }
    });

    // Initialize RevenueCat with Diagnostics
    initializePurchases()
      .then(async () => {
        const isPro = await checkPremiumStatus();
        console.log('💎 RevenueCat Status:', isPro ? 'PRO ACTIVE' : 'FREE TIER');
        
        // Final Connection Test: Fetch real store offerings
        const offerings = await getOfferings();
        if (offerings) {
          console.log('✅ RevenueCat Setup Success: Connected to', offerings.serverDescription);
          console.log('📦 Available Plans:', Object.keys(offerings.availablePackages).length);
        } else {
          console.log('⚠️ RevenueCat Connected, but no Offerings found. Check your Dashboard products!');
        }
      })
      .catch(e => {
        console.log('❌ RevenueCat Setup Failed. Check your API Key!');
        console.error(e);
      });

    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <AppNavigator />
      <StatusBar style="light" />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
