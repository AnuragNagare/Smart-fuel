
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yfvgkmflykiawxftgrpf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmdmdrbWZseWtpYXd4ZnRncnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5Mzg1NDQsImV4cCI6MjA3MDUxNDU0NH0.QHDn3jMtff8y4yrVtQiP9VbRF2B8oQuQsrLEA7uH85M';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin(email, password) {
    console.log(`\nTesting login for: ${email}...`);
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });

    if (error) {
        console.error(`Login failed: ${error.message}`);
        return null;
    }

    console.log(`Login SUCCESS! User ID: ${data.user.id}`);
    
    // Check profile
    console.log(`Checking profile for ${email}...`);
    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

    if (profileError) {
        console.log(`Profile NOT found or error: ${profileError.message}`);
        return data.user.id;
    } else {
        console.log(`Profile found:`, profile);
        return null; // Both exist
    }
}

async function createProfile(id, email, name) {
    console.log(`Creating missing profile for ${email}...`);
    const now = new Date();
    const profileData = {
        id: id,
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
        .upsert([profileData], { onConflict: 'id' });

    if (profileError) {
        console.error(`Failed to create profile: ${profileError.message}`);
    } else {
        console.log(`Profile created successfully!`);
    }
}

async function main() {
    const id1 = await testLogin('anuragnagare77@gmail.com', 'YOUR_PASSWORD');
    if (id1) await createProfile(id1, 'anuragnagare77@gmail.com', 'Anurag');

    const id2 = await testLogin('inetnsework@gmail.com', 'YOUR_PASSWORD');
    if (id2) await createProfile(id2, 'inetnsework@gmail.com', 'Intense');
}

main().catch(console.error);
