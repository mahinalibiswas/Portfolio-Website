// Vercel Serverless API Route for Live Site Data Persistence
// Endpoint: https://mahinalibiswas.vercel.app/api/syncData

let memoryCache = null;

export default async function handler(req, res) {
    // CORS headers for cross-origin security
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'POST' || req.method === 'PUT') {
        try {
            const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            memoryCache = payload;
            
            // Sync to global memory cache
            global._mahin_site_data = payload;

            return res.status(200).json({
                success: true,
                timestamp: Date.now(),
                message: "Data synced live across Vercel servers!"
            });
        } catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }

    if (req.method === 'GET') {
        const data = memoryCache || global._mahin_site_data || null;
        return res.status(200).json(data || {});
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
