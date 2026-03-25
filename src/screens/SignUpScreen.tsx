import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { LIGHT_COLORS, LIGHT_SPACING, LIGHT_RADIUS } from '../constants/lightTheme';
import { signUp, validateEmail, validatePassword } from '../services/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SignUpScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SignUp'>;

interface Props {
    navigation: SignUpScreenNavigationProp;
}

export default function SignUpScreen({ navigation }: Props) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const insets = useSafeAreaInsets();

    const handleSignUp = async () => {
        setError('');

        if (!name || !email || !password || !confirmPassword) {
            setError('All fields are required');
            return;
        }

        if (!validateEmail(email)) {
            setError('Please enter a valid email address');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            setError(passwordValidation.message);
            return;
        }

        setLoading(true);
        try {
            await signUp(email, password, name);
            navigation.replace('ProfileSetup');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Sign up failed');
        } finally {
            setLoading(false);
        }
    };

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
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        { paddingTop: Math.max(insets.top, 60), paddingBottom: Math.max(insets.bottom, 40) }
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Logo Section */}
                    <View style={styles.logoContainer}>
                        <View style={styles.logoIcon}>
                            <MaterialCommunityIcons name="leaf" size={24} color={LIGHT_COLORS.accentPrimary} />
                        </View>
                        <Text style={styles.logoText}>SmartFuel</Text>
                    </View>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>
                            Sign up to start tracking your nutrition and reach your health goals.
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        {/* Name Field */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name</Text>
                            <View style={styles.inputContainer}>
                                <MaterialCommunityIcons
                                    name="account-outline"
                                    size={22}
                                    color={LIGHT_COLORS.textMuted}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="John Doe"
                                    placeholderTextColor={LIGHT_COLORS.textPlaceholder}
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>
                        </View>

                        {/* Email Field */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email Address</Text>
                            <View style={styles.inputContainer}>
                                <MaterialCommunityIcons
                                    name="email-outline"
                                    size={22}
                                    color={LIGHT_COLORS.textMuted}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="hello@smartfuel.app"
                                    placeholderTextColor={LIGHT_COLORS.textPlaceholder}
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        {/* Password Field */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Password</Text>
                            <View style={styles.inputContainer}>
                                <MaterialCommunityIcons
                                    name="lock-outline"
                                    size={22}
                                    color={LIGHT_COLORS.textMuted}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Create password"
                                    placeholderTextColor={LIGHT_COLORS.textPlaceholder}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.eyeIcon}
                                >
                                    <MaterialCommunityIcons
                                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                                        size={22}
                                        color={LIGHT_COLORS.textMuted}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Confirm Password Field */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Confirm Password</Text>
                            <View style={styles.inputContainer}>
                                <MaterialCommunityIcons
                                    name="lock-check-outline"
                                    size={22}
                                    color={LIGHT_COLORS.textMuted}
                                    style={styles.inputIcon}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Re-enter password"
                                    placeholderTextColor={LIGHT_COLORS.textPlaceholder}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showConfirmPassword}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={styles.eyeIcon}
                                >
                                    <MaterialCommunityIcons
                                        name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                                        size={22}
                                        color={LIGHT_COLORS.textMuted}
                                    />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Error Message */}
                        {error ? (
                            <View style={styles.errorContainer}>
                                <MaterialCommunityIcons name="alert-circle-outline" size={20} color={LIGHT_COLORS.error} />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        {/* Action Button */}
                        <TouchableOpacity
                            style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
                            onPress={handleSignUp}
                            disabled={loading}
                        >
                            <Text style={styles.signUpButtonText}>
                                {loading ? 'Creating account...' : 'Sign Up'}
                            </Text>
                        </TouchableOpacity>

                        {/* Logic Link */}
                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.loginLink}>Log In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f6f8f6',
    },
    blurCircle: {
        position: 'absolute',
        borderRadius: 150,
        backgroundColor: LIGHT_COLORS.accentPrimary,
        opacity: 0.1,
    },
    blurCircleTop: {
        width: 300,
        height: 300,
        top: -50,
        right: -100,
    },
    blurCircleBottom: {
        width: 250,
        height: 250,
        bottom: -50,
        left: -80,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: LIGHT_SPACING.xxxl,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 40,
    },
    logoIcon: {
        width: 32,
        height: 32,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    logoText: {
        fontSize: 20,
        fontWeight: '700',
        color: LIGHT_COLORS.textPrimary,
        letterSpacing: -0.5,
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 36,
        fontWeight: '700',
        color: LIGHT_COLORS.textPrimary,
        marginBottom: 12,
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 16,
        color: LIGHT_COLORS.textSecondary,
        lineHeight: 24,
        fontWeight: '400',
    },
    form: {
        gap: 16,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: LIGHT_COLORS.textPrimary,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: LIGHT_COLORS.bgSecondary,
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 60,
        shadowColor: LIGHT_COLORS.textPrimary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: LIGHT_COLORS.textPrimary,
        fontWeight: '500',
    },
    eyeIcon: {
        padding: 8,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff1f2',
        padding: 12,
        borderRadius: 12,
        gap: 8,
    },
    errorText: {
        color: LIGHT_COLORS.error,
        fontSize: 14,
        fontWeight: '500',
    },
    signUpButton: {
        backgroundColor: LIGHT_COLORS.accentPrimary,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        shadowColor: LIGHT_COLORS.accentPrimary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 4,
    },
    signUpButtonDisabled: {
        opacity: 0.6,
    },
    signUpButtonText: {
        color: LIGHT_COLORS.textPrimary,
        fontSize: 18,
        fontWeight: '700',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16,
        alignItems: 'center',
    },
    loginText: {
        fontSize: 14,
        color: LIGHT_COLORS.textSecondary,
    },
    loginLink: {
        fontSize: 14,
        color: LIGHT_COLORS.textPrimary,
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
});
