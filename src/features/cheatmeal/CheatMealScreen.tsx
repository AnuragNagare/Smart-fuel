import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { LIGHT_COLORS, LIGHT_SPACING, LIGHT_RADIUS } from '../../constants/lightTheme';
import { getTodaysDeals, DealOffer } from '../../services/deals';
import { getUserProfile, getBMI } from '../../services/storage';
import { getCurrentUser } from '../../services/auth';
import { getMealHistory } from '../../services/history';
import { chatWithFuelBot } from '../../services/fuelbot';

interface CheatMeal {
    name: string;
    calories: number;
    date?: string;
}

export default function CheatMealScreen() {
    const [selectedTab, setSelectedTab] = useState<'scheduler' | 'optimizer' | 'prep' | 'deals'>('scheduler');
    const [cravingMeal, setCravingMeal] = useState('');
    const [showOptimizer, setShowOptimizer] = useState(false);
    const [deals, setDeals] = useState<DealOffer[]>([]);
    const [isLoadingDeals, setIsLoadingDeals] = useState(false);
    const [userLocation, setUserLocation] = useState('Mumbai');
    const insets = useSafeAreaInsets();

    const [cheatBudget, setCheatBudget] = useState({ used: 0, total: 2, caloriesUnder: 0 });
    const [bestDay, setBestDay] = useState({ day: 'Analyzing...', reason: 'Loading your meal history...' });
    const [isAnalyzingHistory, setIsAnalyzingHistory] = useState(true);
    
    const [optimizerData, setOptimizerData] = useState<any>(null);
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [userContext, setUserContext] = useState<any>(null);

    useEffect(() => {
        loadUserLocation();
        analyzeHistory();
    }, []);

    const loadUserLocation = async () => {
        try {
            const profile = await getUserProfile();
            if (profile?.location) {
                setUserLocation(profile.location);
            }
        } catch (error) {
            console.error('Failed to load location:', error);
        }
    };

    const analyzeHistory = async () => {
        setIsAnalyzingHistory(true);
        try {
            const currentUser = await getCurrentUser();
            const profile = await getUserProfile();
            const bmi = await getBMI();
            
            if (profile) {
                setUserContext({ ...profile, bmi });
            }

            if (currentUser && profile) {
                const history = await getMealHistory(currentUser.id, 21); // get ~week of meals
                
                const today = new Date();
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(today.getDate() - 7);
                
                const lastWeekMeals = history.filter(h => h.created_at && new Date(h.created_at) >= sevenDaysAgo);
                const totalCalories = lastWeekMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
                
                const weight = Number(profile.weight) || 70;
                const tdee = Math.round(weight * 24 * 1.2);
                const weeklyDeficit = (tdee * 7) - totalCalories;
                
                const earnedTotal = weeklyDeficit > 2000 ? 2 : (weeklyDeficit > 0 ? 1 : 0);
                
                setCheatBudget({
                    used: 0,
                    total: earnedTotal,
                    caloriesUnder: weeklyDeficit > 0 ? weeklyDeficit : 0
                });

                if (weeklyDeficit > 0) {
                    const prompt = `Based on a mathematical weekly caloric deficit of ${weeklyDeficit} calories for a user trying to stay fit, what is the best day of the week to take a cheat meal and why? Return purely a raw JSON object (no markdown): {"day": "Friday", "reason": "Because..."}`;
                    const res = await chatWithFuelBot(prompt, [], { ...profile, bmi } as any);
                    const jsonMatch = res.match(/\{[\s\S]*\}/);
                    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : res.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim());
                    setBestDay({ day: parsed.day || 'Friday', reason: parsed.reason || `You earned it with a ${weeklyDeficit} cal deficit.` });
                } else {
                    setBestDay({ day: 'Not Yet', reason: 'You are currently in a caloric surplus this week.' });
                }
            }
        } catch (error) {
            console.error('Failed to analyze history:', error);
            setCheatBudget({ used: 0, total: 1, caloriesUnder: 500 });
            setBestDay({ day: 'Saturday', reason: 'Weekend recovery day.' });
        } finally {
            setIsAnalyzingHistory(false);
        }
    };

    const fetchDeals = async () => {
        setIsLoadingDeals(true);
        try {
            const todaysDeals = await getTodaysDeals(userLocation);
            setDeals(todaysDeals);
        } catch (error) {
            console.error('Error fetching deals:', error);
        } finally {
            setIsLoadingDeals(false);
        }
    };

    const handleCravingSelect = async (craving: string) => {
        setCravingMeal(craving);
        setShowOptimizer(true);
        setIsOptimizing(true);
        
        try {
            const prompt = `The user is craving ${craving}. Estimate the macros for a massive restaurant portion of this. Then, generate a strict 3-day recovery plan to offset these excess calories safely. Return EXACTLY a raw JSON object (no markdown):
{
  "impact": { "calories": 1200, "protein": 40, "fat": 60 },
  "recoverySteps": [
    { "day": "Day 1", "text": "..." },
    { "day": "Day 2", "text": "..." },
    { "day": "Day 3", "text": "..." }
  ]
}`;
            const res = await chatWithFuelBot(prompt, [], userContext);
            const jsonMatch = res.match(/\{[\s\S]*\}/);
            const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : res.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim());
            
            setOptimizerData(parsed);
        } catch (error) {
            console.error('Failed to optimize craving:', error);
            setOptimizerData({
                impact: { calories: 1500, protein: 50, fat: 80 },
                recoverySteps: [
                    { day: "Day 1", text: "Reduce by 300 calories" },
                    { day: "Day 2", text: "Reduce by 300 calories" },
                    { day: "Day 3", text: "45 min intense cardio" }
                ]
            });
        } finally {
            setIsOptimizing(false);
        }
    };

    const cravings = ['🍕 Pizza', '🍔 Burger', '🍰 Cake', '🍦 Ice Cream', '🌮 Tacos', '🍜 Ramen'];

    const renderScheduler = () => (
        <View>
            {isAnalyzingHistory ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#ff9500" />
                    <Text style={{ marginTop: 10, color: LIGHT_COLORS.textSecondary }}>Analyzing your meal history...</Text>
                </View>
            ) : (
                <>
                {/* Cheat Budget */}
            <View style={styles.budgetCard}>
                <Text style={styles.budgetTitle}>Cheat Budget This Week</Text>
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${(cheatBudget.used / cheatBudget.total) * 100}%` }]} />
                    </View>
                    <Text style={styles.budgetText}>
                        {cheatBudget.used}/{cheatBudget.total} used
                    </Text>
                </View>
                <Text style={styles.budgetSubtext}>
                    You have {cheatBudget.total - cheatBudget.used} cheat meal{cheatBudget.total - cheatBudget.used !== 1 ? 's' : ''} left this week!
                </Text>
            </View>

            {/* Best Day Recommendation */}
            <View style={styles.recommendationCard}>
                <Text style={styles.recommendationIcon}>📅</Text>
                <Text style={styles.recommendationTitle}>Best Day for Cheat Meal</Text>
                <View style={styles.bestDayChip}>
                    <Text style={styles.bestDayText}>{bestDay.day.toUpperCase()}</Text>
                </View>
                <Text style={styles.recommendationReason}>{bestDay.reason}</Text>
                <Text style={styles.recommendationSubtext}>
                    Based on your weekly calorie trend and activity levels
                </Text>
            </View>

            {/* Weekly Calendar */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>This Week's Schedule</Text>
                <View style={styles.weekGrid}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                        <View
                            key={day}
                            style={[
                                styles.dayCell,
                                day === 'Fri' && styles.dayCellRecommended,
                            ]}
                        >
                            <Text style={[styles.dayLabel, day === 'Fri' && styles.dayLabelRecommended]}>
                                {day}
                            </Text>
                            {day === 'Fri' && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                    ))}
                </View>
            </View>
            </>
            )}
        </View>
    );

    const renderOptimizer = () => (
        <View>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>What are you craving?</Text>
                <View style={styles.cravingsGrid}>
                    {cravings.map((craving, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.cravingChip,
                                cravingMeal === craving && styles.cravingChipActive,
                            ]}
                            onPress={() => handleCravingSelect(craving)}
                        >
                            <Text style={styles.cravingText}>{craving}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {showOptimizer && cravingMeal && (
                <>
                    {isOptimizing || !optimizerData ? (
                        <View style={{ padding: 40, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color="#ff9500" />
                            <Text style={{ marginTop: 10, color: LIGHT_COLORS.textSecondary }}>FuelBot is calculating impact...</Text>
                        </View>
                    ) : (
                        <>
                        {/* Impact Analysis */}
                        <View style={styles.impactCard}>
                            <Text style={styles.impactTitle}>{cravingMeal}</Text>
                            <View style={styles.impactStats}>
                                <View style={styles.impactStat}>
                                    <Text style={styles.impactValue}>+{optimizerData.impact.calories}</Text>
                                    <Text style={styles.impactLabel}>calories</Text>
                                </View>
                                <View style={styles.impactStat}>
                                    <Text style={styles.impactValue}>{optimizerData.impact.protein}g</Text>
                                    <Text style={styles.impactLabel}>protein</Text>
                                </View>
                                <View style={styles.impactStat}>
                                    <Text style={styles.impactValue}>{optimizerData.impact.fat}g</Text>
                                    <Text style={styles.impactLabel}>fat</Text>
                                </View>
                            </View>
                        </View>

                        {/* Recovery Plan */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Recovery Plan</Text>
                            <Text style={styles.recoverySubtitle}>
                                Balance this meal over the next 3 days
                            </Text>

                            <View style={styles.recoverySteps}>
                                {optimizerData.recoverySteps.map((step: any, idx: number) => (
                                    <View key={idx} style={styles.recoveryStep}>
                                        <View style={styles.stepBadge}>
                                            <Text style={styles.stepBadgeText}>{step.day}</Text>
                                        </View>
                                        <Text style={styles.stepText}>{step.text}</Text>
                                    </View>
                                ))}
                            </View>

                            <TouchableOpacity style={styles.worthItButton}>
                                <Text style={styles.worthItButtonText}>Worth It! Let's Do This 🎉</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.alternativeButton}>
                                <Text style={styles.alternativeButtonText}>Find Healthier Alternative</Text>
                            </TouchableOpacity>
                        </View>
                        </>
                    )}
                </>
            )}
        </View>
    );

    const renderPrep = () => (
        <View>
            <View style={styles.prepCard}>
                <Text style={styles.prepIcon}>🛡️</Text>
                <Text style={styles.prepTitle}>Pre-Cheat Preparation</Text>
                <Text style={styles.prepSubtitle}>
                    Prepare your body 2 days before your cheat meal
                </Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Prep Strategy</Text>
                <Text style={styles.prepStrategy}>
                    Bank calories and optimize nutrition before Friday's cheat meal
                </Text>

                {/* Day 1 */}
                <View style={styles.prepDay}>
                    <View style={styles.prepDayHeader}>
                        <Text style={styles.prepDayTitle}>Wednesday</Text>
                        <Text style={styles.prepDayBadge}>-300 cal</Text>
                    </View>
                    <View style={styles.prepMealList}>
                        <Text style={styles.prepMeal}>• High-protein breakfast (eggs, Greek yogurt)</Text>
                        <Text style={styles.prepMeal}>• Light lunch (chicken salad)</Text>
                        <Text style={styles.prepMeal}>• Skip evening snack</Text>
                    </View>
                </View>

                {/* Day 2 */}
                <View style={styles.prepDay}>
                    <View style={styles.prepDayHeader}>
                        <Text style={styles.prepDayTitle}>Thursday</Text>
                        <Text style={styles.prepDayBadge}>-400 cal</Text>
                    </View>
                    <View style={styles.prepMealList}>
                        <Text style={styles.prepMeal}>• Intermittent fasting until 12 PM</Text>
                        <Text style={styles.prepMeal}>• Veggie-heavy meals</Text>
                        <Text style={styles.prepMeal}>• 30 min walk after dinner</Text>
                    </View>
                </View>

                {/* Cheat Day */}
                <View style={[styles.prepDay, styles.cheatDayHighlight]}>
                    <View style={styles.prepDayHeader}>
                        <Text style={[styles.prepDayTitle, styles.cheatDayTitle]}>Friday</Text>
                        <Text style={[styles.prepDayBadge, styles.cheatDayBadge]}>CHEAT DAY</Text>
                    </View>
                    <Text style={styles.cheatDayText}>
                        You've banked 700 calories! Enjoy your meal guilt-free 🎉
                    </Text>
                </View>
            </View>

            <View style={styles.tipsCard}>
                <Text style={styles.tipsTitle}>💡 Pro Tips</Text>
                <Text style={styles.tipText}>• Stay hydrated (3L water/day)</Text>
                <Text style={styles.tipText}>• Get 7-8 hours sleep</Text>
                <Text style={styles.tipText}>• Protein intake: 120g+/day</Text>
                <Text style={styles.tipText}>• Light cardio on prep days</Text>
            </View>
        </View>
    );

    const renderDeals = () => (
        <View>
            <View style={styles.dealsHeader}>
                <Text style={styles.dealsTitle}>🎁 Today's Best Deals</Text>
                <Text style={styles.dealsSubtitle}>in {userLocation}</Text>
                <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={fetchDeals}
                    disabled={isLoadingDeals}
                >
                    <Text style={styles.refreshButtonText}>
                        {isLoadingDeals ? '🔄 Loading...' : '🔄 Refresh Deals'}
                    </Text>
                </TouchableOpacity>
            </View>

            {isLoadingDeals ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={LIGHT_COLORS.accentPrimary} />
                    <Text style={styles.loadingText}>Finding best deals for you...</Text>
                </View>
            ) : deals.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateIcon}>🔍</Text>
                    <Text style={styles.emptyStateText}>Tap "Refresh Deals" to find offers</Text>
                </View>
            ) : (
                deals.map((deal, index) => (
                    <View key={index} style={styles.dealCard}>
                        <View style={styles.dealHeader}>
                            <View style={styles.dealRestaurant}>
                                <Text style={styles.restaurantName}>{deal.restaurant}</Text>
                                <Text style={styles.dealDish}>{deal.dish}</Text>
                            </View>
                            <View style={[styles.platformBadge,
                            deal.platform === 'Zomato' && styles.zomatoBadge,
                            deal.platform === 'Swiggy' && styles.swiggyBadge,
                            deal.platform === 'Both' && styles.bothBadge
                            ]}>
                                <Text style={styles.platformText}>{deal.platform}</Text>
                            </View>
                        </View>
                        <View style={styles.dealDiscount}>
                            <Text style={styles.discountText}>💰 {deal.discount}</Text>
                        </View>
                        <Text style={styles.dealDescription}>{deal.description}</Text>
                    </View>
                ))
            )}
        </View>
    );

    return (
        <LinearGradient
            colors={[LIGHT_COLORS.bgPrimary, LIGHT_COLORS.bgGradientEnd]}
            style={styles.container}
        >
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
                <View style={[styles.logoIcon, styles.treatIcon]}>
                    <Text style={styles.logoEmoji}>🍰</Text>
                </View>
                <View>
                    <Text style={styles.headerTitle}>Cheat Meals</Text>
                    <Text style={styles.headerSubtitle}>Strategic Indulgence</Text>
                </View>
            </View>

            {/* Tab Selector */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabScroll}
                contentContainerStyle={styles.tabSelector}
            >
                <TouchableOpacity
                    style={[styles.tab, selectedTab === 'scheduler' && styles.tabActive]}
                    onPress={() => setSelectedTab('scheduler')}
                >
                    <Text style={[styles.tabText, selectedTab === 'scheduler' && styles.tabTextActive]}>
                        📅 Schedule
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, selectedTab === 'optimizer' && styles.tabActive]}
                    onPress={() => setSelectedTab('optimizer')}
                >
                    <Text style={[styles.tabText, selectedTab === 'optimizer' && styles.tabTextActive]}>
                        🎯 Optimize
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, selectedTab === 'prep' && styles.tabActive]}
                    onPress={() => setSelectedTab('prep')}
                >
                    <Text style={[styles.tabText, selectedTab === 'prep' && styles.tabTextActive]}>
                        🛡️ Prep
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, selectedTab === 'deals' && styles.tabActive]}
                    onPress={() => { setSelectedTab('deals'); if (deals.length === 0) fetchDeals(); }}
                >
                    <Text style={[styles.tabText, selectedTab === 'deals' && styles.tabTextActive]}>
                        🎁 Deals
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {selectedTab === 'scheduler' && renderScheduler()}
                {selectedTab === 'optimizer' && renderOptimizer()}
                {selectedTab === 'prep' && renderPrep()}
                {selectedTab === 'deals' && renderDeals()}
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
    treatIcon: {
        backgroundColor: '#ff9500', // Orange for treats
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
    tabScroll: {
        marginBottom: LIGHT_SPACING.lg,
    },
    tabSelector: {
        flexDirection: 'row',
        paddingHorizontal: LIGHT_SPACING.xl,
        gap: LIGHT_SPACING.sm,
    },
    tab: {
        minWidth: 95,
        paddingVertical: LIGHT_SPACING.md,
        backgroundColor: LIGHT_COLORS.bgCard,
        borderRadius: LIGHT_RADIUS.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: LIGHT_COLORS.borderColor,
    },
    tabActive: {
        backgroundColor: '#ff9500',
        borderColor: '#ff9500',
    },
    tabText: {
        fontSize: 13,
        fontWeight: '600',
        color: LIGHT_COLORS.textPrimary,
    },
    tabTextActive: {
        color: '#ffffff',
    },
    content: {
        flex: 1,
        paddingHorizontal: LIGHT_SPACING.xl,
    },
    card: {
        backgroundColor: LIGHT_COLORS.bgCard,
        borderRadius: LIGHT_RADIUS.lg,
        padding: LIGHT_SPACING.lg,
        marginBottom: LIGHT_SPACING.md,
        borderWidth: 1,
        borderColor: LIGHT_COLORS.borderColor,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: LIGHT_COLORS.textPrimary,
        marginBottom: LIGHT_SPACING.md,
    },
    budgetCard: {
        backgroundColor: '#fff3e0',
        borderRadius: LIGHT_RADIUS.lg,
        padding: LIGHT_SPACING.xl,
        marginBottom: LIGHT_SPACING.md,
        borderWidth: 2,
        borderColor: '#ff9500',
    },
    budgetTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: LIGHT_COLORS.textPrimary,
        marginBottom: LIGHT_SPACING.md,
    },
    progressContainer: {
        marginBottom: LIGHT_SPACING.sm,
    },
    progressBar: {
        height: 12,
        backgroundColor: 'rgba(255, 149, 0, 0.2)',
        borderRadius: LIGHT_RADIUS.full,
        overflow: 'hidden',
        marginBottom: LIGHT_SPACING.xs,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#ff9500',
        borderRadius: LIGHT_RADIUS.full,
    },
    budgetText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ff9500',
    },
    budgetSubtext: {
        fontSize: 14,
        color: LIGHT_COLORS.textSecondary,
        marginTop: LIGHT_SPACING.xs,
    },
    recommendationCard: {
        backgroundColor: LIGHT_COLORS.bgCard,
        borderRadius: LIGHT_RADIUS.lg,
        padding: LIGHT_SPACING.xl,
        marginBottom: LIGHT_SPACING.md,
        borderWidth: 1,
        borderColor: LIGHT_COLORS.borderColor,
        alignItems: 'center',
    },
    recommendationIcon: {
        fontSize: 48,
        marginBottom: LIGHT_SPACING.sm,
    },
    recommendationTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: LIGHT_COLORS.textPrimary,
        marginBottom: LIGHT_SPACING.md,
    },
    bestDayChip: {
        backgroundColor: '#ff9500',
        paddingVertical: LIGHT_SPACING.sm,
        paddingHorizontal: LIGHT_SPACING.xl,
        borderRadius: LIGHT_RADIUS.full,
        marginBottom: LIGHT_SPACING.sm,
    },
    bestDayText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#ffffff',
    },
    recommendationReason: {
        fontSize: 15,
        color: LIGHT_COLORS.textPrimary,
        fontWeight: '600',
        marginBottom: LIGHT_SPACING.xs,
    },
    recommendationSubtext: {
        fontSize: 13,
        color: LIGHT_COLORS.textSecondary,
        textAlign: 'center',
    },
    weekGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dayCell: {
        width: 42,
        height: 50,
        backgroundColor: LIGHT_COLORS.bgInput,
        borderRadius: LIGHT_RADIUS.sm,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: LIGHT_COLORS.borderColor,
    },
    dayCellRecommended: {
        backgroundColor: '#fff3e0',
        borderColor: '#ff9500',
        borderWidth: 2,
    },
    dayLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: LIGHT_COLORS.textSecondary,
    },
    dayLabelRecommended: {
        color: '#ff9500',
    },
    checkmark: {
        fontSize: 18,
        color: '#ff9500',
    },
    cravingsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: LIGHT_SPACING.sm,
    },
    cravingChip: {
        paddingVertical: LIGHT_SPACING.md,
        paddingHorizontal: LIGHT_SPACING.lg,
        backgroundColor: LIGHT_COLORS.bgInput,
        borderRadius: LIGHT_RADIUS.full,
        borderWidth: 1,
        borderColor: LIGHT_COLORS.borderColor,
    },
    cravingChipActive: {
        backgroundColor: '#ff9500',
        borderColor: '#ff9500',
    },
    cravingText: {
        fontSize: 16,
        fontWeight: '600',
        color: LIGHT_COLORS.textPrimary,
    },
    impactCard: {
        backgroundColor: '#fff3e0',
        borderRadius: LIGHT_RADIUS.lg,
        padding: LIGHT_SPACING.xl,
        marginBottom: LIGHT_SPACING.md,
        borderWidth: 2,
        borderColor: '#ff9500',
        alignItems: 'center',
    },
    impactTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: LIGHT_COLORS.textPrimary,
        marginBottom: LIGHT_SPACING.lg,
    },
    impactStats: {
        flexDirection: 'row',
        gap: LIGHT_SPACING.xxxl,
    },
    impactStat: {
        alignItems: 'center',
    },
    impactValue: {
        fontSize: 28,
        fontWeight: '700',
        color: '#ff9500',
        marginBottom: LIGHT_SPACING.xs,
    },
    impactLabel: {
        fontSize: 14,
        color: LIGHT_COLORS.textSecondary,
    },
    recoverySubtitle: {
        fontSize: 14,
        color: LIGHT_COLORS.textSecondary,
        marginBottom: LIGHT_SPACING.lg,
    },
    recoverySteps: {
        gap: LIGHT_SPACING.md,
        marginBottom: LIGHT_SPACING.lg,
    },
    recoveryStep: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: LIGHT_SPACING.md,
    },
    stepBadge: {
        width: 50,
        height: 50,
        backgroundColor: LIGHT_COLORS.accentLight,
        borderRadius: LIGHT_RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepBadgeText: {
        fontSize: 14,
        fontWeight: '700',
        color: LIGHT_COLORS.accentPrimary,
    },
    stepText: {
        flex: 1,
        fontSize: 15,
        color: LIGHT_COLORS.textPrimary,
    },
    worthItButton: {
        backgroundColor: '#ff9500',
        paddingVertical: LIGHT_SPACING.lg,
        borderRadius: LIGHT_RADIUS.full,
        alignItems: 'center',
        marginBottom: LIGHT_SPACING.sm,
    },
    worthItButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '700',
    },
    alternativeButton: {
        backgroundColor: 'transparent',
        paddingVertical: LIGHT_SPACING.md,
        borderRadius: LIGHT_RADIUS.full,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: LIGHT_COLORS.accentPrimary,
    },
    alternativeButtonText: {
        color: LIGHT_COLORS.accentPrimary,
        fontSize: 14,
        fontWeight: '600',
    },
    prepCard: {
        backgroundColor: LIGHT_COLORS.bgCard,
        borderRadius: LIGHT_RADIUS.lg,
        padding: LIGHT_SPACING.xl,
        marginBottom: LIGHT_SPACING.md,
        borderWidth: 1,
        borderColor: LIGHT_COLORS.borderColor,
        alignItems: 'center',
    },
    prepIcon: {
        fontSize: 48,
        marginBottom: LIGHT_SPACING.sm,
    },
    prepTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: LIGHT_COLORS.textPrimary,
        marginBottom: LIGHT_SPACING.xs,
    },
    prepSubtitle: {
        fontSize: 14,
        color: LIGHT_COLORS.textSecondary,
        textAlign: 'center',
    },
    prepStrategy: {
        fontSize: 14,
        color: LIGHT_COLORS.textSecondary,
        marginBottom: LIGHT_SPACING.lg,
        fontStyle: 'italic',
    },
    prepDay: {
        backgroundColor: LIGHT_COLORS.bgInput,
        borderRadius: LIGHT_RADIUS.md,
        padding: LIGHT_SPACING.lg,
        marginBottom: LIGHT_SPACING.md,
    },
    prepDayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: LIGHT_SPACING.sm,
    },
    prepDayTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: LIGHT_COLORS.textPrimary,
    },
    prepDayBadge: {
        fontSize: 12,
        fontWeight: '700',
        color: LIGHT_COLORS.accentPrimary,
    },
    prepMealList: {
        gap: LIGHT_SPACING.xs,
    },
    prepMeal: {
        fontSize: 14,
        color: LIGHT_COLORS.textSecondary,
        lineHeight: 20,
    },
    cheatDayHighlight: {
        backgroundColor: '#fff3e0',
        borderWidth: 2,
        borderColor: '#ff9500',
    },
    cheatDayTitle: {
        color: '#ff9500',
    },
    cheatDayBadge: {
        color: '#ff9500',
    },
    cheatDayText: {
        fontSize: 15,
        color: LIGHT_COLORS.textPrimary,
        fontWeight: '600',
        textAlign: 'center',
    },
    tipsCard: {
        backgroundColor: LIGHT_COLORS.accentLight,
        borderRadius: LIGHT_RADIUS.md,
        padding: LIGHT_SPACING.lg,
        marginBottom: LIGHT_SPACING.md,
    },
    tipsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: LIGHT_COLORS.textPrimary,
        marginBottom: LIGHT_SPACING.sm,
    },
    tipText: {
        fontSize: 14,
        color: LIGHT_COLORS.textPrimary,
        marginBottom: LIGHT_SPACING.xs,
        lineHeight: 20,
    },
    dealsHeader: {
        backgroundColor: LIGHT_COLORS.bgCard,
        borderRadius: LIGHT_RADIUS.lg,
        padding: LIGHT_SPACING.lg,
        marginBottom: LIGHT_SPACING.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: LIGHT_COLORS.borderColor,
    },
    dealsTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: LIGHT_COLORS.textPrimary,
        marginBottom: LIGHT_SPACING.xs,
    },
    dealsSubtitle: {
        fontSize: 14,
        color: LIGHT_COLORS.textSecondary,
        marginBottom: LIGHT_SPACING.md,
    },
    refreshButton: {
        backgroundColor: LIGHT_COLORS.accentPrimary,
        paddingVertical: LIGHT_SPACING.md,
        paddingHorizontal: LIGHT_SPACING.xl,
        borderRadius: LIGHT_RADIUS.full,
    },
    refreshButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
    loadingContainer: {
        padding: LIGHT_SPACING.xxxl,
        alignItems: 'center',
    },
    loadingText: {
        marginTop: LIGHT_SPACING.md,
        color: LIGHT_COLORS.textSecondary,
        fontSize: 14,
    },
    emptyState: {
        padding: LIGHT_SPACING.xxxl,
        alignItems: 'center',
    },
    emptyStateIcon: {
        fontSize: 48,
        marginBottom: LIGHT_SPACING.md,
    },
    emptyStateText: {
        fontSize: 14,
        color: LIGHT_COLORS.textSecondary,
    },
    dealCard: {
        backgroundColor: LIGHT_COLORS.bgCard,
        borderRadius: LIGHT_RADIUS.lg,
        padding: LIGHT_SPACING.lg,
        marginBottom: LIGHT_SPACING.md,
        borderWidth: 1,
        borderColor: LIGHT_COLORS.borderColor,
        borderLeftWidth: 4,
        borderLeftColor: '#ff9500',
    },
    dealHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: LIGHT_SPACING.sm,
    },
    dealRestaurant: {
        flex: 1,
    },
    restaurantName: {
        fontSize: 16,
        fontWeight: '700',
        color: LIGHT_COLORS.textPrimary,
        marginBottom: LIGHT_SPACING.xs,
    },
    dealDish: {
        fontSize: 14,
        color: LIGHT_COLORS.textSecondary,
    },
    platformBadge: {
        paddingHorizontal: LIGHT_SPACING.md,
        paddingVertical: LIGHT_SPACING.xs,
        borderRadius: LIGHT_RADIUS.sm,
        height: 24,
        justifyContent: 'center',
    },
    zomatoBadge: {
        backgroundColor: '#e23744',
    },
    swiggyBadge: {
        backgroundColor: '#fc8019',
    },
    bothBadge: {
        backgroundColor: '#7c3aed',
    },
    platformText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '700',
    },
    dealDiscount: {
        marginBottom: LIGHT_SPACING.sm,
    },
    discountText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#ff9500',
    },
    dealDescription: {
        fontSize: 13,
        color: LIGHT_COLORS.textSecondary,
        lineHeight: 18,
    },
});
