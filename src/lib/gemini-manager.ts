import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

/**
 * GeminiManager handles rotation and fallback for multiple Gemini API keys.
 * This allows spreading load across multiple free-tier projects.
 */
class GeminiManager {
    private keys: string[];
    private currentIndex: number = 0;

    constructor() {
        // Load all available keys from environment variables
        this.keys = [
            process.env.GOOGLE_GEMINI_API_KEY,
            process.env.GEMINI_KEY_2,
            process.env.GEMINI_KEY_3,
            process.env.GEMINI_KEY_4,
            process.env.GEMINI_KEY_5,
        ].filter((key): key is string => !!key);

        if (this.keys.length === 0) {
            console.warn('GeminiManager: No API keys found in environment variables!');
        } else {
            console.log(`GeminiManager: Initialized with ${this.keys.length} keys.`);
        }
    }

    /**
     * Gets the next available key in the rotation (Round-Robin)
     */
    private getNextKey(): string {
        if (this.keys.length === 0) throw new Error('No Gemini API keys configured');

        const key = this.keys[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.keys.length;
        return key;
    }

    /**
     * Executes a Gemini request with automatic fallback to the next key if a rate limit (429) occurs.
     */
    async withRotation<T>(
        modelName: string,
        executionFn: (model: GenerativeModel) => Promise<T>,
        maxRetries: number = this.keys.length
    ): Promise<T> {
        let attempts = 0;
        let lastError: any = null;

        while (attempts < maxRetries) {
            const key = this.getNextKey();
            const genAI = new GoogleGenerativeAI(key);
            const model = genAI.getGenerativeModel({ model: modelName });

            try {
                return await executionFn(model);
            } catch (error: any) {
                lastError = error;

                // If the error is a rate limit (429) or quota exceeded, try the next key
                if (error.status === 429 || error.message?.toLowerCase().includes('quota') || error.message?.includes('429')) {
                    console.warn(`GeminiManager: Key ${this.currentIndex} rate limited/quota hit. Retrying with next key... (Attempt ${attempts + 1}/${maxRetries})`);
                    attempts++;
                    continue;
                }

                // For other errors, throw immediately
                throw error;
            }
        }

        throw new Error(`GeminiManager: All ${maxRetries} keys failed. Last error: ${lastError?.message || 'Unknown error'}`);
    }
}

// Export a singleton instance
export const geminiManager = new GeminiManager();
