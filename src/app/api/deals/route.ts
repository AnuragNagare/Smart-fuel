import { groqManager } from '@/lib/groq-manager';
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

        const chatCompletion = await groqManager.withRotation(async (groq) => {
            return await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'llama-3.1-8b-instant',
                temperature: 0.3,
                max_tokens: 2048,
                top_p: 0.95,
            });
        });

        const text = chatCompletion.choices[0]?.message?.content || '{}';
        const cleanedText = text
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const data = JSON.parse(cleanedText);

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Deals error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch deals' },
            { status: 500 }
        );
    }
}
