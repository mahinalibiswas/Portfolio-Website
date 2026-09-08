/* ==========================================================================
   MAHIN MOTION DESIGN STUDIO - MAIN SCRIPT
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

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

    /* --- 3. Navbar Sticky Effect & Scroll Spy --- */
    const navbarWrapper = document.querySelector('.navbar-wrapper');
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');

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
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : (url.length === 11 ? url : null);
    }

    function openDirectVideoModal(videoSrc) {
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
    const portfolioFilter = document.getElementById('portfolioFilter');
    const workCards = document.querySelectorAll('.work-card');
    const seeAllBtn = document.getElementById('seeAllProjectsBtn');
    const seeAllWrapper = document.getElementById('seeAllWrapper');
    const seeAllBadge = document.getElementById('seeAllBadge');
    const seeAllIcon = document.getElementById('seeAllIcon');

    let isExpanded = false;
    const INITIAL_LIMIT = 6;

    function applyCardVisibility(activeFilter) {
        let visibleMatchingCount = 0;

        workCards.forEach((card) => {
            const categories = (card.getAttribute('data-category') || '').split(' ');
            const matchesCategory = (activeFilter === 'all' || categories.includes(activeFilter));

            if (matchesCategory) {
                visibleMatchingCount++;
                if (activeFilter === 'all' && !isExpanded && visibleMatchingCount > INITIAL_LIMIT) {
                    card.style.display = 'none';
                } else {
                    card.style.display = 'flex';
                }
            } else {
                card.style.display = 'none';
            }
        });

        // Manage See All button visibility (Always visible under 6 default cards)
        if (seeAllWrapper) {
            seeAllWrapper.style.display = 'flex';
            if (seeAllBadge) seeAllBadge.textContent = workCards.length;
            
            if (isExpanded) {
                if (seeAllBtn) seeAllBtn.querySelector('span').textContent = 'Show Less';
                if (seeAllIcon) seeAllIcon.className = 'fa-solid fa-chevron-up';
            } else {
                if (seeAllBtn) seeAllBtn.querySelector('span').textContent = 'See All Projects';
                if (seeAllIcon) seeAllIcon.className = 'fa-solid fa-chevron-down';
            }
        }
    }

    if (portfolioFilter && workCards.length > 0) {
        const filterBtns = portfolioFilter.querySelectorAll('.filter-btn');

        // Dynamically calculate and update category count badges based on active cards
        function updateFilterCounts() {
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

        // Initialize dynamic count calculation and visibility
        updateFilterCounts();
        applyCardVisibility('all');

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filterValue = btn.getAttribute('data-filter');
                applyCardVisibility(filterValue);
            });
        });

        seeAllBtn?.addEventListener('click', () => {
            isExpanded = !isExpanded;
            const activeBtn = portfolioFilter.querySelector('.filter-btn.active');
            const activeFilter = activeBtn ? activeBtn.getAttribute('data-filter') : 'all';
            applyCardVisibility(activeFilter);
        });
    }

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

    function openProjectVideoModal(projectId) {
        const data = getProjectDataById(projectId);
        const modal = document.getElementById('projectModal') || document.getElementById('videoModal');
        const body = document.getElementById('projectModalBody') || modal?.querySelector('.modal-content') || modal?.querySelector('.video-responsive-wrapper');

        if (data && modal) {
            const ytId = data.youtubeId || (typeof extractYoutubeId === 'function' ? extractYoutubeId(data.youtubeUrl || data.video || '') : null);
            const rawVideo = data.video || data.youtubeUrl || '';
            
            let playerHtml = '';
            if (rawVideo.includes('<iframe')) {
                playerHtml = rawVideo.replace(/width="[^"]*"/g, 'width="100%"').replace(/height="[^"]*"/g, 'height="100%"');
            } else if (ytId) {
                playerHtml = `<iframe src="https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1" title="${data.title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="width: 100%; height: 100%; border: none; border-radius: 16px;"></iframe>`;
            } else {
                playerHtml = `<video src="${rawVideo || 'assets/videos/main_showreel.mp4'}" controls autoplay playsinline style="width: 100%; height: 100%; object-fit: contain; background: #000; border-radius: 16px;"></video>`;
            }

            if (body) {
                body.innerHTML = `
                    <div class="video-modal-inner-container">
                        <div class="video-modal-top-bar">
                            <button class="modal-back-to-projects-btn" id="modalBackToProjectsAction">
                                <i class="fa-solid fa-arrow-left"></i> Back to Projects
                            </button>
                        </div>
                        
                        <div class="pure-video-lightbox">
                            ${playerHtml}
                        </div>
                    </div>
                `;
            }
            modal.classList.add('active');
        }
    }

    function openProjectDetailsOverlay(projectId) {
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
        const backBtn = e.target.closest('#modalBackToProjectsAction, #modalTopCloseAction, .modal-back-to-projects-btn, .modal-top-close-btn');
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
            const projectId = playBtn.getAttribute('data-id');
            openProjectVideoModal(projectId);
            return;
        }
    });

    closeProjectModal?.addEventListener('click', () => {
        const modal = document.getElementById('projectModal') || document.getElementById('directVideoModal');
        modal?.classList.remove('active');
        const body = document.getElementById('projectModalBody') || modal?.querySelector('.video-responsive-wrapper');
        if (body) body.innerHTML = '';
    });

    closeDetailOverlay?.addEventListener('click', () => {
        const overlay = document.getElementById('projectDetailOverlay');
        if (overlay) {
            const detailVideos = overlay.querySelectorAll('video');
            detailVideos.forEach(v => v.pause());
            const detailIframes = overlay.querySelectorAll('iframe');
            detailIframes.forEach(f => f.src = '');
            overlay.classList.remove('active');
        }
    });

    window.startDetailInlineVideo = function(projectId) {
        const data = getProjectDataById(projectId);
        const mediaCard = document.getElementById(`detailMediaCard_${projectId}`) || document.querySelector('.detail-media-card');
        if (mediaCard && data) {
            const ytId = data.youtubeId || (typeof extractYoutubeId === 'function' ? extractYoutubeId(data.youtubeUrl || data.video || '') : null);
            const rawVideo = data.video || data.youtubeUrl || '';

            let playerHtml = '';
            if (rawVideo.includes('<iframe')) {
                playerHtml = rawVideo.replace(/width="[^"]*"/g, 'width="100%"').replace(/height="[^"]*"/g, 'height="100%"');
            } else if (ytId) {
                playerHtml = `<iframe src="https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1" title="${data.title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="width: 100%; height: 100%; border: none; border-radius: 20px;"></iframe>`;
            } else {
                playerHtml = `<video src="${rawVideo || 'assets/videos/main_showreel.mp4'}" controls autoplay playsinline style="width: 100%; height: 100%; object-fit: contain; background: #000; border-radius: 20px;"></video>`;
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

});
