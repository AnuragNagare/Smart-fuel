
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yfvgkmflykiawxftgrpf.supabase.co';
const supabaseServiceKey = 'YOUR_SUPABASE_SERVICE_ROLE_KEY'; 

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function adminCreateUser(name, email, password) {
  console.log(`\n--- Admin Setup for ${email} ---`);
  
  // 1. Create User in Auth
  const { data, error: authError } = await supabase.auth.admin.createUser({
    email: email.toLowerCase(),
    password: password,
    email_confirm: true,
    user_metadata: { full_name: name }
  });

  if (authError) {
    if (authError.message.includes('User already registered') || authError.message.includes('already exists')) {
      console.log(`Auth: User ${email} already registered.`);
      // Need to find existing user ID
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      const existingUser = users?.users.find(u => u.email === email.toLowerCase());
      if (existingUser) {
        console.log(`Found existing user ID: ${existingUser.id}`);
        await createProfile(existingUser.id, email, name);
      }
    } else {
      console.error(`Auth Admin Error for ${email}:`, authError.message);
    }
    return;
  }

  console.log(`Auth: User ${email} created successfully with ID: ${data.user.id}`);
  await createProfile(data.user.id, email, name);
}

async function createProfile(id, email, name) {
  console.log(`Creating profile for ${id}...`);
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
    console.error(`Profile Error for ${email}:`, profileError.message);
  } else {
    console.log(`Profile for ${email} is ready!`);
  }
}

async function main() {
  await adminCreateUser('Anurag', 'anuragnagare77@gmail.com', 'YOUR_PASSWORD');
  await adminCreateUser('Intense', 'inetnsework@gmail.com', 'YOUR_PASSWORD');
}

main().catch(console.error);
