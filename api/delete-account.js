const { getSupabaseAdmin } = require('../lib/supabaseAdmin');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST' && req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing or invalid Authorization header' });
        }

        const accessToken = authHeader.slice(7).trim();
        if (!accessToken) {
            return res.status(401).json({ error: 'Access token is required' });
        }

        const supabaseAdmin = getSupabaseAdmin();

        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(accessToken);
        if (userError || !user) {
            return res.status(401).json({ error: 'Invalid or expired session' });
        }

        const userId = user.id;

        const { error: historyError } = await supabaseAdmin
            .from('meal_history')
            .delete()
            .eq('user_id', userId);

        if (historyError) {
            console.error('meal_history delete error:', historyError);
            return res.status(500).json({ error: 'Failed to delete meal history' });
        }

        const { error: profileError } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', userId);

        if (profileError) {
            console.error('users delete error:', profileError);
            return res.status(500).json({ error: 'Failed to delete user profile' });
        }

        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (authDeleteError) {
            console.error('auth delete error:', authDeleteError);
            return res.status(500).json({ error: 'Failed to delete authentication account' });
        }

        return res.status(200).json({
            success: true,
            message: 'Account and associated data deleted',
        });
    } catch (error) {
        console.error('delete-account error:', error);
        const message = error.message?.includes('SUPABASE')
            ? 'Server configuration error'
            : error.message || 'Account deletion failed';
        return res.status(500).json({ error: message });
    }
};
