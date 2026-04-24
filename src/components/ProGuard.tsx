import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LIGHT_COLORS, LIGHT_RADIUS, LIGHT_SPACING } from '../constants/lightTheme';

const { height, width } = Dimensions.get('window');

interface ProGuardProps {
    isPremium: boolean;
    onUpgrade: () => void;
    featureName: string;
    children: React.ReactNode;
}

export default function ProGuard({ isPremium, onUpgrade, featureName, children }: ProGuardProps) {
    if (isPremium) {
        return <>{children}</>;
    }

    return (
        <View style={styles.container}>
            {/* Blurred/Grayed out preview of content */}
            <View style={styles.contentBlur} pointerEvents="none">
                {children}
            </View>

            {/* Overlay */}
            <LinearGradient
                colors={['rgba(246, 248, 246, 0.7)', 'rgba(246, 248, 246, 0.95)', '#f6f8f6']}
                style={styles.overlay}
            >
                <View style={styles.lockCard}>
                    <View style={styles.iconCircle}>
                        <MaterialCommunityIcons name="lock" size={32} color={LIGHT_COLORS.accentPrimary} />
                    </View>
                    
                    <Text style={styles.title}>NutriBot Pro Feature</Text>
                    <Text style={styles.description}>
                        Unlock <Text style={styles.featureName}>{featureName}</Text> and take your nutrition to the next level.
                    </Text>

                    <TouchableOpacity 
                        style={styles.upgradeButton} 
                        onPress={onUpgrade}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[LIGHT_COLORS.accentPrimary, '#0db846']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            <Text style={styles.buttonText}>Unlock with NutriBot Pro</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <Text style={styles.priceNote}>Just ₹125/mo billed annually</Text>
                </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
    },
    contentBlur: {
        flex: 1,
        opacity: 0.3,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    lockCard: {
        backgroundColor: '#fff',
        width: '100%',
        padding: 32,
        borderRadius: 32,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        borderWidth: 1,
        borderColor: LIGHT_COLORS.borderColor,
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#13ec5b15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: LIGHT_COLORS.textPrimary,
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        color: LIGHT_COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 28,
    },
    featureName: {
        fontWeight: '800',
        color: LIGHT_COLORS.accentPrimary,
    },
    upgradeButton: {
        width: '100%',
        marginBottom: 16,
    },
    gradientButton: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '800',
    },
    priceNote: {
        fontSize: 12,
        color: LIGHT_COLORS.textMuted,
        fontWeight: '600',
    },
});
