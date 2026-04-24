import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Platform,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LIGHT_COLORS, LIGHT_SPACING, LIGHT_RADIUS } from '../constants/lightTheme';
import { getCurrentUser, updateUser } from '../services/auth';
import { getOfferings, purchasePackage } from '../services/purchase';
import { PurchasesPackage } from 'react-native-purchases';

const { width } = Dimensions.get('window');

const PREMIUM_FEATURES = [
    {
        icon: 'camera-iris',
        title: 'Unlimited AI Scans',
        description: 'No daily limits on food analysis.',
    },
    {
        icon: 'calendar-check',
        title: 'Pro Meal Planning',
        description: 'Advanced weekly plans tailored to you.',
    },
    {
        icon: 'swap-horizontal',
        title: 'Elite Smart Swaps',
        description: 'Discover the absolute best alternatives.',
    },
    {
        icon: 'robot-happy',
        title: '24/7 Priority Bot',
        description: 'Get instant answers from NutriBot anytime.',
    },
];

export default function PremiumScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
    const [offerings, setOfferings] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    React.useEffect(() => {
        loadPriceData();
    }, []);

    const loadPriceData = async () => {
        const currentOfferings = await getOfferings();
        if (currentOfferings) {
            setOfferings(currentOfferings);
        }
    };

    const handleSubscribe = async () => {
        if (!offerings) {
            Alert.alert("Wait", "We're loading current prices. Please try again in a moment.");
            return;
        }

        const packageToBuy = selectedPlan === 'monthly' 
            ? offerings.monthly 
            : offerings.annual;

        if (!packageToBuy) {
            Alert.alert("Unavailable", "The selected plan is not currently available in the Store.");
            return;
        }

        setIsLoading(true);
        try {
            const success = await purchasePackage(packageToBuy);
            if (success) {
                Alert.alert(
                    "🌟 Upgrade Successful",
                    "Welcome to NutriBot Pro! You now have unlimited access to all premium features.",
                    [{ text: "Awesome!", onPress: () => navigation.goBack() }]
                );
            }
        } catch (error) {
            console.error('Upgrade error:', error);
            Alert.alert("Error", "Failed to process purchase. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0d1b12', '#1a2e21', '#0d1b12']}
                style={StyleSheet.absoluteFill}
            />
            
            {/* Background Decorative Circles */}
            <View style={[styles.glowCircle, { top: -100, right: -100, backgroundColor: '#13ec5b20' }]} />
            <View style={[styles.glowCircle, { bottom: -100, left: -100, backgroundColor: '#ffd70010' }]} />

            <ScrollView 
                contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <TouchableOpacity 
                    style={styles.closeButton} 
                    onPress={() => navigation.goBack()}
                >
                    <MaterialCommunityIcons name="close" size={24} color="#ffffff80" />
                </TouchableOpacity>

                <View style={styles.header}>
                    <View style={styles.proBadge}>
                        <Text style={styles.proBadgeText}>PRO</Text>
                    </View>
                    <Text style={styles.title}>NutriBot Premium</Text>
                    <Text style={styles.subtitle}>Unlock the full potential of your nutrition journey</Text>
                </View>

                {/* Features */}
                <View style={styles.featuresContainer}>
                    {PREMIUM_FEATURES.map((feature, index) => (
                        <View key={index} style={styles.featureItem}>
                            <View style={styles.featureIcon}>
                                <MaterialCommunityIcons name={feature.icon as any} size={24} color={LIGHT_COLORS.accentPrimary} />
                            </View>
                            <View style={styles.featureText}>
                                <Text style={styles.featureTitle}>{feature.title}</Text>
                                <Text style={styles.featureDescription}>{feature.description}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Plans */}
                <View style={styles.plansContainer}>
                    <TouchableOpacity 
                        style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardActive]}
                        onPress={() => setSelectedPlan('monthly')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.planHeader}>
                            <Text style={styles.planTitle}>Monthly</Text>
                            <Text style={styles.planPrice}>
                                {offerings?.monthly?.product.priceString || '₹299'}
                            </Text>
                        </View>
                        <Text style={styles.planSubtitle}>Full access, billed monthly</Text>
                        {selectedPlan === 'monthly' && (
                            <View style={styles.checkCircle}>
                                <MaterialCommunityIcons name="check" size={16} color="#000" />
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.planCard, selectedPlan === 'yearly' && styles.planCardActive, styles.yearlyCard]}
                        onPress={() => setSelectedPlan('yearly')}
                        activeOpacity={0.8}
                    >
                        <View style={styles.bestValueBadge}>
                            <Text style={styles.bestValueText}>BEST VALUE - SAVE 58%</Text>
                        </View>
                        <View style={styles.planHeader}>
                            <View>
                                <Text style={styles.planTitle}>Yearly</Text>
                                <Text style={styles.planPrice}>
                                    {offerings?.annual?.product.priceString || '₹1,499'}
                                </Text>
                            </View>
                            <View style={styles.perMonthBadge}>
                                <Text style={styles.perMonthText}>
                                    {offerings?.annual ? `₹${Math.round(offerings.annual.product.price / 12)}/mo` : '₹125/mo'}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.planSubtitle}>Unlock everything for a full year</Text>
                        {selectedPlan === 'yearly' && (
                            <View style={[styles.checkCircle, { backgroundColor: LIGHT_COLORS.accentPrimary }]}>
                                <MaterialCommunityIcons name="check" size={16} color="#000" />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* CTA */}
                <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribe} activeOpacity={0.9}>
                    <LinearGradient
                        colors={[LIGHT_COLORS.accentPrimary, '#0db846']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                    >
                        <Text style={styles.subscribeText}>Start Pro Access</Text>
                        <MaterialCommunityIcons name="chevron-right" size={24} color="#000" />
                    </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.footerNote}>Cancel anytime. Secure checkout.</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0d1b12',
    },
    glowCircle: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        opacity: 0.5,
    },
    scrollContent: {
        paddingHorizontal: 24,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ffffff15',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'flex-end',
        marginBottom: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    proBadge: {
        backgroundColor: '#ffd700',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 16,
    },
    proBadgeText: {
        color: '#000',
        fontWeight: '900',
        fontSize: 12,
        letterSpacing: 1,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#ffffff80',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    featuresContainer: {
        marginBottom: 40,
        gap: 20,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff08',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ffffff10',
    },
    featureIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#13ec5b15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    featureDescription: {
        fontSize: 14,
        color: '#ffffff60',
    },
    plansContainer: {
        gap: 16,
        marginBottom: 40,
    },
    planCard: {
        backgroundColor: '#ffffff08',
        padding: 20,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#ffffff15',
        position: 'relative',
    },
    planCardActive: {
        borderColor: LIGHT_COLORS.accentPrimary,
        backgroundColor: '#13ec5b08',
    },
    yearlyCard: {
        borderWidth: 2.5,
    },
    bestValueBadge: {
        position: 'absolute',
        top: -12,
        right: 20,
        backgroundColor: LIGHT_COLORS.accentPrimary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    bestValueText: {
        color: '#000',
        fontWeight: '900',
        fontSize: 10,
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    planTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    planPrice: {
        fontSize: 24,
        fontWeight: '800',
        color: '#fff',
    },
    planSubtitle: {
        fontSize: 14,
        color: '#ffffff60',
    },
    perMonthBadge: {
        backgroundColor: '#ffffff10',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    perMonthText: {
        color: LIGHT_COLORS.accentPrimary,
        fontSize: 12,
        fontWeight: '700',
    },
    checkCircle: {
        position: 'absolute',
        bottom: 20,
        right: 24,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    subscribeButton: {
        marginBottom: 20,
        shadowColor: LIGHT_COLORS.accentPrimary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    gradientButton: {
        flexDirection: 'row',
        height: 64,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    subscribeText: {
        color: '#000',
        fontSize: 18,
        fontWeight: '800',
    },
    footerNote: {
        textAlign: 'center',
        color: '#ffffff40',
        fontSize: 12,
    },
});
