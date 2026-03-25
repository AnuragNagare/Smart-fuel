import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LIGHT_COLORS, LIGHT_SPACING, LIGHT_RADIUS } from '../../constants/lightTheme';
import { chatWithFuelBot } from '../../services/fuelbot';
import { getUserProfile, getBMI } from '../../services/storage';

interface Meal {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

interface DayPlan {
    date: string;
    day: string;
    breakfast: Meal;
    lunch: Meal;
    dinner: Meal;
}

export default function MealPlanningScreen() {
    const [weekPlan, setWeekPlan] = useState<DayPlan[]>(generateWeekPlan());
    const [selectedDay, setSelectedDay] = useState(0);
    const [isReplacing, setIsReplacing] = useState<string | null>(null);
    const [isLoadingRecipe, setIsLoadingRecipe] = useState<string | null>(null);
    const [userContext, setUserContext] = useState<any>(null);

    React.useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const profile = await getUserProfile();
            const bmi = await getBMI();
            if (profile) {
                setUserContext({
                    name: profile.name,
                    age: profile.age,
                    weight: profile.weight,
                    height: profile.height,
                    bmi: bmi || undefined,
                });
            }
        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    };

    function generateWeekPlan(): DayPlan[] {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const today = new Date();

        return days.map((day, index) => {
            const date = new Date(today);
            date.setDate(today.getDate() + index);

            return {
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                day,
                breakfast: {
                    name: 'Oatmeal with Berries',
                    calories: 320,
                    protein: 12,
                    carbs: 54,
                    fat: 8,
                },
                lunch: {
                    name: 'Grilled Chicken Salad',
                    calories: 450,
                    protein: 42,
                    carbs: 28,
                    fat: 16,
                },
                dinner: {
                    name: 'Salmon with Quinoa',
                    calories: 520,
                    protein: 38,
                    carbs: 45,
                    fat: 18,
                },
            };
        });
    }

    const handleViewRecipe = async (meal: Meal, mealType: string, dayName: string) => {
        const mealKey = `${dayName}-${mealType}`;
        setIsLoadingRecipe(mealKey);
        try {
            const response = await chatWithFuelBot(
                `Give me a short, simple recipe and cooking instructions for ${meal.name}. Format nicely as plain text.`,
                [],
                userContext
            );
            Alert.alert(`Recipe: ${meal.name}`, response);
        } catch (error) {
            Alert.alert('Error', 'Failed to fetch the recipe. Please try again.');
        } finally {
            setIsLoadingRecipe(null);
        }
    };

    const handleReplace = async (dayIndex: number, mealType: string, currentMeal: Meal, dayName: string) => {
        const mealKey = `${dayName}-${mealType}`;
        setIsReplacing(mealKey);
        try {
            const response = await chatWithFuelBot(
                `Give me one single alternative meal for ${mealType} instead of ${currentMeal.name}. Reply EXACTLY and ONLY with a valid JSON object in this format: {"name": "Meal Name", "calories": 400, "protein": 30, "carbs": 40, "fat": 15}. Do not include markdown or any other text, just raw JSON.`,
                [],
                userContext
            );
            
            const newMealData = JSON.parse(response.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim());
            
            setWeekPlan(prevPlan => {
                const newPlan = [...prevPlan];
                const dayToUpdate = { ...newPlan[dayIndex] };
                if (mealType.toLowerCase() === 'breakfast') dayToUpdate.breakfast = newMealData;
                else if (mealType.toLowerCase() === 'lunch') dayToUpdate.lunch = newMealData;
                else if (mealType.toLowerCase() === 'dinner') dayToUpdate.dinner = newMealData;
                newPlan[dayIndex] = dayToUpdate;
                return newPlan;
            });
        } catch (error) {
            console.error('Failed to replace meal:', error);
            Alert.alert('Error', 'Failed to generate a new meal. Please try again.');
        } finally {
            setIsReplacing(null);
        }
    };

