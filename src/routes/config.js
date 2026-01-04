/**
 * Config Route
 * 
 * Securely provides public configuration to the frontend.
 * NOTE: Only expose PUBLIC keys here (Anon keys). Never expose Service Role keys.
 */

import express from 'express';

const router = express.Router();

router.get('/config', (req, res) => {
    res.json({
        success: true,
        data: {
            supabaseUrl: process.env.SUPABASE_URL || '',
            supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ''
        }
    });
});

export default router;
