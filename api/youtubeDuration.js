// Vercel Serverless Function to fetch YouTube video duration & rich metadata (title, description, author, channel avatar, thumbnail, keywords)
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
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9'
            }
        });

        if (!ytRes.ok) {
            return res.status(502).json({ error: 'Failed to fetch YouTube page' });
        }

        const html = await ytRes.text();

        let playerResponse = null;
        const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});(?:var|<\/script>)/s);
        if (playerMatch) {
            try { playerResponse = JSON.parse(playerMatch[1]); } catch(e){}
        }

        const vDetails = playerResponse?.videoDetails || {};

        // 1. Title
        let title = vDetails.title || '';
        if (!title) {
            const tm = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i) || html.match(/<title>([^<]*)<\/title>/i);
            if (tm) title = tm[1].replace(/ - YouTube$/, '').trim();
        }

        // 2. Full Description
        let description = vDetails.shortDescription || '';
        if (!description) {
            const dm = html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/i) || html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
            if (dm) description = dm[1];
        }

        // 3. Author / Channel Name
        let author = vDetails.author || '';
        if (!author) {
            const am = html.match(/"author":"([^"]*)"/) || html.match(/<link\s+itemprop="name"\s+content="([^"]*)"/i);
            if (am) author = am[1];
        }

        // 4. Duration & Seconds
        let seconds = null;
        if (vDetails.lengthSeconds) {
            seconds = parseInt(vDetails.lengthSeconds, 10);
        } else {
            const approxMatch = html.match(/"approxDurationMs":"(\d+)"/);
            if (approxMatch && approxMatch[1]) {
                seconds = Math.floor(parseInt(approxMatch[1], 10) / 1000);
            }
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

        let formatted = '03:00';
        if (seconds !== null && !isNaN(seconds)) {
            const mins = Math.floor(seconds / 60);
            const remSec = seconds % 60;
            formatted = `${mins < 10 ? '0' : ''}${mins}:${remSec < 10 ? '0' : ''}${remSec}`;
        }

        // 5. Channel Avatar / Logo
        let channelAvatar = null;
        const ownerMatch = html.match(/"videoOwnerRenderer":\s*\{.*?"thumbnail":\s*\{\s*"thumbnails":\s*\[\s*\{\s*"url":\s*"([^"]+)"/s);
        if (ownerMatch && ownerMatch[1]) {
            channelAvatar = ownerMatch[1].replace(/=s\d+[^"]*/, '=s176-c-k-c0x00ffffff-no-rj');
        } else {
            const avatarRegex = /https:\/\/yt3\.(?:ggpht|googleusercontent)\.com\/[a-zA-Z0-9_\-\/=]+/g;
            const match = html.match(avatarRegex);
            if (match && match[0]) {
                channelAvatar = match[0].replace(/=s\d+[^"]*/, '=s176-c-k-c0x00ffffff-no-rj');
            }
        }

        // 6. Thumbnail
        const thumbnail = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

        // 7. Keywords / Tags
        const keywords = vDetails.keywords || [];

        return res.status(200).json({
            success: true,
            id: videoId,
            seconds,
            duration: formatted,
            title,
            description,
            author,
            channelAvatar,
            thumbnail,
            keywords
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
