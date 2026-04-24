const { groqRequest } = require('../lib/groq');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { userMessage, chatHistory = [], userContext } = req.body;

        if (!userMessage) {
            return res.status(400).json({ error: 'userMessage is required' });
        }

        // Build system prompt with user context
        let systemPrompt = `You are NutriBot, a friendly, expert AI nutrition coach. 
You give clear, actionable, science-backed advice about diet, nutrition, weight management, and healthy eating.
Keep responses concise and practical. Use plain text only — no markdown asterisks or special formatting.
Be warm, encouraging, and motivating.`;

        if (userContext) {
            systemPrompt += `\n\nUser Profile: Name: ${userContext.name || 'User'}, Age: ${userContext.age || 'unknown'}, Height: ${userContext.height || 'unknown'}cm, Weight: ${userContext.weight || 'unknown'}kg, Location: ${userContext.location || 'unknown'}.
Personalize your advice based on this profile.`;
        }

        // Convert chat history to Groq message format
        const messages = [
            { role: 'system', content: systemPrompt },
            ...chatHistory.map(msg => ({
                role: msg.role === 'model' ? 'assistant' : 'user',
                content: msg.text,
            })),
            { role: 'user', content: userMessage },
        ];

        const data = await groqRequest({
            model: 'llama-3.1-8b-instant',
            messages,
            temperature: 0.7,
            max_tokens: 512,
        });

        const text = data.choices?.[0]?.message?.content || '';
        return res.status(200).json({ text });

    } catch (error) {
        console.error('[/api/chat] Error:', error.message);
        return res.status(500).json({ error: error.message || 'Chat service failed' });
    }
};
