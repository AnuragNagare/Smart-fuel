import { BACKEND_URL } from '../constants/theme';

const CHAT_API_URL = `${BACKEND_URL}/api/chat`;

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

export async function chatWithNutriBot(
    userMessage: string,
    chatHistory: ChatMessage[],
    userContext?: {
        name?: string;
        age?: string;
        weight?: string;
        height?: string;
        bmi?: string;
    }
): Promise<string> {
    try {
        const response = await fetch(CHAT_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userMessage,
                chatHistory,
                userContext
            }),
        });

        if (!response.ok) {
            throw new Error(`Chat service error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.text) {
            throw new Error('Invalid response from chat service');
        }

        // Strip out markdown bold/italic asterisks for cleaner mobile rendering
        return data.text.replace(/\*/g, '');
    } catch (error) {
        console.error('NutriBot chat error:', error);
        throw new Error('Failed to get response from NutriBot. Please try again.');
    }
}
