import { groq } from '@/lib/groq-client';
import { NextRequest, NextResponse } from 'next/server';

interface UserProfile {
    name: string;
    age: string;
    height: string;
    weight: string;
    bmi: string;
}

export async function POST(request: NextRequest) {
    try {
        const { image, userProfile } = await request.json();

        if (!image) {
            return NextResponse.json(
                { error: 'No image provided' },
                { status: 400 }
            );
        }

        // Extract base64 data from data URL
        const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
        const mimeType = image.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';

        // Build user context for personalized analysis
        let userContext = '';
        if (userProfile && userProfile.bmi) {
            const bmi = parseFloat(userProfile.bmi);
            let bmiCategory = '';
            if (bmi < 18.5) bmiCategory = 'underweight';
            else if (bmi < 25) bmiCategory = 'normal weight';
            else if (bmi < 30) bmiCategory = 'overweight';
            else bmiCategory = 'obese';

            userContext = `
USER PROFILE FOR PERSONALIZED ANALYSIS:
- Age: ${userProfile.age} years
- Height: ${userProfile.height} cm
- Weight: ${userProfile.weight} kg
- BMI: ${userProfile.bmi} (${bmiCategory})

Based on this user's BMI and profile, you MUST provide personalized health insights.
`;
        }

        // Create the prompt with personalized analysis
        const prompt = `You are an expert nutritionist and health advisor. Analyze this food image carefully.

TASK: Identify ALL food items and provide nutritional data + personalized health insights.

${userContext}

FOR EACH FOOD ITEM, provide:
1. Food name (be specific)
2. Portion size (grams or standard units)
3. Calories (kcal)
4. Protein (grams)
5. Fat (grams)  
6. Carbohydrates (grams)

${userProfile ? `
PERSONALIZED HEALTH ANALYSIS (REQUIRED):
Based on the user's BMI of ${userProfile.bmi}, analyze this meal and provide:

1. "healthScore" (1-10): How healthy is this meal for THIS specific user?
   - Consider their BMI category when scoring
   - Factor in protein, fat, carb ratios
   - Consider caloric density vs their needs

2. "weightImpact": Will this meal contribute to weight GAIN, LOSS, or MAINTENANCE?
   - For underweight users: high-calorie meals = positive
   - For overweight users: low-calorie, high-protein = positive
   - Be specific about WHY based on the macros

3. "muscleImpact": Will this meal help with muscle GAIN, LOSS, or MAINTENANCE?
   - Analyze protein content (0.8-1g per kg bodyweight is baseline need)
   - Consider protein quality and amino acid profile
   - Factor in carbs for glycogen replenishment

4. "recommendations": Array of 2-3 specific, actionable tips for this user
   - Make suggestions specific to their BMI category
   - Suggest portion adjustments if needed
   - Recommend complementary foods if meal is unbalanced

5. "warnings": Array of any health concerns (empty array if none)
   - High sodium, sugar, or saturated fat alerts
   - Allergenic ingredients
   - Caloric concerns based on user's profile
` : ''}

IMPORTANT:
- Use REAL nutritional science, not guesses
- Base protein/calorie recommendations on established guidelines
- Be accurate about portion sizes from visual estimation
- Round nutritional values to whole numbers

Return ONLY valid JSON (no markdown):
{
  "items": [
    {
      "name": "Food Name",
      "portion": "estimated portion",
      "calories": number,
      "protein": number,
      "fat": number,
      "carbs": number
    }
  ],
  "totals": {
    "calories": number,
    "protein": number,
    "fat": number,
    "carbs": number
  }${userProfile ? `,
  "healthInsights": {
    "healthScore": number,
    "healthLabel": "Excellent/Good/Moderate/Poor",
    "weightImpact": "gain/loss/maintenance",
    "weightExplanation": "Brief explanation why",
    "muscleImpact": "gain/maintenance/loss",
    "muscleExplanation": "Brief explanation why",
    "recommendations": ["tip1", "tip2", "tip3"],
    "warnings": ["warning1"] 
  }` : ''}
}

If the image doesn't contain recognizable food, return:
{"error": "Unable to identify food items in this image"}`;

        // Generate content using Groq Vision
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        {
                            type: 'image_url',
                            image_url: {
                                url: image // The data URL with base64
                            }
                        }
                    ]
                }
            ],
            model: 'llama-3.2-11b-vision-preview',
            temperature: 0.2,
            max_tokens: 2048,
        });

        const text = chatCompletion.choices[0]?.message?.content || '{}';

        // Clean markdown if present
        const cleanedText = text
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const nutritionData = JSON.parse(cleanedText);

        // Check for error response from Groq
        if (nutritionData.error) {
            return NextResponse.json(
                { error: nutritionData.error },
                { status: 400 }
            );
        }

        // Validate the response structure
        if (!nutritionData.items || !nutritionData.totals) {
            throw new Error('Invalid response structure');
        }

        return NextResponse.json(nutritionData);
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: error.message || 'An error occurred while analyzing the image. Please try again.' },
            { status: 500 }
        );
    }
}
