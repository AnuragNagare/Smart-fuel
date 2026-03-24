import Groq from 'groq-sdk';

/**
 * GroqManager handles rotation and fallback for multiple Groq API keys.
 * This allows spreading load across multiple free-tier keys.
 */
class GroqManager {
    private keys: string[];
    private currentIndex: number = 0;

    constructor() {
        // Load all available keys from environment variables
        this.keys = [
            process.env.GROQ_API_KEY,
            process.env.GROQ_API_KEY_2,
            process.env.GROQ_API_KEY_3,
            process.env.GROQ_API_KEY_4,
            process.env.GROQ_API_KEY_5,
        ].filter((key): key is string => !!key);

        if (this.keys.length === 0) {
            console.warn('GroqManager: No API keys found in environment variables!');
        } else {
            console.log(`GroqManager: Initialized with ${this.keys.length} keys.`);
        }
    }

    /**
     * Gets the next available key in the rotation (Round-Robin)
     */
    private getNextKey(): string {
        if (this.keys.length === 0) throw new Error('No Groq API keys configured');

        const key = this.keys[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.keys.length;
        return key;
    }

    /**
     * Executes a Groq request with automatic fallback to the next key if a rate limit (429) occurs.
     */
    async withRotation<T>(
        executionFn: (groq: Groq) => Promise<T>,
        maxRetries: number = this.keys.length
    ): Promise<T> {
        let attempts = 0;
        let lastError: any = null;

        while (attempts < maxRetries) {
            const key = this.getNextKey();
            const groq = new Groq({ apiKey: key });

            try {
                return await executionFn(groq);
            } catch (error: any) {
                lastError = error;

                // If the error is a rate limit (429) or quota exceeded, try the next key
                if (error.status === 429 || error.message?.toLowerCase().includes('quota') || error.message?.toLowerCase().includes('rate limit')) {
                    console.warn(`GroqManager: Key ${this.currentIndex} rate limited/quota hit. Retrying with next key... (Attempt ${attempts + 1}/${maxRetries})`);
                    attempts++;
                    continue;
                }

                // For other errors, throw immediately
                throw error;
            }
        }

        throw new Error(`GroqManager: All ${maxRetries} keys failed. Last error: ${lastError?.message || 'Unknown error'}`);
    }
}

// Export a singleton instance
export const groqManager = new GroqManager();
