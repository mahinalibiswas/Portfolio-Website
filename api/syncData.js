// Vercel Serverless API Route for Live Site Data Persistence (Backed by Firebase RTDB)
// Endpoint: https://mahinalibiswas.vercel.app/api/syncData

const FIREBASE_URL = 'https://mahin-portfolio-default-rtdb.firebaseio.com/siteData.json';

export default async function handler(req, res) {
    // CORS headers for cross-origin security
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
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
            
            // Proxy write request to Firebase Realtime Database
            const fbRes = await fetch(FIREBASE_URL, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (fbRes.ok) {
                const fbData = await fbRes.json();
                return res.status(200).json({
                    success: true,
                    timestamp: Date.now(),
                    data: fbData
                });
            } else {
                return res.status(fbRes.status).json({ success: false, error: 'Firebase error' });
            }
        } catch (err) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }

    if (req.method === 'GET') {
        try {
            const fbRes = await fetch(`${FIREBASE_URL}?t=${Date.now()}`, { cache: 'no-store' });
            const fbData = await fbRes.json();
            return res.status(200).json(fbData || {});
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
