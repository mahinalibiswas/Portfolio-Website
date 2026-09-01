/* ==========================================================================
   PORTFOLIO WEBSITE CENTRAL SITE DATA STORE & PERSISTENCE ENGINE
   Manages all website content (Hero, About, Showreel, Projects, Services, 
   Software, Contact) in localStorage with fallback defaults.
   ========================================================================== */

const STORAGE_KEY = 'mahin_portfolio_site_data';
const PASSWORD_STORAGE_KEY = 'mahin_admin_password';
const DEFAULT_ADMIN_PASSWORD = 'mahin2026';

const DEFAULT_SITE_DATA = {
    // 1. Hero Section
    hero: {
        badge: "MOTION & VIDEO ARTIST",
        titleTop: "MAHIN ALI",
        titleBottom: "BISWAS",
        subtitleTag: "Motion Graphics Artist & Senior Video Editor",
        subtitle: "Transforming concepts into high-impact motion graphics, 2D/3D title animations, kinetic typography, and high-retention video edits for YouTubers, agencies, and global brands.",
        showreelVideo: "",
        showreelPoster: "assets/images/project_3d_cyber.jpg",
        behanceUrl: "https://www.behance.net/mahinalibiswas",
        youtubeUrl: "https://www.youtube.com/@mahinalibiswas",
        facebookUrl: "https://www.facebook.com/mahinalibiswas",
        ctaButtons: [
            { id: "btn-1", text: "Watch Showreel", link: "assets/videos/main_showreel.mp4", icon: "fa-solid fa-play", isModal: true },
            { id: "btn-2", text: "Hire Me", link: "#contact", icon: "fa-solid fa-paper-plane", isModal: false },
            { id: "btn-3", text: "About & Photo", link: "#about", icon: "fa-solid fa-user", isModal: false }
        ],
        statsEdited: "100+",
        statsClients: "50+",
        statsDelivery: "100%"
    },

    // 2. About Me Section
    about: {
        tagBadge: "ABOUT THE ARTIST",
        titleTop: "Elevating Content Through",
        titleGradient: "Motion & Storytelling",
        bio: "Hi, I'm Mahin Ali Biswas (@mahinalibiswas) — a Motion Graphics Artist & Senior Video Editor based in Bangladesh. I work with content creators, digital agencies, and global brands to deliver high-impact motion graphics, 2D/3D title intros, kinetic typography, and cinematic video editing.",
        expYears: "3+",
        expSub: "Motion & Video Specialist",
        behanceUrl: "https://www.behance.net/mahinalibiswas",
        btnBehanceText: "Visit Behance Profile",
        btnBehanceUrl: "https://www.behance.net/mahinalibiswas",
        btnContactText: "Contact Direct",
        btnContactLink: "#contact",
        features: [
            {
                icon: "fa-solid fa-bolt",
                title: "High-Retention Pacing",
                desc: "YouTube, Shorts & Reels editing for maximum watch time."
            },
            {
                icon: "fa-solid fa-closed-captioning",
                title: "Motion Subtitles",
                desc: "Dynamic Bangla & English kinetic captions & pop-ups."
            },
            {
                icon: "fa-solid fa-sliders",
                title: "Cinematic Color Pass",
                desc: "Log footage color balancing & filmic grading passes."
            },
            {
                icon: "fa-solid fa-compact-disc",
                title: "Immersive Audio SFX",
                desc: "Custom sound design layering & audio noise cleanup."
            }
        ]
    },

    // 3. Highlight Showreel Section
    showreel: {
        subtitle: "// HIGHLIGHT SHOWREEL",
        titleTop: "Featured Motion &",
        titleGradient: "Video Reel",
        desc: "A compilation of YouTube edits, talking head videos, dynamic reels, motion graphics, and sound design passes by Mahin Ali Biswas.",
        videoUrl: "assets/videos/main_showreel.mp4",
        youtubeUrl: "https://www.youtube.com/watch?v=deQijHls--0",
        youtubeId: "deQijHls--0"
    },

    // 4. Selected Projects (Full Portfolio Items)
    projects: [
        {
            id: "project-1",
            title: "YouTube Documentary Edit",
            category: "featured youtube documentary tutorial motion-graphics",
            categoryBadge: "YouTube",
            desc: "A complete high-retention documentary editing pass featuring fast-paced B-roll overlays, kinetic text captions, animated infographics, sound design layer pass, and color correction.",
            image: "assets/images/project_youtube_doc.jpg",
            video: "assets/videos/main_showreel.mp4",
            youtubeId: "M7lc1UVf-VE",
            youtubeUrl: "https://www.youtube.com/watch?v=M7lc1UVf-VE",
            client: "Mahin Ali Biswas",
            date: "2026",
            duration: "03:22",
            tools: ["Adobe Premiere Pro", "Adobe After Effects", "Audition"]
        },
        {
            id: "project-2",
            title: "Viral Reels & TikToks",
            category: "featured reels-shorts promotional music-videos motion-reel",
            categoryBadge: "Reels / Shorts",
            desc: "Dynamic vertical video edit featuring pop-up emojis, animated Bangla/English motion subtitles, zoom cuts, audio sound effects, and fast-hook intro pacing.",
            image: "assets/images/project_reels_shorts.jpg",
            video: "assets/videos/hero_teaser.mp4",
            youtubeId: "kJQP7kiw5Fk",
            youtubeUrl: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
            client: "Social Media Client",
            date: "2026",
            duration: "00:58",
            tools: ["Adobe Premiere Pro", "After Effects", "Photoshop"]
        },
        {
            id: "project-3",
            title: "Talking Head Corporate",
            category: "corporate talking-head event-videos tutorial",
            categoryBadge: "Corporate",
            desc: "Clean corporate talking-head video editing with smooth jump-cut reduction, lower third titles, background noise removal, and crisp color correction.",
            image: "assets/images/project_talking_head.jpg",
            video: "assets/videos/main_showreel.mp4",
            youtubeId: "aqz-KE-bpKQ",
            youtubeUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
            client: "Corporate Agency",
            date: "2025",
            duration: "04:15",
            tools: ["Adobe Premiere Pro", "DaVinci Resolve", "Audition"]
        },
        {
            id: "project-4",
            title: "Animated Logo Reveals",
            category: "motion-graphics logo-animation promotional motion-reel",
            categoryBadge: "Motion Graphics",
            desc: "High-end 2D/3D logo animation and intro sequence built in Adobe After Effects with custom particle effects, glowing neon accents, and punchy audio SFX.",
            image: "assets/images/project_motion_logo.jpg",
            video: "assets/videos/hero_teaser.mp4",
            youtubeId: "2g811Ko7K8U",
            youtubeUrl: "https://www.youtube.com/watch?v=2g811Ko7K8U",
            client: "Tech Brand",
            date: "2026",
            duration: "00:15",
            tools: ["Adobe After Effects", "Photoshop", "Illustrator"]
        },
        {
            id: "project-5",
            title: "Cinematic Color Pass",
            category: "color-pass documentary music-videos event-videos",
            categoryBadge: "Color Pass",
            desc: "Professional color grading and LUT application on raw Log footage to create a moody, high-budget cinematic look with natural skin tone preservation.",
            image: "assets/images/project_color_pass.jpg",
            video: "assets/videos/main_showreel.mp4",
            youtubeId: "L_LUpnjgPso",
            youtubeUrl: "https://www.youtube.com/watch?v=L_LUpnjgPso",
            client: "Film Director",
            date: "2025",
            duration: "02:40",
            tools: ["DaVinci Resolve", "Adobe Premiere Pro"]
        },
        {
            id: "project-6",
            title: "Commercial Ad Promo",
            category: "commercial-ad corporate featured promotional",
            categoryBadge: "Commercial Ad",
            desc: "High-converting commercial promo video for brand marketing campaigns with energetic pacing, product highlight callouts, kinetic captions, and licensed music.",
            image: "assets/images/project_commercial_ad.jpg",
            video: "assets/videos/hero_teaser.mp4",
            youtubeId: "ScMzIvxBSi4",
            youtubeUrl: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
            client: "E-Commerce Brand",
            date: "2026",
            duration: "01:10",
            tools: ["Adobe Premiere Pro", "After Effects", "Photoshop"]
        }
    ],

    // 5. Services Offered Section
    services: [
        {
            id: "service-1",
            icon: "fa-solid fa-clapperboard",
            title: "YouTube Video Editing",
            desc: "Engaging storytelling edits optimized for watch-time retention, featuring sound FX, zoom cuts, and B-roll transitions.",
            checkpoints: ["High-Retention Pacing", "B-Roll & Visual Enhancements", "Custom Thumbnails & Intros"]
        },
        {
            id: "service-2",
            icon: "fa-solid fa-mobile-screen-button",
            title: "Reels, Shorts & TikToks",
            desc: "High-energy vertical video edits with animated subtitles, pop-up graphics, and trending audio sync.",
            checkpoints: ["Animated Bangla/English Subtitles", "Fast Hook & Visual Effects", "9:16 Vertical Optimization"]
        },
        {
            id: "service-3",
            icon: "fa-solid fa-microphone-lines",
            title: "Talking Head & Course Videos",
            desc: "Polished corporate talking head videos, podcast editing, online course modules, and educational videos.",
            checkpoints: ["Seamless Jump-cut Smoothing", "Lower Thirds & Screen Graphics", "Audio Noise Reduction"]
        },
        {
            id: "service-4",
            icon: "fa-solid fa-wand-magic-sparkles",
            title: "Motion Graphics & Captions",
            desc: "Eye-catching 2D/3D title animations, animated infographics, lower thirds, and logo reveals.",
            checkpoints: ["Dynamic Motion Captions", "2D/3D Animated Logo Intros", "Custom Motion Elements"]
        },
        {
            id: "service-5",
            icon: "fa-solid fa-palette",
            title: "Color Grading & Correction",
            desc: "Cinematic color grading passes to give your video footage a vibrant, high-budget film look.",
            checkpoints: ["Log Footage Color Balancing", "Filmic LUTs & Tone Matching", "Skin Tone Perfection"]
        },
        {
            id: "service-6",
            icon: "fa-solid fa-sliders",
            title: "Audio Mixing & Sound Design",
            desc: "Immersive sound design with impact SFX, swooshes, background music mixing, and crystal clear voiceovers.",
            checkpoints: ["Custom Sound Effects Layering", "Dialogue Audio Mastering", "Background Music Balance"]
        }
    ],

    // 6. Software Toolkit Section
    software: [
        {
            id: "soft-1",
            title: "After Effects",
            subtitle: "Motion Graphics & Kinetic Subtitles",
            icon: "assets/images/software/ae_icon.png",
            level: 98
        },
        {
            id: "soft-2",
            title: "Premiere Pro",
            subtitle: "Primary Video Editing Suite",
            icon: "assets/images/software/pr_icon.png",
            level: 96
        },
        {
            id: "soft-3",
            title: "Adobe Photoshop",
            subtitle: "Thumbnail & Visual Asset Design",
            icon: "assets/images/software/ps_icon.png",
            level: 94
        },
        {
            id: "soft-4",
            title: "Adobe Illustrator",
            subtitle: "Vector Graphics & Motion Asset Prep",
            icon: "assets/images/software/ai_icon.png",
            level: 92
        },
        {
            id: "soft-5",
            title: "Canva",
            subtitle: "Social Media Templates & Design",
            icon: "assets/images/software/canva_icon.png",
            isCanva: true,
            level: 90
        },
        {
            id: "soft-6",
            title: "Figma",
            subtitle: "UI Layouts, Overlays & Web Assets",
            icon: "assets/images/software/figma_icon.png",
            level: 88
        }
    ],

    // 7. Marquee Ticker Items
    ticker: [
        { icon: "fa-brands fa-youtube", text: "YOUTUBE CONTENT" },
        { icon: "fa-solid fa-film", text: "REELS & SHORTS" },
        { icon: "fa-solid fa-bolt", text: "MOTION GRAPHICS" },
        { icon: "fa-solid fa-sliders", text: "COLOR GRADING" },
        { icon: "fa-solid fa-microphone", text: "TALKING HEADS" },
        { icon: "fa-brands fa-behance", text: "BEHANCE PORTFOLIO" },
        { icon: "fa-solid fa-wand-magic-sparkles", text: "2D/3D TITLE ANIMATION" }
    ],

    // 8. Contact & Socials
    contact: {
        email: "mahinali2322@gmail.com",
        whatsapp: "+8801700000000",
        behanceUrl: "https://www.behance.net/mahinalibiswas",
        youtubeUrl: "https://www.youtube.com/@mahinalibiswas",
        facebookUrl: "https://www.facebook.com/mahinalibiswas",
        location: "Dhaka, Bangladesh (Available Worldwide)",
        subtitle: "Have a video editing or motion graphics project in mind? Fill out the form or reach out directly to discuss your requirements."
    }
};

