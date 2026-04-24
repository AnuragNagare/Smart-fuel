const { groqRequest } = require('../lib/groq');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { location = 'India' } = req.body;

        const prompt = `Generate 6 realistic healthy food deals available today in ${location} on food delivery apps like Zomato and Swiggy.

Return ONLY a raw JSON object with NO markdown. Exactly this structure:
{
  "deals": [
    {
      "restaurant": "Restaurant Name",
      "dish": "Dish Name",
      "discount": "40% off",
      "platform": "Zomato",
      "description": "On orders above ₹300"
    }
  ]
}

platform must be exactly one of: "Zomato", "Swiggy", or "Both".
Make deals realistic and varied. Include healthy options like salads, grilled items, protein bowls.`;

        const data = await groqRequest({
            model: 'llama-3.1-8b-instant',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.8,
            max_tokens: 512,
        });

        const rawText = data.choices?.[0]?.message?.content || '';
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No valid JSON in response');

        const result = JSON.parse(jsonMatch[0]);
        return res.status(200).json(result);

    } catch (error) {
        console.error('[/api/deals] Error:', error.message);
        return res.status(500).json({ error: error.message || 'Deals service failed' });
    }
};
