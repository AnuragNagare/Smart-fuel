import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LoadingScreen from '../components/LoadingScreen';
import { getMealHistory, MealRecord } from '../services/history';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, UserProfile } from '../types';
import { LIGHT_COLORS, LIGHT_SPACING, LIGHT_RADIUS } from '../constants/lightTheme';
import { getUserProfile, getBMI } from '../services/storage';
import { scheduleLocalNotification } from '../services/notification';
import { getCurrentUser, User } from '../services/auth';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
    navigation: HomeScreenNavigationProp;
}

export default function HomeScreen({ navigation }: Props) {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [authUser, setAuthUser] = useState<User | null>(null);
    const [bmi, setBmi] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [history, setHistory] = useState<MealRecord[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const insets = useSafeAreaInsets();

    useFocusEffect(
        React.useCallback(() => {
            loadUserData();
        }, [])
    );

    const loadUserData = async () => {
        try {
            const profile = await getUserProfile();
            const savedBmi = await getBMI();
            const currentUser = await getCurrentUser();

            if (currentUser) {
                // Ensure usageStats always has a safe default (may be undefined for new users)
                if (!currentUser.usageStats) {
                    currentUser.usageStats = {
                        scansThisWeek: 0,
                        scansWeekStartDate: new Date().toISOString(),
                        scansToday: 0,
                        lastScanDate: new Date().toISOString(),
                        chatMessagesThisWeek: 0,
                        swapsToday: 0,
                        swapsDayDate: new Date().toISOString(),
                    };
                }

                // Reset daily scans if it's a new day
                const today = new Date().toDateString();
                const lastScanDate = currentUser.usageStats.lastScanDate
                    ? new Date(currentUser.usageStats.lastScanDate).toDateString()
                    : '';

                if (today !== lastScanDate) {
                    currentUser.usageStats.scansToday = 0;
                    currentUser.usageStats.lastScanDate = new Date().toISOString();
                    const { updateUser } = await import('../services/auth');
                    await updateUser(currentUser);
                }

                loadHistory(currentUser.id);
            }

            setUserProfile(profile);
            setBmi(savedBmi);
            setAuthUser(currentUser);
        } catch (error) {
            console.error('Load user data error:', error);
        }
    };

    const loadHistory = async (userId: string) => {
        setIsLoadingHistory(true);
        try {
            const historyData = await getMealHistory(userId, 5); // Fetch last 5 meals
            setHistory(historyData);
        } catch (error) {
            console.error('History load error:', error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const checkScanLimit = () => {
        if (!authUser) return false;
        if (authUser.isPremium) return true;
        
        if (authUser.usageStats.scansToday >= 3) {
            scheduleLocalNotification(
                "🚀 Daily Limit Reached",
                "You've used your 3 free scans for today. Upgrade to NutriBot Pro for unlimited elite analysis!"
            );
            Alert.alert(
                "🚀 Daily Limit Reached",
                "Free users get 3 scans per day. Upgrade to Pro for unlimited scans!",
                [
                    { text: "Maybe Later", style: "cancel" },
                    { text: "Go Pro", onPress: () => navigation.navigate('Premium') }
                ]
            );
            return false;
        }
        return true;
    };

    const handleCamera = () => {
        if (checkScanLimit()) {
            navigation.navigate('Camera');
        }
    };

    const handleGallery = async () => {
        // Check if user is authenticated — fall back to live Supabase check
        // to avoid false "login required" from async state not yet loaded
        let currentUser = authUser;
        if (!currentUser) {
            currentUser = await getCurrentUser();
        }
        if (!currentUser) {
            Alert.alert('Login Required', 'Please login to scan meals.');
            return;
        }
        // Sync state so the rest of the function can use it
        if (!authUser) setAuthUser(currentUser);

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'We need camera roll permissions to upload photos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7, // Higher quality for better AI vision analysis
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            // Show loading and analyze
            const imageUri = result.assets[0].uri;
            const base64Image = result.assets[0].base64;

            setIsAnalyzing(true);

            try {
                // Import necessary services
                const { analyzeFood } = await import('../services/api');
                const { getUserProfile, getBMI } = await import('../services/storage');
                const { updateUser } = await import('../services/auth');

                // Get user profile for personalized insights
                const profile = await getUserProfile();
                const userBMI = await getBMI();

                let userProfile = undefined;
                if (profile && userBMI) {
                    userProfile = {
                        ...profile,
                        bmi: userBMI,
                    };
                }

                // Analyze the image
                const report = await analyzeFood(base64Image, userProfile);

                // Increment scan count if not premium
                if (currentUser && !currentUser.isPremium) {
                    currentUser.usageStats.scansToday += 1;
                    currentUser.usageStats.lastScanDate = new Date().toISOString();
                    await updateUser(currentUser);
                    setAuthUser({ ...currentUser }); // update state too
                }

                // Navigate to results with actual data
                navigation.navigate('Results', {
                    report,
                    imageUri,
                });
            } catch (error) {
                console.error('Analysis error:', error);
                Alert.alert('Error', 'Failed to analyze image. Please try again.');
            } finally {
                setIsAnalyzing(false);
            }
        }
    };

    const handleGoPremium = () => {
        navigation.navigate('Premium');
    };

    return (
        <LinearGradient
            colors={[LIGHT_COLORS.bgPrimary, LIGHT_COLORS.bgGradientEnd]}
            style={styles.container}
        >
            {isAnalyzing && <LoadingScreen />}

            {/* Paywall Modal Removed */}

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
                    <Text style={styles.emoji}>🍽️</Text>
                    <Text style={styles.title}>NutriBot</Text>
                    <Text style={styles.subtitle}>AI-Powered Nutrition Analysis</Text>
                </View>

                {/* Premium Banner */}
                <TouchableOpacity 
                    style={[styles.premiumBanner, authUser?.isPremium && styles.premiumBannerHidden]} 
                    onPress={handleGoPremium}
                    activeOpacity={0.9}
                    disabled={authUser?.isPremium}
                >
                    <LinearGradient
                        colors={['#0d1b12', '#1a2e21']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.premiumGradient}
                    >
                        <View style={styles.premiumContent}>
                            <View style={styles.premiumTextContainer}>
                                <Text style={styles.premiumTitle}>
                                    {authUser?.isPremium ? 'NutriBot Pro Active' : 'NutriBot Pro'}
                                </Text>
                                <Text style={styles.premiumSubtitle}>
                                    {authUser?.isPremium ? 'Unlimited access enabled' : 'Get unlimited AI scans & pro plans'}
                                </Text>
                            </View>
                            <View style={[styles.premiumTag, authUser?.isPremium && { backgroundColor: '#ffd700' }]}>
                                <Text style={styles.premiumTagText}>
                                    {authUser?.isPremium ? 'ELITE' : 'UPGRADE'}
                                </Text>
                            </View>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                {userProfile ? (
                    <TouchableOpacity
                        style={styles.userBadge}
                        onPress={() => navigation.navigate('ProfileSetup')}
                    >
                        <View style={styles.userAvatar}>
                            <Text style={styles.avatarText}>👤</Text>
                        </View>
                        <View style={styles.userInfo}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={styles.userName}>{userProfile.name}</Text>
                                {authUser?.isPremium && (
                                    <View style={styles.proBadgeSmall}>
                                        <Text style={styles.proBadgeTextSmall}>PRO</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.userStats}>
                                {userProfile.height}{userProfile.heightUnit || 'cm'} • {userProfile.weight}{userProfile.weightUnit || 'kg'}
                            </Text>
                        </View>
                        {bmi && (
                            <View style={styles.userBmi}>
                                <Text style={styles.bmiValue}>{bmi}</Text>
                                <Text style={styles.bmiLabel}>BMI</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.registerCTA}
                        onPress={() => navigation.navigate('ProfileSetup')}
                    >
                        <Text style={styles.registerText}>
                            👤 Create your profile for personalized insights →
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Usage Statistics */}
                <View style={styles.usageSection}>
                    <View style={styles.usageHeader}>
                        <Text style={styles.usageTitle}>
                            {authUser?.isPremium ? 'PRO STATUS' : 'DAILY AI SCANS'}
                        </Text>
                        <Text style={[styles.usageCount, authUser?.isPremium && { color: '#ffd700' }]}>
                            {authUser?.isPremium ? 'Unlimited' : `${authUser?.usageStats?.scansToday || 0} / 3 Used`}
                        </Text>
                    </View>
                    <View style={styles.meterBackground}>
                        <LinearGradient
                            colors={authUser?.isPremium ? ['#ffd700', '#b8860b'] : [LIGHT_COLORS.accentPrimary, '#0db846']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[
                                styles.meterFill, 
                                { width: authUser?.isPremium ? '100%' : `${((authUser?.usageStats?.scansToday || 0) / 3) * 100}%` }
                            ]}
                        />
                    </View>
                    {!authUser?.isPremium && (
                        <TouchableOpacity onPress={handleGoPremium}>
                            <Text style={styles.usageHint}>
                                Upgrade to <Text style={styles.proLink}>Pro</Text> for unlimited elite analysis →
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>📸 CAPTURE YOUR MEAL</Text>

                    <View style={styles.uploadArea}>
                        <Text style={styles.uploadIcon}>📷</Text>
                        <Text style={styles.uploadText}>Tap to upload or take a photo</Text>
                        <Text style={styles.uploadHint}>Supports JPG, PNG</Text>
                    </View>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity style={styles.button} onPress={handleCamera}>
                            <Text style={styles.buttonText}>📷 Camera</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={handleGallery}>
                            <Text style={styles.buttonText}>📁 Upload</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {history.length > 0 && (
                    <View style={styles.historySection}>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.cardTitle}>🕐 RECENT MEALS</Text>
                            <TouchableOpacity>
                                <Text style={styles.viewAllText}>View All</Text>
                            </TouchableOpacity>
                        </View>

                        {history.map((meal) => (
                            <TouchableOpacity
                                key={meal.id}
                                style={styles.historyItem}
                                onPress={() => navigation.navigate('Results', {
                                    report: meal.report_data,
                                    imageUri: meal.image_url
                                })}
                            >
                                <View style={styles.historyIcon}>
                                    <Text style={styles.historyEmoji}>🍲</Text>
                                </View>
                                <View style={styles.historyInfo}>
                                    <Text style={styles.mealName}>{meal.meal_name}</Text>
                                    <Text style={styles.mealDate}>
                                        {new Date(meal.created_at!).toLocaleDateString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </Text>
                                </View>
                                <View style={styles.mealMacros}>
                                    <Text style={styles.mealCals}>{meal.calories} kcal</Text>
                                    <View style={[styles.scoreTag, {
                                        backgroundColor: meal.health_score >= 8 ? '#dcfce7' :
                                            meal.health_score >= 6 ? '#fef3c7' : '#fee2e2'
                                    }]}>
                                        <Text style={[styles.scoreTagText, {
                                            color: meal.health_score >= 8 ? '#166534' :
                                                meal.health_score >= 6 ? '#92400e' : '#991b1b'
                                        }]}>
                                            {meal.health_score}/10
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: LIGHT_SPACING.xl,
    },
    header: {
        alignItems: 'center',
        paddingTop: 0, // Managed via insets
        marginBottom: LIGHT_SPACING.xxxl,
    },
    emoji: {
        fontSize: 48,
        marginBottom: LIGHT_SPACING.sm,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: LIGHT_COLORS.accentPrimary,
        marginBottom: LIGHT_SPACING.xs,
    },
    subtitle: {
        fontSize: 16,
        color: LIGHT_COLORS.textSecondary,
    },
    userBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: LIGHT_COLORS.bgCard,
        padding: LIGHT_SPACING.md,
        borderRadius: LIGHT_RADIUS.lg,
        marginBottom: LIGHT_SPACING.xl,
        borderWidth: 1,
        borderColor: LIGHT_COLORS.borderColor,
    },
    userAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: LIGHT_COLORS.accentPrimary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 20,
    },
    userInfo: {
        flex: 1,
        marginLeft: LIGHT_SPACING.md,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: LIGHT_COLORS.textPrimary,
        marginBottom: 2,
    },
    userStats: {
        fontSize: 12,
        color: LIGHT_COLORS.textMuted,
    },
    userBmi: {
        alignItems: 'flex-end',
    },
    bmiValue: {
        fontSize: 20,
        fontWeight: '700',
        color: LIGHT_COLORS.accentPrimary,
    },
    bmiLabel: {
        fontSize: 10,
        color: LIGHT_COLORS.textMuted,
        textTransform: 'uppercase',
    },
    registerCTA: {
        backgroundColor: LIGHT_COLORS.bgCard,
        padding: LIGHT_SPACING.lg,
        borderRadius: LIGHT_RADIUS.lg,
        marginBottom: LIGHT_SPACING.xl,
        borderWidth: 1,
        borderColor: LIGHT_COLORS.borderColor,
        alignItems: 'center',
    },
    registerText: {
        color: LIGHT_COLORS.textSecondary,
        fontSize: 14,
    },
    usageSection: {
        backgroundColor: LIGHT_COLORS.bgCard,
        padding: LIGHT_SPACING.lg,
        borderRadius: LIGHT_RADIUS.lg,
        marginBottom: LIGHT_SPACING.xl,
        borderWidth: 1,
        borderColor: LIGHT_COLORS.borderColor,
    },
    usageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 10,
    },
    usageTitle: {
        fontSize: 10,
        fontWeight: '800',
        color: LIGHT_COLORS.textMuted,
        letterSpacing: 1,
    },
    usageCount: {
        fontSize: 14,
        fontWeight: '700',
        color: LIGHT_COLORS.textPrimary,
    },
    meterBackground: {
        height: 8,
        backgroundColor: '#e5e7eb',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 12,
    },
    meterFill: {
        height: '100%',
        borderRadius: 4,
    },
    usageHint: {
        fontSize: 11,
        color: LIGHT_COLORS.textSecondary,
        textAlign: 'center',
        fontWeight: '500',
    },
    proLink: {
        color: LIGHT_COLORS.accentPrimary,
        fontWeight: '800',
    },
    usageSectionBox: {
        marginBottom: LIGHT_SPACING.lg,
    },
    card: {
        backgroundColor: LIGHT_COLORS.bgCard,
        borderRadius: LIGHT_RADIUS.lg,
        padding: LIGHT_SPACING.xl,
        borderWidth: 1,
        borderColor: LIGHT_COLORS.borderColor,
    },
    cardTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: LIGHT_COLORS.textSecondary,
        marginBottom: LIGHT_SPACING.lg,
        letterSpacing: 0.5,
    },
    uploadArea: {
        alignItems: 'center',
        paddingVertical: LIGHT_SPACING.xxxl * 2,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: LIGHT_COLORS.borderColor,
        borderRadius: LIGHT_RADIUS.lg,
        backgroundColor: LIGHT_COLORS.bgCard,
        marginBottom: LIGHT_SPACING.lg,
    },
    uploadIcon: {
        fontSize: 48,
        marginBottom: LIGHT_SPACING.md,
        opacity: 0.6,
    },
    uploadText: {
        fontSize: 16,
        color: LIGHT_COLORS.textSecondary,
    },
    uploadHint: {
        fontSize: 12,
        color: LIGHT_COLORS.textMuted,
        marginTop: LIGHT_SPACING.sm,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: LIGHT_SPACING.md,
    },
    button: {
        flex: 1,
        backgroundColor: LIGHT_COLORS.bgCard,
        paddingVertical: LIGHT_SPACING.lg,
        borderRadius: LIGHT_RADIUS.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: LIGHT_COLORS.borderColor,
    },
    buttonText: {
        color: LIGHT_COLORS.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
    historySection: {
        marginTop: LIGHT_SPACING.xl,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: LIGHT_SPACING.lg,
    },
    viewAllText: {
        fontSize: 12,
        fontWeight: '700',
        color: LIGHT_COLORS.accentPrimary,
        letterSpacing: 0.5,
    },
    historyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: LIGHT_COLORS.bgCard,
        padding: LIGHT_SPACING.md,
        borderRadius: LIGHT_RADIUS.lg,
        marginBottom: LIGHT_SPACING.md,
        borderWidth: 1,
        borderColor: LIGHT_COLORS.borderColor,
    },
    historyIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    historyEmoji: {
        fontSize: 22,
    },
    historyInfo: {
        flex: 1,
        marginLeft: LIGHT_SPACING.md,
    },
    mealName: {
        fontSize: 16,
        fontWeight: '700',
        color: LIGHT_COLORS.textPrimary,
        marginBottom: 2,
    },
    mealDate: {
        fontSize: 12,
        color: LIGHT_COLORS.textMuted,
    },
    mealMacros: {
        alignItems: 'flex-end',
    },
    mealCals: {
        fontSize: 14,
        fontWeight: '800',
        color: LIGHT_COLORS.textPrimary,
        marginBottom: 4,
    },
    scoreTag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    scoreTagText: {
        fontSize: 10,
        fontWeight: '800',
    },
    premiumBanner: {
        marginBottom: LIGHT_SPACING.xl,
        borderRadius: LIGHT_RADIUS.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#13ec5b30',
        elevation: 4,
        shadowColor: '#13ec5b',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    premiumGradient: {
        padding: 16,
    },
    premiumContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    premiumTextContainer: {
        flex: 1,
    },
    premiumTitle: {
        color: '#13ec5b',
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 2,
    },
    premiumSubtitle: {
        color: '#ffffff80',
        fontSize: 12,
        fontWeight: '600',
    },
    premiumTag: {
        backgroundColor: '#13ec5b',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    premiumTagText: {
        color: '#000',
        fontSize: 10,
        fontWeight: '900',
    },
    premiumBannerHidden: {
        opacity: 0.8,
        borderColor: '#ffd70030',
    },
    proBadgeSmall: {
        backgroundColor: '#ffd700',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    proBadgeTextSmall: {
        fontSize: 8,
        fontWeight: '800',
        color: '#000',
    },
});
