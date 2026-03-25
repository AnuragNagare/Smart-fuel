import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    FlatList,
    Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { LIGHT_COLORS, LIGHT_SPACING, LIGHT_RADIUS } from '../constants/lightTheme';

type OnboardingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Onboarding'>;

interface Props {
    navigation: OnboardingScreenNavigationProp;
}

const { width } = Dimensions.get('window');

const slides = [
    {
        id: '1',
        title: 'Welcome to SmartFuel',
        subtitle: 'AI-Powered Nutrition Analyzer',
        emoji: '🍽️',
        description: 'Analyze your meals instantly with AI. Get calories, protein, fat, and carbs from a single photo.',
    },
    {
        id: '2',
        title: 'Smart Analysis',
        emoji: '🤖',
        description: 'Our AI identifies food items and calculates accurate nutritional information in seconds.',
    },
    {
        id: '3',
        title: 'Personalized Insights',
        emoji: '💡',
        description: 'Get personalized recommendations based on your BMI and health goals.',
    },
];

export default function OnboardingScreen({ navigation }: Props) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const insets = useSafeAreaInsets();

    const handleNext = () => {
        if (currentIndex < slides.length - 1) {
            const nextIndex = currentIndex + 1;
            flatListRef.current?.scrollToIndex({ index: nextIndex });
            setCurrentIndex(nextIndex);
        } else {
            navigation.replace('Login');
        }
    };

    const handleSkip = () => {
        navigation.replace('Login');
    };

    const renderSlide = ({ item }: { item: typeof slides[0] }) => (
        <View style={styles.slide}>
            <View style={styles.emojiContainer}>
                <Text style={styles.emoji}>{item.emoji}</Text>
                <View style={styles.emojiBlur} />
            </View>
            <Text style={styles.slideTitle}>{item.title}</Text>
            {item.subtitle && <Text style={styles.slideSubtitle}>{item.subtitle}</Text>}
            <Text style={styles.description}>{item.description}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[LIGHT_COLORS.bgPrimary, LIGHT_COLORS.bgGradientEnd]}
                style={StyleSheet.absoluteFill}
            />

            {/* Decorative Blurry Circles */}
            <View style={[styles.blurCircle, styles.blurCircleTop]} />
            <View style={[styles.blurCircle, styles.blurCircleBottom]} />

            <FlatList
                ref={flatListRef}
                data={slides}
                renderItem={renderSlide}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(index);
                }}
                keyExtractor={(item) => item.id}
            />

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 40) }]}>
                <View style={styles.pagination}>
                    {slides.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                index === currentIndex && styles.dotActive,
                            ]}
                        />
                    ))}
                </View>

                <View style={styles.buttonRow}>
                    <TouchableOpacity onPress={handleSkip} style={styles.skipButton} activeOpacity={0.7}>
                        <Text style={styles.skipText}>Skip</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={handleNext} style={styles.nextButton} activeOpacity={0.8}>
                        <LinearGradient
                            colors={[LIGHT_COLORS.accentPrimary, '#059669']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.gradientButton}
                        >
                            <Text style={styles.nextText}>
                                {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
                            </Text>
                            <MaterialCommunityIcons
                                name={currentIndex === slides.length - 1 ? 'rocket-launch' : 'arrow-right'}
                                size={20}
                                color="#fff"
                            />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
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
    slide: {
        width,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emojiContainer: {
        width: 140,
        height: 140,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 5,
        position: 'relative',
    },
    emojiBlur: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: LIGHT_COLORS.accentPrimary,
        opacity: 0.2,
        borderRadius: 40,
        zIndex: -1,
    },
    emoji: {
        fontSize: 70,
    },
    slideTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: LIGHT_COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: 12,
        letterSpacing: -1,
    },
    slideSubtitle: {
        fontSize: 18,
        fontWeight: '700',
        color: LIGHT_COLORS.accentPrimary,
        textAlign: 'center',
        marginBottom: 20,
    },
    description: {
        fontSize: 16,
        color: LIGHT_COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 26,
        paddingHorizontal: 10,
    },
    footer: {
        paddingHorizontal: 30,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 30,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#e2e8f0',
        marginHorizontal: 4,
    },
    dotActive: {
        width: 24,
        backgroundColor: LIGHT_COLORS.accentPrimary,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 15,
    },
    skipButton: {
        flex: 1,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    skipText: {
        color: LIGHT_COLORS.textSecondary,
        fontSize: 16,
        fontWeight: '700',
    },
    nextButton: {
        flex: 2,
        shadowColor: LIGHT_COLORS.accentPrimary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    gradientButton: {
        height: 60,
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    nextText: {
        color: '#ffffff',
        fontSize: 17,
        fontWeight: '800',
    },
});
