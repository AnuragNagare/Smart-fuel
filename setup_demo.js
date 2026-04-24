
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yfvgkmflykiawxftgrpf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmdmdrbWZseWtpYXd4ZnRncnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5Mzg1NDQsImV4cCI6MjA3MDUxNDU0NH0.QHDn3jMtff8y4yrVtQiP9VbRF2B8oQuQsrLEA7uH85M';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function processUser(name, email, password) {
    console.log(`\n--- Working on ${email} ---`);
    
    // 1. Auth Signup
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
        options: { data: { full_name: name } }
    });

    if (authError) {
        if (authError.message.includes('User already registered')) {
            console.log("Auth: User already exists.");
        } else {
            console.error("Auth Error:", authError.message);
            return;
        }
    } else {
        console.log("Auth Signup: SUCCESS");
    }

    // 2. Fetch or Create Profile
    // Let's try to find what column 'users' has by trial and error
    const testColumns = ['name', 'full_name', 'username', 'email'];
    for (const col of testColumns) {
        console.log(`Testing profile creation with column '${col}'...`);
        const { error } = await supabase.from('users').upsert([
            { id: authData?.user?.id || 'dummy', [col]: name, email: email.toLowerCase() }
        ]);
        
        if (!error) {
            console.log(`Profile SUCCESS with column '${col}'`);
            return;
        } else {
            console.log(`Profile FAILED with '${col}':`, error.message);
        }
    }
}

async function main() {
    await processUser('Anurag', 'anuragnagare77@gmail.com', 'YOUR_PASSWORD');
    await processUser('Intense', 'inetnsework@gmail.com', 'YOUR_PASSWORD');
}

main().catch(console.error);
