import { geminiManager } from '@/lib/gemini-manager';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { location } = await request.json();

        const prompt = `Search the web for CURRENT food delivery offers and discounts in ${location} for TODAY.

Find offers from:
1. Zomato
2. Swiggy

Look for:
- Percentage discounts (e.g., 50% off)
- BOGO (Buy One Get One) deals
- Free delivery offers
- Flat discounts
- Bank card offers
- First order discounts

IMPORTANT: Only include ACTIVE offers available TODAY. Be specific about restaurant names and dishes.

Return EXACTLY 8-10 best offers in this JSON format (no markdown):
{
  "deals": [
    {
      "restaurant": "Restaurant Name",
      "dish": "Specific dish or category",
      "discount": "50% off",
      "platform": "Zomato",
      "description": "Brief 1-line description"
    }
  ]
}`;

        const data = await geminiManager.withRotation('gemini-1.5-flash', async (model) => {
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.3,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                },
                tools: [
                    {
                        googleSearchRetrieval: {
                            dynamicRetrievalConfig: {
                                mode: "MODE_DYNAMIC",
                                dynamicThreshold: 0.7,
                            },
                        },
                    },
                ] as any,
            });

            const text = result.response.text();
            const cleanedText = text
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

            return JSON.parse(cleanedText);
        });

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Deals error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch deals' },
            { status: 500 }
        );
    }
}
