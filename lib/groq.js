/**
 * Groq API Key Rotation
 * Tries each key in sequence. If one hits rate limit (429) or token exhaustion,
 * it automatically falls back to the next key. Loops through all 6 keys.
 */

const GROQ_API_KEYS = [
    process.env.GROQ_KEY_1,
    process.env.GROQ_KEY_2,
    process.env.GROQ_KEY_3,
    process.env.GROQ_KEY_4,
    process.env.GROQ_KEY_5,
    process.env.GROQ_KEY_6,
].filter(Boolean); // Remove any undefined keys

/**
 * Make a Groq API request with automatic key rotation on rate limit / token exhaustion.
 * @param {object} body - The full Groq request body (model, messages, etc.)
 * @returns {object} - The Groq API response JSON
 */
async function groqRequest(body) {
    let lastError = null;

    for (let i = 0; i < GROQ_API_KEYS.length; i++) {
        const key = GROQ_API_KEYS[i];
        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`,
                },
                body: JSON.stringify(body),
            });

            // If rate limited or token exhausted, try next key
            if (response.status === 429 || response.status === 413) {
                console.warn(`[Groq] Key ${i + 1} hit rate limit (${response.status}), trying next key...`);
                lastError = new Error(`Key ${i + 1} rate limited`);
                continue;
            }

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData?.error?.message || `Groq error: ${response.status}`);
            }

            const data = await response.json();
            console.log(`[Groq] Success with key ${i + 1}`);
            return data;

        } catch (err) {
            // Network error or thrown error — try next key
            if (err.message?.includes('rate limit') || err.message?.includes('Key')) {
                lastError = err;
                continue;
            }
            // Non-rate-limit errors — throw immediately
            throw err;
        }
    }

    // All keys exhausted
    throw new Error(`All Groq API keys exhausted. Last error: ${lastError?.message}`);
}

module.exports = { groqRequest };
