import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../types';

const USER_PROFILE_KEY = '@smartfuel_user';
const BMI_KEY = '@smartfuel_bmi';

export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
    try {
        await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));

        // Calculate and save BMI
        const heightInM = parseFloat(profile.height) / 100;
        const weight = parseFloat(profile.weight);
        const bmi = weight / (heightInM * heightInM);
        await AsyncStorage.setItem(BMI_KEY, bmi.toFixed(1));
    } catch (error) {
        console.error('Error saving user profile:', error);
        throw error;
    }
};

export const getUserProfile = async (): Promise<UserProfile | null> => {
    try {
        const profileData = await AsyncStorage.getItem(USER_PROFILE_KEY);
        return profileData ? JSON.parse(profileData) : null;
    } catch (error) {
        console.error('Error getting user profile:', error);
        return null;
    }
};

export const getBMI = async (): Promise<string | null> => {
    try {
        return await AsyncStorage.getItem(BMI_KEY);
    } catch (error) {
        console.error('Error getting BMI:', error);
        return null;
    }
};

export const clearUserData = async (): Promise<void> => {
    try {
        await AsyncStorage.multiRemove([USER_PROFILE_KEY, BMI_KEY]);
    } catch (error) {
        console.error('Error clearing user data:', error);
        throw error;
    }
};
