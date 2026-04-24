
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://yfvgkmflykiawxftgrpf.supabase.co';
const supabaseServiceKey = 'YOUR_SUPABASE_SERVICE_ROLE_KEY'; 

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectTable() {
    console.log('Inspecting users table with service role key...');
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error.message);
    } else {
        if (data.length > 0) {
            console.log('Found columns:', Object.keys(data[0]));
        } else {
            console.log('Table is empty. Trying to find columns via dummy insert error...');
            const { error: insertError } = await supabase
                .from('users')
                .insert([{ id: '00000000-0000-0000-0000-000000000000' }]);
            console.log('Insert error response:', insertError?.message);
        }
    }
}

inspectTable().catch(console.error);
