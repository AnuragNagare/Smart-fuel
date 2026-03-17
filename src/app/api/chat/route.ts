import { Content } from '@google/generative-ai';
import { geminiManager } from '@/lib/gemini-manager';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { userMessage, chatHistory, userContext: profile } = await request.json();

        const contextPrompt = `You are FuelBot, an expert AI nutrition coach specializing in personalized meal planning and health advice. 
You provide practical, actionable advice using simple, homemade recipes with common household ingredients.

IMPORTANT GUIDELINES:
1. For meal plans: Provide 7-day detailed plans with breakfast, lunch, dinner, and snacks
2. Include homemade recipes using ingredients commonly found in households
3. For each recipe, list ingredients and simple cooking steps
4. Add helpful tips (like "drink warm lemon water in the morning")
5. Be specific and practical
6. Focus on Indian/local cuisine when relevant
7. Keep portions realistic and easy to prepare

${profile ? `
User Profile:
- Name: ${profile.name || 'User'}
- Age: ${profile.age || 'N/A'}
- Weight: ${profile.weight || 'N/A'} kg
- Height: ${profile.height || 'N/A'} cm
- BMI: ${profile.bmi || 'N/A'}
` : ''}
`;

        const contents: Content[] = [];

        // Add system context as first message
        contents.push({
            role: 'user',
            parts: [{ text: contextPrompt }]
        });

        contents.push({
            role: 'model',
            parts: [{ text: "Hello! I'm FuelBot, your AI nutrition coach. I'm here to help you with personalized meal plans, recipes, and nutrition advice. How can I assist you today?" }]
        });

        // Add history
        chatHistory.forEach((msg: any) => {
            contents.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            });
        });

        // Add current message
        contents.push({
            role: 'user',
            parts: [{ text: userMessage }]
        });

        const textResponse = await geminiManager.withRotation('gemini-1.5-flash', async (model) => {
            const result = await model.generateContent({
                contents,
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                },
            });
            return result.response.text();
        });

        return NextResponse.json({ text: textResponse });
    } catch (error: any) {
        console.error('FuelBot chat error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get response from FuelBot' },
            { status: 500 }
        );
    }
}
