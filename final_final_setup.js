
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yfvgkmflykiawxftgrpf.supabase.co';
const supabaseServiceKey = 'YOUR_SUPABASE_SERVICE_ROLE_KEY'; 

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function finishSetup(id, email, name, password) {
    console.log(`\nFinalizing ${email}...`);
    
    const profileData = {
        id: id,
        email: email.toLowerCase(),
        username: name,
        password_hash: password, // Providing plain password as hash for now to satisfy constraint
        created_at: new Date().toISOString()
    };

    const { error: profileError } = await supabase
        .from('users')
        .upsert([profileData], { onConflict: 'id' });

    if (profileError) {
        console.error(`Profile Error: ${profileError.message}`);
    } else {
        console.log(`SUCCESS: Profile for ${email} created!`);
    }
}

async function main() {
    await finishSetup('1f28a066-7d51-4eb0-a6df-5930731a7354', 'anuragnagare77@gmail.com', 'Anurag', 'YOUR_PASSWORD');
    await finishSetup('93d50d08-33b4-42de-9c89-f3a819079bae', 'inetnsework@gmail.com', 'Intense', 'YOUR_PASSWORD');
}

main().catch(console.error);
