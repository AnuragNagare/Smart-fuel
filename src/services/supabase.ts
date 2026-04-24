import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://yfvgkmflykiawxftgrpf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmdmdrbWZseWtpYXd4ZnRncnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5Mzg1NDQsImV4cCI6MjA3MDUxNDU0NH0.QHDn3jMtff8y4yrVtQiP9VbRF2B8oQuQsrLEA7uH85M';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
