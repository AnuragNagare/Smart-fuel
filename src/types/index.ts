export interface UserProfile {
    name: string;
    age: string;
    location: string;
    height: string;
    weight: string;
}

export interface FoodItem {
    name: string;
    portion: string;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
}

export interface NutritionTotals {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
}

export interface HealthInsights {
    healthScore: number;
    healthLabel: string;
    weightImpact: 'gain' | 'loss' | 'maintenance';
    weightExplanation: string;
    muscleImpact: 'gain' | 'loss' | 'maintenance';
    muscleExplanation: string;
    recommendations: string[];
    warnings: string[];
}

export interface NutritionReport {
    items: FoodItem[];
    totals: NutritionTotals;
    healthInsights?: HealthInsights;
}

export type RootStackParamList = {
    Onboarding: undefined;
    Login: undefined;
    SignUp: undefined;
    ProfileSetup: undefined;
    Home: undefined;
    Camera: undefined;
    Results: { report: NutritionReport; imageUri: string };
};
