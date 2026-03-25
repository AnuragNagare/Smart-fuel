import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LIGHT_COLORS } from '../constants/lightTheme';

// Tab Screens
import HomeScreen from '../screens/HomeScreen';
import FuelBotScreen from '../features/fuelbot/FuelBotScreen';
import MealPlanningScreen from '../features/mealplanning/MealPlanningScreen';
import HealthInsightsScreen from '../features/healthinsights/HealthInsightsScreen';
import SmartSwapsScreen from '../features/smartswaps/SmartSwapsScreen';
import CheatMealScreen from '../features/cheatmeal/CheatMealScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
    const insets = useSafeAreaInsets();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: [
                    styles.tabBar,
                    {
                        height: 75 + insets.bottom,
                        paddingBottom: insets.bottom > 0 ? insets.bottom : 12
                    }
                ],
                tabBarActiveTintColor: LIGHT_COLORS.accentPrimary,
                tabBarInactiveTintColor: LIGHT_COLORS.textMuted,
                tabBarLabelStyle: styles.tabLabel,
                tabBarIconStyle: styles.tabIcon,
            }}
        >
            <Tab.Screen
                name="HomeTab"
                component={HomeScreen}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <Text style={[styles.iconText, { color, fontSize: size }]}>🏠</Text>
                    ),
                }}
            />
            <Tab.Screen
                name="Coach"
                component={FuelBotScreen}
                options={{
                    tabBarLabel: 'Coach',
                    tabBarIcon: ({ color, size }) => (
                        <Text style={[styles.iconText, { color, fontSize: size }]}>🤖</Text>
                    ),
                }}
            />
            <Tab.Screen
                name="Plan"
                component={MealPlanningScreen}
                options={{
                    tabBarLabel: 'Plan',
                    tabBarIcon: ({ color, size }) => (
                        <Text style={[styles.iconText, { color, fontSize: size }]}>📅</Text>
                    ),
                }}
            />
            <Tab.Screen
                name="Health"
                component={HealthInsightsScreen}
                options={{
                    tabBarLabel: 'Health',
                    tabBarIcon: ({ color, size }) => (
                        <Text style={[styles.iconText, { color, fontSize: size }]}>📈</Text>
                    ),
                }}
            />
            <Tab.Screen
                name="Swaps"
                component={SmartSwapsScreen}
                options={{
                    tabBarLabel: 'Swaps',
                    tabBarIcon: ({ color, size }) => (
                        <Text style={[styles.iconText, { color, fontSize: size }]}>🔄</Text>
                    ),
                }}
            />
            <Tab.Screen
                name="Treats"
                component={CheatMealScreen}
                options={{
                    tabBarLabel: 'Treats',
                    tabBarIcon: ({ color, size }) => (
                        <Text style={[styles.iconText, { color, fontSize: size }]}>🍰</Text>
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: LIGHT_COLORS.bgCard,
        borderTopWidth: 1,
        borderTopColor: LIGHT_COLORS.borderColor,
        // Height and padding now managed dynamically via screenOptions
    },
    tabLabel: {
        fontSize: 10,
        fontWeight: '600',
    },
    tabIcon: {
        marginBottom: -4,
    },
    iconText: {
        fontSize: 22,
    },
});
