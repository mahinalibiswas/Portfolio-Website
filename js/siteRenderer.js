/* ==========================================================================
   PORTFOLIO WEBSITE DYNAMIC SITE RENDERER ENGINE
   Hydrates index.html with live content from siteData (localStorage/Defaults).
   ========================================================================== */

function extractYoutubeId(url) {
    if (!url) return null;
    const str = url.trim();
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = str.match(regExp);
    if (match && match[2] && match[2].length === 11) {
        return match[2];
    }
    if (str.length === 11 && !str.includes('/') && !str.includes('.')) {
        return str;
    }
    return null;
}

document.addEventListener('DOMContentLoaded', () => {
    renderSiteData();
});

function renderSiteData() {
    if (typeof getSiteData !== 'function') return;
    const data = getSiteData();

    // 1. Render Hero Section
    if (data.hero) {
        const heroBadge = document.querySelector('.hero-badge span:last-child');
        if (heroBadge) heroBadge.textContent = data.hero.badge || "MOTION & VIDEO ARTIST";

        const titleTop = document.querySelector('.hero-title .title-top');
        if (titleTop) titleTop.textContent = data.hero.titleTop || "MAHIN ALI";

        const titleBottom = document.querySelector('.hero-title .title-bottom');
        if (titleBottom) titleBottom.textContent = data.hero.titleBottom || "BISWAS";

        const subtitleTag = document.querySelector('.hero-subtitle-tag');
        if (subtitleTag) subtitleTag.textContent = data.hero.subtitleTag || "Motion Graphics Artist & Senior Video Editor";

        const subtitle = document.querySelector('.hero-subtitle');
        if (subtitle) subtitle.textContent = data.hero.subtitle || "";

        const heroMainCard = document.getElementById('heroMainCard');
        if (heroMainCard) {
            const rawInput = (data.hero.showreelVideo || '').trim();
            const posterUrl = (data.hero.showreelPoster || '').trim();

            if (!rawInput) {
                if (posterUrl) {
                    heroMainCard.innerHTML = `<img src="${posterUrl}" alt="Hero Cover" style="width:100%; height:100%; object-fit:cover; border-radius:20px;">`;
                } else {
                    heroMainCard.innerHTML = `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#000; color:var(--text-dim); border-radius:20px; font-size:0.9rem;"><span>No Video Link or Embed Code Set</span></div>`;
                }
            } else if (rawInput.includes('<iframe')) {
                let cleanIframe = rawInput.replace(/width="[^"]*"/g, 'width="100%"').replace(/height="[^"]*"/g, 'height="100%"');
                if (!cleanIframe.includes('style=')) {
                    cleanIframe = cleanIframe.replace('<iframe', '<iframe style="width:100%; height:100%; border:none; border-radius:20px;"');
                }
                heroMainCard.innerHTML = cleanIframe;
            } else {
                const ytId = extractYoutubeId(rawInput);
                if (ytId) {
                    heroMainCard.innerHTML = `
                        <iframe src="https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1" 
                                title="Hero Showreel Video" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                referrerpolicy="strict-origin-when-cross-origin"
                                allowfullscreen 
                                style="width: 100%; height: 100%; border: none; border-radius: 20px;">
                        </iframe>
                    `;
                } else {
                    heroMainCard.innerHTML = `
                        <video id="heroMainVideo" src="${rawInput}" class="main-card-video" autoplay loop muted playsinline poster="${posterUrl}"></video>
                        <div class="main-card-overlay">
                            <button class="hero-big-play-btn" id="heroBigPlayBtn" aria-label="Play Video Reel">
                                <i class="fa-solid fa-play"></i>
                            </button>
                        </div>
                    `;
                    const bigPlayBtn = document.getElementById('heroBigPlayBtn');
                    if (bigPlayBtn) {
                        bigPlayBtn.addEventListener('click', () => {
                            if (typeof openDirectVideoModal === 'function') openDirectVideoModal(rawInput);
                        });
                    }
                }
            }
        }

        // Stats Counters
        const statBoxes = document.querySelectorAll('.hero-stats .stat-box');
        if (statBoxes.length >= 3) {
            if (statBoxes[0].querySelector('h3')) statBoxes[0].querySelector('h3').textContent = data.hero.statsEdited || "100+";
            if (statBoxes[1].querySelector('h3')) statBoxes[1].querySelector('h3').textContent = data.hero.statsClients || "50+";
            if (statBoxes[2].querySelector('h3')) statBoxes[2].querySelector('h3').textContent = data.hero.statsDelivery || "100%";
        }

        // Dynamic Hero CTA Buttons
        const heroCtaGroup = document.querySelector('.hero-cta-group');
        if (heroCtaGroup && data.hero.ctaButtons && Array.isArray(data.hero.ctaButtons)) {
            heroCtaGroup.innerHTML = data.hero.ctaButtons.map((btn) => {
                let iconHtml = '';
                if (btn.iconImage) {
                    iconHtml = `<img src="${btn.iconImage}" alt="" style="width: 18px; height: 18px; object-fit: contain;">`;
                } else if (btn.icon) {
                    iconHtml = `<i class="${btn.icon}"></i>`;
                }

                if (btn.isModal) {
                    return `
                        <button class="btn btn-primary" id="heroPlayReelBtn" data-video-src="${btn.link || 'assets/videos/main_showreel.mp4'}">
                            <span>${btn.text}</span>
                            <span class="btn-icon-circle">${iconHtml || '<i class="fa-solid fa-play"></i>'}</span>
                        </button>
                    `;
                } else {
                    return `
                        <a href="${btn.link || '#contact'}" class="btn btn-hero-secondary" style="display: inline-flex; align-items: center; gap: 0.55rem;">
                            ${iconHtml} <span>${btn.text}</span>
                        </a>
                    `;
                }
            }).join('');

            const playBtn = document.getElementById('heroPlayReelBtn');
            if (playBtn) {
                playBtn.addEventListener('click', () => {
                    const videoSrc = playBtn.getAttribute('data-video-src') || 'assets/videos/main_showreel.mp4';
                    if (typeof openDirectVideoModal === 'function') openDirectVideoModal(videoSrc);
                });
            }
        }

        // Social Links
        const heroBehance = document.querySelector('.hero-social-links a[href*="behance"]');
        if (heroBehance && data.hero.behanceUrl) heroBehance.href = data.hero.behanceUrl;

        const heroYoutube = document.querySelector('.hero-social-links a[href*="youtube"]');
        if (heroYoutube && data.hero.youtubeUrl) heroYoutube.href = data.hero.youtubeUrl;

        const heroFacebook = document.querySelector('.hero-social-links a[href*="facebook"]');
        if (heroFacebook && data.hero.facebookUrl) heroFacebook.href = data.hero.facebookUrl;
    }

    // 2. Render About Section
    if (data.about) {
        const aboutBadge = document.querySelector('.about-tag-badge span');
        if (aboutBadge) aboutBadge.textContent = data.about.tagBadge || "ABOUT THE ARTIST";

        const aboutTitle = document.querySelector('.about-text-content .section-title');
        if (aboutTitle) {
            aboutTitle.innerHTML = `${data.about.titleTop || "Elevating Content Through"} <span class="gradient-text">${data.about.titleGradient || "Motion & Storytelling"}</span>`;
        }

        const aboutDesc = document.querySelector('.about-desc');
        if (aboutDesc) aboutDesc.innerHTML = data.about.bio || "";

        const expYears = document.querySelector('.exp-years');
        if (expYears) expYears.textContent = data.about.expYears || "3+";

        const expSub = document.querySelector('.exp-sub');
        if (expSub) expSub.textContent = data.about.expSub || "Motion & Video Specialist";

        // About CTA Buttons
        const aboutBehanceBtn = document.querySelector('.about-cta-group a[href*="behance"]');
        if (aboutBehanceBtn) {
            const behanceSpan = aboutBehanceBtn.querySelector('span:first-child');
            if (behanceSpan && data.about.btnBehanceText) behanceSpan.textContent = data.about.btnBehanceText;
            if (data.about.btnBehanceUrl) aboutBehanceBtn.href = data.about.btnBehanceUrl;
        }

        const aboutContactBtn = document.querySelector('.about-cta-group a[href*="#contact"]');
        if (aboutContactBtn) {
            if (data.about.btnContactText) aboutContactBtn.textContent = data.about.btnContactText;
            if (data.about.btnContactLink) aboutContactBtn.href = data.about.btnContactLink;
        }

        // 4 Feature Boxes
        if (data.about.features && Array.isArray(data.about.features)) {
            const featureBoxes = document.querySelectorAll('.about-feature-box');
            data.about.features.forEach((feat, index) => {
                if (featureBoxes[index]) {
                    const iconEl = featureBoxes[index].querySelector('.feature-icon i');
                    if (iconEl) iconEl.className = feat.icon;

                    const h4El = featureBoxes[index].querySelector('h4');
                    if (h4El) h4El.textContent = feat.title;

                    const pEl = featureBoxes[index].querySelector('p');
                    if (pEl) pEl.textContent = feat.desc;
                }
            });
        }
    }

    // 3. Render Showreel Section
    if (data.showreel) {
        const showreelSub = document.querySelector('#showreel .section-subtitle');
        if (showreelSub) showreelSub.textContent = data.showreel.subtitle || "// HIGHLIGHT SHOWREEL";

        const showreelTitle = document.querySelector('#showreel .section-title');
        if (showreelTitle) {
            showreelTitle.innerHTML = `${data.showreel.titleTop || "Featured Motion &"} <span class="gradient-text">${data.showreel.titleGradient || "Video Reel"}</span>`;
        }

        const showreelDesc = document.querySelector('#showreel .section-desc');
        if (showreelDesc) showreelDesc.textContent = data.showreel.desc || "";

        const directShowreelVideo = document.getElementById('directShowreelVideo');
        if (directShowreelVideo && data.showreel.videoUrl) {
            directShowreelVideo.src = data.showreel.videoUrl;
        }
    }

    // 4. Render Projects Grid
    if (data.projects && Array.isArray(data.projects)) {
        const worksGrid = document.getElementById('worksGrid');
        if (worksGrid) {
            worksGrid.innerHTML = data.projects.map((proj, index) => `
                <div class="work-card" data-category="${proj.category || 'featured'}" data-id="${proj.id || 'project-' + (index + 1)}">
                    <div class="card-media-frame">
                        <img src="${proj.image}" alt="${proj.title}" class="card-img">
                        <button class="card-glass-play-btn view-project-btn" data-id="${proj.id}" aria-label="Play Video">
                            <i class="fa-solid fa-play"></i>
                        </button>
                        <span class="card-category-pill">${proj.categoryBadge || 'Video Project'}</span>
                    </div>

                    <div class="card-text-block">
                        <h3 class="card-project-title">${proj.title}</h3>
                        <p class="card-project-desc">${proj.desc}</p>
                        
                        <div class="card-bottom-bar">
                            <div class="card-author-info">
                                <div class="card-author-avatar">
                                    <img src="assets/images/mahin_profile.jpg" alt="${proj.client || 'Mahin Ali Biswas'}">
                                </div>
                                <div class="card-author-text">
                                    <span class="author-name">${proj.client || 'Mahin Ali Biswas'}</span>
                                    <span class="project-date">${proj.date || '2026'}</span>
                                </div>
                            </div>
                            <button class="card-details-btn" data-id="${proj.id}">Details</button>
                        </div>
                    </div>
                </div>
            `).join('');

            // Re-initialize details buttons event listeners
            if (typeof initProjectDetailEvents === 'function') {
                initProjectDetailEvents();
            }
        }
    }

    // 5. Render Services Grid
    if (data.services && Array.isArray(data.services)) {
        const servicesGrid = document.querySelector('.services-grid');
        if (servicesGrid) {
            servicesGrid.innerHTML = data.services.map(serv => `
                <div class="service-card">
                    <div class="service-icon-box"><i class="${serv.icon}"></i></div>
                    <h3>${serv.title}</h3>
                    <p>${serv.desc}</p>
                    <ul class="service-list">
                        ${(serv.checkpoints || []).map(cp => `<li><i class="fa-solid fa-check"></i> ${cp}</li>`).join('')}
                    </ul>
                </div>
            `).join('');
        }
    }

    // 6. Render Software Toolkit
    if (data.software && Array.isArray(data.software)) {
        const toolsGrid = document.querySelector('.tools-grid');
        if (toolsGrid) {
            toolsGrid.innerHTML = data.software.map(soft => `
                <div class="tool-badge-card">
                    <div class="tool-icon-frame ${soft.isCanva ? 'canva-badge-frame' : ''}">
                        <img src="${soft.icon}" alt="${soft.title}" class="software-logo-img ${soft.isCanva ? 'canva-logo' : ''}">
                    </div>
                    <div class="tool-info">
                        <h4>${soft.title}</h4>
                        <span>${soft.subtitle}</span>
                    </div>
                    <div class="tool-level"><div class="level-bar" style="width: ${soft.level || 90}%;"></div></div>
                </div>
            `).join('');
        }
    }

    // 7. Render Contact Section
    if (data.contact) {
        const contactSub = document.querySelector('#contact .contact-text');
        if (contactSub) contactSub.textContent = data.contact.subtitle || "";

        const emailVal = document.querySelector('.method-item a[href^="mailto:"]');
        if (emailVal) {
            emailVal.href = `mailto:${data.contact.email}`;
            emailVal.textContent = data.contact.email;
        }

        const phoneVal = document.querySelector('.method-item a[href^="https://wa.me"]');
        if (phoneVal) {
            const cleanNum = (data.contact.whatsapp || '').replace(/[^0-9+]/g, '');
            phoneVal.href = `https://wa.me/${cleanNum}`;
            phoneVal.textContent = data.contact.whatsapp;
        }

        const locVal = document.querySelectorAll('.method-val')[2];
        if (locVal) locVal.textContent = data.contact.location || "Dhaka, Bangladesh (Available Worldwide)";
    }
}
