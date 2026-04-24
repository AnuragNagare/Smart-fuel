import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, UserProfile } from '../types';
import { LIGHT_COLORS, LIGHT_SPACING, LIGHT_RADIUS } from '../constants/lightTheme';
import { saveUserProfile, getUserProfile } from '../services/storage';
import { logout } from '../services/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ProfileSetupScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ProfileSetup'>;

interface Props {
    navigation: ProfileSetupScreenNavigationProp;
}

export default function ProfileSetupScreen({ navigation }: Props) {
    const [formData, setFormData] = useState<UserProfile>({
        name: '',
        age: '',
        location: '',
        height: '',
        weight: '',
        heightUnit: 'cm',
        weightUnit: 'kg',
    });
    const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
    const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
    const [hasExistingProfile, setHasExistingProfile] = useState(false);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const loadProfile = async () => {
            const profile = await getUserProfile();
            if (profile) {
                setHasExistingProfile(true);
                setFormData(profile);
                if (profile.heightUnit) setHeightUnit(profile.heightUnit);
                if (profile.weightUnit) setWeightUnit(profile.weightUnit);
            }
        };
        loadProfile();
    }, []);

    const updateField = (field: keyof UserProfile, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const convertHeight = (val: string, from: 'cm' | 'ft', to: 'cm' | 'ft') => {
        if (!val) return '';
        const num = parseFloat(val);
        if (isNaN(num)) return val;
        if (from === to) return val;
        if (to === 'ft') return (num / 30.48).toFixed(1);
        return (num * 30.48).toFixed(1);
    };

    const convertWeight = (val: string, from: 'kg' | 'lbs', to: 'kg' | 'lbs') => {
        if (!val) return '';
        const num = parseFloat(val);
        if (isNaN(num)) return val;
        if (from === to) return val;
        if (to === 'lbs') return (num * 2.20462).toFixed(1);
        return (num / 2.20462).toFixed(1);
    };

    const handleHeightUnitChange = (newUnit: 'cm' | 'ft') => {
        if (newUnit === heightUnit) return;
        const converted = convertHeight(formData.height, heightUnit, newUnit);
        setHeightUnit(newUnit);
        setFormData(prev => ({ ...prev, height: converted, heightUnit: newUnit }));
    };

    const handleWeightUnitChange = (newUnit: 'kg' | 'lbs') => {
        if (newUnit === weightUnit) return;
        const converted = convertWeight(formData.weight, weightUnit, newUnit);
        setWeightUnit(newUnit);
        setFormData(prev => ({ ...prev, weight: converted, weightUnit: newUnit }));
    };

    const calculateBMI = () => {
        if (formData.height && formData.weight) {
            let heightInM = 0;
            let weightInKg = 0;

            if (heightUnit === 'cm') {
                heightInM = parseFloat(formData.height) / 100;
            } else {
                heightInM = (parseFloat(formData.height) * 30.48) / 100;
            }

            if (weightUnit === 'kg') {
                weightInKg = parseFloat(formData.weight);
            } else {
                weightInKg = parseFloat(formData.weight) / 2.20462;
            }

            if (heightInM > 0) {
                return (weightInKg / (heightInM * heightInM)).toFixed(1);
            }
        }
        return null;
    };

    const handleSubmit = async () => {
        try {
            const dataToSave = {
                ...formData,
                heightUnit,
                weightUnit,
            };
            await saveUserProfile(dataToSave);
            if (navigation.canGoBack()) {
                navigation.goBack();
            } else {
                navigation.replace('Home');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
        }
    };

    const isFormValid =
        formData.name && formData.age && formData.location && formData.height && formData.weight;

    const bmi = calculateBMI();

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[LIGHT_COLORS.bgPrimary, LIGHT_COLORS.bgGradientEnd]}
                style={StyleSheet.absoluteFill}
            />

            {/* Decorative Blurry Circles */}
            <View style={[styles.blurCircle, styles.blurCircleTop]} />
            <View style={[styles.blurCircle, styles.blurCircleBottom]} />

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingTop: Math.max(insets.top, 60), paddingBottom: Math.max(insets.bottom, 40) }
                    ]}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        {hasExistingProfile && (
                            <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
                                <MaterialCommunityIcons name="close" size={24} color={LIGHT_COLORS.textPrimary} />
                            </TouchableOpacity>
                        )}
                        <View style={styles.logoIcon}>
                            <MaterialCommunityIcons name="account-details" size={32} color={LIGHT_COLORS.accentPrimary} />
                        </View>
                        <Text style={styles.title}>{hasExistingProfile ? 'Your Profile' : 'Complete Your Profile'}</Text>
                        <Text style={styles.subtitle}>{hasExistingProfile ? 'Update your stats and goals' : 'Help us personalize your nutrition insights'}</Text>
                    </View>

                    <View style={styles.formContainer}>
                        <Text style={styles.sectionTitle}>👤 PERSONAL INFORMATION</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name</Text>
                            <View style={styles.inputContainer}>
                                <MaterialCommunityIcons name="account-outline" size={22} color={LIGHT_COLORS.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your name"
                                    placeholderTextColor={LIGHT_COLORS.textPlaceholder}
                                    value={formData.name}
                                    onChangeText={(text) => updateField('name', text)}
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Age</Text>
                            <View style={styles.inputContainer}>
                                <MaterialCommunityIcons name="calendar-outline" size={22} color={LIGHT_COLORS.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your age"
                                    placeholderTextColor={LIGHT_COLORS.textPlaceholder}
                                    value={formData.age}
                                    onChangeText={(text) => updateField('age', text)}
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Location</Text>
                            <View style={styles.inputContainer}>
                                <MaterialCommunityIcons name="map-marker-outline" size={22} color={LIGHT_COLORS.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="City, Country"
                                    placeholderTextColor={LIGHT_COLORS.textPlaceholder}
                                    value={formData.location}
                                    onChangeText={(text) => updateField('location', text)}
                                />
                            </View>
                        </View>

                        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>📏 BODY METRICS</Text>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, styles.halfWidth]}>
                                <View style={styles.labelRow}>
                                    <Text style={styles.label}>Height</Text>
                                    <View style={styles.unitToggleContainer}>
                                        <TouchableOpacity
                                            style={[styles.unitBtn, heightUnit === 'cm' && styles.unitBtnActive]}
                                            onPress={() => handleHeightUnitChange('cm')}
                                        >
                                            <Text style={[styles.unitBtnText, heightUnit === 'cm' && styles.unitBtnTextActive]}>cm</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.unitBtn, heightUnit === 'ft' && styles.unitBtnActive]}
                                            onPress={() => handleHeightUnitChange('ft')}
                                        >
                                            <Text style={[styles.unitBtnText, heightUnit === 'ft' && styles.unitBtnTextActive]}>ft</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder={heightUnit === 'cm' ? "170" : "5.6"}
                                        placeholderTextColor={LIGHT_COLORS.textPlaceholder}
                                        value={formData.height}
                                        onChangeText={(text) => updateField('height', text)}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>

                            <View style={[styles.inputGroup, styles.halfWidth]}>
                                <View style={styles.labelRow}>
                                    <Text style={styles.label}>Weight</Text>
                                    <View style={styles.unitToggleContainer}>
                                        <TouchableOpacity
                                            style={[styles.unitBtn, weightUnit === 'kg' && styles.unitBtnActive]}
                                            onPress={() => handleWeightUnitChange('kg')}
                                        >
                                            <Text style={[styles.unitBtnText, weightUnit === 'kg' && styles.unitBtnTextActive]}>kg</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.unitBtn, weightUnit === 'lbs' && styles.unitBtnActive]}
                                            onPress={() => handleWeightUnitChange('lbs')}
                                        >
                                            <Text style={[styles.unitBtnText, weightUnit === 'lbs' && styles.unitBtnTextActive]}>lbs</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={styles.inputContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder={weightUnit === 'kg' ? "70" : "154"}
                                        placeholderTextColor={LIGHT_COLORS.textPlaceholder}
                                        value={formData.weight}
                                        onChangeText={(text) => updateField('weight', text)}
                                        keyboardType="numeric"
                                    />
                                </View>
                            </View>
                        </View>

                        {bmi && (
                            <View style={styles.bmiPreview}>
                                <View>
                                    <Text style={styles.bmiLabel}>Estimated BMI</Text>
                                    <Text style={styles.bmiStatus}>Normal Range</Text>
                                </View>
                                <Text style={styles.bmiValue}>{bmi}</Text>
                            </View>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[styles.submitButton, !isFormValid && styles.submitButtonDisabled]}
                        onPress={handleSubmit}
                        disabled={!isFormValid}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={isFormValid ? [LIGHT_COLORS.accentPrimary, '#059669'] : ['#d1d5db', '#9ca3af']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            <Text style={styles.submitText}>Continue</Text>
                            <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>

                    {hasExistingProfile && (
                        <TouchableOpacity
                            style={styles.logoutButton}
                            onPress={async () => {
                                try {
                                    await logout();
                                    navigation.reset({
                                        index: 0,
                                        routes: [{ name: 'Onboarding' }],
                                    });
                                } catch (error) {
                                    console.error('Logout failed:', error);
                                }
                            }}
                        >
                            <MaterialCommunityIcons name="logout" size={20} color="#EF4444" />
                            <Text style={styles.logoutText}>Sign Out</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: LIGHT_COLORS.bgPrimary,
    },
    blurCircle: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: LIGHT_COLORS.accentPrimary,
        opacity: 0.1,
    },
    blurCircleTop: {
        top: -100,
        right: -100,
    },
    blurCircleBottom: {
        bottom: -50,
        left: -100,
        backgroundColor: '#3b82f6',
        opacity: 0.05,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: LIGHT_SPACING.xl,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoIcon: {
        width: 72,
        height: 72,
        backgroundColor: '#fff',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 5,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: LIGHT_COLORS.textPrimary,
        marginBottom: 10,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: LIGHT_COLORS.textSecondary,
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 24,
    },
    formContainer: {
        width: '100%',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: LIGHT_COLORS.textMuted,
        marginBottom: 16,
        letterSpacing: 1.5,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: LIGHT_COLORS.textPrimary,
        marginLeft: 4,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    unitToggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: 10,
        padding: 2,
    },
    unitBtn: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    unitBtnActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    unitBtnText: {
        fontSize: 10,
        fontWeight: '700',
        color: LIGHT_COLORS.textMuted,
    },
    unitBtnTextActive: {
        color: LIGHT_COLORS.accentPrimary,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#e8ecef',
        height: 60,
        paddingHorizontal: 15,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: LIGHT_COLORS.textPrimary,
        fontWeight: '600',
    },
    row: {
        flexDirection: 'row',
        gap: 15,
    },
    halfWidth: {
        flex: 1,
    },
    bmiPreview: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        padding: 20,
        borderRadius: 24,
        marginTop: 10,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    bmiLabel: {
        fontSize: 14,
        color: LIGHT_COLORS.textSecondary,
        fontWeight: '600',
    },
    bmiStatus: {
        fontSize: 12,
        color: LIGHT_COLORS.accentPrimary,
        fontWeight: '800',
        marginTop: 2,
    },
    bmiValue: {
        fontSize: 32,
        fontWeight: '800',
        color: LIGHT_COLORS.accentPrimary,
    },
    submitButton: {
        marginTop: 40,
        shadowColor: LIGHT_COLORS.accentPrimary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    submitButtonDisabled: {
        shadowOpacity: 0,
        elevation: 0,
    },
    gradientButton: {
        flexDirection: 'row',
        height: 64,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    submitText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    closeButton: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: LIGHT_COLORS.bgCard,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: LIGHT_COLORS.borderColor,
        zIndex: 10,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        paddingVertical: 15,
        gap: 8,
    },
    logoutText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '700',
    },
});
