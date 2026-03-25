import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, ProgressChart } from 'react-native-chart-kit';
import { LIGHT_COLORS, LIGHT_SPACING, LIGHT_RADIUS } from '../../constants/lightTheme';
import { getMealHistory, MealRecord } from '../../services/history';
import { chatWithFuelBot } from '../../services/fuelbot';
import { getUserProfile, getBMI } from '../../services/storage';
import { getCurrentUser } from '../../services/auth';

const screenWidth = Dimensions.get('window').width;

export default function HealthInsightsScreen() {
    const [isLoading, setIsLoading] = React.useState(true);
    const [avgCalories, setAvgCalories] = React.useState(0);
    const [targetCalories, setTargetCalories] = React.useState(2000);

    const [weightData] = useState({
        labels: ['Jan 1', 'Jan 8', 'Jan 15', 'Jan 22', 'Today'],
        datasets: [{ data: [72, 71.5, 71, 70.8, 70.5] }],
    });

    const [calorieData, setCalorieData] = useState({
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }],
    });

    const [goalProgress, setGoalProgress] = useState({
        labels: ['Protein', 'Calories', 'Carbs'],
        data: [0, 0, 0],
    });

    const [insights, setInsights] = useState([
        {
            icon: '🍽️',
            title: 'Analyzing Diet...',
            text: 'We are analyzing your recent meals to generate personalized insights.',
        }
    ]);

    React.useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const user = await getCurrentUser();
            if (!user) {
                setIsLoading(false);
                return;
            }

            const profile = await getUserProfile();
            const bmi = await getBMI();
            const userContext = profile ? { ...profile, bmi: bmi || undefined } : undefined;
            
            // Set dynamic targets based on weight profile if exists
            const currentWeight = profile?.weight ? Number(profile.weight) : 0;
            const targetCals = currentWeight > 0 ? currentWeight * 24 * 1.2 : 2000;
            const targetProtein = currentWeight > 0 ? currentWeight * 1.6 : 120; // 1.6g per kg
            const targetCarbs = 200; // rough default for progress tracking
            setTargetCalories(Math.round(targetCals));

            // Fetch last 100 meals
            const history = await getMealHistory(user.id, 100);

            // Group by last 7 days including today
            const last7Days = Array.from({length: 7}, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                return d;
            });

            const dayLabels = last7Days.map(d => d.toLocaleDateString('en-US', { weekday: 'short' }));
            const dailyData = last7Days.map(() => ({ calories: 0, protein: 0, carbs: 0, fat: 0 }));

            // Today's date at midnight for accurate diffing
            const todayEnd = new Date();
            todayEnd.setHours(23, 59, 59, 999);

            history.forEach(meal => {
                if (!meal.created_at) return;
                const mealDate = new Date(meal.created_at);
                const dayDiff = Math.floor((todayEnd.getTime() - mealDate.getTime()) / (1000 * 3600 * 24));
                
                if (dayDiff >= 0 && dayDiff < 7) {
                    const idx = 6 - dayDiff;
                    dailyData[idx].calories += meal.calories;
                    dailyData[idx].protein += meal.protein;
                    dailyData[idx].carbs += meal.carbs;
                    dailyData[idx].fat += meal.fat;
                }
            });

            setCalorieData({
                labels: dayLabels,
                datasets: [{ data: dailyData.map(d => Math.max(d.calories, 1)) }] // min 1 to avoid chart rendering crash on all 0s
            });

            // Calculate averages
            let totalCals = 0, totalProtein = 0, totalCarbs = 0;
            dailyData.forEach(d => {
                totalCals += d.calories;
                totalProtein += d.protein;
                totalCarbs += d.carbs;
            });
            const avgCals = Math.round(totalCals / 7);
            const avgProtein = Math.round(totalProtein / 7);
            const avgCarbs = Math.round(totalCarbs / 7);
            
            setAvgCalories(avgCals);

            // Update Progress Chart (capped at 1.0 = 100%)
            setGoalProgress({
                labels: ['Protein', 'Calories', 'Carbs'],
                data: [
                    Math.min(avgProtein / targetProtein, 1) || 0,
                    Math.min(avgCals / targetCals, 1) || 0,
                    Math.min(avgCarbs / targetCarbs, 1) || 0
                ]
            });

            // Generate Insights via AI
            if (totalCals > 0) { // Only generate insights if they actually logged meals
                const dataContext = `Here is my average daily nutrition over the last 7 days:
Calories: ${avgCals} (Target: ${Math.round(targetCals)})
Protein: ${avgProtein}g (Target: ${Math.round(targetProtein)}g)
Carbs: ${avgCarbs}g.`;

                try {
                    const aiResponse = await chatWithFuelBot(
                        dataContext + ` Based on this explicit nutrient data, provide EXACTLY 3 short, highly personalized health/diet insights for me. Return EXACTLY a raw JSON array of objects with no markdown around it. Format: [{"icon": "emoji", "title": "Short Title", "text": "Short 1-sentence insight"}]. DO NOT wrap in \`\`\`json.`,
                        [],
                        userContext
                    );

                    const parsedInsights = JSON.parse(aiResponse.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim());
                    if (Array.isArray(parsedInsights) && parsedInsights.length > 0) {
                        setInsights(parsedInsights.slice(0, 3));
                    }
                } catch (e) {
                    console.error("Failed to parse AI insights", e);
                    setInsights([{ icon: '🤖', title: 'AI Error', text: 'Could not generate insights right now.' }]);
                }
            } else {
                setInsights([{ icon: '📷', title: 'Log Meals', text: 'Log meals via the home screen using your camera to see your AI insights!' }]);
            }

        } catch (error) {
            console.error('Data load error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const chartConfig = {
        backgroundColor: LIGHT_COLORS.bgCard,
        backgroundGradientFrom: LIGHT_COLORS.bgCard,
        backgroundGradientTo: LIGHT_COLORS.bgCard,
        decimalPlaces: 1,
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
        style: {
            borderRadius: LIGHT_RADIUS.md,
        },
        propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: LIGHT_COLORS.accentPrimary,
        },
    };

    return (
        <LinearGradient
            colors={[LIGHT_COLORS.bgPrimary, LIGHT_COLORS.bgGradientEnd]}
            style={styles.container}
        >
            <View style={styles.header}>
                <View style={styles.logoIcon}>
                    <Text style={styles.logoEmoji}>📈</Text>
                </View>
                <View>
                    <Text style={styles.headerTitle}>Health Insights</Text>
                    <Text style={styles.headerSubtitle}>Predictive Analytics</Text>
                </View>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {isLoading ? (
                    <View style={{ marginTop: 40 }}>
                        <ActivityIndicator size="large" color={LIGHT_COLORS.accentPrimary} />
                        <Text style={{ textAlign: 'center', marginTop: 10, color: LIGHT_COLORS.textSecondary }}>
                            Analyzing your recent meals...
                        </Text>
                    </View>
                ) : (
                    <>
                        {/* Prediction Card */}
                <View style={styles.predictionCard}>
                    <Text style={styles.predictionIcon}>🎯</Text>
                    <Text style={styles.predictionTitle}>Weight Prediction</Text>
                    <Text style={styles.predictionText}>
                        At your current pace, you'll reach your goal weight of{' '}
                        <Text style={styles.highlight}>68kg</Text> by{' '}
                        <Text style={styles.highlight}>March 15, 2026</Text>
                    </Text>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '65%' }]} />
                    </View>
                    <Text style={styles.progressText}>65% to goal</Text>
                </View>

                {/* Weight Chart */}
                <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>Weight Progress</Text>
                    <LineChart
                        data={weightData}
                        width={screenWidth - 2 * LIGHT_SPACING.xl}
                        height={200}
                        chartConfig={chartConfig}
                        bezier
                        style={styles.chart}
                    />
                    <Text style={styles.chartSubtitle}>
                        ↓ 1.5kg lost in 30 days
                    </Text>
                </View>

                {/* Calorie Chart */}
                <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>Weekly Calories</Text>
                    <LineChart
                        data={calorieData}
                        width={screenWidth - 2 * LIGHT_SPACING.xl}
                        height={200}
                        chartConfig={chartConfig}
                        style={styles.chart}
                    />
                    <Text style={styles.chartSubtitle}>
                        Avg: {avgCalories} cal/day (Target: {targetCalories})
                    </Text>
                </View>

                {/* Goal Progress */}
                <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>Weekly Goals</Text>
                    <ProgressChart
                        data={goalProgress}
                        width={screenWidth - 2 * LIGHT_SPACING.xl}
                        height={200}
                        strokeWidth={16}
                        radius={32}
                        chartConfig={chartConfig}
                        hideLegend={false}
                        style={styles.chart}
                    />
                </View>

                {/* Insights Cards */}
                {insights.map((insight, index) => (
                    <View key={index} style={styles.insightCard}>
                        <Text style={styles.insightIcon}>{insight.icon}</Text>
                        <Text style={styles.insightTitle}>{insight.title}</Text>
                        <Text style={styles.insightText}>{insight.text}</Text>
                    </View>
                ))}

                <View style={{ height: 20 }} />
                    </>
                )}
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
    scrollView: {
        flex: 1,
        paddingHorizontal: LIGHT_SPACING.xl,
    },
    predictionCard: {
        backgroundColor: LIGHT_COLORS.accentLight,
        borderRadius: LIGHT_RADIUS.lg,
        padding: LIGHT_SPACING.xl,
        marginBottom: LIGHT_SPACING.lg,
        borderWidth: 2,
        borderColor: LIGHT_COLORS.accentPrimary,
        alignItems: 'center',
    },
    predictionIcon: {
        fontSize: 48,
        marginBottom: LIGHT_SPACING.sm,
    },
    predictionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: LIGHT_COLORS.textPrimary,
        marginBottom: LIGHT_SPACING.sm,
    },
    predictionText: {
        fontSize: 15,
        color: LIGHT_COLORS.textPrimary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: LIGHT_SPACING.lg,
    },
    highlight: {
        fontWeight: '700',
        color: LIGHT_COLORS.accentPrimary,
    },
    progressBar: {
        width: '100%',
        height: 8,
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        borderRadius: LIGHT_RADIUS.full,
        overflow: 'hidden',
        marginBottom: LIGHT_SPACING.sm,
    },
    progressFill: {
        height: '100%',
        backgroundColor: LIGHT_COLORS.accentPrimary,
        borderRadius: LIGHT_RADIUS.full,
    },
    progressText: {
        fontSize: 14,
        fontWeight: '600',
        color: LIGHT_COLORS.accentPrimary,
    },
    chartCard: {
        backgroundColor: LIGHT_COLORS.bgCard,
        borderRadius: LIGHT_RADIUS.lg,
        padding: LIGHT_SPACING.lg,
        marginBottom: LIGHT_SPACING.lg,
        borderWidth: 1,
        borderColor: LIGHT_COLORS.borderColor,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: LIGHT_COLORS.textPrimary,
        marginBottom: LIGHT_SPACING.md,
    },
    chart: {
        marginVertical: 8,
        borderRadius: LIGHT_RADIUS.md,
    },
    chartSubtitle: {
        fontSize: 14,
        color: LIGHT_COLORS.textSecondary,
        textAlign: 'center',
        marginTop: LIGHT_SPACING.sm,
    },
    insightCard: {
        backgroundColor: LIGHT_COLORS.bgCard,
        borderRadius: LIGHT_RADIUS.md,
        padding: LIGHT_SPACING.lg,
        marginBottom: LIGHT_SPACING.md,
        borderLeftWidth: 4,
        borderLeftColor: LIGHT_COLORS.accentPrimary,
        borderWidth: 1,
        borderColor: LIGHT_COLORS.borderColor,
    },
    insightIcon: {
        fontSize: 32,
        marginBottom: LIGHT_SPACING.sm,
    },
    insightTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: LIGHT_COLORS.textPrimary,
        marginBottom: LIGHT_SPACING.xs,
    },
    insightText: {
        fontSize: 14,
        color: LIGHT_COLORS.textSecondary,
        lineHeight: 20,
    },
});
