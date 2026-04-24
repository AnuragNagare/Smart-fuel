import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LIGHT_COLORS } from '../constants/lightTheme';
import { FontAwesome5 } from '@expo/vector-icons';

// Tab Screens
import HomeScreen from '../screens/HomeScreen';
import NutriBotScreen from '../features/nutribot/NutriBotScreen';
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
                    tabBarActiveTintColor: '#4A90E2',
                    tabBarIcon: ({ focused, size }) => (
                        <FontAwesome5 name="home" size={focused ? size + 4 : size} color={focused ? '#4A90E2' : LIGHT_COLORS.textMuted} />
                    ),
                }}
            />
            <Tab.Screen
                name="Coach"
                component={NutriBotScreen}
                options={{
                    tabBarLabel: 'Coach',
                    tabBarActiveTintColor: '#9B51E0',
                    tabBarIcon: ({ focused, size }) => (
                        <FontAwesome5 name="robot" size={focused ? size + 4 : size} color={focused ? '#9B51E0' : LIGHT_COLORS.textMuted} />
                    ),
                }}
            />
            <Tab.Screen
                name="Plan"
                component={MealPlanningScreen}
                options={{
                    tabBarLabel: 'Plan',
                    tabBarActiveTintColor: '#27AE60',
                    tabBarIcon: ({ focused, size }) => (
                        <FontAwesome5 name="calendar-alt" size={focused ? size + 4 : size} color={focused ? '#27AE60' : LIGHT_COLORS.textMuted} />
                    ),
                }}
            />
            <Tab.Screen
                name="Health"
                component={HealthInsightsScreen}
                options={{
                    tabBarLabel: 'Health',
                    tabBarActiveTintColor: '#F2994A',
                    tabBarIcon: ({ focused, size }) => (
                        <FontAwesome5 name="chart-line" size={focused ? size + 4 : size} color={focused ? '#F2994A' : LIGHT_COLORS.textMuted} />
                    ),
                }}
            />
            <Tab.Screen
                name="Swaps"
                component={SmartSwapsScreen}
                options={{
                    tabBarLabel: 'Swaps',
                    tabBarActiveTintColor: '#00BCD4',
                    tabBarIcon: ({ focused, size }) => (
                        <FontAwesome5 name="exchange-alt" size={focused ? size + 4 : size} color={focused ? '#00BCD4' : LIGHT_COLORS.textMuted} />
                    ),
                }}
            />
            <Tab.Screen
                name="Treats"
                component={CheatMealScreen}
                options={{
                    tabBarLabel: 'Treats',
                    tabBarActiveTintColor: '#E91E63',
                    tabBarIcon: ({ focused, size }) => (
                        <FontAwesome5 name="hamburger" size={focused ? size + 4 : size} color={focused ? '#E91E63' : LIGHT_COLORS.textMuted} />
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
