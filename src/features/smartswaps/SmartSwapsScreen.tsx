import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { LIGHT_COLORS, LIGHT_SPACING, LIGHT_RADIUS } from '../../constants/lightTheme';
import { getCurrentUser, User } from '../../services/auth';
import { getMealHistory } from '../../services/history';
import { chatWithFuelBot } from '../../services/fuelbot';
import { getUserProfile } from '../../services/storage';

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
    
    const [historyMeals, setHistoryMeals] = useState<FoodItem[]>([]);
    const [selectedMealIndex, setSelectedMealIndex] = useState(0);
    const [swapsCache, setSwapsCache] = useState<Record<number, Swap>>({});
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingRecipeFor, setLoadingRecipeFor] = useState<string | null>(null);
    const [userContext, setUserContext] = useState<any>(null);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        setIsLoading(true);
        try {
            const currentUser = await getCurrentUser();
            setAuthUser(currentUser);

            const profile = await getUserProfile();
            if (profile) setUserContext(profile);

            if (currentUser) {
                const history = await getMealHistory(currentUser.id, 30);
                if (history && history.length > 0) {
                    const mappedMeals: FoodItem[] = history.map(h => ({
                        name: h.meal_name,
                        calories: h.calories || 0,
                        protein: h.protein || 0,
                        carbs: h.carbs || 0,
                        fat: h.fat || 0,
                        cost: 15, // estimated baseline
                        time: 30, // estimated baseline
                    }));
                    
                    // Remove duplicates by name to show unique recent foods
                    const uniqueMeals = mappedMeals.filter((meal, index, self) =>
                        index === self.findIndex((t) => t.name === meal.name)
                    );

                    setHistoryMeals(uniqueMeals);
                    if (uniqueMeals.length > 0) {
                        generateSwaps(0, uniqueMeals[0]);
                    }
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const generateSwaps = async (index: number, mealToSwap: FoodItem) => {
        setSelectedMealIndex(index);
        
        if (swapsCache[index]) {
            return; // Already generated
        }

        setIsGenerating(true);
        
        try {
            const prompt = `Generate exactly 3 alternative meal swaps for "${mealToSwap.name}" which currently has ${mealToSwap.calories} cal, ${mealToSwap.protein}g protein.
1. 'healthier': lower calorie, higher protein
2. 'cheaper': very budget-friendly ingredients
3. 'faster': cooks in under 10 minutes

Return EXACTLY a raw JSON object (with NO markdown around it) with this exact structure:
{
  "healthier": { "name": "...", "calories": 400, "protein": 30, "carbs": 20, "fat": 10, "cost": 8, "time": 15 },
  "cheaper": { "name": "...", "calories": 500, "protein": 25, "carbs": 40, "fat": 12, "cost": 4, "time": 20 },
  "faster": { "name": "...", "calories": 450, "protein": 28, "carbs": 30, "fat": 15, "cost": 9, "time": 8 }
}`;
            const response = await chatWithFuelBot(prompt, [], userContext);
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            const jsonString = jsonMatch ? jsonMatch[0] : response.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
            const alternatives = JSON.parse(jsonString);

            const newSwapEntry: Swap = {
                original: mealToSwap,
                healthier: alternatives.healthier,
                cheaper: alternatives.cheaper,
                faster: alternatives.faster,
            };

            setSwapsCache(prev => ({ ...prev, [index]: newSwapEntry }));

        } catch (error) {
            console.error('Failed to generate swaps:', error);
            // Fallback object to prevent crashing page if parse fails
            setSwapsCache(prev => ({ 
                ...prev, 
                [index]: {
                    original: mealToSwap,
                    healthier: { name: 'AI Error (Try again)', calories: 0, protein: 0, carbs: 0, fat: 0, cost: 0, time: 0 },
                    cheaper: { name: 'AI Error', calories: 0, protein: 0, carbs: 0, fat: 0, cost: 0, time: 0 },
                    faster: { name: 'AI Error', calories: 0, protein: 0, carbs: 0, fat: 0, cost: 0, time: 0 },
                } 
            }));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleUseSwap = async (meal: FoodItem) => {
        setLoadingRecipeFor(meal.name);
        try {
            const prompt = `Give me a short, simple recipe and cooking instructions for ${meal.name}. It should take around ${meal.time} minutes and include budget-friendly ingredients if possible. Format nicely as plain text.`;
            const response = await chatWithFuelBot(prompt, [], userContext);
            Alert.alert(`Recipe: ${meal.name}`, response);
        } catch (error) {
            console.error('Failed to get recipe:', error);
            Alert.alert('Error', 'Failed to fetch the recipe. Please try again.');
        } finally {
            setLoadingRecipeFor(null);
        }
    };


    const renderMealCard = (meal: FoodItem | undefined, label: string, icon: string, comparisonType?: 'healthier' | 'cheaper' | 'faster') => {
        const isOriginal = !comparisonType;
        if (!meal) return null;
        
        const currentSwap = swapsCache[selectedMealIndex];

        let comparison = null;
        if (currentSwap && comparisonType === 'healthier') {
            const calDiff = currentSwap.original.calories - meal.calories;
            comparison = calDiff > 0 ? `Save ${calDiff} cal` : `${Math.abs(calDiff)} cal higher`;
        } else if (currentSwap && comparisonType === 'cheaper') {
            const costDiff = currentSwap.original.cost - meal.cost;
            comparison = costDiff > 0 ? `Save $${costDiff}` : `$${Math.abs(costDiff)} more`;
        } else if (currentSwap && comparisonType === 'faster') {
            const timeDiff = currentSwap.original.time - meal.time;
            comparison = timeDiff > 0 ? `${timeDiff} min faster` : `${Math.abs(timeDiff)} min slower`;
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
                    <TouchableOpacity 
                        style={styles.useSwapButton} 
                        onPress={() => handleUseSwap(meal)}
                        disabled={loadingRecipeFor === meal.name}
                    >
                        {loadingRecipeFor === meal.name ? (
                            <ActivityIndicator color="#ffffff" size="small" />
                        ) : (
                            <Text style={styles.useSwapButtonText}>Get Recipe</Text>
                        )}
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
            {historyMeals.length === 0 && !isLoading ? (
                <View style={{ padding: LIGHT_SPACING.xl, alignItems: 'center', marginTop: 40 }}>
                    <Text style={{ fontSize: 48, marginBottom: 10 }}>📷</Text>
                    <Text style={{ fontSize: 18, color: LIGHT_COLORS.textPrimary, textAlign: 'center', fontWeight: '600' }}>
                        No Meals Found
                    </Text>
                    <Text style={{ fontSize: 14, color: LIGHT_COLORS.textSecondary, textAlign: 'center', marginTop: 8 }}>
                        Go to the Home tab and use the camera to log your first meal. Your Smart Swaps will appear here!
                    </Text>
                </View>
            ) : (
                <>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.mealSelector}
                    contentContainerStyle={styles.mealSelectorContent}
                >
                    {historyMeals.map((meal, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.mealChip,
                                selectedMealIndex === index && styles.mealChipActive,
                            ]}
                            onPress={() => generateSwaps(index, meal)}
                            disabled={isGenerating}
                        >
                            <Text style={[
                                styles.mealChipText,
                                selectedMealIndex === index && styles.mealChipTextActive,
                            ]}>
                                {meal.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {isLoading || isGenerating ? (
                    <View style={{ marginTop: 60, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={LIGHT_COLORS.accentPrimary} />
                        <Text style={{ marginTop: 16, color: LIGHT_COLORS.textSecondary }}>
                            {isGenerating ? "FuelBot is analyzing alternatives..." : "Loading meal history..."}
                        </Text>
                    </View>
                ) : swapsCache[selectedMealIndex] ? (
                    <>
                        {renderMealCard(swapsCache[selectedMealIndex].original, 'Your Original Meal', '🍽️')}

                        <Text style={styles.sectionTitle}>Smart Alternatives</Text>

                        {renderMealCard(swapsCache[selectedMealIndex].healthier, 'Healthier Option', '🥗', 'healthier')}
                        {renderMealCard(swapsCache[selectedMealIndex].cheaper, 'Budget-Friendly', '💰', 'cheaper')}
                        {renderMealCard(swapsCache[selectedMealIndex].faster, 'Quick Option', '⚡', 'faster')}

                        <View style={{ height: insets.bottom + 20 }} />
                    </>
                ) : null}
            </ScrollView>
            </>
            )}
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