    const renderMealCard = (mealType: string, meal: Meal, icon: string, dayIndex: number, dayName: string) => {
        const mealKey = `${dayName}-${mealType}`;
        const replacing = isReplacing === mealKey;
        const loadingRecipe = isLoadingRecipe === mealKey;

        return (
        <View style={styles.mealCard}>
            <View style={styles.mealHeader}>
                <Text style={styles.mealIcon}>{icon}</Text>
                <View style={styles.mealInfo}>
                    <Text style={styles.mealType}>{mealType}</Text>
                    <Text style={styles.mealName}>{meal.name}</Text>
                </View>
                <Text style={styles.calories}>{meal.calories} cal</Text>
            </View>

            <View style={styles.macros}>
                <View style={styles.macroItem}>
                    <Text style={styles.macroLabel}>Protein</Text>
                    <Text style={styles.macroValue}>{meal.protein}g</Text>
                </View>
                <View style={styles.macroItem}>
                    <Text style={styles.macroLabel}>Carbs</Text>
                    <Text style={styles.macroValue}>{meal.carbs}g</Text>
                </View>
                <View style={styles.macroItem}>
                    <Text style={styles.macroLabel}>Fat</Text>
                    <Text style={styles.macroValue}>{meal.fat}g</Text>
                </View>
            </View>

            <View style={styles.mealActions}>
                <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleReplace(dayIndex, mealType, meal, dayName)}
                    disabled={replacing || loadingRecipe}
                >
                    {replacing ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                        <Text style={styles.actionButtonText}>Replace</Text>
                    )}
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.actionButton, styles.actionButtonOutline]}
                    onPress={() => handleViewRecipe(meal, mealType, dayName)}
                    disabled={replacing || loadingRecipe}
                >
                    {loadingRecipe ? (
                        <ActivityIndicator color={LIGHT_COLORS.accentPrimary} size="small" />
                    ) : (
                        <Text style={styles.actionButtonTextOutline}>View Recipe</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
        );
    };

    const currentDay = weekPlan[selectedDay];
    const totalCalories = currentDay.breakfast.calories + currentDay.lunch.calories + currentDay.dinner.calories;
    const totalProtein = currentDay.breakfast.protein + currentDay.lunch.protein + currentDay.dinner.protein;

    return (
        <LinearGradient
            colors={[LIGHT_COLORS.bgPrimary, LIGHT_COLORS.bgGradientEnd]}
            style={styles.container}
        >
            <View style={styles.header}>
                <View style={styles.logoIcon}>
                    <Text style={styles.logoEmoji}>📅</Text>
                </View>
                <View>
                    <Text style={styles.headerTitle}>Meal Planning</Text>
                    <Text style={styles.headerSubtitle}>AI-Generated Weekly Plan</Text>
                </View>
            </View>

            {/* Week Selector */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.weekSelector}
                contentContainerStyle={styles.weekSelectorContent}
            >
                {weekPlan.map((dayPlan, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.dayChip,
                            selectedDay === index && styles.dayChipActive,
                        ]}
                        onPress={() => setSelectedDay(index)}
                    >
                        <Text style={[
                            styles.dayLabel,
                            selectedDay === index && styles.dayLabelActive,
                        ]}>
                            {dayPlan.day}
                        </Text>
                        <Text style={[
                            styles.dateLabel,
                            selectedDay === index && styles.dateLabelActive,
                        ]}>
                            {dayPlan.date}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Daily Summary */}
            <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Calories</Text>
                    <Text style={styles.summaryValue}>{totalCalories} cal</Text>
                </View>
                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total Protein</Text>
                    <Text style={styles.summaryValue}>{totalProtein}g</Text>
                </View>
            </View>

            {/* Meals List */}
            <ScrollView style={styles.mealsContainer} showsVerticalScrollIndicator={false}>
                {renderMealCard('Breakfast', currentDay.breakfast, '🌅', selectedDay, currentDay.day)}
                {renderMealCard('Lunch', currentDay.lunch, '☀️', selectedDay, currentDay.day)}
                {renderMealCard('Dinner', currentDay.dinner, '🌙', selectedDay, currentDay.day)}

                {/* Action Buttons */}
                <TouchableOpacity style={styles.generateButton}>
                    <Text style={styles.generateButtonText}>✨ Regenerate All Meals</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.generateButton, styles.groceryButton]}>
                    <Text style={styles.groceryButtonText}>🛒 Generate Grocery List</Text>
                </TouchableOpacity>

                <View style={{ height: 20 }} />
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
        paddingTop: 60,
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
    weekSelector: {
        maxHeight: 80,
    },
    weekSelectorContent: {
        paddingHorizontal: LIGHT_SPACING.xl,
        gap: LIGHT_SPACING.sm,
    },
    dayChip: {
        backgroundColor: LIGHT_COLORS.bgCard,
        paddingHorizontal: LIGHT_SPACING.lg,
        paddingVertical: LIGHT_SPACING.md,
        borderRadius: LIGHT_RADIUS.md,
        minWidth: 70,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: LIGHT_COLORS.borderColor,
    },
    dayChipActive: {
        backgroundColor: LIGHT_COLORS.accentPrimary,
        borderColor: LIGHT_COLORS.accentPrimary,
    },
    dayLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: LIGHT_COLORS.textPrimary,
        marginBottom: 2,
    },
    dayLabelActive: {
        color: '#ffffff',
    },
    dateLabel: {
        fontSize: 12,
        color: LIGHT_COLORS.textSecondary,
    },
    dateLabelActive: {
        color: 'rgba(255,255,255,0.9)',
    },
    summaryCard: {
        backgroundColor: LIGHT_COLORS.bgCard,
        marginHorizontal: LIGHT_SPACING.xl,
        marginTop: LIGHT_SPACING.lg,
        marginBottom: LIGHT_SPACING.md,
        padding: LIGHT_SPACING.lg,
        borderRadius: LIGHT_RADIUS.md,
        borderWidth: 1,
        borderColor: LIGHT_COLORS.borderColor,
        gap: LIGHT_SPACING.sm,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 14,
        color: LIGHT_COLORS.textSecondary,
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: '700',
        color: LIGHT_COLORS.accentPrimary,
    },
    mealsContainer: {
        flex: 1,
        paddingHorizontal: LIGHT_SPACING.xl,
    },
    mealCard: {
        backgroundColor: LIGHT_COLORS.bgCard,
        borderRadius: LIGHT_RADIUS.lg,
        padding: LIGHT_SPACING.lg,
        marginBottom: LIGHT_SPACING.md,
        borderWidth: 1,
        borderColor: LIGHT_COLORS.borderColor,
    },
    mealHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: LIGHT_SPACING.md,
    },
    mealIcon: {
        fontSize: 32,
        marginRight: LIGHT_SPACING.md,
    },
    mealInfo: {
        flex: 1,
    },
    mealType: {
        fontSize: 12,
        color: LIGHT_COLORS.textSecondary,
        textTransform: 'uppercase',
        fontWeight: '600',
        marginBottom: 2,
    },
    mealName: {
        fontSize: 16,
        fontWeight: '600',
        color: LIGHT_COLORS.textPrimary,
    },
    calories: {
        fontSize: 16,
        fontWeight: '700',
        color: LIGHT_COLORS.accentPrimary,
    },
    macros: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: LIGHT_SPACING.md,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: LIGHT_COLORS.borderLight,
        marginBottom: LIGHT_SPACING.md,
    },
    macroItem: {
        alignItems: 'center',
    },
    macroLabel: {
        fontSize: 12,
        color: LIGHT_COLORS.textSecondary,
        marginBottom: 4,
    },
    macroValue: {
        fontSize: 16,
        fontWeight: '600',
        color: LIGHT_COLORS.textPrimary,
    },
    mealActions: {
        flexDirection: 'row',
        gap: LIGHT_SPACING.sm,
    },
    actionButton: {
        flex: 1,
        backgroundColor: LIGHT_COLORS.accentPrimary,
        paddingVertical: LIGHT_SPACING.sm,
        borderRadius: LIGHT_RADIUS.md,
        alignItems: 'center',
    },
    actionButtonOutline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: LIGHT_COLORS.accentPrimary,
    },
    actionButtonText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 14,
    },
    actionButtonTextOutline: {
        color: LIGHT_COLORS.accentPrimary,
        fontWeight: '600',
        fontSize: 14,
    },
    generateButton: {
        backgroundColor: LIGHT_COLORS.accentPrimary,
        paddingVertical: LIGHT_SPACING.lg,
        borderRadius: LIGHT_RADIUS.full,
        alignItems: 'center',
        marginTop: LIGHT_SPACING.md,
    },
    generateButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
    groceryButton: {
        backgroundColor: LIGHT_COLORS.bgCard,
        borderWidth: 2,
        borderColor: LIGHT_COLORS.accentPrimary,
    },
    groceryButtonText: {
        color: LIGHT_COLORS.accentPrimary,
        fontSize: 16,
        fontWeight: '700',
    },
});
