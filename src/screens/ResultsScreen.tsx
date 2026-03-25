import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image as RNImage,
    TouchableOpacity,
    Dimensions,
    Platform,
    Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { LIGHT_COLORS, LIGHT_SPACING, LIGHT_RADIUS } from '../constants/lightTheme';
import { Svg, Circle, G } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCurrentUser } from '../services/auth';
import { saveMealToHistory } from '../services/history';
import LoadingScreen from '../components/LoadingScreen';

const { width } = Dimensions.get('window');

type ResultsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Results'>;
type ResultsScreenRouteProp = RouteProp<RootStackParamList, 'Results'>;

interface Props {
    navigation: ResultsScreenNavigationProp;
    route: ResultsScreenRouteProp;
}

export default function ResultsScreen({ navigation, route }: Props) {
    const { report, imageUri } = route.params;
    const insets = useSafeAreaInsets();
    const [isSaving, setIsSaving] = useState(false);

    // Helper to generate tags based on macros
    const getFoodTags = (item: any) => {
        const tags = [];
        if (item.protein > 20) tags.push({ label: 'High Protein', color: LIGHT_COLORS.accentPrimary });
        if (item.carbs < 10) tags.push({ label: 'Low Carb', color: '#3b82f6' });
        if (item.fat > 15) tags.push({ label: 'Healthy Fats', color: '#eab308' });
        if (item.calories < 200) tags.push({ label: 'Low Cal', color: LIGHT_COLORS.textSecondary });
        return tags;
    };

    // Helper to get colors
    const getScoreColor = (score: number) => {
        if (score >= 8) return '#22c55e';
        if (score >= 6) return '#f59e0b';
        return '#ef4444';
    };

    const getImpactColor = (impact: string) => {
        const i = impact?.toLowerCase();
        if (i === 'gain' || i === 'high') return '#f59e0b';
        if (i === 'loss' || i === 'low') return '#22c55e';
        return LIGHT_COLORS.accentPrimary;
    };

    // Calculate ring chart values
    const calorieGoal = 2200; // Default goal
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min((report.totals?.calories || 0) / calorieGoal, 1);
    const dashOffset = circumference * (1 - progress);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const user = await getCurrentUser();
            if (!user) {
                Alert.alert('Login Required', 'You need to be logged in to save your meal history.');
                navigation.navigate('Login');
                return;
            }

            await saveMealToHistory(user.id, report, imageUri);
            Alert.alert('Success', 'Meal saved to your history!', [
                { text: 'OK', onPress: () => navigation.navigate('Home') }
            ]);
        } catch (error) {
            console.error('Save error:', error);
            Alert.alert('Error', 'Failed to save meal to history. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View style={styles.container}>
            {isSaving && <LoadingScreen />}
            {/* Top Navigation Bar */}
            <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 15) }]}>
                <TouchableOpacity
                    style={styles.roundButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backIcon}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Report</Text>
                <TouchableOpacity style={styles.roundButton}>
                    <Text style={styles.shareIcon}>share</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Card */}
                <View style={styles.heroCard}>
                    {imageUri && (
                        <RNImage source={{ uri: imageUri }} style={styles.heroImage} />
                    )}
                    <View style={styles.imageOverlay} />

                    {/* Confidence Badge */}
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>✨ Gemini Analysis</Text>
                    </View>

                    <View style={styles.heroTextContainer}>
                        <Text style={styles.uploadTime}>Uploaded Just Now</Text>
                        <View style={styles.heroHeaderRow}>
                            <Text style={styles.mealTitle} numberOfLines={1}>
                                {report.items?.[0]?.name || 'Meal Analysis'}
                            </Text>
                            <TouchableOpacity style={styles.editHeroButton}>
                                <Text style={styles.editIcon}>✎</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Macro Section Header */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>TOTAL MACROS</Text>
                    <Text style={styles.dailyGoal}>Daily Goal: {calorieGoal} kcal</Text>
                </View>

                {/* Energy Intake Card */}
                <View style={[styles.card, styles.calorieCard]}>
                    <View>
                        <Text style={styles.cardLabel}>Energy Intake</Text>
                        <View style={styles.calorieValueRow}>
                            <Text style={styles.calorieValue}>{report.totals?.calories}</Text>
                            <Text style={styles.calorieUnit}>kcal</Text>
                        </View>
                        <View style={styles.onTrackRow}>
                            <View style={styles.trackDot} />
                            <Text style={styles.trackText}>ON TRACK</Text>
                        </View>
                    </View>

                    <View style={styles.ringContainer}>
                        <Svg height="100" width="100" viewBox="0 0 100 100">
                            <Circle
                                cx="50"
                                cy="50"
                                r={radius}
                                stroke={LIGHT_COLORS.borderLight}
                                strokeWidth="8"
                                fill="transparent"
                            />
                            <Circle
                                cx="50"
                                cy="50"
                                r={radius}
                                stroke={LIGHT_COLORS.accentPrimary}
                                strokeWidth="8"
                                strokeDasharray={circumference}
                                strokeDashoffset={dashOffset}
                                strokeLinecap="round"
                                fill="transparent"
                                transform="rotate(-90 50 50)"
                            />
                        </Svg>
                        <View style={styles.ringIconContainer}>
                            <Text style={styles.fireIcon}>🔥</Text>
                        </View>
                    </View>
                </View>

                {/* Macro Breakdown Grid */}
                <View style={styles.macroGrid}>
                    <View style={styles.macroCard}>
                        <View style={styles.macroHeader}>
                            <View style={[styles.iconBox, { backgroundColor: '#f0fdf4' }]}>
                                <Text style={styles.macroStatIcon}>💪</Text>
                            </View>
                            <Text style={styles.macroCardLabel}>Protein</Text>
                        </View>
                        <Text style={styles.macroValueStat}>{report.totals?.protein}g</Text>
                        <View style={styles.progressBg}>
                            <View style={[styles.progressBar, { width: '75%', backgroundColor: LIGHT_COLORS.accentPrimary }]} />
                        </View>
                    </View>

                    <View style={styles.macroCard}>
                        <View style={styles.macroHeader}>
                            <View style={[styles.iconBox, { backgroundColor: '#fffbeb' }]}>
                                <Text style={styles.macroStatIcon}>💧</Text>
                            </View>
                            <Text style={styles.macroCardLabel}>Fat</Text>
                        </View>
                        <Text style={styles.macroValueStat}>{report.totals?.fat}g</Text>
                        <View style={styles.progressBg}>
                            <View style={[styles.progressBar, { width: '45%', backgroundColor: '#f59e0b' }]} />
                        </View>
                    </View>
                </View>

                <View style={[styles.card, styles.carbsCard]}>
                    <View style={styles.carbsInfo}>
                        <View style={[styles.iconBox, { backgroundColor: '#eff6ff' }]}>
                            <Text style={styles.macroStatIcon}>🌾</Text>
                        </View>
                        <View>
                            <Text style={styles.macroCardLabel}>Carbs</Text>
                            <Text style={styles.carbsSub}>Complex sources detected</Text>
                        </View>
                    </View>
                    <Text style={styles.macroValueStat}>{report.totals?.carbs}g</Text>
                </View>

                {/* Health Insights Section */}
                {report.healthInsights && (
                    <View style={styles.insightsSection}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>HEALTH INSIGHTS</Text>
                            <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(report.healthInsights.healthScore) }]}>
                                <Text style={styles.scoreText}>{report.healthInsights.healthScore}/10</Text>
                            </View>
                        </View>

                        <View style={styles.insightStatsRow}>
                            <View style={styles.insightCard}>
                                <Text style={styles.insightEmoji}>⚖️</Text>
                                <Text style={styles.insightLabel}>Weight Impact</Text>
                                <Text style={[styles.insightValue, { color: getImpactColor(report.healthInsights.weightImpact) }]}>
                                    {report.healthInsights.weightImpact?.toUpperCase()}
                                </Text>
                                <Text style={styles.insightExplanation}>{report.healthInsights.weightExplanation}</Text>
                            </View>

                            <View style={styles.insightCard}>
                                <Text style={styles.insightEmoji}>🥩</Text>
                                <Text style={styles.insightLabel}>Muscle Impact</Text>
                                <Text style={[styles.insightValue, { color: getImpactColor(report.healthInsights.muscleImpact) }]}>
                                    {report.healthInsights.muscleImpact?.toUpperCase()}
                                </Text>
                                <Text style={styles.insightExplanation}>{report.healthInsights.muscleExplanation}</Text>
                            </View>
                        </View>

                        {/* Tips & Recommendations */}
                        {report.healthInsights.recommendations?.length > 0 && (
                            <View style={styles.recommendationsCard}>
                                <Text style={styles.tipsTitle}>🔥 Expert Suggestions</Text>
                                {report.healthInsights.recommendations.map((tip: string, i: number) => (
                                    <View key={i} style={styles.tipRow}>
                                        <Text style={styles.tipDot}>•</Text>
                                        <Text style={styles.tipText}>{tip}</Text>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Warnings */}
                        {report.healthInsights.warnings?.length > 0 && (
                            <View style={[styles.recommendationsCard, { borderColor: '#fee2e2', backgroundColor: '#fef2f2' }]}>
                                <Text style={[styles.tipsTitle, { color: '#991b1b' }]}>⚠️ Health Warnings</Text>
                                {report.healthInsights.warnings.map((warning: string, i: number) => (
                                    <View key={i} style={styles.tipRow}>
                                        <Text style={[styles.tipDot, { color: '#991b1b' }]}>•</Text>
                                        <Text style={[styles.tipText, { color: '#991b1b' }]}>{warning}</Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}

                {/* Detected Items */}
                <Text style={styles.sectionTitleItems}>DETECTED ITEMS</Text>
                <View style={styles.itemsList}>
                    {report.items?.map((item: any, index: number) => (
                        <View key={index} style={styles.itemRow}>
                            <View style={styles.itemImagePlaceholder}>
                                <Text style={styles.itemEmoji}>🍽️</Text>
                            </View>
                            <View style={styles.itemMainInfo}>
                                <View style={styles.itemHeaderRow}>
                                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                                    <Text style={styles.itemCal}>{item.calories} kcal</Text>
                                </View>
                                <Text style={styles.itemPortion}>{item.portion}</Text>
                                <View style={styles.tagsRow}>
                                    {getFoodTags(item).map((tag: any, i: number) => (
                                        <View key={i} style={[styles.tag, { backgroundColor: tag.color + '10' }]}>
                                            <Text style={[styles.tagText, { color: tag.color }]}>{tag.label.toUpperCase()}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>
                            <TouchableOpacity>
                                <Text style={styles.rowEditIcon}>✎</Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                {/* AI Disclaimer */}
                <View style={styles.disclaimer}>
                    <Text style={styles.infoIcon}>ⓘ</Text>
                    <Text style={styles.disclaimerText}>
                        Estimates based on Gemini AI analysis. Please verify portion sizes for the most accurate tracking.
                    </Text>
                </View>

                {/* Extra padding for sticky footer */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Sticky Bottom Actions */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                <TouchableOpacity
                    style={styles.retakeButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.retakeButtonText}>📸 Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    <Text style={styles.saveButtonText}>✓ Save to Log</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f6f8f6',
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: LIGHT_SPACING.lg,
        paddingTop: 0, // Managed via insets
        paddingBottom: 15,
        backgroundColor: '#f6f8f6',
        zIndex: 10,
    },
    roundButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    backIcon: { fontSize: 24, color: '#0d1b12', fontWeight: '300' },
    shareIcon: { fontSize: 14, color: '#0d1b12' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#0d1b12', flex: 1, textAlign: 'center' },

    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: LIGHT_SPACING.lg },

    heroCard: {
        width: '100%',
        aspectRatio: 4 / 3,
        borderRadius: LIGHT_RADIUS.lg,
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        backgroundColor: '#e0e7e3',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    badge: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    badgeText: { fontSize: 12, fontWeight: '700', color: '#0d1b12' },
    heroTextContainer: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
    },
    uploadTime: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '500', marginBottom: 4 },
    heroHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    mealTitle: { color: '#ffffff', fontSize: 24, fontWeight: '800', flex: 1 },
    editHeroButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editIcon: { color: '#ffffff', fontSize: 16 },

    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        marginTop: 24,
        marginBottom: 16,
    },
    sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0d1b12' },
    dailyGoal: { fontSize: 13, color: '#9ca3af', fontWeight: '600' },

    card: {
        backgroundColor: '#ffffff',
        borderRadius: LIGHT_RADIUS.lg,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    calorieCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardLabel: { fontSize: 14, color: '#6b7280', fontWeight: '500', marginBottom: 8 },
    calorieValueRow: { flexDirection: 'row', alignItems: 'baseline' },
    calorieValue: { fontSize: 44, fontWeight: '800', color: '#0d1b12', letterSpacing: -1 },
    calorieUnit: { fontSize: 18, color: '#9ca3af', marginLeft: 4, fontWeight: '500' },
    onTrackRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
    trackDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: LIGHT_COLORS.accentPrimary, marginRight: 8 },
    trackText: { fontSize: 12, fontWeight: '800', color: LIGHT_COLORS.accentPrimary, letterSpacing: 0.5 },

    ringContainer: { position: 'relative', width: 100, height: 100, justifyContent: 'center', alignItems: 'center' },
    ringIconContainer: { position: 'absolute', top: 35, left: 35, width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
    fireIcon: { fontSize: 24 },

    macroGrid: { flexDirection: 'row', gap: 12, marginTop: 12 },
    macroCard: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: LIGHT_RADIUS.lg,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    macroHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    iconBox: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    macroStatIcon: { fontSize: 14 },
    macroCardLabel: { fontSize: 14, fontWeight: '700', color: '#0d1b12' },
    macroValueStat: { fontSize: 24, fontWeight: '800', color: '#0d1b12' },
    progressBg: { width: '100%', height: 6, backgroundColor: '#f3f4f6', borderRadius: 3, marginTop: 12, overflow: 'hidden' },
    progressBar: { height: '100%', borderRadius: 3 },

    carbsCard: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    carbsInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    carbsSub: { fontSize: 12, color: '#6b7280' },

    sectionTitleItems: { fontSize: 16, fontWeight: '800', color: '#0d1b12', marginTop: 32, marginBottom: 16 },
    itemsList: { gap: 12 },
    itemRow: {
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: LIGHT_RADIUS.lg,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    itemImagePlaceholder: {
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemEmoji: { fontSize: 24 },
    itemMainInfo: { flex: 1 },
    itemHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
    itemName: { fontSize: 17, fontWeight: '700', color: '#0d1b12', flex: 1 },
    itemCal: { fontSize: 14, fontWeight: '700', color: LIGHT_COLORS.accentPrimary },
    itemPortion: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    tagText: { fontSize: 10, fontWeight: '800' },
    rowEditIcon: { color: '#d1d5db', fontSize: 18 },

    disclaimer: {
        marginTop: 16,
        padding: 12,
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        borderRadius: 12,
        flexDirection: 'row',
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(59, 130, 246, 0.1)',
    },
    infoIcon: { fontSize: 18, color: '#3b82f6' },
    disclaimerText: { fontSize: 12, color: '#1e40af', flex: 1, lineHeight: 18 },

    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        paddingBottom: 0, // Will be overridden in component
        flexDirection: 'row',
        gap: 12,
        backgroundColor: '#f6f8f6',
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.03)',
    },
    retakeButton: {
        flex: 1,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    retakeButtonText: { fontSize: 16, fontWeight: '700', color: '#0d1b12' },
    saveButton: {
        flex: 2,
        height: 56,
        borderRadius: 28,
        backgroundColor: LIGHT_COLORS.accentPrimary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: LIGHT_COLORS.accentPrimary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    saveButtonText: { fontSize: 16, fontWeight: '700', color: '#ffffff' },

    // New Detail Styles
    descriptionCard: {
        backgroundColor: '#ffffff',
        borderRadius: LIGHT_RADIUS.lg,
        padding: 16,
        marginTop: 16,
        borderLeftWidth: 4,
        borderLeftColor: LIGHT_COLORS.accentPrimary,
    },
    descriptionTitle: { fontSize: 14, fontWeight: '800', color: LIGHT_COLORS.accentPrimary, marginBottom: 4, letterSpacing: 0.5 },
    descriptionText: { fontSize: 14, color: '#4b5563', lineHeight: 20 },

    insightsSection: { marginTop: 24 },
    scoreBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
    scoreText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },

    insightStatsRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
    insightCard: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: LIGHT_RADIUS.lg,
        padding: 16,
        alignItems: 'center',
    },
    insightEmoji: { fontSize: 24, marginBottom: 8 },
    insightLabel: { fontSize: 12, color: '#6b7280', fontWeight: '600', marginBottom: 2 },
    insightValue: { fontSize: 14, fontWeight: '800', marginBottom: 8 },
    insightExplanation: { fontSize: 11, color: '#6b7280', textAlign: 'center', lineHeight: 15 },

    recommendationsCard: {
        backgroundColor: '#ffffff',
        borderRadius: LIGHT_RADIUS.lg,
        padding: 16,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    tipsTitle: { fontSize: 15, fontWeight: '800', color: '#0d1b12', marginBottom: 12 },
    tipRow: { flexDirection: 'row', marginBottom: 8 },
    tipDot: { fontSize: 18, color: LIGHT_COLORS.accentPrimary, marginRight: 8, marginTop: -2 },
    tipText: { fontSize: 13, color: '#4b5563', flex: 1, lineHeight: 18 },
});
