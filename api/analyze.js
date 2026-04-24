const { groqRequest } = require('../lib/groq');

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { image, userProfile } = req.body;

        if (!image) {
            return res.status(400).json({ error: 'Image is required' });
        }

        // Build personalized context if profile is available
        let profileContext = '';
        if (userProfile) {
            profileContext = `\nUser Profile: Age ${userProfile.age}, Height ${userProfile.height}cm, Weight ${userProfile.weight}kg, BMI ${userProfile.bmi}.`;
        }

        const prompt = `You are an expert nutritionist AI. Analyze this food image and return nutritional data.
${profileContext}

Return ONLY a valid JSON object with NO markdown, no explanation, no code fences. Exactly this structure:
{
  "items": [
    { "name": "Food Item Name", "portion": "estimated portion", "calories": 250, "protein": 20, "fat": 10, "carbs": 30 }
  ],
  "totals": { "calories": 250, "protein": 20, "fat": 10, "carbs": 30 },
  "healthInsights": {
    "healthScore": 7,
    "healthLabel": "Moderately Healthy",
    "weightImpact": "maintenance",
    "weightExplanation": "This meal fits well within typical daily caloric needs.",
    "muscleImpact": "gain",
    "muscleExplanation": "Good protein content supports muscle maintenance.",
    "recommendations": ["Add more vegetables", "Drink water alongside"],
    "warnings": []
  }
}

Be accurate with portion estimates. healthScore is 1-10. weightImpact and muscleImpact must be exactly one of: "gain", "loss", or "maintenance".`;

        const data = await groqRequest({
            model: 'llama-3.2-11b-vision-preview',
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        { type: 'image_url', image_url: { url: image } },
                    ],
                },
            ],
            temperature: 0.3,
            max_tokens: 1024,
        });

        const rawText = data.choices?.[0]?.message?.content || '';

        // Extract JSON from response
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No valid JSON in Groq response');
        }

        const report = JSON.parse(jsonMatch[0]);
        return res.status(200).json(report);

    } catch (error) {
        console.error('[/api/analyze] Error:', error.message);
        return res.status(500).json({ error: error.message || 'Failed to analyze image' });
    }
};
