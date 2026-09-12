/* ==========================================================================
   MAHIN MOTION DESIGN STUDIO - MAIN SCRIPT
   ========================================================================== */

// 0. Force Always Scroll to Top on Every Page Refresh / Reload
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

window.addEventListener('beforeunload', () => {
    window.scrollTo(0, 0);
});

// Clear any location hash on reload so browser doesn't anchor-jump to lower sections
if (window.location.hash) {
    history.replaceState(null, null, window.location.pathname + window.location.search);
}
window.scrollTo(0, 0);

document.addEventListener('DOMContentLoaded', () => {
    window.scrollTo(0, 0);

    /* --- 0. Ultra-Smooth Momentum Scrolling Engine (Lenis) --- */
    if (typeof Lenis !== 'undefined') {
        const lenis = new Lenis({
            duration: 1.25,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1.0,
            touchMultiplier: 1.6,
            infinite: false
        });

        window.lenis = lenis;

        // Force Lenis to start at the top (Hero section) immediately
        lenis.scrollTo(0, { immediate: true });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        // Smooth scroll delegation for internal anchor links
        document.addEventListener('click', (e) => {
            const anchor = e.target.closest('a[href^="#"]');
            if (anchor) {
                const targetId = anchor.getAttribute('href');
                if (targetId && targetId !== '#' && targetId.length > 1) {
                    const targetEl = document.querySelector(targetId);
                    if (targetEl) {
                        e.preventDefault();
                        lenis.scrollTo(targetEl, { offset: -70, duration: 1.3 });
                    }
                }
            }
        });
    }

    /* --- 1. Custom Glowing Cursor (Perfect Dead-Center Alignment) --- */
    const cursorDot = document.getElementById('cursorDot');
    const cursorOutline = document.getElementById('cursorOutline');

    if (cursorDot && cursorOutline && window.innerWidth > 768) {
        let mouseX = -100, mouseY = -100;
        let outlineX = -100, outlineY = -100;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursorDot.style.left = `${mouseX}px`;
            cursorDot.style.top = `${mouseY}px`;
            cursorDot.style.opacity = '1';
            cursorOutline.style.opacity = '1';
        });

        window.addEventListener('mouseleave', () => {
            cursorDot.style.opacity = '0';
            cursorOutline.style.opacity = '0';
        });

        function animateCursor() {
            // Smooth lerp following
            outlineX += (mouseX - outlineX) * 0.18;
            outlineY += (mouseY - outlineY) * 0.18;

            cursorOutline.style.left = `${outlineX}px`;
            cursorOutline.style.top = `${outlineY}px`;

            requestAnimationFrame(animateCursor);
        }
        animateCursor();
    }

    /* --- 2. Interactive Kinetic Canvas Background --- */
    const canvas = document.getElementById('kineticCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        });

        const particles = [];
        const particleCount = Math.min(Math.floor(width / 35), 45);

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.4;
                this.vy = (Math.random() - 0.5) * 0.4;
                this.radius = Math.random() * 1.8 + 0.8;
                this.color = ['#84cc16', '#a3e635', '#10b981', '#bef264'][Math.floor(Math.random() * 4)];
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.color;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }

        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        function animateCanvas() {
            ctx.clearRect(0, 0, width, height);

            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();

                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(163, 230, 53, ${0.12 - dist / 1000})`;
                        ctx.lineWidth = 0.6;
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(animateCanvas);
        }
        animateCanvas();
    }

    /* --- 3. Navbar Sticky Effect, Scroll Spy & Mobile Navigation Drawer --- */
    const navbarWrapper = document.querySelector('.navbar-wrapper');
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const closeMobileNavBtn = document.getElementById('closeMobileNavBtn');
    const mobileNavDrawer = document.getElementById('mobileNavDrawer');
    const mobileNavBackdrop = document.getElementById('mobileNavBackdrop');
    const mobileDrawerContactBtn = document.getElementById('mobileDrawerContactBtn');

    function openMobileNav() {
        if (mobileNavDrawer && mobileNavBackdrop) {
            mobileNavDrawer.classList.add('active');
            mobileNavBackdrop.classList.add('active');
            mobileNavDrawer.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            if (window.lenis) window.lenis.stop();
        }
    }

    function closeMobileNav() {
        if (mobileNavDrawer && mobileNavBackdrop) {
            mobileNavDrawer.classList.remove('active');
            mobileNavBackdrop.classList.remove('active');
            mobileNavDrawer.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
            if (window.lenis) window.lenis.start();
        }
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (mobileNavDrawer && mobileNavDrawer.classList.contains('active')) {
                closeMobileNav();
            } else {
                openMobileNav();
            }
        });
    }

    if (closeMobileNavBtn) {
        closeMobileNavBtn.addEventListener('click', closeMobileNav);
    }

    if (mobileNavBackdrop) {
        mobileNavBackdrop.addEventListener('click', closeMobileNav);
    }

    mobileNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeMobileNav();
        });
    });

    if (mobileDrawerContactBtn) {
        mobileDrawerContactBtn.addEventListener('click', () => {
            closeMobileNav();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileNavDrawer?.classList.contains('active')) {
            closeMobileNav();
        }
    });

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbarWrapper?.classList.add('scrolled');
        } else {
            navbarWrapper?.classList.remove('scrolled');
        }

        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });

        mobileNavLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });

    /* --- 4. Hero Section Playlist Switcher (Exact Screenshot Interactive UX) --- */
    const heroPlaylist = document.getElementById('heroPlaylist');
    const heroMainVideo = document.getElementById('heroMainVideo');
    const heroMainTitle = document.getElementById('heroMainTitle');
    const heroMainSub = document.getElementById('heroMainSub');
    const heroBigPlayBtn = document.getElementById('heroBigPlayBtn');

    if (heroPlaylist && heroMainVideo) {
        const thumbCards = heroPlaylist.querySelectorAll('.thumb-card');

        thumbCards.forEach(card => {
            card.addEventListener('click', () => {
                thumbCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');

                const videoSrc = card.getAttribute('data-video');
                const posterSrc = card.getAttribute('data-poster');
                const titleText = card.getAttribute('data-title');
                const subText = card.getAttribute('data-sub');

                heroMainVideo.src = videoSrc;
                heroMainVideo.poster = posterSrc;
                heroMainVideo.play();

                if (heroMainTitle && titleText) heroMainTitle.textContent = titleText;
                if (heroMainSub && subText) heroMainSub.innerHTML = `<span class="highlight-green">${subText}</span>`;
            });
        });
    }

    /* --- 5. Direct HTML5 Video Modal Lightbox --- */
    const videoModal = document.getElementById('videoModal');
    const closeVideoModal = document.getElementById('closeVideoModal');
    const modalHtml5Video = document.getElementById('modalHtml5Video');
    const heroPlayReelBtn = document.getElementById('heroPlayReelBtn');
    const showreelOverlay = document.getElementById('showreelOverlay');
    const mainPlayBtn = document.getElementById('mainPlayBtn');
    const directShowreelVideo = document.getElementById('directShowreelVideo');

    function extractYoutubeId(url) {
        if (!url || typeof url !== 'string') return null;
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
        return (match && match[2] && match[2].length === 11) ? match[2] : (str.length === 11 && !str.includes('/') && !str.includes('.') ? str : null);
    }

    function openDirectVideoModal(videoSrc) {
        window.lenis?.stop();
        if (!videoModal) videoModal = document.getElementById('directVideoModal');
        if (!videoModal) return;
        const wrapper = videoModal.querySelector('.video-responsive-wrapper');
        const raw = (videoSrc || '').trim();

        if (wrapper) {
            const isVertical = raw.includes('/shorts/') || 
                              raw.includes('height="848"') || 
                              raw.includes('height="800"') || 
                              raw.includes('477') || 
                              raw.toLowerCase().includes('short') || 
                              raw.includes('AOWpWckDgLk');

            let iframeStyle = "width: 100%; height: 100%; border: none; border-radius: 16px;";
            let wrapperStyle = "width: 100%; aspect-ratio: 16/9; max-height: 75vh; display: flex; align-items: center; justify-content: center; background: #000; border-radius: 16px; overflow: hidden;";
            let containerMaxWidth = "900px";

            if (isVertical) {
                wrapperStyle = "width: 100%; max-width: 420px; aspect-ratio: 9/16; height: 75vh; max-height: 700px; margin: 0 auto; display: flex; align-items: center; justify-content: center; background: #000; border-radius: 16px; overflow: hidden;";
                containerMaxWidth = "460px";
            }

            const modalContainer = videoModal.querySelector('.modal-video-container');
            if (modalContainer) modalContainer.style.maxWidth = containerMaxWidth;

            if (raw.includes('<iframe')) {
                let clean = raw.replace(/width="[^"]*"/g, 'width="100%"').replace(/height="[^"]*"/g, 'height="100%"');
                if (!clean.includes('style=')) {
                    clean = clean.replace('<iframe', `<iframe style="${iframeStyle}"`);
                }
                wrapper.style.cssText = wrapperStyle;
                wrapper.innerHTML = clean;
            } else {
                const ytId = extractYoutubeId(raw);
                if (ytId) {
                    wrapper.style.cssText = wrapperStyle;
                    wrapper.innerHTML = `<iframe src="https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1" title="YouTube Video Player" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen style="${iframeStyle}"></iframe>`;
                } else {
                    wrapper.style.cssText = wrapperStyle;
                    wrapper.innerHTML = `<video id="modalHtml5Video" src="${raw || 'assets/videos/main_showreel.mp4'}" controls autoplay playsinline style="width: 100%; height: 100%; object-fit: contain; border-radius: 16px;"></video>`;
                }
            }
        }
        videoModal.classList.add('active');
    }

    function closeDirectVideoModal() {
        window.lenis?.start();
        if (!videoModal) videoModal = document.getElementById('directVideoModal');
        if (!videoModal) return;
        videoModal.classList.remove('active');
        const wrapper = videoModal.querySelector('.video-responsive-wrapper');
        if (wrapper) wrapper.innerHTML = '';
    }

    window.openDirectVideoModal = openDirectVideoModal;
    window.closeDirectVideoModal = closeDirectVideoModal;

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.trigger-video-modal, .trigger-reel, #heroPlayReelBtn');
        if (btn) {
            e.preventDefault();
            const rawSrc = btn.getAttribute('data-video-src') || 'assets/videos/main_showreel.mp4';
            let videoSrc = rawSrc;
            if (rawSrc) {
                try {
                    videoSrc = decodeURIComponent(rawSrc);
                } catch(err) {
                    videoSrc = rawSrc;
                }
            }
            openDirectVideoModal(videoSrc);
        }
    });

    closeVideoModal?.addEventListener('click', closeDirectVideoModal);
    document.getElementById('modalBackToProjectsBtn')?.addEventListener('click', closeDirectVideoModal);

    videoModal?.addEventListener('click', (e) => {
        if (e.target === videoModal) closeDirectVideoModal();
    });

    // Showreel Section Autoplay & Auto-Pause on Scroll System (IntersectionObserver)
    const showreelSection = document.getElementById('showreel');

    function handleShowreelPlayClick() {
        const video = document.getElementById('directShowreelVideo');
        const overlay = document.getElementById('showreelOverlay');
        if (overlay) {
            overlay.style.opacity = '0';
            overlay.style.pointerEvents = 'none';
        }
        if (video) {
            video.muted = false;
            video.setAttribute('data-user-unmuted', 'true');
            video.play().catch(e => console.log('Showreel play error:', e));
        }
    }

    if (showreelOverlay) {
        showreelOverlay.addEventListener('click', handleShowreelPlayClick);
    }
    document.getElementById('mainPlayBtn')?.addEventListener('click', handleShowreelPlayClick);

    if ('IntersectionObserver' in window) {
        const targetEl = showreelSection || document.getElementById('showreelPlayerBox');
        if (targetEl) {
            const videoObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const video = document.getElementById('directShowreelVideo');
                    const iframe = document.getElementById('directShowreelIframe') || document.querySelector('#showreelPlayerBox iframe');
                    const overlay = document.getElementById('showreelOverlay');

                    if (entry.isIntersecting) {
                        // Automatically play video from the VERY BEGINNING (0:00) when scrolled into section
                        if (overlay) {
                            overlay.style.opacity = '0';
                            overlay.style.pointerEvents = 'none';
                        }
                        if (video) {
                            if (!video.hasAttribute('data-user-unmuted')) {
                                video.muted = true;
                            }
                            try {
                                video.currentTime = 0;
                            } catch(e) {}
                            const p = video.play();
                            if (p !== undefined) {
                                p.catch(err => {
                                    console.log('Autoplay on scroll:', err);
                                });
                            }
                        }
                        if (iframe && iframe.contentWindow) {
                            try {
                                iframe.contentWindow.postMessage('{"event":"command","func":"mute","args":""}', '*');
                                iframe.contentWindow.postMessage('{"event":"command","func":"seekTo","args":[0, true]}', '*');
                                iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
                            } catch(err) {
                                console.log('Iframe play error:', err);
                            }
                        }
                    } else {
                        // Automatically pause video & reset time to 0:00 when scrolled out of section
                        if (video) {
                            video.pause();
                            try {
                                video.currentTime = 0;
                            } catch(e) {}
                        }
                        if (iframe && iframe.contentWindow) {
                            try {
                                iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
                                iframe.contentWindow.postMessage('{"event":"command","func":"seekTo","args":[0, true]}', '*');
                            } catch(err) {
                                console.log('Iframe pause error:', err);
                            }
                        }
                    }
                });
            }, { threshold: 0.15 });

            videoObserver.observe(targetEl);
        }
    }

    /* --- 6. Portfolio Category Filter & "See All Projects" Expand/Collapse Engine --- */
    let isPortfolioExpanded = false;
    const PORTFOLIO_INITIAL_LIMIT = 6;

    function getLiveWorkCards() {
        return Array.from(document.querySelectorAll('#worksGrid .work-card'));
    }

    function applyPortfolioCardVisibility(customFilter) {
        const portfolioFilter = document.getElementById('portfolioFilter');
        const activeBtn = portfolioFilter ? portfolioFilter.querySelector('.filter-btn.active') : null;
        const activeFilter = customFilter || (activeBtn ? (activeBtn.getAttribute('data-filter') || 'all') : 'all');

        const workCards = getLiveWorkCards();
        const seeAllBtn = document.getElementById('seeAllProjectsBtn');
        const seeAllWrapper = document.getElementById('seeAllWrapper');
        const seeAllBadge = document.getElementById('seeAllBadge');
        const seeAllIcon = document.getElementById('seeAllIcon');

        let visibleMatchingCount = 0;
        let totalMatchingCount = 0;

        workCards.forEach((card) => {
            const categories = (card.getAttribute('data-category') || '').split(' ');
            const matchesCategory = (activeFilter === 'all' || categories.includes(activeFilter));

            if (matchesCategory) {
                totalMatchingCount++;
                visibleMatchingCount++;
                // If not expanded and count exceeds 6, hide it
                if (!isPortfolioExpanded && visibleMatchingCount > PORTFOLIO_INITIAL_LIMIT) {
                    card.style.display = 'none';
                } else {
                    card.style.display = 'flex';
                }
            } else {
                card.style.display = 'none';
            }
        });

        // Manage See All button visibility & state
        if (seeAllWrapper) {
            // If total matching projects > 6, always display See All button
            if (totalMatchingCount > PORTFOLIO_INITIAL_LIMIT) {
                seeAllWrapper.style.display = 'flex';
                if (seeAllBadge) seeAllBadge.textContent = totalMatchingCount;

                if (isPortfolioExpanded) {
                    if (seeAllBtn) {
                        const span = seeAllBtn.querySelector('span');
                        if (span) span.textContent = 'Show Less';
                    }
                    if (seeAllIcon) seeAllIcon.className = 'fa-solid fa-chevron-up';
                } else {
                    if (seeAllBtn) {
                        const span = seeAllBtn.querySelector('span');
                        if (span) span.textContent = 'See All Projects';
                    }
                    if (seeAllIcon) seeAllIcon.className = 'fa-solid fa-chevron-down';
                }
            } else {
                // 6 or fewer cards: hide the expand button
                seeAllWrapper.style.display = 'none';
            }
        }
    }
    window.applyPortfolioCardVisibility = applyPortfolioCardVisibility;

    function updatePortfolioFilterCounts() {
        const portfolioFilter = document.getElementById('portfolioFilter');
        if (!portfolioFilter) return;
        const workCards = getLiveWorkCards();
        const filterBtns = portfolioFilter.querySelectorAll('.filter-btn');

        filterBtns.forEach(btn => {
            const filterValue = btn.getAttribute('data-filter');
            const countBadge = btn.querySelector('.filter-count');
            if (countBadge) {
                if (filterValue === 'all') {
                    countBadge.textContent = workCards.length;
                } else {
                    let count = 0;
                    workCards.forEach(card => {
                        const categories = (card.getAttribute('data-category') || '').split(' ');
                        if (categories.includes(filterValue)) {
                            count++;
                        }
                    });
                    countBadge.textContent = count;
                }
            }
        });
    }
    window.updatePortfolioFilterCounts = updatePortfolioFilterCounts;

    function initPortfolioFilterEngine() {
        const portfolioFilter = document.getElementById('portfolioFilter');
        const seeAllBtn = document.getElementById('seeAllProjectsBtn');

        if (portfolioFilter && !portfolioFilter.dataset.filterBound) {
            portfolioFilter.dataset.filterBound = 'true';
            const filterBtns = portfolioFilter.querySelectorAll('.filter-btn');

            filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');

                    const filterValue = btn.getAttribute('data-filter') || 'all';
                    applyPortfolioCardVisibility(filterValue);
                });
            });
        }

        if (seeAllBtn && !seeAllBtn.dataset.expandBound) {
            seeAllBtn.dataset.expandBound = 'true';
            seeAllBtn.addEventListener('click', () => {
                isPortfolioExpanded = !isPortfolioExpanded;
                applyPortfolioCardVisibility();

                // If collapsing back to 6 cards, scroll smoothly to the works section
                if (!isPortfolioExpanded) {
                    const worksSection = document.getElementById('works');
                    if (worksSection) {
                        worksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            });
        }

        updatePortfolioFilterCounts();
        applyPortfolioCardVisibility();
    }
    window.initPortfolioFilterEngine = initPortfolioFilterEngine;

    initPortfolioFilterEngine();

    /* --- 7. Project Detail Video Lightbox Modal (Smart Auto-Detection Engine) --- */
    const projectData = {
        'project-1': {
            title: 'YouTube Documentary Edit',
            video: 'assets/videos/main_showreel.mp4',
            youtubeId: 'M7lc1UVf-VE'
        },
        'project-2': {
            title: 'Viral Reels & TikToks',
            video: 'assets/videos/hero_teaser.mp4',
            youtubeId: 'kJQP7kiw5Fk'
        },
        'project-3': {
            title: 'Talking Head Corporate',
            video: 'assets/videos/main_showreel.mp4',
            youtubeId: 'aqz-KE-bpKQ'
        },
        'project-4': {
            title: 'Animated Logo Reveals',
            video: 'assets/videos/hero_teaser.mp4',
            youtubeId: '2g811Ko7K8U'
        },
        'project-5': {
            title: 'Cinematic Color Pass',
            video: 'assets/videos/main_showreel.mp4',
            youtubeId: 'L_LUpnjgPso'
        },
        'project-6': {
            title: 'Brand Commercial Ad',
            video: 'assets/videos/hero_teaser.mp4',
            youtubeId: 'LXb3EKWsInQ'
        }
    };

    /* --- 7 & 8. Project Video Lightbox & Project Details Overlay Engine --- */
    const projectModal = document.getElementById('projectModal') || document.getElementById('directVideoModal');
    const closeProjectModal = document.getElementById('closeProjectModal');
    const projectModalBody = document.getElementById('projectModalBody') || projectModal?.querySelector('.video-responsive-wrapper');
    const projectDetailOverlay = document.getElementById('projectDetailOverlay');
    const closeDetailOverlay = document.getElementById('closeDetailOverlay');
    const projectDetailContent = document.getElementById('projectDetailContent');

    const fullProjectData = {
        'project-1': {
            title: 'YouTube Documentary & Storytelling Edit',
            desc: 'A complete high-retention documentary editing pass featuring fast-paced B-roll overlays, kinetic text captions, animated infographics, sound design layer pass, and color correction. Built to keep viewers hooked from intro to outro.',
            image: 'assets/images/project_youtube_doc.jpg',
            video: 'assets/videos/main_showreel.mp4',
            youtubeId: 'M7lc1UVf-VE',
            youtubeUrl: 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
            client: 'Mahin Ali Biswas',
            date: 'Jan 15, 2026',
            duration: '03:22',
            tools: ['Adobe Premiere Pro', 'Adobe After Effects', 'Audition'],
            category: 'YouTube Documentary'
        },
        'project-2': {
            title: 'Viral Instagram Reel & TikTok Edit',
            desc: 'Dynamic vertical video edit featuring pop-up emojis, animated Bangla/English motion subtitles, zoom cuts, audio sound effects, and fast-hook intro pacing designed for high social media virality.',
            image: 'assets/images/project_reels_shorts.jpg',
            video: 'assets/videos/hero_teaser.mp4',
            youtubeId: 'kJQP7kiw5Fk',
            youtubeUrl: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
            client: 'Social Media Client',
            date: 'Feb 02, 2026',
            duration: '00:58',
            tools: ['After Effects', 'Premiere Pro'],
            category: 'Reels / Shorts'
        },
        'project-3': {
            title: 'Talking Head Corporate & Educational Course',
            desc: 'Corporate talking head video editing with seamless jump-cut smoothing, lower third title overlays, multi-camera switching, audio noise clean-up, and polished color pass.',
            image: 'assets/images/project_talking_head.jpg',
            video: 'assets/videos/main_showreel.mp4',
            youtubeId: 'aqz-KE-bpKQ',
            youtubeUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
            client: 'EdTech Academy',
            date: 'Jan 28, 2026',
            duration: '08:45',
            tools: ['Premiere Pro', 'Adobe Audition'],
            category: 'Talking Head'
        },
        'project-4': {
            title: 'Animated Logo Reveal & Motion Graphics',
            desc: 'Sleek 2D/3D logo animation and animated subtitle presets designed for online brands, YouTube channel intros, and promo videos.',
            image: 'assets/images/project_motion_logo.jpg',
            video: 'assets/videos/hero_teaser.mp4',
            youtubeId: '2g811Ko7K8U',
            youtubeUrl: 'https://www.youtube.com/watch?v=2g811Ko7K8U',
            client: 'MabFx Studio',
            date: 'Jan 10, 2026',
            duration: '00:15',
            tools: ['After Effects', 'Illustrator'],
            category: 'Motion Design'
        },
        'project-5': {
            title: 'Cinematic B-Roll & Color Correction Pass',
            desc: 'Professional color grading pass transforming flat Log camera footage into vibrant, cinematic filmic tones with skin tone balance and mood styling.',
            image: 'assets/images/project_color_pass.jpg',
            video: 'assets/videos/main_showreel.mp4',
            youtubeId: 'L_LUpnjgPso',
            youtubeUrl: 'https://www.youtube.com/watch?v=L_LUpnjgPso',
            client: 'Filmmaker Production',
            date: 'Dec 20, 2025',
            duration: '02:10',
            tools: ['DaVinci Resolve', 'Premiere Pro'],
            category: 'Color Pass'
        },
        'project-6': {
            title: 'Brand Commercial Ad Video',
            desc: 'High-converting social media advertisement video combining call-to-action motion graphics, energetic sound design, and audio sync.',
            image: 'assets/images/project_commercial_ad.jpg',
            video: 'assets/videos/hero_teaser.mp4',
            youtubeId: 'LXb3EKWsInQ',
            youtubeUrl: 'https://www.youtube.com/watch?v=LXb3EKWsInQ',
            client: 'E-Commerce Brand',
            date: 'Nov 12, 2025',
            duration: '01:30',
            tools: ['Premiere Pro', 'After Effects'],
            category: 'Commercial Ad'
        }
    };

    function getProjectDataById(projectId) {
        if (!projectId) return fullProjectData['project-1'];

        if (typeof getSiteData === 'function') {
            const siteData = getSiteData();
            if (siteData && siteData.projects && Array.isArray(siteData.projects)) {
                const found = siteData.projects.find(p => p.id === projectId || p.id === 'project-' + projectId);
                if (found) {
                    let ytId = found.youtubeId;
                    if (!ytId && typeof extractYoutubeId === 'function') {
                        ytId = extractYoutubeId(found.youtubeUrl || found.videoUrl || found.video || '');
                    }
                    return {
                        id: found.id || projectId,
                        title: found.title || 'Project Details',
                        desc: found.desc || '',
                        image: found.image || 'assets/images/hero_showreel_cover.jpg',
                        video: found.video || found.videoUrl || found.youtubeUrl || 'assets/videos/main_showreel.mp4',
                        youtubeId: ytId || 'deQijHls--0',
                        youtubeUrl: found.youtubeUrl || (ytId ? `https://www.youtube.com/watch?v=${ytId}` : 'https://www.youtube.com/watch?v=deQijHls--0'),
                        client: found.client || 'Mahin Ali Biswas',
                        date: found.date || '2026',
                        duration: found.duration || '03:20',
                        tools: Array.isArray(found.tools) ? found.tools : (typeof found.tools === 'string' ? found.tools.split(',') : ['Premiere Pro', 'After Effects']),
                        category: found.categoryBadge || found.category || 'Featured'
                    };
                }
            }
        }
        return fullProjectData[projectId] || fullProjectData['project-' + projectId] || fullProjectData['project-1'];
    }

    /* --- Dedicated Vertical Reels & Shorts Modal System --- */
    let currentReelIndex = 0;
    let currentReelsData = [];

    function getShortsList() {
        if (typeof getSiteData === 'function') {
            const sd = getSiteData();
            if (sd && Array.isArray(sd.shorts) && sd.shorts.length > 0) return sd.shorts;
        }
        if (typeof DEFAULT_SITE_DATA !== 'undefined' && Array.isArray(DEFAULT_SITE_DATA.shorts)) {
            return DEFAULT_SITE_DATA.shorts;
        }
        return [];
    }

    function openReelModal(shortId) {
        const list = getShortsList();
        if (!list.length) return;
        
        currentReelsData = list;
        let foundIdx = -1;
        if (shortId) {
            foundIdx = list.findIndex(s => s.id === shortId || 'short-' + s.id === shortId || s.id === 'short-' + shortId);
            if (foundIdx === -1) {
                // If id was project-2 etc
                foundIdx = list.findIndex(s => s.id == shortId || s.youtubeId === shortId || (s.title && shortId.includes && shortId.includes(s.id)));
            }
        }
        if (foundIdx === -1) foundIdx = 0;
        
        currentReelIndex = foundIdx;
        showReelAtIndex(currentReelIndex);

        window.lenis?.stop();
        const modal = document.getElementById('reelModal');
        if (modal) modal.classList.add('active');
    }

    let isReelChanging = false;

    function transitionReel(direction) {
        if (isReelChanging) return;
        if (!currentReelsData || !currentReelsData.length) currentReelsData = getShortsList();
        if (!currentReelsData.length) return;

        isReelChanging = true;
        const mediaLayer = document.getElementById('reelMediaLayer');
        const bottomInfo = document.getElementById('reelBottomInfo');

        let nextIndex = direction === 'next' ? currentReelIndex + 1 : currentReelIndex - 1;
        if (nextIndex >= currentReelsData.length) nextIndex = 0;
        if (nextIndex < 0) nextIndex = currentReelsData.length - 1;

        const outClass = direction === 'next' ? 'reel-slide-out-up' : 'reel-slide-out-down';
        const inClass = direction === 'next' ? 'reel-slide-in-up' : 'reel-slide-in-down';

        if (mediaLayer) {
            mediaLayer.classList.remove('reel-slide-out-up', 'reel-slide-in-up', 'reel-slide-out-down', 'reel-slide-in-down');
            mediaLayer.classList.add(outClass);
        }
        if (bottomInfo) {
            bottomInfo.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            bottomInfo.style.opacity = '0';
            bottomInfo.style.transform = direction === 'next' ? 'translateY(-8px)' : 'translateY(8px)';
        }

        setTimeout(() => {
            showReelAtIndex(nextIndex);
            if (mediaLayer) {
                mediaLayer.classList.remove(outClass);
                mediaLayer.classList.add(inClass);
            }
            if (bottomInfo) {
                bottomInfo.style.transform = direction === 'next' ? 'translateY(8px)' : 'translateY(-8px)';
                setTimeout(() => {
                    bottomInfo.style.opacity = '1';
                    bottomInfo.style.transform = 'translateY(0)';
                }, 40);
            }

            setTimeout(() => {
                if (mediaLayer) mediaLayer.classList.remove(inClass);
                isReelChanging = false;
            }, 320);
        }, 220);
    }

    async function showReelAtIndex(index) {
        if (!currentReelsData || !currentReelsData.length) currentReelsData = getShortsList();
        if (!currentReelsData.length) return;

        if (index < 0) index = currentReelsData.length - 1;
        if (index >= currentReelsData.length) index = 0;
        currentReelIndex = index;

        const short = currentReelsData[currentReelIndex];
        const mediaLayer = document.getElementById('reelMediaLayer');
        const bottomTitle = document.getElementById('reelBottomTitle');
        const realTitle = (short.title && short.title !== 'Viral Reels & TikToks') ? short.title : 'Professional Video Color Grading';
        if (bottomTitle) bottomTitle.textContent = realTitle;
        const bottomChannel = document.getElementById('reelBottomChannel');
        if (bottomChannel) bottomChannel.textContent = short.author || 'Mahin Ali Biswas';
        const bottomAvatar = document.querySelector('.reel-bottom-avatar');
        if (bottomAvatar) bottomAvatar.src = 'assets/images/mahin_profile.jpg';

        // Render Media Layer (100% Clean & Immersive Showcase)
        const playerFrame = document.getElementById('reelPlayerFrame');
        let rawVideo = (short.video || short.youtubeUrl || '').trim();

        if (rawVideo.startsWith('idb:') && typeof resolveMediaUrl === 'function') {
            const resolved = await resolveMediaUrl(rawVideo);
            rawVideo = resolved || short.youtubeUrl || (short.youtubeId ? `https://www.youtube.com/watch?v=${short.youtubeId}` : '') || 'assets/videos/short_color_grading.mp4';
        }
        if (rawVideo.startsWith('idb:')) {
            rawVideo = short.youtubeUrl || (short.youtubeId ? `https://www.youtube.com/watch?v=${short.youtubeId}` : '') || 'assets/videos/short_color_grading.mp4';
        }

        const isDirectVideo = rawVideo && !rawVideo.startsWith('idb:') && (rawVideo.startsWith('data:video') || rawVideo.startsWith('blob:') || /\.(mp4|webm|mov|ogg)($|\?)/i.test(rawVideo));
        const extractedYt = typeof extractYoutubeId === 'function' ? extractYoutubeId(rawVideo) : null;
        const isEmbedCode = rawVideo.includes('<iframe');
        const isYoutubeOrEmbed = (extractedYt || isEmbedCode || (short.youtubeId && (!rawVideo || rawVideo === short.youtubeUrl))) && !isDirectVideo;

        const bottomInfo = document.getElementById('reelBottomInfo');
        if (playerFrame) {
            if (isYoutubeOrEmbed) {
                playerFrame.classList.add('is-youtube-mode');
                playerFrame.classList.remove('is-direct-mode');
                if (bottomInfo) bottomInfo.style.display = 'none';
            } else {
                playerFrame.classList.add('is-direct-mode');
                playerFrame.classList.remove('is-youtube-mode');
                if (bottomInfo) bottomInfo.style.display = 'none';
            }
        }

        if (mediaLayer) {
            if (isDirectVideo) {
                mediaLayer.innerHTML = `
                    <video id="reelVideo" src="${rawVideo}" playsinline loop style="width: 100%; height: 100%; object-fit: cover; background: #000; cursor: pointer;"></video>
                `;
                const soundBtn = document.getElementById('reelSoundBtn');
                if (soundBtn) soundBtn.style.display = 'flex';

                const v = document.getElementById('reelVideo');
                if (v) {
                    v.muted = false;
                    v.volume = 1.0;
                    updateReelSoundUI(false);

                    const playPromise = v.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(err => {
                            console.warn("Unmuted autoplay restricted by browser, fallback to muted:", err);
                            v.muted = true;
                            updateReelSoundUI(true);
                            v.play().catch(e => console.log('Autoplay fallback error:', e));
                        });
                    }

                    v.addEventListener('click', () => {
                        if (v.paused) v.play();
                        else v.pause();
                    });
                }
            } else if (extractedYt) {
                const soundBtn = document.getElementById('reelSoundBtn');
                if (soundBtn) soundBtn.style.display = 'none';

                mediaLayer.innerHTML = `
                    <iframe id="reelIframe"
                        src="https://www.youtube-nocookie.com/embed/${extractedYt}?autoplay=1&mute=0&loop=1&playlist=${extractedYt}&controls=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1&iv_load_policy=3&disablekb=1&fs=0"
                        title="${short.title || 'Reel'}"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowfullscreen>
                    </iframe>
                `;
            } else if (isEmbedCode) {
                const soundBtn = document.getElementById('reelSoundBtn');
                if (soundBtn) soundBtn.style.display = 'none';

                const embedMatch = rawVideo.match(/src=["']([^"']+)["']/i);
                const embedUrl = embedMatch ? embedMatch[1] : '';
                const ytIdFromEmbed = typeof extractYoutubeId === 'function' ? extractYoutubeId(embedUrl) : null;
                if (ytIdFromEmbed) {
                    mediaLayer.innerHTML = `
                        <iframe id="reelIframe"
                            src="https://www.youtube-nocookie.com/embed/${ytIdFromEmbed}?autoplay=1&mute=0&loop=1&playlist=${ytIdFromEmbed}&controls=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1&iv_load_policy=3&disablekb=1&fs=0"
                            title="${short.title || 'Reel'}"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowfullscreen>
                        </iframe>
                    `;
                } else {
                    let cleanIframe = rawVideo.replace(/width="[^"]*"/g, '').replace(/height="[^"]*"/g, '');
                    cleanIframe = cleanIframe.replace(/style="[^"]*"/g, '');
                    cleanIframe = cleanIframe.replace('<iframe', '<iframe id="reelIframe"');
                    if (!cleanIframe.includes('allow=')) {
                        cleanIframe = cleanIframe.replace('<iframe', '<iframe allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen');
                    }
                    mediaLayer.innerHTML = cleanIframe;
                }
            } else if (short.youtubeId && (!rawVideo || rawVideo === short.youtubeUrl)) {
                const soundBtn = document.getElementById('reelSoundBtn');
                if (soundBtn) soundBtn.style.display = 'none';

                mediaLayer.innerHTML = `
                    <iframe id="reelIframe"
                        src="https://www.youtube-nocookie.com/embed/${short.youtubeId}?autoplay=1&mute=0&loop=1&playlist=${short.youtubeId}&controls=0&modestbranding=1&rel=0&playsinline=1&enablejsapi=1&iv_load_policy=3&disablekb=1&fs=0"
                        title="${short.title || 'Reel'}"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowfullscreen>
                    </iframe>
                `;
            } else if (rawVideo) {
                mediaLayer.innerHTML = `
                    <video id="reelVideo" src="${rawVideo}" playsinline loop style="width: 100%; height: 100%; object-fit: cover; background: #000; cursor: pointer;"></video>
                `;
                const soundBtn = document.getElementById('reelSoundBtn');
                if (soundBtn) soundBtn.style.display = 'flex';

                const v = document.getElementById('reelVideo');
                if (v) {
                    v.muted = false;
                    v.volume = 1.0;
                    updateReelSoundUI(false);
                    const playPromise = v.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(err => {
                            console.warn("Unmuted autoplay restricted, muting:", err);
                            v.muted = true;
                            updateReelSoundUI(true);
                            v.play().catch(e => console.log('Autoplay handled:', e));
                        });
                    }
                    v.addEventListener('click', () => {
                        if (v.paused) v.play();
                        else v.pause();
                    });
                }
            } else {
                const soundBtn = document.getElementById('reelSoundBtn');
                if (soundBtn) soundBtn.style.display = 'none';

                mediaLayer.innerHTML = `
                    <img src="${short.image || 'assets/images/project_reels_shorts.jpg'}" alt="${short.title || 'Reel'}" style="width: 100%; height: 100%; object-fit: cover;">
                `;
            }
        }
    }

    function updateReelSoundUI(isMuted) {
        const soundBtn = document.getElementById('reelSoundBtn');
        if (!soundBtn) return;
        const icon = soundBtn.querySelector('i');
        if (icon) {
            icon.className = isMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
        }
        soundBtn.setAttribute('title', isMuted ? 'Unmute Sound' : 'Mute Sound');
    }

    function closeReelModal() {
        const modal = document.getElementById('reelModal');
        if (modal) {
            modal.classList.remove('active');
            const mediaLayer = document.getElementById('reelMediaLayer');
            if (mediaLayer) mediaLayer.innerHTML = '';
        }
        const soundBtn = document.getElementById('reelSoundBtn');
        if (soundBtn) soundBtn.style.display = 'none';
        const playerFrame = document.getElementById('reelPlayerFrame');
        if (playerFrame) {
            playerFrame.classList.remove('is-youtube-mode', 'is-direct-mode');
        }
        isReelChanging = false;
        window.lenis?.start();
    }

    window.openReelModal = openReelModal;
    window.closeReelModal = closeReelModal;
    window.showReelAtIndex = showReelAtIndex;
    window.transitionReel = transitionReel;

    async function openProjectVideoModal(projectId) {
        const data = getProjectDataById(projectId);
        const modal = document.getElementById('projectModal') || document.getElementById('videoModal');
        const body = document.getElementById('projectModalBody') || modal?.querySelector('.modal-content') || modal?.querySelector('.video-responsive-wrapper');

        if (data && modal) {
            let rawVideo = (data.video || data.youtubeUrl || '').trim();
            if (rawVideo.startsWith('idb:') && typeof resolveMediaUrl === 'function') {
                const resolved = await resolveMediaUrl(rawVideo);
                rawVideo = resolved || data.youtubeUrl || (data.youtubeId ? `https://www.youtube.com/watch?v=${data.youtubeId}` : '') || 'assets/videos/main_showreel.mp4';
            }
            if (rawVideo.startsWith('idb:')) {
                rawVideo = data.youtubeUrl || (data.youtubeId ? `https://www.youtube.com/watch?v=${data.youtubeId}` : '') || 'assets/videos/main_showreel.mp4';
            }
            const isDirectVideo = rawVideo && !rawVideo.startsWith('idb:') && (rawVideo.startsWith('data:video') || rawVideo.startsWith('blob:') || /\.(mp4|webm|mov|ogg)($|\?)/i.test(rawVideo));
            const extractedYt = typeof extractYoutubeId === 'function' ? extractYoutubeId(rawVideo) : null;
            const isEmbedCode = rawVideo.includes('<iframe');
            
            let playerHtml = '';
            if (isDirectVideo) {
                playerHtml = `<video src="${rawVideo}" controls autoplay playsinline style="width: 100%; height: 100%; object-fit: cover; display: block; border: none; transform: scale(1.015); transform-origin: center;"></video>`;
            } else if (extractedYt) {
                playerHtml = `<iframe src="https://www.youtube.com/embed/${extractedYt}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1" title="${data.title || 'Project'}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="width: 100%; height: 100%; border: none; display: block; transform: scale(1.015); transform-origin: center;"></iframe>`;
            } else if (isEmbedCode) {
                let clean = rawVideo.replace(/width="[^"]*"/g, 'width="100%"').replace(/height="[^"]*"/g, 'height="100%"');
                if (!clean.includes('style=')) {
                    clean = clean.replace('<iframe', '<iframe style="width: 100%; height: 100%; border: none; display: block; transform: scale(1.015); transform-origin: center;"');
                }
                playerHtml = clean;
            } else if (data.youtubeId && (!rawVideo || rawVideo === data.youtubeUrl)) {
                playerHtml = `<iframe src="https://www.youtube.com/embed/${data.youtubeId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1" title="${data.title || 'Project'}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="width: 100%; height: 100%; border: none; display: block; transform: scale(1.015); transform-origin: center;"></iframe>`;
            } else {
                playerHtml = `<video src="${rawVideo || 'assets/videos/main_showreel.mp4'}" controls autoplay playsinline style="width: 100%; height: 100%; object-fit: cover; display: block; border: none; transform: scale(1.015); transform-origin: center;"></video>`;
            }

            if (body) {
                const categoryName = data.category || data.categoryBadge || 'Featured Project';
                const clientName = data.client || 'Mahin Ali Biswas';
                const projectYear = data.date ? (data.date.includes('2025') ? '2025' : '2026') : '2026';

                body.innerHTML = `
                    <div class="modal-video-header-row">
                        <button class="modal-floating-back-btn" id="modalBackToProjectsAction">
                            <i class="fa-solid fa-arrow-left"></i> Back to Projects
                        </button>
                        <div class="modal-video-header-meta">
                            <span class="modal-video-badge"><i class="fa-solid fa-circle-play"></i> ${categoryName}</span>
                            <span class="modal-video-title-tag">${data.title || 'Video Project'}</span>
                        </div>
                    </div>
                    <div class="pure-video-lightbox">
                        ${playerHtml}
                    </div>
                    <div class="modal-video-footer-strip">
                        <div class="video-footer-meta-item">
                            <i class="fa-regular fa-user" style="color: var(--accent-neon);"></i>
                            <span>Client: <strong>${clientName}</strong></span>
                        </div>
                        <div class="video-footer-meta-item">
                            <i class="fa-regular fa-calendar"></i>
                            <span>${projectYear}</span>
                        </div>
                        <div class="video-footer-meta-item video-footer-sound-badge">
                            <i class="fa-solid fa-volume-high"></i>
                            <span>Audio Active</span>
                        </div>
                    </div>
                `;

                // Unmute and play with sound
                const vid = body.querySelector('video');
                if (vid) {
                    vid.muted = false;
                    vid.volume = 1;
                    const p = vid.play();
                    if (p !== undefined) {
                        p.catch(() => {
                            // Fallback if browser policy blocks unmuted autoplay
                            vid.muted = true;
                            vid.play();
                        });
                    }
                }
            }
            modal.classList.add('active');
        }
    }

    function openProjectDetailsOverlay(projectId) {
        window.lenis?.stop();
        const overlay = document.getElementById('projectDetailOverlay');
        const content = document.getElementById('projectDetailContent');
        const modal = document.getElementById('projectModal') || document.getElementById('directVideoModal');
        const body = document.getElementById('projectModalBody');

        if (modal) modal.classList.remove('active');
        if (body) body.innerHTML = '';

        const data = getProjectDataById(projectId);

        if (content && overlay) {
            const toolsArray = Array.isArray(data.tools) ? data.tools : ['Premiere Pro', 'After Effects'];
            const toolsHtml = toolsArray.map(t => `<span class="detail-tool-pill">${t}</span>`).join(' ');

            content.innerHTML = `
                <div class="detail-media-card" id="detailMediaCard_${data.id || projectId}">
                    <img src="${data.image}" alt="${data.title}">
                    <button class="detail-play-btn" onclick="startDetailInlineVideo('${data.id || projectId}')">
                        <i class="fa-solid fa-play"></i> Play Video
                    </button>
                </div>

                <div class="detail-info-card">
                    <div class="detail-header-row">
                        <h1 class="detail-main-title">${data.title}</h1>
                        <span class="detail-duration-tag"><i class="fa-regular fa-clock"></i> ${data.duration || '03:20'}</span>
                    </div>
                    
                    <p class="detail-main-desc">${data.desc}</p>
                    <p class="detail-cta-text">Looking for similar work? <a href="#contact" onclick="document.getElementById('projectDetailOverlay').classList.remove('active')">Visit my services or contact me</a> to discuss your next project.</p>

                    <div class="detail-meta-grid">
                        <div class="meta-col">
                            <h4>Project Details</h4>
                            <p><i class="fa-regular fa-calendar"></i> Published: <strong>${data.date || '2026'}</strong></p>
                            <p><i class="fa-regular fa-user"></i> Client: <strong>${data.client || 'Mahin Ali Biswas'}</strong></p>
                        </div>
                        <div class="meta-col">
                            <h4>Tools & Software</h4>
                            <div class="tools-pills-row">${toolsHtml}</div>
                        </div>
                    </div>

                    <div class="detail-categories-row">
                        <h4>Project Categories</h4>
                        <span class="card-category-pill">${data.category || 'Featured'}</span>
                    </div>

                    <div class="detail-action-footer">
                        <a href="${data.youtubeUrl || '#'}" target="_blank" class="btn-watch-youtube">
                            <i class="fa-brands fa-youtube"></i> Watch on YouTube
                        </a>
                    </div>
                </div>
            `;
            overlay.classList.add('active');
            overlay.scrollTop = 0;
        }
    }

    // Delegated Global Event Listeners for statically AND dynamically rendered cards
    document.addEventListener('click', (e) => {
        // 1. Reel Modal Controls
        const reelClose = e.target.closest('#closeReelModal');
        if (reelClose) {
            e.preventDefault();
            e.stopPropagation();
            closeReelModal();
            return;
        }

        const soundBtn = e.target.closest('#reelSoundBtn');
        if (soundBtn) {
            e.preventDefault();
            e.stopPropagation();
            const v = document.getElementById('reelVideo');
            if (v) {
                v.muted = !v.muted;
                updateReelSoundUI(v.muted);
            }
            return;
        }

        const reelPrev = e.target.closest('#reelOutsidePrev');
        if (reelPrev) {
            e.preventDefault();
            e.stopPropagation();
            transitionReel('prev');
            return;
        }

        const reelNext = e.target.closest('#reelOutsideNext');
        if (reelNext) {
            e.preventDefault();
            e.stopPropagation();
            transitionReel('next');
            return;
        }

        if (e.target.id === 'reelModal') {
            closeReelModal();
            return;
        }

        // 2. Reel Trigger on Cards (play button, details, or thumbnail)
        const openReelTrigger = e.target.closest('.open-reel-btn, .short-play-btn, .short-reel-details-btn');
        if (openReelTrigger) {
            e.preventDefault();
            e.stopPropagation();
            const shortCard = openReelTrigger.closest('.short-card');
            const shortId = openReelTrigger.getAttribute('data-short-id') || 
                            openReelTrigger.getAttribute('data-id') || 
                            shortCard?.getAttribute('data-short-id') || 
                            shortCard?.id;
            openReelModal(shortId);
            return;
        }

        const shortCardClicked = e.target.closest('.short-card');
        if (shortCardClicked && !e.target.closest('button, a')) {
            e.preventDefault();
            e.stopPropagation();
            const shortId = shortCardClicked.getAttribute('data-short-id') || shortCardClicked.id;
            openReelModal(shortId);
            return;
        }

        // 3. Long Video Modals & Project Overlays
        const backBtn = e.target.closest('#modalBackToProjectsAction, #modalTopCloseAction, .modal-floating-back-btn, .modal-back-to-projects-btn');
        if (backBtn) {
            e.preventDefault();
            e.stopPropagation();
            const projectModal = document.getElementById('projectModal');
            const videoModal = document.getElementById('videoModal');
            if (projectModal) {
                projectModal.classList.remove('active');
                const body = document.getElementById('projectModalBody');
                if (body) body.innerHTML = '';
            }
            if (videoModal) {
                videoModal.classList.remove('active');
                const wrapper = videoModal.querySelector('.video-responsive-wrapper');
                if (wrapper) wrapper.innerHTML = '';
            }
            return;
        }

        const moreBtn = e.target.closest('.card-desc-more-btn');
        if (moreBtn) {
            e.preventDefault();
            e.stopPropagation();
            const cardBody = moreBtn.closest('.card-body');
            const cardDesc = cardBody ? cardBody.querySelector('.card-desc') : null;
            if (cardDesc) {
                const isExpanded = cardDesc.classList.toggle('expanded');
                moreBtn.innerHTML = isExpanded 
                    ? 'See Less <i class="fa-solid fa-chevron-up"></i>' 
                    : 'See More <i class="fa-solid fa-chevron-down"></i>';
            }
            return;
        }

        const detailsBtn = e.target.closest('.card-details-btn');
        if (detailsBtn) {
            e.preventDefault();
            e.stopPropagation();
            const projectId = detailsBtn.getAttribute('data-id');
            openProjectDetailsOverlay(projectId);
            return;
        }

        const playBtn = e.target.closest('.view-project-btn, .card-glass-play-btn');
        if (playBtn) {
            e.preventDefault();
            e.stopPropagation();
            const projectId = playBtn.getAttribute('data-id') || playBtn.closest('.work-card')?.getAttribute('data-id') || 'project-1';
            openProjectVideoModal(projectId);
            return;
        }
    });

    // Keyboard listener for Reel and Project Video modals
    document.addEventListener('keydown', (e) => {
        const reelModal = document.getElementById('reelModal');
        if (reelModal && reelModal.classList.contains('active')) {
            if (e.key === 'Escape') closeReelModal();
            else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') transitionReel('prev');
            else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') transitionReel('next');
        }
        const projModal = document.getElementById('projectModal');
        if (projModal && projModal.classList.contains('active') && e.key === 'Escape') {
            projModal.classList.remove('active');
            const body = document.getElementById('projectModalBody');
            if (body) body.innerHTML = '';
        }
    });

    // Mouse Wheel Scrolling & Touch Swipe for Reel Modal
    const reelModalElement = document.getElementById('reelModal');
    if (reelModalElement) {
        let lastReelWheel = 0;
        reelModalElement.addEventListener('wheel', (e) => {
            if (!reelModalElement.classList.contains('active')) return;
            e.preventDefault();
            const now = Date.now();
            if (now - lastReelWheel < 450) return; // Debounce for smooth single-reel glide

            if (e.deltaY > 20) {
                lastReelWheel = now;
                transitionReel('next');
            } else if (e.deltaY < -20) {
                lastReelWheel = now;
                transitionReel('prev');
            }
        }, { passive: false });

        let touchStartY = 0;
        let touchStartX = 0;
        reelModalElement.addEventListener('touchstart', (e) => {
            if (!reelModalElement.classList.contains('active')) return;
            touchStartY = e.touches[0].clientY;
            touchStartX = e.touches[0].clientX;
        }, { passive: true });

        reelModalElement.addEventListener('touchend', (e) => {
            if (!reelModalElement.classList.contains('active')) return;
            const touchEndY = e.changedTouches[0].clientY;
            const touchEndX = e.changedTouches[0].clientX;
            const deltaY = touchStartY - touchEndY;
            const deltaX = touchStartX - touchEndX;

            if (Math.abs(deltaY) > 35 && Math.abs(deltaY) > Math.abs(deltaX)) {
                if (deltaY > 0) {
                    transitionReel('next'); // Swiped up -> Next Reel
                } else {
                    transitionReel('prev'); // Swiped down -> Previous Reel
                }
            }
        }, { passive: true });
    }

    closeProjectModal?.addEventListener('click', () => {
        const modal = document.getElementById('projectModal') || document.getElementById('directVideoModal');
        modal?.classList.remove('active');
        const body = document.getElementById('projectModalBody') || modal?.querySelector('.video-responsive-wrapper');
        if (body) body.innerHTML = '';
    });

    const activeProjectModal = document.getElementById('projectModal');
    activeProjectModal?.addEventListener('click', (e) => {
        if (e.target === activeProjectModal) {
            activeProjectModal.classList.remove('active');
            const body = document.getElementById('projectModalBody');
            if (body) body.innerHTML = '';
        }
    });

    closeDetailOverlay?.addEventListener('click', () => {
        window.lenis?.start();
        const overlay = document.getElementById('projectDetailOverlay');
        if (overlay) {
            const detailVideos = overlay.querySelectorAll('video');
            detailVideos.forEach(v => v.pause());
            const detailIframes = overlay.querySelectorAll('iframe');
            detailIframes.forEach(f => f.src = '');
            overlay.classList.remove('active');
        }
    });

    window.startDetailInlineVideo = async function(projectId) {
        const data = getProjectDataById(projectId);
        const mediaCard = document.getElementById(`detailMediaCard_${projectId}`) || document.querySelector('.detail-media-card');
        if (mediaCard && data) {
            let rawVideo = (data.video || data.youtubeUrl || '').trim();
            if (rawVideo.startsWith('idb:') && typeof resolveMediaUrl === 'function') {
                const resolved = await resolveMediaUrl(rawVideo);
                rawVideo = resolved || data.youtubeUrl || (data.youtubeId ? `https://www.youtube.com/watch?v=${data.youtubeId}` : '') || 'assets/videos/main_showreel.mp4';
            }
            if (rawVideo.startsWith('idb:')) {
                rawVideo = data.youtubeUrl || (data.youtubeId ? `https://www.youtube.com/watch?v=${data.youtubeId}` : '') || 'assets/videos/main_showreel.mp4';
            }
            const ytId = data.youtubeId || (typeof extractYoutubeId === 'function' ? extractYoutubeId(rawVideo) : null);

            let playerHtml = '';
            if (rawVideo.includes('<iframe')) {
                playerHtml = rawVideo.replace(/width="[^"]*"/g, 'width="100%"').replace(/height="[^"]*"/g, 'height="100%"');
            } else if (ytId) {
                playerHtml = `<iframe src="https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1" title="${data.title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="width: 100%; height: 100%; border: none; transform: scale(1.015); transform-origin: center;"></iframe>`;
            } else {
                playerHtml = `<video src="${rawVideo || 'assets/videos/main_showreel.mp4'}" controls autoplay playsinline style="width: 100%; height: 100%; object-fit: cover; display: block; border: none; transform: scale(1.015); transform-origin: center;"></video>`;
            }
            mediaCard.innerHTML = playerHtml;
        }
    };

    window.initProjectDetailEvents = function() {};
    window.openProjectDetailsOverlay = openProjectDetailsOverlay;
    window.openProjectVideoModal = openProjectVideoModal;

    /* --- 8. Interactive Project Estimator Calculation --- */
    const estimatorForm = document.getElementById('estimatorForm');
    const durationRange = document.getElementById('durationRange');
    const durationVal = document.getElementById('durationVal');
    const priceDisplay = document.getElementById('priceDisplay');
    const sendEstimateBtn = document.getElementById('sendEstimateBtn');

    const rates = {
        'youtube_edit': { base: 60, perMin: 20 },
        'reels_shorts': { base: 35, perMin: 15 },
        'talking_head': { base: 50, perMin: 15 },
        'motion_logo': { base: 80, perMin: 25 }
    };

    function calculateEstimate() {
        if (!durationRange || !priceDisplay) return;

        const selectedTypeInput = document.querySelector('input[name="projectType"]:checked');
        const selectedSpeedInput = document.querySelector('input[name="speed"]:checked');

        const type = selectedTypeInput ? selectedTypeInput.value : 'youtube_edit';
        const speed = selectedSpeedInput ? selectedSpeedInput.value : 'standard';
        const mins = parseInt(durationRange.value) || 5;

        if (durationVal) durationVal.textContent = `${mins} Minute${mins > 1 ? 's' : ''}`;

        const rate = rates[type] || rates['youtube_edit'];
        let baseCost = rate.base + (mins * rate.perMin);

        if (speed === 'express') baseCost *= 1.4;

        const minPrice = Math.round(baseCost * 0.9);
        const maxPrice = Math.round(baseCost * 1.2);

        priceDisplay.textContent = `$${minPrice} - $${maxPrice} USD`;
    }

    durationRange?.addEventListener('input', calculateEstimate);

    document.querySelectorAll('input[name="projectType"], input[name="speed"]').forEach(input => {
        input.addEventListener('change', (e) => {
            const parentGroup = e.target.closest('.option-grid');
            if (parentGroup) {
                parentGroup.querySelectorAll('.option-card').forEach(card => card.classList.remove('active'));
                e.target.closest('.option-card')?.classList.add('active');
            }
            calculateEstimate();
        });
    });

    sendEstimateBtn?.addEventListener('click', () => {
        const contactSection = document.getElementById('contact');
        const clientSubject = document.getElementById('clientSubject');
        const clientMessage = document.getElementById('clientMessage');

        const selectedType = document.querySelector('input[name="projectType"]:checked')?.value || 'youtube_edit';
        const mins = durationRange?.value || 5;
        const estPrice = priceDisplay?.textContent || '';

        if (clientSubject) clientSubject.value = `Video Inquiry (${selectedType.replace('_', ' ').toUpperCase()} - ${mins} Mins)`;
        if (clientMessage) clientMessage.value = `Hi Mahin,\n\nI calculated an estimated project budget of ${estPrice} for a ${mins}-minute ${selectedType.replace('_', ' ')} video.\n\nHere are additional details about my project: `;

        contactSection?.scrollIntoView({ behavior: 'smooth' });
        showToast('Estimator details copied to contact form!');
    });

    /* --- 9. Toast Notification Helper --- */
    function showToast(message) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color: var(--accent-neon);"></i> <span>${message}</span>`;

        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3500);
    }

    /* --- 10. Contact Form Submission Handling --- */
    const contactForm = document.getElementById('contactForm');
    contactForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        showToast('Message sent successfully! Mahin will respond shortly.');
        contactForm.reset();
    });

    /* --- 11. Shorts & Reels Carousel with Butter-Smooth Inertia --- */
    window.initShortsCarousel = function() {
        const track = document.getElementById('shortsTrack');
        const prevBtn = document.getElementById('shortsPrevBtn');
        const nextBtn = document.getElementById('shortsNextBtn');
        const dotsContainer = document.getElementById('shortsDots');

        if (!track || !prevBtn || !nextBtn) return;

        let scrollAnimationId = null;

        function getStep() {
            const firstCard = track.querySelector('.short-card');
            if (!firstCard) return 338;
            const style = window.getComputedStyle(track);
            const gap = parseFloat(style.gap) || 28;
            return firstCard.offsetWidth + gap;
        }

        // Custom silky easeOutQuart animation for buttery slide
        function smoothScrollTrack(delta, duration = 500) {
            cancelAnimationFrame(scrollAnimationId);
            const start = track.scrollLeft;
            const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
            const target = Math.max(0, Math.min(maxScroll, start + delta));
            const change = target - start;
            if (Math.abs(change) < 1) return;

            const startTime = performance.now();

            function easeOutQuart(t) {
                return 1 - (--t) * t * t * t;
            }

            function step(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const ease = easeOutQuart(progress);

                track.scrollLeft = start + change * ease;

                if (progress < 1) {
                    scrollAnimationId = requestAnimationFrame(step);
                } else {
                    updateUI();
                }
            }

            scrollAnimationId = requestAnimationFrame(step);
        }

        function updateUI() {
            const maxScroll = track.scrollWidth - track.clientWidth - 5;
            prevBtn.disabled = track.scrollLeft <= 5;
            nextBtn.disabled = track.scrollLeft >= maxScroll;

            if (dotsContainer) {
                const cards = track.querySelectorAll('.short-card');
                const step = getStep();
                const activeIndex = Math.min(cards.length - 1, Math.max(0, Math.round(track.scrollLeft / step)));
                dotsContainer.querySelectorAll('.shorts-dot').forEach((dot, idx) => {
                    dot.classList.toggle('active', idx === activeIndex);
                });
            }
        }

        function buildDots() {
            if (!dotsContainer) return;
            const cards = track.querySelectorAll('.short-card');
            dotsContainer.innerHTML = '';
            cards.forEach((card, idx) => {
                const dot = document.createElement('button');
                dot.className = 'shorts-dot' + (idx === 0 ? ' active' : '');
                dot.setAttribute('aria-label', `Go to short ${idx + 1}`);
                dot.addEventListener('click', () => {
                    const target = idx * getStep();
                    smoothScrollTrack(target - track.scrollLeft, 550);
                });
                dotsContainer.appendChild(dot);
            });
        }

        prevBtn.onclick = function(e) {
            e.preventDefault();
            isWheelLerping = false;
            cancelAnimationFrame(wheelLerpId);
            targetScrollLeft = Math.max(0, track.scrollLeft - getStep());
            smoothScrollTrack(-getStep(), 500);
        };

        nextBtn.onclick = function(e) {
            e.preventDefault();
            isWheelLerping = false;
            cancelAnimationFrame(wheelLerpId);
            targetScrollLeft = Math.min(track.scrollWidth - track.clientWidth, track.scrollLeft + getStep());
            smoothScrollTrack(getStep(), 500);
        };

        // Smooth Mouse Drag with Inertial Momentum
        let isDown = false;
        let startX = 0;
        let startScrollLeft = 0;
        let velocity = 0;
        let lastMoveX = 0;
        let lastMoveTime = 0;
        let momentumId = null;

        track.onmousedown = function(e) {
            if (e.target.closest('button, a')) return;
            isDown = true;
            track.classList.add('active-drag');
            startX = e.pageX - track.offsetLeft;
            startScrollLeft = track.scrollLeft;
            lastMoveX = e.pageX;
            lastMoveTime = performance.now();
            velocity = 0;
            isWheelLerping = false;
            cancelAnimationFrame(wheelLerpId);
            cancelAnimationFrame(scrollAnimationId);
            cancelAnimationFrame(momentumId);
        };

        window.addEventListener('mouseup', () => {
            if (!isDown) return;
            isDown = false;
            track.classList.remove('active-drag');
            if (Math.abs(velocity) > 0.15) {
                let vel = velocity * 13;
                function momentum() {
                    if (Math.abs(vel) > 0.5) {
                        track.scrollLeft -= vel;
                        vel *= 0.93;
                        momentumId = requestAnimationFrame(momentum);
                    } else {
                        updateUI();
                    }
                }
                momentumId = requestAnimationFrame(momentum);
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - track.offsetLeft;
            const walk = (x - startX) * 1.15;
            track.scrollLeft = startScrollLeft - walk;

            const now = performance.now();
            const dt = now - lastMoveTime;
            if (dt > 10) {
                velocity = (e.pageX - lastMoveX) / dt;
                lastMoveX = e.pageX;
                lastMoveTime = now;
            }
        });

        // Wheel Scroll Interceptor on Short Video Section:
        // When mouse is over this section, scrolling slides reels horizontally (NOT page).
        // Page scroll is strictly frozen until all reels are finished, then resumes smoothly!
        const shortsSection = document.getElementById('shorts') || track.closest('.shorts-section') || track;
        let targetScrollLeft = track.scrollLeft;
        let isWheelLerping = false;
        let wheelLerpId = null;

        function scrollReelsLerp(amount) {
            cancelAnimationFrame(scrollAnimationId);
            cancelAnimationFrame(momentumId);

            const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);

            // Clamp target relative to current position to avoid excessive runaway accumulation
            const minAllowed = Math.max(0, track.scrollLeft - 500);
            const maxAllowed = Math.min(maxScroll, track.scrollLeft + 500);

            targetScrollLeft = Math.max(minAllowed, Math.min(maxAllowed, targetScrollLeft + amount));

            if (!isWheelLerping) {
                isWheelLerping = true;
                function lerpStep() {
                    const diff = targetScrollLeft - track.scrollLeft;
                    if (Math.abs(diff) > 0.8) {
                        track.scrollLeft += diff * 0.22;
                        updateUI();
                        wheelLerpId = requestAnimationFrame(lerpStep);
                    } else {
                        track.scrollLeft = targetScrollLeft;
                        updateUI();
                        isWheelLerping = false;

                        // Check if boundary was reached to allow Lenis to resume
                        const atEnd = track.scrollLeft >= maxScroll - 8;
                        const atStart = track.scrollLeft <= 8;
                        if (atEnd || atStart) {
                            window.lenis?.start();
                        }
                    }
                }
                wheelLerpId = requestAnimationFrame(lerpStep);
            }
        }

        // Clean up previously registered listener if initShortsCarousel runs multiple times
        if (shortsSection._wheelHandler) {
            shortsSection.removeEventListener('wheel', shortsSection._wheelHandler, { capture: true });
        }
        if (shortsSection._leaveHandler) {
            shortsSection.removeEventListener('mouseleave', shortsSection._leaveHandler);
        }

        shortsSection._wheelHandler = function(e) {
            const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
            if (maxScroll <= 8) {
                // All cards already visible on screen - allow normal vertical page scroll
                window.lenis?.start();
                return;
            }

            const delta = e.deltaY;
            if (Math.abs(delta) < 2) return;

            const vh = window.innerHeight || document.documentElement.clientHeight;
            const trackRect = track.getBoundingClientRect();
            const trackCenter = trackRect.top + trackRect.height / 2;
            const screenCenter = vh / 2;

            // Center tolerance threshold:
            // Ensure cards are properly centered in screen view before horizontal reel sliding activates
            const centerThreshold = Math.min(85, Math.max(45, vh * 0.09));

            const isAtEnd = track.scrollLeft >= maxScroll - 8 && targetScrollLeft >= maxScroll - 8;
            const isAtStart = track.scrollLeft <= 8 && targetScrollLeft <= 8;

            // Scrolling DOWN (forward through reels)
            if (delta > 0) {
                // If video cards haven't reached the screen center yet (still entering from below),
                // do NOT intercept - let the page scroll down until cards are fully centered!
                if (trackCenter > screenCenter + centerThreshold) {
                    window.lenis?.start();
                    return;
                }

                if (!isAtEnd) {
                    // Cards ARE centered and reels not yet finished: STOP page scrolling completely!
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    window.lenis?.stop();

                    const stepAmount = Math.max(140, Math.min(280, Math.abs(delta) * 1.5));
                    scrollReelsLerp(stepAmount);
                } else {
                    // All reels finished! Allow page scrolling to smoothly resume downwards
                    window.lenis?.start();
                }
            }
            // Scrolling UP (backward through reels)
            else if (delta < 0) {
                // If video cards haven't reached the screen center yet (still entering from above),
                // do NOT intercept - let the page scroll up until cards are fully centered!
                if (trackCenter < screenCenter - centerThreshold) {
                    window.lenis?.start();
                    return;
                }

                if (!isAtStart) {
                    // Cards ARE centered and reels not yet at start: STOP page scrolling completely!
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    window.lenis?.stop();

                    const stepAmount = Math.max(140, Math.min(280, Math.abs(delta) * 1.5));
                    scrollReelsLerp(-stepAmount);
                } else {
                    // First reel reached! Allow page scrolling to smoothly resume upwards
                    window.lenis?.start();
                }
            }
        };

        shortsSection._leaveHandler = function() {
            // When mouse leaves the section, ALWAYS ensure Lenis is started
            window.lenis?.start();
        };

        // Attach in CAPTURE phase so it intercepts the event BEFORE it bubbles to window/Lenis
        shortsSection.addEventListener('wheel', shortsSection._wheelHandler, { passive: false, capture: true });
        shortsSection.addEventListener('mouseleave', shortsSection._leaveHandler);

        track.onscroll = function() {
            if (!isWheelLerping) {
                targetScrollLeft = track.scrollLeft;
            }
            updateUI();
        };
        window.onresize = function() {
            buildDots();
            updateUI();
        };

        buildDots();
        updateUI();
    };

    window.initShortsCarousel();
});

// Safeguard on window load: lock viewport to top (hero section)
window.addEventListener('load', () => {
    window.scrollTo(0, 0);
    if (window.lenis) {
        window.lenis.scrollTo(0, { immediate: true });
    }
    setTimeout(() => {
        window.scrollTo(0, 0);
        if (window.lenis) {
            window.lenis.scrollTo(0, { immediate: true });
        }
    }, 60);
});

