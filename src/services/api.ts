import axios from 'axios';
import { BACKEND_URL } from '../constants/theme';
import { NutritionReport, UserProfile } from '../types';

const ANALYZE_API_URL = `${BACKEND_URL}/api/analyze`;

export const analyzeFood = async (
    base64Image: string,
    userProfile?: UserProfile & { bmi: string }
): Promise<NutritionReport> => {
    try {
        const response = await axios.post(ANALYZE_API_URL, {
            image: `data:image/jpeg;base64,${base64Image}`,
            userProfile
        });

        if (!response.data) {
            throw new Error('Empty response from analysis service');
        }

        return response.data;
    } catch (error: any) {
        console.error('Error analyzing food:', error.response?.data || error.message);

        if (error.response?.status === 429) {
            throw new Error('The AI is a bit busy right now. Please wait 10 seconds and try again.');
        }

        throw new Error('Failed to analyze image. Please try again.');
    }
};
