import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LineChart, ProgressChart } from 'react-native-chart-kit';
import { LIGHT_COLORS, LIGHT_SPACING, LIGHT_RADIUS } from '../../constants/lightTheme';

const screenWidth = Dimensions.get('window').width;

export default function HealthInsightsScreen() {
    const [weightData] = useState({
        labels: ['Jan 1', 'Jan 8', 'Jan 15', 'Jan 22', 'Today'],
        datasets: [{
            data: [72, 71.5, 71, 70.8, 70.5],
        }],
    });

    const [calorieData] = useState({
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
            data: [1850, 2100, 1950, 2200, 1900, 2300, 1800],
        }],
    });

    const [goalProgress] = useState({
        labels: ['Protein', 'Calories', 'Workouts'],
        data: [0.85, 0.92, 0.71],
    });

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
                        Avg: 2,014 cal/day (Target: 2,000)
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
                <View style={styles.insightCard}>
                    <Text style={styles.insightIcon}>💪</Text>
                    <Text style={styles.insightTitle}>Protein Trend</Text>
                    <Text style={styles.insightText}>
                        Your protein intake is trending low. Average: 85g/day. Aim for 112g+ to maintain muscle during weight loss.
                    </Text>
                </View>

                <View style={styles.insightCard}>
                    <Text style={styles.insightIcon}>⚡</Text>
                    <Text style={styles.insightTitle}>Energy Pattern</Text>
                    <Text style={styles.insightText}>
                        You tend to eat high-calorie meals after 8 PM. Try moving dinner to 7 PM for better sleep quality.
                    </Text>
                </View>

                <View style={styles.insightCard}>
                    <Text style={styles.insightIcon}>🥗</Text>
                    <Text style={styles.insightTitle}>Nutrient Alert</Text>
                    <Text style={styles.insightText}>
                        Low Vitamin D intake detected (14 days). Add salmon, eggs, or fortified foods to your diet.
                    </Text>
                </View>

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
