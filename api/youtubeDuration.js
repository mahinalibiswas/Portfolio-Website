// Vercel Serverless Function to fetch YouTube video duration & rich metadata (title, description, author, channel avatar, thumbnail, keywords)
// Endpoint: /api/youtubeDuration?url=... or /api/youtubeDuration?id=...

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');

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
        let title = '';
        let description = '';
        let author = '';
        let seconds = null;
        let channelAvatar = null;
        let thumbnail = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
        let keywords = [];

        // 1. YouTube official InnerTube API (Using MWEB & mobile clients that never require login from datacenter IPs)
        const innerTubeClients = [
            { clientName: 'MWEB', clientVersion: '2.20240315.00.00' },
            { clientName: 'ANDROID_TESTSUITE', clientVersion: '1.9' },
            { clientName: 'WEB', clientVersion: '2.20240315.00.00' }
        ];

        for (const clientConfig of innerTubeClients) {
            try {
                const playerRes = await fetch('https://www.youtube.com/youtubei/v1/player', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36'
                    },
                    body: JSON.stringify({
                        videoId: videoId,
                        context: { client: clientConfig }
                    })
                });

                if (playerRes.ok) {
                    const playerData = await playerRes.json();
                    const vDetails = playerData?.videoDetails;
                    if (vDetails) {
                        if (vDetails.title && !title) title = vDetails.title;
                        if (vDetails.shortDescription && !description) description = vDetails.shortDescription;
                        if (vDetails.author && !author) author = vDetails.author;
                        if (vDetails.lengthSeconds && seconds === null) seconds = parseInt(vDetails.lengthSeconds, 10);
                        if (vDetails.keywords && Array.isArray(vDetails.keywords) && keywords.length === 0) keywords = vDetails.keywords;

                        if (vDetails.thumbnail?.thumbnails?.length) {
                            const thumbs = vDetails.thumbnail.thumbnails;
                            thumbnail = thumbs[thumbs.length - 1].url || thumbnail;
                        }

                        if (title && description && seconds !== null) break;
                    }
                }
            } catch (innerErr) {
                console.warn('InnerTube client error:', innerErr.message);
            }
        }

        // 2. Fetch Channel Avatar and fallback metadata from watch page with consent cookie
        try {
            const ytRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Cookie': 'SOCS=CAESEwgDEgk2OTc3OTM3MjQaAmVuIAEaBgiA_LyaBg; CONSENT=PENDING+999; PREF=tz=UTC&hl=en'
                }
            });

            if (ytRes.ok) {
                const html = await ytRes.text();

                // Channel Avatar
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

                if (!title) {
                    const tm = html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i) || html.match(/<title>([^<]*)<\/title>/i);
                    if (tm) title = tm[1].replace(/ - YouTube$/, '').trim();
                }

                if (!description) {
                    const dm = html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/i) || html.match(/<meta\s+name="description"\s+content="([^"]*)"/i);
                    if (dm && !dm[1].startsWith('Enjoy the videos')) description = dm[1];
                }

                if (!author) {
                    const am = html.match(/"author":"([^"]*)"/) || html.match(/<link\s+itemprop="name"\s+content="([^"]*)"/i);
                    if (am) author = am[1];
                }
            }
        } catch (e) {}

        // 3. Guaranteed fallback for Title and Author via official YouTube oEmbed API
        if (!title || !author) {
            try {
                const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
                if (oembedRes.ok) {
                    const oData = await oembedRes.json();
                    if (!title && oData.title) title = oData.title;
                    if (!author && oData.author_name) author = oData.author_name;
                    if (!thumbnail && oData.thumbnail_url) thumbnail = oData.thumbnail_url;
                }
            } catch (e) {}
        }

        // Format duration mm:ss or hh:mm:ss
        let formatted = '03:00';
        if (seconds !== null && !isNaN(seconds)) {
            const hrs = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            const remSec = seconds % 60;
            if (hrs > 0) {
                formatted = `${hrs}:${mins < 10 ? '0' : ''}${mins}:${remSec < 10 ? '0' : ''}${remSec}`;
            } else {
                formatted = `${mins < 10 ? '0' : ''}${mins}:${remSec < 10 ? '0' : ''}${remSec}`;
            }
        }

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
