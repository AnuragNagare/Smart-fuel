import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { LIGHT_COLORS, LIGHT_SPACING, LIGHT_RADIUS } from '../../constants/lightTheme';
import { getCurrentUser, User } from '../../services/auth';

interface FoodItem {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    cost: number;
    time: number;
}

interface Swap {
    original: FoodItem;
    healthier: FoodItem;
    cheaper: FoodItem;
    faster: FoodItem;
}

export default function SmartSwapsScreen() {
    const [authUser, setAuthUser] = useState<User | null>(null);
    const insets = useSafeAreaInsets();
    const [recentMeals] = useState<Swap[]>([
        {
            original: {
                name: 'Chicken Alfredo Pasta',
                calories: 850,
                protein: 35,
                carbs: 92,
                fat: 38,
                cost: 12,
                time: 30,
            },
            healthier: {
                name: 'Zucchini Alfredo',
                calories: 420,
                protein: 32,
                carbs: 28,
                fat: 18,
                cost: 10,
                time: 25,
            },
            cheaper: {
                name: 'Chickpea Alfredo',
                calories: 520,
                protein: 28,
                carbs: 65,
                fat: 15,
                cost: 6,
                time: 20,
            },
            faster: {
                name: 'Grilled Chicken Salad',
                calories: 380,
                protein: 40,
                carbs: 25,
                fat: 12,
                cost: 9,
                time: 10,
            },
        },
        {
            original: {
                name: 'Beef Burger & Fries',
                calories: 920,
                protein: 42,
                carbs: 85,
                fat: 48,
                cost: 15,
                time: 20,
            },
            healthier: {
                name: 'Turkey Burger Bowl',
                calories: 480,
                protein: 45,
                carbs: 38,
                fat: 16,
                cost: 12,
                time: 18,
            },
            cheaper: {
                name: 'Bean Burger',
                calories: 520,
                protein: 22,
                carbs: 68,
                fat: 18,
                cost: 7,
                time: 15,
            },
            faster: {
                name: 'Grilled Chicken Wrap',
                calories: 420,
                protein: 38,
                carbs: 42,
                fat: 12,
                cost: 10,
                time: 8,
            },
        },
    ]);

    const [selectedMeal, setSelectedMeal] = useState(0);
    const currentSwap = recentMeals[selectedMeal];

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        const currentUser = await getCurrentUser();
        setAuthUser(currentUser);
    };

    const handleUseSwap = async () => {
        if (!authUser) {
            Alert.alert('Login Required', 'Please login to use swaps.');
            return;
        }

        Alert.alert('Success!', 'Swap saved to your meal plan!');
    };


    const renderMealCard = (meal: FoodItem, label: string, icon: string, comparisonType?: 'healthier' | 'cheaper' | 'faster') => {
        const isOriginal = !comparisonType;

        let comparison = null;
        if (comparisonType === 'healthier') {
            const calDiff = currentSwap.original.calories - meal.calories;
            comparison = `Save ${calDiff} cal`;
        } else if (comparisonType === 'cheaper') {
            const costDiff = currentSwap.original.cost - meal.cost;
            comparison = `Save $${costDiff}`;
        } else if (comparisonType === 'faster') {
            const timeDiff = currentSwap.original.time - meal.time;
            comparison = `${timeDiff} min faster`;
        }

        return (
            <View style={[styles.mealCard, isOriginal && styles.originalCard]}>
                <View style={styles.mealHeader}>
                    <Text style={styles.mealIcon}>{icon}</Text>
                    <View style={styles.mealInfo}>
                        <Text style={styles.mealLabel}>{label}</Text>
                        <Text style={styles.mealName}>{meal.name}</Text>
                    </View>
                </View>

                <View style={styles.nutritionGrid}>
                    <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>{meal.calories}</Text>
                        <Text style={styles.nutritionLabel}>cal</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>{meal.protein}g</Text>
                        <Text style={styles.nutritionLabel}>protein</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>${meal.cost}</Text>
                        <Text style={styles.nutritionLabel}>cost</Text>
                    </View>
                    <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>{meal.time}m</Text>
                        <Text style={styles.nutritionLabel}>time</Text>
                    </View>
                </View>

                {comparison && (
                    <View style={styles.comparisonBadge}>
                        <Text style={styles.comparisonText}>✨ {comparison}</Text>
                    </View>
                )}

                {!isOriginal && (
                    <TouchableOpacity style={styles.useSwapButton} onPress={handleUseSwap}>
                        <Text style={styles.useSwapButtonText}>Use This Swap</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <LinearGradient
            colors={[LIGHT_COLORS.bgPrimary, LIGHT_COLORS.bgGradientEnd]}
            style={styles.container}
        >
            {/* Paywall Modal Removed */}
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
                <View style={styles.logoIcon}>
                    <Text style={styles.logoEmoji}>🔄</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Smart Swaps</Text>
                    <Text style={styles.headerSubtitle}>Healthier Alternatives</Text>
                </View>
            </View>

            {/* Usage Meter removed for free release */}

            {/* Meal Selector */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.mealSelector}
                contentContainerStyle={styles.mealSelectorContent}
            >
                {recentMeals.map((swap, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.mealChip,
                            selectedMeal === index && styles.mealChipActive,
                        ]}
                        onPress={() => setSelectedMeal(index)}
                    >
                        <Text style={[
                            styles.mealChipText,
                            selectedMeal === index && styles.mealChipTextActive,
                        ]}>
                            {swap.original.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {renderMealCard(currentSwap.original, 'Your Original Meal', '🍽️')}

                <Text style={styles.sectionTitle}>Smart Alternatives</Text>

                {renderMealCard(currentSwap.healthier, 'Healthier Option', '🥗', 'healthier')}
                {renderMealCard(currentSwap.cheaper, 'Budget-Friendly', '💰', 'cheaper')}
                {renderMealCard(currentSwap.faster, 'Quick Option', '⚡', 'faster')}

                <View style={{ height: insets.bottom + 20 }} />
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 0, // Managed via insets
        paddingHorizontal: LIGHT_SPACING.xl,
        paddingBottom: LIGHT_SPACING.lg,
        gap: LIGHT_SPACING.md,
    },
    logoIcon: {
        width: 50,
        height: 50,
        backgroundColor: LIGHT_COLORS.accentPrimary,
        borderRadius: LIGHT_RADIUS.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoEmoji: {
        fontSize: 28,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: LIGHT_COLORS.textPrimary,
    },
    headerSubtitle: {
        fontSize: 14,
        color: LIGHT_COLORS.textSecondary,
    },
    usageSection: {
        paddingHorizontal: LIGHT_SPACING.xl,
        marginBottom: LIGHT_SPACING.md,
    },
    mealSelector: {
        maxHeight: 60,
    },
    mealSelectorContent: {
        paddingHorizontal: LIGHT_SPACING.xl,
        gap: LIGHT_SPACING.sm,
    },
    mealChip: {
        backgroundColor: LIGHT_COLORS.bgCard,
        paddingHorizontal: LIGHT_SPACING.lg,
        paddingVertical: LIGHT_SPACING.md,
        borderRadius: LIGHT_RADIUS.full,
        borderWidth: 1,
        borderColor: LIGHT_COLORS.borderColor,
    },
    mealChipActive: {
        backgroundColor: LIGHT_COLORS.accentPrimary,
        borderColor: LIGHT_COLORS.accentPrimary,
    },
    mealChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: LIGHT_COLORS.textPrimary,
    },
    mealChipTextActive: {
        color: '#ffffff',
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: LIGHT_SPACING.xl,
        marginTop: LIGHT_SPACING.lg,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: LIGHT_COLORS.textPrimary,
        marginTop: LIGHT_SPACING.lg,
        marginBottom: LIGHT_SPACING.md,
    },
    mealCard: {
        backgroundColor: LIGHT_COLORS.bgCard,
        borderRadius: LIGHT_RADIUS.lg,
        padding: LIGHT_SPACING.lg,
        marginBottom: LIGHT_SPACING.md,
        borderWidth: 1,
        borderColor: LIGHT_COLORS.borderColor,
    },
    originalCard: {
        borderColor: LIGHT_COLORS.textMuted,
        borderWidth: 2,
    },
    mealHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: LIGHT_SPACING.md,
    },
    mealIcon: {
        fontSize: 36,
        marginRight: LIGHT_SPACING.md,
    },
    mealInfo: {
        flex: 1,
    },
    mealLabel: {
        fontSize: 12,
        color: LIGHT_COLORS.textSecondary,
        textTransform: 'uppercase',
        fontWeight: '600',
        marginBottom: 2,
    },
    mealName: {
        fontSize: 18,
        fontWeight: '600',
        color: LIGHT_COLORS.textPrimary,
    },
    nutritionGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: LIGHT_SPACING.md,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: LIGHT_COLORS.borderLight,
        marginBottom: LIGHT_SPACING.md,
    },
    nutritionItem: {
        alignItems: 'center',
    },
    nutritionValue: {
        fontSize: 16,
        fontWeight: '700',
        color: LIGHT_COLORS.textPrimary,
        marginBottom: 2,
    },
    nutritionLabel: {
        fontSize: 12,
        color: LIGHT_COLORS.textSecondary,
    },
    comparisonBadge: {
        backgroundColor: LIGHT_COLORS.accentLight,
        paddingVertical: LIGHT_SPACING.sm,
        paddingHorizontal: LIGHT_SPACING.md,
        borderRadius: LIGHT_RADIUS.md,
        alignSelf: 'flex-start',
        marginBottom: LIGHT_SPACING.md,
    },
    comparisonText: {
        color: LIGHT_COLORS.accentPrimary,
        fontWeight: '600',
        fontSize: 14,
    },
    useSwapButton: {
        backgroundColor: LIGHT_COLORS.accentPrimary,
        paddingVertical: LIGHT_SPACING.md,
        borderRadius: LIGHT_RADIUS.md,
        alignItems: 'center',
    },
    useSwapButtonText: {
        color: '#ffffff',
        fontWeight: '700',
        fontSize: 16,
    },
});
