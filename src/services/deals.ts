import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../constants/theme';

const DEALS_API_URL = `${BACKEND_URL}/api/deals`;
const DEALS_CACHE_KEY = '@smartfuel_deals_cache';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export interface DealOffer {
    restaurant: string;
    dish: string;
    discount: string;
    platform: 'Zomato' | 'Swiggy' | 'Both';
    description: string;
}

interface CachedDeals {
    timestamp: number;
    location: string;
    data: DealOffer[];
}

export async function getTodaysDeals(location: string): Promise<DealOffer[]> {
    try {
        // Check cache first
        const cachedDataCheck = await AsyncStorage.getItem(DEALS_CACHE_KEY);
        if (cachedDataCheck) {
            const cachedDeals: CachedDeals = JSON.parse(cachedDataCheck);
            const now = Date.now();

            if (
                cachedDeals.location === location &&
                now - cachedDeals.timestamp < CACHE_DURATION
            ) {
                console.log('Returning cached deals');
                return cachedDeals.data;
            }
        }

        const response = await fetch(DEALS_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ location }),
        });

        if (!response.ok) {
            throw new Error(`Deals service error: ${response.status}`);
        }

        const dealsData = await response.json();

        if (!dealsData.deals || !Array.isArray(dealsData.deals)) {
            throw new Error('Invalid deals format');
        }

        // Cache the successful response
        const cachePayload: CachedDeals = {
            timestamp: Date.now(),
            location,
            data: dealsData.deals
        };
        await AsyncStorage.setItem(DEALS_CACHE_KEY, JSON.stringify(cachePayload));

        return dealsData.deals;
    } catch (error) {
        console.error('Error fetching deals:', error);

        // Fallback mocks
        return [
            {
                restaurant: "Domino's Pizza",
                dish: "Any pizza",
                discount: "50% off",
                platform: "Zomato",
                description: "On orders above ₹400",
            },
            {
                restaurant: "McDonald's",
                dish: "Burgers & Fries",
                discount: "Buy 1 Get 1",
                platform: "Swiggy",
                description: "On selected combos",
            },
            {
                restaurant: "KFC",
                dish: "Chicken Bucket",
                discount: "₹200 off",
                platform: "Both",
                description: "On orders above ₹500",
            },
        ];
    }
}
