import Purchases, { PurchasesOffering, LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';
import { updateUser, getCurrentUser } from './auth';

// Use the public SDK key provided by the user
const API_KEY = 'test_KCGwNkVtVajaYtTZjKPwIqbTRzD';

export const initializePurchases = async () => {
  console.log('RevenueCat initialization temporarily disabled');
  // if (Platform.OS === 'android') {
  //   await Purchases.configure({ apiKey: API_KEY });
  //   Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  //   console.log('RevenueCat initialized for Android');
  // }
};

export const getOfferings = async (): Promise<PurchasesOffering | null> => {
  return null; // RevenueCat disabled
  // try {
  //   const offerings = await Purchases.getOfferings();
  //   if (offerings.current !== null) {
  //     return offerings.current;
  //   }
  // } catch (e) {
  //   console.error('Error fetching offerings:', e);
  // }
  // return null;
};

export const purchasePackage = async (packageToPurchase: any) => {
  return false; // RevenueCat disabled
  // try {
  //   const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
  //   
  //   // Check if the entitlement is active
  //   // We assume the user creates an entitlement named 'pro' in the dashboard
  //   if (typeof customerInfo.entitlements.active['pro'] !== 'undefined') {
  //     const user = await getCurrentUser();
  //     if (user) {
  //       user.isPremium = true;
  //       await updateUser(user);
  //       return true;
  //     }
  //   }
  // } catch (e: any) {
  //   if (!e.userCancelled) {
  //     console.error('Purchase error:', e);
  //   }
  // }
  // return false;
};

export const restorePurchases = async () => {
  return false; // RevenueCat disabled
  // try {
  //   const customerInfo = await Purchases.restorePurchases();
  //   if (typeof customerInfo.entitlements.active['pro'] !== 'undefined') {
  //     const user = await getCurrentUser();
  //     if (user) {
  //       user.isPremium = true;
  //       await updateUser(user);
  //       return true;
  //     }
  //   }
  // } catch (e) {
  //   console.error('Restore error:', e);
  // }
  // return false;
};

export const checkPremiumStatus = async () => {
  return false; // RevenueCat disabled
  // try {
  //   const customerInfo = await Purchases.getCustomerInfo();
  //   const isPremium = typeof customerInfo.entitlements.active['pro'] !== 'undefined';
  //   
  //   const user = await getCurrentUser();
  //   if (user && user.isPremium !== isPremium) {
  //     user.isPremium = isPremium;
  //     await updateUser(user);
  //   }
  //   return isPremium;
  // } catch (e) {
  //   console.error('Check status error:', e);
  //   return false;
  // }
};
