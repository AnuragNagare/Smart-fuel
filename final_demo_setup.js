
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yfvgkmflykiawxftgrpf.supabase.co';
// Using the service key from .env.local
const supabaseServiceKey = 'YOUR_SUPABASE_SERVICE_ROLE_KEY'; 

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function setupUser(name, email) {
    console.log(`\n--- Setting up ${email} ---`);
    
    // 1. Get User ID by email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error("List Users Error:", listError.message);
        return;
    }

    const user = users.find(u => u.email === email.toLowerCase());
    if (!user) {
        console.log(`User ${email} not found in Auth.`);
        return;
    }

    console.log(`Found User ID: ${user.id}. Confirming email...`);

    // 2. Confirm Email
    const { error: confirmError } = await supabase.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
    );

    if (confirmError) {
        console.error("Confirm Email Error:", confirmError.message);
    } else {
        console.log("Email confirmed successfully.");
    }

    // 3. Upsert Profile
    console.log("Upserting profile...");
    const now = new Date();
    const profileData = {
        id: user.id,
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
        console.error("Profile Upsert Error:", profileError.message);
    } else {
        console.log("Profile setup complete!");
    }
}

async function main() {
    await setupUser('Anurag', 'anuragnagare77@gmail.com');
    await setupUser('Intense', 'inetnsework@gmail.com');
}

main().catch(console.error);
