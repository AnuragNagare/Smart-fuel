import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { LIGHT_COLORS, LIGHT_SPACING, LIGHT_RADIUS } from '../../constants/lightTheme';
import { chatWithFuelBot } from '../../services/fuelbot';
import { getUserProfile, getBMI } from '../../services/storage';
import { getCurrentUser, User } from '../../services/auth';
// Features fully free for this version

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
}

export default function FuelBotScreen() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "Hi! I'm FuelBot, your AI nutrition coach. I've analyzed your eating patterns and I'm here to help you reach your health goals. How can I assist you today?",
            sender: 'bot',
            timestamp: new Date(),
        },
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const [userContext, setUserContext] = useState<any>(null);
    const [authUser, setAuthUser] = useState<User | null>(null);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const profile = await getUserProfile();
            const bmi = await getBMI();
            const currentUser = await getCurrentUser();

            if (profile) {
                setUserContext({
                    name: profile.name,
                    age: profile.age,
                    weight: profile.weight,
                    height: profile.height,
                    bmi: bmi || undefined,
                });
            }

            setAuthUser(currentUser);
        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    };

    const quickActions = [
        '📊 How am I doing?',
        '💪 7-day muscle gain plan',
        '🔥 Weight loss meal plan',
        '🥗 High protein meals',
    ];

    const sendMessage = async () => {
        if (!inputText.trim()) return;

        // Check if user is authenticated
        if (!authUser) {
            Alert.alert('Login Required', 'Please login to chat with FuelBot.');
            return;
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputText,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        const currentInput = inputText;
        setInputText('');
        setIsTyping(true);

        try {
            // Build chat history for API
            const chatHistory = messages.map(msg => ({
                role: msg.sender === 'user' ? ('user' as const) : ('model' as const),
                text: msg.text,
            }));

            // Get AI response
            const aiResponse = await chatWithFuelBot(currentInput, chatHistory, userContext);

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: aiResponse,
                sender: 'bot',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            console.error('FuelBot error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
                sender: 'bot',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };


    const handleQuickAction = (action: string) => {
        const cleanAction = action.substring(action.indexOf(' ') + 1); // Remove emoji
        setInputText(cleanAction);
    };

    return (
        <LinearGradient
            colors={[LIGHT_COLORS.bgPrimary, LIGHT_COLORS.bgGradientEnd]}
            style={styles.container}
        >
            {/* Paywall Modal Removed */}

            <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
                <View style={styles.logoIcon}>
                    <Text style={styles.logoEmoji}>🤖</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>FuelBot</Text>
                    <Text style={styles.headerSubtitle}>Your AI Nutrition Coach</Text>
                </View>
            </View>

            {/* Usage Meter removed for free release */}

            <KeyboardAvoidingView
                style={styles.chatContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={90}
            >
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={styles.messagesContent}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
                >
                    {messages.map((message) => (
                        <View
                            key={message.id}
                            style={[
                                styles.messageBubble,
                                message.sender === 'user' ? styles.userBubble : styles.botBubble,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.messageText,
                                    message.sender === 'user' ? styles.userText : styles.botText,
                                ]}
                            >
                                {message.text}
                            </Text>
                            <Text
                                style={[
                                    styles.timestamp,
                                    message.sender === 'user' ? styles.userTimestamp : styles.botTimestamp,
                                ]}
                            >
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
                    ))}

                    {isTyping && (
                        <View style={[styles.messageBubble, styles.botBubble]}>
                            <ActivityIndicator size="small" color={LIGHT_COLORS.accentPrimary} />
                            <Text style={styles.typingText}>FuelBot is typing...</Text>
                        </View>
                    )}
                </ScrollView>

                {/* Quick Actions */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.quickActionsContainer}
                >
                    {quickActions.map((action, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.quickActionChip}
                            onPress={() => handleQuickAction(action)}
                        >
                            <Text style={styles.quickActionText}>{action}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Input Area */}
                <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                    <TextInput
                        style={styles.input}
                        placeholder="Ask FuelBot anything..."
                        placeholderTextColor={LIGHT_COLORS.textPlaceholder}
                        value={inputText}
                        onChangeText={setInputText}
                        multiline
                        maxLength={500}
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, (!inputText.trim() || isTyping) && styles.sendButtonDisabled]}
                        onPress={sendMessage}
                        disabled={!inputText.trim() || isTyping}
                    >
                        <Text style={styles.sendButtonText}>➤</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
    usageSection: {
        paddingHorizontal: LIGHT_SPACING.xl,
        marginBottom: LIGHT_SPACING.md,
    },
    chatContainer: {
        flex: 1,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: LIGHT_SPACING.xl,
        gap: LIGHT_SPACING.md,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: LIGHT_SPACING.md,
        borderRadius: LIGHT_RADIUS.md,
        marginBottom: LIGHT_SPACING.sm,
    },
    userBubble: {
        alignSelf: 'flex-end',
        backgroundColor: LIGHT_COLORS.accentPrimary,
    },
    botBubble: {
        alignSelf: 'flex-start',
        backgroundColor: LIGHT_COLORS.bgCard,
        borderWidth: 1,
        borderColor: LIGHT_COLORS.borderColor,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 20,
    },
    userText: {
        color: '#ffffff',
    },
    botText: {
        color: LIGHT_COLORS.textPrimary,
    },
    timestamp: {
        fontSize: 11,
        marginTop: LIGHT_SPACING.xs,
    },
    userTimestamp: {
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'right',
    },
    botTimestamp: {
        color: LIGHT_COLORS.textMuted,
    },
    typingText: {
        color: LIGHT_COLORS.textSecondary,
        fontStyle: 'italic',
        fontSize: 14,
        marginTop: LIGHT_SPACING.xs,
    },
    quickActionsContainer: {
        paddingHorizontal: LIGHT_SPACING.xl,
        paddingVertical: LIGHT_SPACING.md,
        maxHeight: 60,
    },
    quickActionChip: {
        backgroundColor: LIGHT_COLORS.bgCard,
        paddingHorizontal: LIGHT_SPACING.lg,
        paddingVertical: LIGHT_SPACING.sm,
        borderRadius: LIGHT_RADIUS.full,
        marginRight: LIGHT_SPACING.sm,
        borderWidth: 1,
        borderColor: LIGHT_COLORS.borderColor,
    },
    quickActionText: {
        color: LIGHT_COLORS.textPrimary,
        fontSize: 14,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: LIGHT_SPACING.lg,
        paddingBottom: 0, // Managed via insets
        gap: LIGHT_SPACING.md,
        backgroundColor: LIGHT_COLORS.bgCard,
        borderTopWidth: 1,
        borderTopColor: LIGHT_COLORS.borderColor,
    },
    input: {
        flex: 1,
        backgroundColor: LIGHT_COLORS.bgInput,
        borderRadius: LIGHT_RADIUS.md,
        paddingHorizontal: LIGHT_SPACING.lg,
        paddingVertical: LIGHT_SPACING.md,
        fontSize: 16,
        color: LIGHT_COLORS.textPrimary,
        maxHeight: 100,
        borderWidth: 1,
        borderColor: LIGHT_COLORS.borderColor,
    },
    sendButton: {
        width: 44,
        height: 44,
        backgroundColor: LIGHT_COLORS.accentPrimary,
        borderRadius: LIGHT_RADIUS.full,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        opacity: 0.5,
    },
    sendButtonText: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: '700',
    },
});
