import { supabase } from './supabase';

export interface User {
    id: string;
    email: string;
    name: string;
    createdAt: string;

    // Usage tracking
    usageStats: {
        scansThisWeek: number;
        scansWeekStartDate: string;
        chatMessagesThisWeek: number;
        swapsToday: number;
        swapsDayDate: string;
    };
}

// Sign up a new user
export const signUp = async (
    email: string,
    password: string,
    name: string
): Promise<User> => {
    // Validate inputs
    if (!email || !password || !name) {
        throw new Error('All fields are required');
    }

    if (!email.includes('@')) {
        throw new Error('Invalid email format');
    }

    if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
    }

    // 1. Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
        options: {
            data: {
                full_name: name,
            },
        },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No user data returned from Auth');

    // 2. Create the profile in public.users
    const now = new Date();
    const newUserProfile = {
        id: authData.user.id,
        email: email.toLowerCase(),
        full_name: name,
        created_at: now.toISOString(),
        usage_stats: {
            scansThisWeek: 0,
            scansWeekStartDate: now.toISOString(),
            chatMessagesThisWeek: 0,
            swapsToday: 0,
            swapsDayDate: now.toISOString(),
        }
    };

    const { error: profileError } = await supabase
        .from('users')
        .insert([newUserProfile]);

    if (profileError) {
        console.error('Error creating user profile:', profileError);
    }

    return {
        id: authData.user.id,
        email: email.toLowerCase(),
        name,
        createdAt: now.toISOString(),
        usageStats: newUserProfile.usage_stats,
    };
};

// Log in an existing user
export const login = async (
    email: string,
    password: string
): Promise<User> => {
    if (!email || !password) {
        throw new Error('Email and password are required');
    }

    // 1. Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Invalid email or password');

    // 2. Fetch profile from public.users
    const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

    if (profileError || !profileData) {
        // Fallback for metadata if profile fails
        return {
            id: authData.user.id,
            email: authData.user.email || '',
            name: authData.user.user_metadata?.full_name || 'User',
            createdAt: authData.user.created_at,
            usageStats: {
                scansThisWeek: 0,
                scansWeekStartDate: new Date().toISOString(),
                chatMessagesThisWeek: 0,
                swapsToday: 0,
                swapsDayDate: new Date().toISOString(),
            },
        };
    }

    return {
        id: profileData.id,
        email: profileData.email,
        name: profileData.name || profileData.full_name || 'User',
        createdAt: profileData.created_at,
        usageStats: profileData.usage_stats,
    };
};

// Get current authenticated user
export const getCurrentUser = async (): Promise<User | null> => {
    try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return null;

        const { data: profileData, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single();

        if (profileError || !profileData) {
            return {
                id: authUser.id,
                email: authUser.email || '',
                name: authUser.user_metadata?.full_name || 'User',
                createdAt: authUser.created_at,
                usageStats: {
                    scansThisWeek: 0,
                    scansWeekStartDate: new Date().toISOString(),
                    chatMessagesThisWeek: 0,
                    swapsToday: 0,
                    swapsDayDate: new Date().toISOString(),
                },
            };
        }

        return {
            id: profileData.id,
            email: profileData.email,
            name: profileData.name,
            createdAt: profileData.created_at,
            usageStats: profileData.usage_stats,
        };
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
};

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session !== null;
};

// Log out current user
export const logout = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Error logging out:', error);
        throw error;
    }
};


// Validate email format
export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate password strength
export const validatePassword = (password: string): { valid: boolean; message: string } => {
    if (password.length < 6) {
        return { valid: false, message: 'Password must be at least 6 characters' };
    }
    if (password.length < 8) {
        return { valid: true, message: 'Password strength: Weak' };
    }
    if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
        return { valid: true, message: 'Password strength: Medium' };
    }
    return { valid: true, message: 'Password strength: Strong' };
};

// Update user data (usage stats, etc.)
export const updateUser = async (updatedUser: User): Promise<void> => {
    const { error } = await supabase
        .from('users')
        .update({
            name: updatedUser.name,
            usage_stats: updatedUser.usageStats,
        })
        .eq('id', updatedUser.id);

    if (error) {
        console.error('Error updating user:', error);
        throw error;
    }
};


