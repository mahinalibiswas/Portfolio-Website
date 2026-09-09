/* ==========================================================================
   PORTFOLIO WEBSITE DYNAMIC SITE RENDERER ENGINE
   Hydrates index.html with live content from siteData (localStorage/Defaults).
   ========================================================================== */

function extractYoutubeId(url) {
    if (!url) return null;
    let str = url.trim();
    if (str.startsWith('data:video') || str.startsWith('blob:') || /\.(mp4|webm|mov|ogg)($|\?)/i.test(str)) {
        return null;
    }

    if (str.includes('<iframe')) {
        const srcMatch = str.match(/src=["']([^"']+)["']/);
        if (srcMatch && srcMatch[1]) {
            str = srcMatch[1];
        }
    }

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
    // 1. Render immediate local cache
    renderSiteData();

    // 2. Fetch live Cloud Database data & re-render for all visitors worldwide (~100ms)
    if (typeof fetchCloudSiteData === 'function') {
        fetchCloudSiteData((cloudData) => {
            renderSiteData(cloudData);
        });
    }
});

function renderSiteData(customData) {
    if (typeof getSiteData !== 'function' && !customData) return;
    const data = customData || (typeof getSiteData === 'function' ? getSiteData() : null) || (typeof DEFAULT_SITE_DATA !== 'undefined' ? DEFAULT_SITE_DATA : null);
    if (!data) return;

    // 0. Render Navigation Bar
    if (data.navigation) {
        const brandLogo = document.querySelector('.nav-logo');
        if (brandLogo) brandLogo.textContent = data.navigation.brandLogo || "MAHIN.";

        const navCtaBtn = document.querySelector('.nav-cta-btn');
        if (navCtaBtn) {
            navCtaBtn.textContent = data.navigation.ctaText || "Hire Me";
            if (data.navigation.ctaUrl) navCtaBtn.setAttribute('href', data.navigation.ctaUrl);
        }

        const navLinksContainer = document.getElementById('navLinks');
        if (navLinksContainer && Array.isArray(data.navigation.navLinks) && data.navigation.navLinks.length > 0) {
            navLinksContainer.innerHTML = data.navigation.navLinks.map(link => 
                `<a href="${link.url}" class="nav-link">${link.label}</a>`
            ).join('');
        }
    }

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
                const iframeStart = rawInput.indexOf('<iframe');
                let cleanIframe = rawInput.substring(iframeStart);
                cleanIframe = cleanIframe.replace(/width="[^"]*"/g, 'width="100%"').replace(/height="[^"]*"/g, 'height="100%"');
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
                    if (rawInput.startsWith('idb:') && typeof resolveMediaUrl === 'function') {
                        resolveMediaUrl(rawInput).then(resolved => {
                            const vidEl = document.getElementById('heroMainVideo');
                            if (vidEl && resolved) vidEl.src = resolved;
                        });
                    }
                    const bigPlayBtn = document.getElementById('heroBigPlayBtn');
                    if (bigPlayBtn) {
                        bigPlayBtn.addEventListener('click', async () => {
                            let playUrl = rawInput;
                            if (playUrl.startsWith('idb:') && typeof resolveMediaUrl === 'function') {
                                playUrl = await resolveMediaUrl(playUrl);
                            }
                            if (typeof openDirectVideoModal === 'function') openDirectVideoModal(playUrl);
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
                    const encodedSrc = encodeURIComponent(btn.link || 'assets/videos/main_showreel.mp4');
                    return `
                        <button class="btn btn-primary trigger-video-modal" data-video-src="${encodedSrc}">
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

            heroCtaGroup.querySelectorAll('.trigger-video-modal').forEach(playBtn => {
                playBtn.addEventListener('click', () => {
                    const rawSrc = playBtn.getAttribute('data-video-src') || '';
                    let videoSrc = 'assets/videos/main_showreel.mp4';
                    if (rawSrc) {
                        try {
                            videoSrc = decodeURIComponent(rawSrc);
                        } catch (e) {
                            videoSrc = rawSrc;
                        }
                    }
                    if (typeof openDirectVideoModal === 'function') openDirectVideoModal(videoSrc);
                });
            });
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
        const aboutCtaGroup = document.querySelector('.about-cta-group');
        if (aboutCtaGroup && data.about.ctaButtons && Array.isArray(data.about.ctaButtons) && data.about.ctaButtons.length > 0) {
            aboutCtaGroup.innerHTML = data.about.ctaButtons.map((btn, idx) => {
                const isPrimary = idx === 0;
                const btnClass = isPrimary ? 'btn btn-primary' : 'btn btn-hero-secondary';
                const targetAttr = (btn.link && btn.link.startsWith('http')) ? 'target="_blank" rel="noopener noreferrer"' : '';
                const defaultIcon = isPrimary ? 'fa-brands fa-behance' : 'fa-solid fa-paper-plane';
                const iconHtml = btn.iconImage 
                    ? `<img src="${btn.iconImage}" style="width: 18px; height: 18px; object-fit: contain;">`
                    : `<i class="${btn.icon || defaultIcon}"></i>`;

                return `
                    <a href="${btn.link || '#'}" ${targetAttr} class="${btnClass}">
                        <span>${btn.text}</span>
                        <span class="btn-icon-circle">${iconHtml}</span>
                    </a>
                `;
            }).join('');
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

        const playerBox = document.getElementById('showreelPlayerBox');
        if (playerBox) {
            const rawUrl = (data.showreel.videoUrl || data.showreel.youtubeUrl || "https://www.youtube.com/watch?v=deQijHls--0").trim();
            const posterUrl = data.showreel.poster || data.showreel.showreelPoster || "assets/images/hero_showreel_cover.jpg";
            
            let ytId = null;
            if (typeof extractYoutubeId === 'function') {
                ytId = extractYoutubeId(rawUrl);
            }
            if (!ytId && data.showreel.youtubeId) {
                ytId = data.showreel.youtubeId;
            }

            if (ytId) {
                const iframeSrc = `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&enablejsapi=1&playsinline=1&rel=0&modestbranding=1&loop=1&playlist=${ytId}`;
                const existingIframe = playerBox.querySelector('iframe');
                if (!existingIframe || !existingIframe.src.includes(ytId)) {
                    playerBox.innerHTML = `
                        <iframe id="directShowreelIframe" src="${iframeSrc}" title="Featured Motion & Video Reel" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="width: 100%; height: 100%; border: none; border-radius: 16px;"></iframe>
                    `;
                }
            } else if (rawUrl.includes('<iframe')) {
                const iframeStart = rawUrl.indexOf('<iframe');
                let clean = rawUrl.substring(iframeStart).replace(/width="[^"]*"/g, 'width="100%"').replace(/height="[^"]*"/g, 'height="100%"');
                clean = clean.replace(/src="([^"]+)"/, (match, srcVal) => {
                    const delim = srcVal.includes('?') ? '&' : '?';
                    let newSrc = srcVal;
                    if (!newSrc.includes('enablejsapi=1')) newSrc += delim + 'enablejsapi=1';
                    if (!newSrc.includes('autoplay=1')) newSrc += '&autoplay=1';
                    if (!newSrc.includes('mute=1')) newSrc += '&mute=1';
                    if (!newSrc.includes('playsinline=1')) newSrc += '&playsinline=1';
                    return `src="${newSrc}" id="directShowreelIframe" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"`;
                });
                playerBox.innerHTML = clean;
            } else {
                let videoEl = document.getElementById('directShowreelVideo');
                if (!videoEl) {
                    playerBox.innerHTML = `
                        <video id="directShowreelVideo" src="${rawUrl}" class="showreel-video-element" controls autoplay loop muted playsinline poster="${posterUrl}"></video>
                        <div class="showreel-controls-overlay" id="showreelOverlay" style="opacity:0; pointer-events:none;">
                            <button class="big-play-btn" id="mainPlayBtn">
                                <i class="fa-solid fa-play"></i>
                            </button>
                            <div class="showreel-meta">
                                <h3>Mahin Ali Biswas Official Video Showcase</h3>
                                <p>Tools: Premiere Pro, After Effects, DaVinci Resolve, Audition</p>
                            </div>
                        </div>
                    `;
                    if (rawUrl.startsWith('idb:') && typeof resolveMediaUrl === 'function') {
                        resolveMediaUrl(rawUrl).then(resolved => {
                            const v = document.getElementById('directShowreelVideo');
                            if (v && resolved) { v.src = resolved; v.load(); }
                        });
                    }
                } else {
                    if (rawUrl.startsWith('idb:') && typeof resolveMediaUrl === 'function') {
                        resolveMediaUrl(rawUrl).then(resolved => {
                            if (videoEl.src !== resolved) {
                                videoEl.src = resolved;
                                if (posterUrl) videoEl.poster = posterUrl;
                                videoEl.load();
                            }
                        });
                    } else if (videoEl.src !== rawUrl && !videoEl.src.includes(rawUrl)) {
                        videoEl.src = rawUrl;
                        if (posterUrl) videoEl.poster = posterUrl;
                        videoEl.load();
                    }
                }
            }
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
                    </div>

                    <div class="card-body">
                        <span class="card-category-pill">${proj.categoryBadge || 'Video Project'}</span>
                        <h3 class="card-title">${proj.title}</h3>
                        <p class="card-desc">${proj.desc}</p>
                        ${proj.desc && proj.desc.length > 80 ? `<button class="card-desc-more-btn" aria-label="Expand Description">See More <i class="fa-solid fa-chevron-down"></i></button>` : ''}
                    </div>
                    
                    <div class="card-footer">
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
            `).join('');

            // Re-initialize details buttons event listeners
            if (typeof initProjectDetailEvents === 'function') {
                initProjectDetailEvents();
            }
        }
    }

    // 4.5 Render Shorts & Reels Section
    const shortsHeader = data.shortsHeader || (typeof DEFAULT_SITE_DATA !== 'undefined' ? DEFAULT_SITE_DATA.shortsHeader : null);
    if (shortsHeader) {
        const shortsSec = document.getElementById('shorts');
        if (shortsSec) {
            const titleEl = shortsSec.querySelector('.section-title');
            if (titleEl) {
                titleEl.innerHTML = `${shortsHeader.titleTop || 'Short'} <span class="gradient-text">${shortsHeader.titleGradient || 'Video'}</span>`;
            }
            const descEl = shortsSec.querySelector('.section-desc');
            if (descEl && shortsHeader.desc) {
                descEl.textContent = shortsHeader.desc;
            }
        }
    }

    const shortsData = data.shorts || (typeof DEFAULT_SITE_DATA !== 'undefined' ? DEFAULT_SITE_DATA.shorts : null);
    if (shortsData && Array.isArray(shortsData) && shortsData.length > 0) {
        const shortsTrack = document.getElementById('shortsTrack');
        if (shortsTrack) {
            shortsTrack.innerHTML = shortsData.map((short, idx) => `
                <div class="short-card" id="${short.id || 'short-' + (idx + 1)}" data-short-id="${short.id || 'short-' + (idx + 1)}">
                    <div class="short-media-frame">
                        <img src="${short.image}" alt="${short.title}" class="short-card-img">
                        <button class="short-play-btn open-reel-btn" data-short-id="${short.id}" aria-label="Play Reel">
                            <i class="fa-solid fa-play"></i>
                        </button>
                    </div>
                    <div class="short-card-body">
                        <h4 class="short-card-title">${short.title}</h4>
                        <p class="short-card-meta"><i class="fa-regular fa-clock"></i> ${(typeof resolveShortDuration === 'function' ? resolveShortDuration(short, idx) : short.duration) || '1:24'} &nbsp;•&nbsp; ${short.client || 'Client'}</p>
                        <button class="card-details-btn short-reel-details-btn" data-short-id="${short.id}">Details</button>
                    </div>
                </div>
            `).join('');

            // Re-init shorts carousel if available
            if (typeof window.initShortsCarousel === 'function') {
                window.initShortsCarousel();
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
