import { groq } from '@/lib/groq-client';
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

        const messages: any[] = [];

        // Add system context
        messages.push({
            role: 'system',
            content: contextPrompt
        });

        messages.push({
            role: 'assistant',
            content: "Hello! I'm FuelBot, your AI nutrition coach. I'm here to help you with personalized meal plans, recipes, and nutrition advice. How can I assist you today?"
        });

        // Add history
        chatHistory.forEach((msg: any) => {
            messages.push({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.text
            });
        });

        // Add current message
        messages.push({
            role: 'user',
            content: userMessage
        });

        const chatCompletion = await groq.chat.completions.create({
            messages,
            model: 'llama-3.1-8b-instant',
            temperature: 0.7,
            max_tokens: 2048,
            top_p: 0.95,
        });

        return NextResponse.json({ text: chatCompletion.choices[0]?.message?.content || '' });
    } catch (error: any) {
        console.error('FuelBot chat error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get response from FuelBot' },
            { status: 500 }
        );
    }
}
