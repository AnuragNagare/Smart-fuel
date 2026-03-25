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
import LoadingScreen from '../components/LoadingScreen';
import { getMealHistory, MealRecord } from '../services/history';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, UserProfile } from '../types';
import { LIGHT_COLORS, LIGHT_SPACING, LIGHT_RADIUS } from '../constants/lightTheme';
import { getUserProfile, getBMI } from '../services/storage';
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

            setUserProfile(profile);
            setBmi(savedBmi);
            setAuthUser(currentUser);

            if (currentUser) {
                loadHistory(currentUser.id);
            }
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

    const handleCamera = () => {
        navigation.navigate('Camera');
    };

    const handleGallery = async () => {
        // Check if user is authenticated
        if (!authUser) {
            Alert.alert('Login Required', 'Please login to scan meals.');
            return;
        }

        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'We need camera roll permissions to upload photos.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.2, // Lower quality to keep payload small for Groq Vision
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            // Show loading and analyze
            const imageUri = result.assets[0].uri;
            const base64Image = result.assets[0].base64;

            setIsAnalyzing(true);

            try {
                // Import the analyzeFood function
                const { analyzeFood } = await import('../services/api');
                const { getUserProfile, getBMI } = await import('../services/storage');

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
                    <Text style={styles.title}>SmartFuel</Text>
                    <Text style={styles.subtitle}>AI-Powered Nutrition Analysis</Text>
                </View>

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
                                {/* PremiumBadge removed for free release */}
                            </View>
                            <Text style={styles.userStats}>
                                {userProfile.height}cm • {userProfile.weight}kg
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

                {/* Usage Meters removed for free release */}

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
});