/**
 * Gets current site data from localStorage or initializes with default
 */
function getSiteData() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return {
                ...DEFAULT_SITE_DATA,
                ...parsed,
                hero: { ...DEFAULT_SITE_DATA.hero, ...(parsed.hero || {}) },
                about: { ...DEFAULT_SITE_DATA.about, ...(parsed.about || {}) },
                showreel: { ...DEFAULT_SITE_DATA.showreel, ...(parsed.showreel || {}) },
                contact: { ...DEFAULT_SITE_DATA.contact, ...(parsed.contact || {}) }
            };
        }
    } catch (e) {
        console.error("Error reading site data from localStorage", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_SITE_DATA));
}

/**
 * Saves updated site data to localStorage
 */
function saveSiteData(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        return true;
    } catch (e) {
        console.error("Error saving site data to localStorage", e);
        return false;
    }
}

/**
 * Gets current admin password
 */
function getAdminPassword() {
    return localStorage.getItem(PASSWORD_STORAGE_KEY) || DEFAULT_ADMIN_PASSWORD;
}

/**
 * Sets new admin password
 */
function setAdminPassword(newPassword) {
    if (newPassword && newPassword.trim().length >= 4) {
        localStorage.setItem(PASSWORD_STORAGE_KEY, newPassword.trim());
        return true;
    }
    return false;
}

/**
 * Resets site data back to default
 */
function resetSiteDataToDefault() {
    localStorage.removeItem(STORAGE_KEY);
    return JSON.parse(JSON.stringify(DEFAULT_SITE_DATA));
}
