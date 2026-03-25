import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { isAuthenticated } from '../services/auth';

// Screens
import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import TabNavigator from './TabNavigator';
import CameraScreen from '../screens/CameraScreen';
import ResultsScreen from '../screens/ResultsScreen';

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
    const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Onboarding');
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        const authenticated = await isAuthenticated();
        setInitialRoute(authenticated ? 'Home' : 'Onboarding');
        setIsReady(true);
    };

    if (!isReady) {
        return null;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    cardStyle: { backgroundColor: '#f0fdf4' },
                }}
                initialRouteName={initialRoute}
            >
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="SignUp" component={SignUpScreen} />
                <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
                <Stack.Screen name="Home" component={TabNavigator} />
                <Stack.Screen
                    name="Camera"
                    component={CameraScreen}
                    options={{
                        presentation: 'modal',
                    }}
                />
                <Stack.Screen name="Results" component={ResultsScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
