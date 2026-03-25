import { supabase } from './supabase';
import { NutritionReport } from '../types';

export interface MealRecord {
    id?: string;
    user_id: string;
    meal_name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    health_score: number;
    image_url: string;
    report_data: NutritionReport;
    created_at?: string;
}

/**
 * Save a meal analysis result to Supabase history
 */
export const saveMealToHistory = async (
    userId: string,
    report: NutritionReport,
    imageUri: string
): Promise<void> => {
    try {
        const { error } = await supabase
            .from('meal_history')
            .insert({
                user_id: userId,
                meal_name: report.items?.[0]?.name || 'Meal Analysis',
                calories: report.totals.calories,
                protein: report.totals.protein,
                carbs: report.totals.carbs,
                fat: report.totals.fat,
                health_score: report.healthInsights?.healthScore || 0,
                image_url: imageUri, // Note: In a real app, you'd upload to Storage first
                report_data: report,
            });

        if (error) throw error;
    } catch (error) {
        console.error('Error saving meal to history:', error);
        throw error;
    }
};

/**
 * Fetch the user's meal history from Supabase
 */
export const getMealHistory = async (userId: string, limit: number = 20): Promise<MealRecord[]> => {
    try {
        const { data, error } = await supabase
            .from('meal_history')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Error fetching meal history:', error);
        return [];
    }
};
