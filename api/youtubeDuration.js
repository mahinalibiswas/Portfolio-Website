// Vercel Serverless Function to fetch YouTube video duration & metadata
// Endpoint: /api/youtubeDuration?url=... or /api/youtubeDuration?id=...

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { url, id } = req.query;
    let videoId = id;

    if (!videoId && url) {
        const str = decodeURIComponent(url);
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = str.match(regExp);
        if (match && match[2] && match[2].length === 11) {
            videoId = match[2];
        } else if (str.length === 11 && !str.includes('/') && !str.includes('.')) {
            videoId = str;
        }
    }

    if (!videoId) {
        return res.status(400).json({ error: 'Missing or invalid YouTube URL or ID' });
    }

    try {
        const ytRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });

        if (!ytRes.ok) {
            return res.status(502).json({ error: 'Failed to fetch YouTube page' });
        }

        const html = await ytRes.text();
        let seconds = null;

        const approxMatch = html.match(/"approxDurationMs":"(\d+)"/);
        if (approxMatch && approxMatch[1]) {
            seconds = Math.floor(parseInt(approxMatch[1], 10) / 1000);
        }

        if (seconds === null) {
            const isoMatch = html.match(/itemprop="duration"\s+content="PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?"/i);
            if (isoMatch) {
                const hours = parseInt(isoMatch[1] || '0', 10);
                const mins = parseInt(isoMatch[2] || '0', 10);
                const secs = parseInt(isoMatch[3] || '0', 10);
                seconds = (hours * 3600) + (mins * 60) + secs;
            }
        }

        if (seconds !== null && !isNaN(seconds)) {
            const mins = Math.floor(seconds / 60);
            const remSec = seconds % 60;
            const formatted = `${mins < 10 ? '0' : ''}${mins}:${remSec < 10 ? '0' : ''}${remSec}`;
            return res.status(200).json({
                success: true,
                id: videoId,
                seconds,
                duration: formatted
            });
        }

        return res.status(404).json({ error: 'Duration not found in YouTube metadata' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
