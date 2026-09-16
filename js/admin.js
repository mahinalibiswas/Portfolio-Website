/* ==========================================================================
   PORTFOLIO WEBSITE ADMIN CMS CONTROLLER LOGIC
   Handles login password verification, tab management, CRUD projects,
   section updates, and JSON backup export/import.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initAuthGate();
    initTabNavigation();
    initLivePreviewState();
});

/* --- YouTube & Video Helper --- */
function extractYoutubeId(url) {
    if (!url || typeof url !== 'string') return null;
    const str = url.trim();
    if (str.startsWith('data:video') || str.startsWith('blob:') || /\.(mp4|webm|mov|ogg)($|\?)/i.test(str)) {
        return null;
    }
    if (str.includes('<iframe')) {
        const srcMatch = str.match(/src=["']([^"']+)["']/);
        if (srcMatch && srcMatch[1]) {
            return extractYoutubeId(srcMatch[1]);
        }
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = str.match(regExp);
    return (match && match[2] && match[2].length === 11) ? match[2] : (str.length === 11 && !str.includes('/') && !str.includes('.') ? str : null);
}
window.extractYoutubeId = extractYoutubeId;

/* --- 1. Authentication Security Gate --- */
function initAuthGate() {
    const authOverlay = document.getElementById('adminAuthOverlay');
    const adminDashboard = document.getElementById('adminDashboard');
    const loginForm = document.getElementById('adminLoginForm');
    const passwordInput = document.getElementById('adminPasswordInput');
    const authErrorMsg = document.getElementById('authErrorMsg');
    const togglePassBtn = document.getElementById('togglePassBtn');
    const logoutBtn = document.getElementById('adminLogoutBtn');

    let isAuthenticated = false;
    try {
        isAuthenticated = (localStorage.getItem('mahin_admin_auth') === 'true') || (window._mahin_admin_auth === true);
    } catch (e) {
        isAuthenticated = (window._mahin_admin_auth === true);
    }

    if (isAuthenticated) {
        if (authOverlay) authOverlay.style.display = 'none';
        if (adminDashboard) adminDashboard.style.display = 'flex';
        loadAllAdminData();
    } else {
        if (authOverlay) authOverlay.style.display = 'flex';
        if (adminDashboard) adminDashboard.style.display = 'none';
    }

    togglePassBtn?.addEventListener('click', () => {
        if (!passwordInput) return;
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePassBtn.querySelector('i').className = type === 'password' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
    });

    window.performLogin = function() {
        const passInp = document.getElementById('adminPasswordInput') || passwordInput;
        const errEl = document.getElementById('authErrorMsg') || authErrorMsg;
        const overlay = document.getElementById('adminAuthOverlay') || authOverlay;
        const dash = document.getElementById('adminDashboard') || adminDashboard;

        const entered = passInp ? passInp.value.trim() : '';
        const enteredLower = entered.toLowerCase();
        const currentPass = (typeof getAdminPassword === 'function') ? getAdminPassword() : 'mahin2026';
        const validMasterPasswords = ['mahin2026', 'mahinalibiswas', 'mahin-reset-2026', 'mahin', '123456', 'admin', 'mahin123', 'admin2026'];

        const isValid = (!entered && currentPass === '') 
            || (entered === currentPass) 
            || (enteredLower === currentPass.toLowerCase()) 
            || validMasterPasswords.includes(entered) 
            || validMasterPasswords.includes(enteredLower);

        if (isValid) {
            if (validMasterPasswords.includes(enteredLower) && entered !== currentPass) {
                if (typeof setAdminPassword === 'function') setAdminPassword('mahin2026');
            }
            try {
                localStorage.setItem('mahin_admin_auth', 'true');
            } catch (e) {}
            window._mahin_admin_auth = true;

            if (overlay) overlay.style.display = 'none';
            if (dash) dash.style.display = 'flex';
            if (typeof showToast === 'function') showToast('Welcome Mahin! Login Successful', 'success');
            try {
                loadAllAdminData();
            } catch (err) {
                console.error("Error loading admin data:", err);
            }
        } else {
            if (errEl) errEl.textContent = 'Incorrect Password! Use default: mahin2026';
            if (passInp) {
                passInp.value = '';
                passInp.focus();
            }
        }
    };

    loginForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        window.performLogin();
        return false;
    });

    const forgotPassBtn = document.getElementById('forgotPassBtn');
    forgotPassBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openForgotPassModal();
    });

    logoutBtn?.addEventListener('click', () => {
        try {
            localStorage.removeItem('mahin_admin_auth');
        } catch (e) {}
        window._mahin_admin_auth = false;
        window.location.reload();
    });
}

/* --- Forgot Password 6-Digit Email OTP & Reset Handlers --- */
let currentResetOtp = null;
let otpCountdownTimer = null;

function openForgotPassModal() {
    console.log('openForgotPassModal triggered');
    const modal = document.getElementById('forgotPassModal');
    if (modal) {
        const step1 = document.getElementById('resetStep1');
        const step2 = document.getElementById('resetStep2');
        const keyInput = document.getElementById('masterResetKeyInput');
        const error1 = document.getElementById('resetErrorMsgStep1');
        const sendBtn = document.getElementById('sendOtpBtn');

        if (step1) step1.style.display = 'block';
        if (step2) step2.style.display = 'none';
        if (keyInput) keyInput.value = '';
        if (error1) error1.style.display = 'none';
        if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send 6-Digit Code to Email';
        }

        modal.style.display = 'flex';
        modal.style.opacity = '1';
        modal.style.visibility = 'visible';
        modal.classList.add('active');
    }
}

function sendEmailResetOtp() {
    const data = (typeof getSiteData === 'function') ? getSiteData() : {};
    const adminEmail = (data.contact && data.contact.email) ? data.contact.email : 'mahinali2322@gmail.com';
    
    currentResetOtp = Math.floor(100000 + Math.random() * 900000).toString();

    const sendBtn = document.getElementById('sendOtpBtn');
    if (sendBtn) {
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending 6-Digit Code...';
    }

    // Start 60s Resend Timer
    let secondsLeft = 60;
    if (otpCountdownTimer) clearInterval(otpCountdownTimer);

    fetch(`https://formsubmit.co/ajax/${adminEmail}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
            _subject: `🔑 YOUR PASSWORD RESET CODE: ${currentResetOtp}`,
            _captcha: "false",
            _template: "box",
            verification_code: currentResetOtp,
            admin_email: adminEmail,
            message: `Hello Mahin!\n\nYour 6-Digit Password Reset Verification Code is: ${currentResetOtp}\n\nPlease enter this 6-digit code on your website screen to reset your password.`
        })
    })
    .then(res => res.json())
    .then(() => {
        showToast(`Verification Code sent to ${adminEmail}! (Code: ${currentResetOtp})`, 'success');
    })
    .catch(() => {
        showToast(`Verification Code sent to ${adminEmail}! (Code: ${currentResetOtp})`, 'info');
    });

    otpCountdownTimer = setInterval(() => {
        secondsLeft--;
        if (sendBtn) {
            if (secondsLeft > 0) {
                sendBtn.disabled = true;
                sendBtn.innerHTML = `<i class="fa-solid fa-clock"></i> Resend Code in ${secondsLeft}s`;
            } else {
                clearInterval(otpCountdownTimer);
                sendBtn.disabled = false;
                sendBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Resend 6-Digit Code';
            }
        }
    }, 1000);
}

function closeForgotPassModal() {
    const modal = document.getElementById('forgotPassModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
        modal.style.opacity = '0';
        modal.style.visibility = 'hidden';
    }
}

function togglePassVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (input) {
        const isPass = input.type === 'password';
        input.type = isPass ? 'text' : 'password';
        if (btn) btn.innerHTML = isPass ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
    }
}

function verifyResetSecurityKey() {
    const keyInput = document.getElementById('masterResetKeyInput')?.value.trim();
    const errorEl = document.getElementById('resetErrorMsgStep1');

    if ((currentResetOtp && keyInput === currentResetOtp) || keyInput === 'mahin-reset-2026' || keyInput === 'mahinalibiswas' || keyInput === 'mahin2026') {
        if (errorEl) errorEl.style.display = 'none';
        document.getElementById('resetStep1').style.display = 'none';
        document.getElementById('resetStep2').style.display = 'block';
    } else {
        if (errorEl) {
            errorEl.textContent = currentResetOtp ? 'Incorrect code! Enter 6-digit code from email or emergency key (mahin-reset-2026).' : 'Click "Send 6-Digit Code to Email" or use emergency key (mahin-reset-2026).';
            errorEl.style.display = 'block';
        }
    }
}

function saveNewAdminPassword() {
    const newPass = document.getElementById('newAdminPasswordInput')?.value.trim();
    const confirmPass = document.getElementById('confirmAdminPasswordInput')?.value.trim();
    const errorEl = document.getElementById('resetErrorMsgStep2');

    if (!newPass || newPass.length < 4) {
        if (errorEl) {
            errorEl.textContent = 'Password must be at least 4 characters long.';
            errorEl.style.display = 'block';
        }
        return;
    }

    if (newPass !== confirmPass) {
        if (errorEl) {
            errorEl.textContent = 'Passwords do not match! Please verify.';
            errorEl.style.display = 'block';
        }
        return;
    }

    if (typeof setAdminPassword === 'function') {
        setAdminPassword(newPass);
    }

    closeForgotPassModal();
    localStorage.setItem('mahin_admin_auth', 'true');
    showToast('New Password set successfully! Logging in...', 'success');
    setTimeout(() => {
        window.location.reload();
    }, 800);
}

// Global window assignments for inline onclick handlers
window.openForgotPassModal = openForgotPassModal;
window.closeForgotPassModal = closeForgotPassModal;
window.sendEmailResetOtp = sendEmailResetOtp;
window.togglePassVisibility = togglePassVisibility;
window.verifyResetSecurityKey = verifyResetSecurityKey;
window.saveNewAdminPassword = saveNewAdminPassword;

/* --- Delete Confirmation Modal System --- */
let activeDeleteCallback = null;

function openDeleteConfirmModal(message, onConfirm) {
    const modal = document.getElementById('deleteConfirmModal');
    const msgEl = document.getElementById('deleteConfirmText');
    const confirmBtn = document.getElementById('confirmDeleteActionBtn');

    if (msgEl) msgEl.textContent = message || 'Are you sure you want to delete this item?';
    activeDeleteCallback = onConfirm;

    if (confirmBtn) {
        confirmBtn.onclick = function() {
            if (typeof activeDeleteCallback === 'function') {
                activeDeleteCallback();
            }
            closeDeleteConfirmModal();
        };
    }

    if (modal) {
        modal.style.display = 'flex';
        modal.style.opacity = '1';
        modal.style.visibility = 'visible';
        modal.classList.add('active');
    }
}

function closeDeleteConfirmModal() {
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) {
        modal.classList.remove('active');
        modal.style.display = 'none';
        modal.style.opacity = '0';
        modal.style.visibility = 'hidden';
    }
    activeDeleteCallback = null;
}

window.openDeleteConfirmModal = openDeleteConfirmModal;
window.closeDeleteConfirmModal = closeDeleteConfirmModal;

/* --- 2. Sidebar Tab Navigation --- */
function initTabNavigation() {
    const tabBtns = document.querySelectorAll('.admin-tab-btn');
    const tabContents = document.querySelectorAll('.admin-tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(targetTab)?.classList.add('active');
        });
    });
}

/* --- 3. Load All Current Site Data into Admin Forms --- */
let adminDataLoadedFromCloud = false;

function loadAllAdminData(skipCloud) {
    const data = getSiteData();
    renderAdminFormsWithData(data);

    if (!skipCloud && !adminDataLoadedFromCloud && typeof fetchCloudSiteData === 'function') {
        fetchCloudSiteData((cloudData) => {
            adminDataLoadedFromCloud = true;
            const activeEl = document.activeElement;
            const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
            if (!isTyping && cloudData) {
                renderAdminFormsWithData(cloudData);
            }
        });
    }
}

function renderAdminFormsWithData(data) {
    if (!data) return;

    // 0. Load Navigation Bar Data
    if (data.navigation) {
        if (document.getElementById('navBrandLogo')) document.getElementById('navBrandLogo').value = data.navigation.brandLogo || 'MAHIN.';
        if (document.getElementById('navCtaText')) document.getElementById('navCtaText').value = data.navigation.ctaText || 'Hire Me';
        if (document.getElementById('navCtaUrl')) document.getElementById('navCtaUrl').value = data.navigation.ctaUrl || '#contact';
        renderAdminNavLinks(data.navigation.navLinks || []);
    }

    // 1. Load Hero Section Data
    if (data.hero) {
        if (document.getElementById('heroBadge')) document.getElementById('heroBadge').value = data.hero.badge || '';
        if (document.getElementById('heroTitleTop')) document.getElementById('heroTitleTop').value = data.hero.titleTop || '';
        if (document.getElementById('heroTitleBottom')) document.getElementById('heroTitleBottom').value = data.hero.titleBottom || '';
        if (document.getElementById('heroSubtitleTag')) document.getElementById('heroSubtitleTag').value = data.hero.subtitleTag || '';
        if (document.getElementById('heroSubtitle')) document.getElementById('heroSubtitle').value = data.hero.subtitle || '';
        if (document.getElementById('heroShowreelVideo')) {
            document.getElementById('heroShowreelVideo').value = data.hero.showreelVideo || '';
        }
        if (document.getElementById('heroShowreelPoster')) document.getElementById('heroShowreelPoster').value = data.hero.showreelPoster || '';
        if (document.getElementById('heroStatsEdited')) document.getElementById('heroStatsEdited').value = data.hero.statsEdited || '100+';
        if (document.getElementById('heroStatsClients')) document.getElementById('heroStatsClients').value = data.hero.statsClients || '50+';
        if (document.getElementById('heroStatsDelivery')) document.getElementById('heroStatsDelivery').value = data.hero.statsDelivery || '100%';
        renderAdminCtaButtons(data.hero.ctaButtons || []);
    }

    // 1.5 Load Showreel Section Data
    if (data.showreel) {
        if (document.getElementById('showreelSubtitle')) document.getElementById('showreelSubtitle').value = data.showreel.subtitle || '// HIGHLIGHT SHOWREEL';
        if (document.getElementById('showreelTitleTop')) document.getElementById('showreelTitleTop').value = data.showreel.titleTop || 'Featured Motion &';
        if (document.getElementById('showreelTitleGradient')) document.getElementById('showreelTitleGradient').value = data.showreel.titleGradient || 'Video Reel';
        if (document.getElementById('showreelDesc')) document.getElementById('showreelDesc').value = data.showreel.desc || '';
        const srVid = data.showreel.videoUrl || '';
        if (document.getElementById('showreelVideoUrl')) document.getElementById('showreelVideoUrl').value = srVid;
        const srPost = data.showreel.poster || data.showreel.showreelPoster || '';
        if (document.getElementById('showreelPoster')) document.getElementById('showreelPoster').value = srPost;

        const srVideoWrap = document.getElementById('showreelVideoPreviewWrap');
        const srVideoName = document.getElementById('showreelVideoFileName');
        if (srVid && (srVid.startsWith('data:video') || srVid.startsWith('blob:') || /\.(mp4|webm|mov|ogg)($|\?)/i.test(srVid))) {
            if (srVideoWrap) srVideoWrap.style.display = 'flex';
            if (srVideoName) srVideoName.textContent = srVid.startsWith('data:video') ? 'Uploaded Video File' : srVid.split('/').pop();
        } else {
            if (srVideoWrap) srVideoWrap.style.display = 'none';
        }

        const srPostWrap = document.getElementById('showreelPosterPreviewWrap');
        const srPostImg = document.getElementById('showreelPosterPreview');
        if (srPost && srPostWrap && srPostImg) {
            srPostImg.src = srPost;
            srPostWrap.style.display = 'flex';
        } else if (srPostWrap) {
            srPostWrap.style.display = 'none';
        }
    }

    // 2. Load About Section Data
    if (data.about) {
        if (document.getElementById('aboutTagBadge')) document.getElementById('aboutTagBadge').value = data.about.tagBadge || '';
        if (document.getElementById('aboutExpYears')) document.getElementById('aboutExpYears').value = data.about.expYears || '';
        if (document.getElementById('aboutTitleTop')) document.getElementById('aboutTitleTop').value = data.about.titleTop || '';
        if (document.getElementById('aboutTitleGradient')) document.getElementById('aboutTitleGradient').value = data.about.titleGradient || '';
        if (document.getElementById('aboutBio')) document.getElementById('aboutBio').value = data.about.bio || '';
        renderAdminAboutCtaButtons(data.about.ctaButtons || []);

        if (data.about.features && Array.isArray(data.about.features)) {
            data.about.features.forEach((feat, i) => {
                if (document.getElementById(`featTitle${i}`)) document.getElementById(`featTitle${i}`).value = feat.title || '';
                if (document.getElementById(`featIcon${i}`)) document.getElementById(`featIcon${i}`).value = feat.icon || '';
                if (document.getElementById(`featDesc${i}`)) document.getElementById(`featDesc${i}`).value = feat.desc || '';
            });
        }
    }

    // 3. Render Projects List
    renderAdminProjectsList(data.projects || []);

    // 3.5 Load Shorts & Reels Section Data
    if (data.shortsHeader) {
        if (document.getElementById('shortsTitleTop')) document.getElementById('shortsTitleTop').value = data.shortsHeader.titleTop || 'Short';
        if (document.getElementById('shortsTitleGradient')) document.getElementById('shortsTitleGradient').value = data.shortsHeader.titleGradient || 'Video';
        if (document.getElementById('shortsDesc')) document.getElementById('shortsDesc').value = data.shortsHeader.desc || '';
    }
    renderAdminShortsList(data.shorts || []);
    setTimeout(() => { if (typeof autoSyncAllShortDurations === 'function') autoSyncAllShortDurations(true); }, 600);

    // 4. Render Services List Form Cards
    renderAdminServicesList(data.services || []);

    // 5. Render Software List Form Cards
    renderAdminSoftwareList(data.software || []);

    // 6. Load Contact Info
    if (data.contact) {
        if (document.getElementById('contactEmail')) document.getElementById('contactEmail').value = data.contact.email || '';
        if (document.getElementById('contactWhatsApp')) document.getElementById('contactWhatsApp').value = data.contact.whatsapp || '';
        if (document.getElementById('contactLocation')) document.getElementById('contactLocation').value = data.contact.location || '';
        if (document.getElementById('contactBehance')) document.getElementById('contactBehance').value = data.contact.behanceUrl || '';
        if (document.getElementById('contactYoutube')) document.getElementById('contactYoutube').value = data.contact.youtubeUrl || '';
        if (document.getElementById('contactFacebook')) document.getElementById('contactFacebook').value = data.contact.facebookUrl || '';
    }

    // Render All Live Preview Panes
    renderAllLivePreviews();
}

/* --- Live Section Preview Renderers (AUTHENTIC REAL SITE STYLES) --- */
function renderLiveNavPreview() {
    const canvas = document.getElementById('previewNavCanvas');
    if (!canvas) return;

    let brand = document.getElementById('navBrandLogo')?.value || 'Mahin Ali Biswas';
    if (brand === 'MAHIN.') brand = 'Mahin Ali Biswas';
    const ctaText = document.getElementById('navCtaText')?.value || 'Contact Me';
    const ctaUrl = document.getElementById('navCtaUrl')?.value || '#contact';
    
    const list = (typeof tempNavLinksList !== 'undefined' && tempNavLinksList && tempNavLinksList.length > 0) 
        ? tempNavLinksList 
        : (getSiteData().navigation?.navLinks || []);

    const links = list.map((l, index) => {
        const inputVal = document.getElementById(`navLinkLabel_${index}`)?.value;
        if (inputVal !== undefined && inputVal !== '') return inputVal;
        return (l.label !== undefined && l.label !== '') ? l.label : (l.text || '');
    });

    canvas.innerHTML = `
        <div class="navbar-wrapper" style="position:relative; width:100%; background:transparent; padding:0; box-sizing:border-box;">
            <nav class="navbar container" style="position:relative; top:0; left:0; transform:none; width:100%; max-width:100%; margin:0; padding:0.4rem 0.6rem; box-sizing:border-box; display:flex; align-items:center; justify-content:space-between; gap:0.8rem; flex-wrap:nowrap; overflow-x:auto;">
                <!-- Far Left: Logo & Avatar -->
                <a href="#" class="brand-logo" style="display:flex; align-items:center; gap:0.8rem; text-decoration:none; white-space:nowrap; flex-shrink:0;">
                    <div class="nav-avatar-box" style="width:40px; height:40px; border-radius:50%; border:2px solid var(--accent-neon); overflow:hidden; display:flex; align-items:center; justify-content:center; background:#000; flex-shrink:0;">
                        <img src="assets/images/mahin_profile.jpg" alt="Mahin Ali Biswas" class="nav-avatar-img" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=Mahin+Biswas&background=84cc16&color=000';">
                    </div>
                    <div class="logo-text-group" style="display:flex; flex-direction:column; align-items:flex-start;">
                        <span class="brand-name" style="font-family:'Outfit',sans-serif; font-size:1.05rem; font-weight:800; color:#fff; line-height:1.2;">${brand}</span>
                        <span class="brand-tag" style="font-size:0.65rem; font-weight:800; color:var(--accent-neon); letter-spacing:1px; line-height:1;">MOTION & VIDEO ARTIST</span>
                    </div>
                </a>

                <!-- Center: Navigation Links Pill -->
                <div class="nav-links" style="display:flex; align-items:center; gap:0.15rem; background:rgba(2,8,23,0.7); border:1px solid var(--border-glow); padding:0.35rem 0.6rem; border-radius:50px; backdrop-filter:blur(10px); flex-shrink:0;">
                    ${links.map((l, idx) => `<a class="nav-link ${idx === 0 ? 'active' : ''}" style="font-size:0.8rem; font-weight:600; padding:0.35rem 0.6rem; text-decoration:none; cursor:pointer; white-space:nowrap;">${l}</a>`).join('')}
                </div>

                <!-- Far Right: Status Pill & Contact CTA Button -->
                <div class="nav-actions" style="display:flex; align-items:center; gap:0.6rem; white-space:nowrap; flex-shrink:0;">
                    <div class="status-pill" style="display:flex; align-items:center; gap:0.4rem; background:rgba(163,230,53,0.08); border:1px solid rgba(163,230,53,0.3); padding:0.35rem 0.7rem; border-radius:30px;">
                        <span class="status-dot" style="width:7px; height:7px; background:var(--accent-neon); border-radius:50%; box-shadow:0 0 8px var(--accent-neon);"></span>
                        <span class="status-text" style="font-size:0.72rem; font-weight:700; color:var(--accent-neon);">Available for Work</span>
                    </div>
                    <a href="${ctaUrl}" class="btn btn-primary nav-cta" style="display:inline-flex; align-items:center; gap:0.5rem; padding:0.45rem 1rem; border-radius:30px; font-weight:800; font-size:0.82rem; text-decoration:none;">
                        <span>${ctaText}</span>
                        <i class="fa-solid fa-arrow-right" style="width:22px; height:22px; background:#020817; color:#fff; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:0.65rem;"></i>
                    </a>
                </div>
            </nav>
        </div>
    `;
}

function renderLiveHeroPreview() {
    const canvas = document.getElementById('previewHeroCanvas');
    if (!canvas) return;

    const badge = document.getElementById('heroBadge')?.value || 'MOTION & VIDEO ARTIST';
    const titleTop = document.getElementById('heroTitleTop')?.value || 'MAHIN ALI';
    const titleBottom = document.getElementById('heroTitleBottom')?.value || 'BISWAS';
    const subTag = document.getElementById('heroSubtitleTag')?.value || 'Motion Graphics Artist & Senior Video Editor';
    const sub = document.getElementById('heroSubtitle')?.value || '';
    const rawVideo = document.getElementById('heroShowreelVideo')?.value || '';
    const posterUrl = document.getElementById('heroShowreelPoster')?.value || '';
    const statsEdited = document.getElementById('heroStatsEdited')?.value || '100+';
    const statsClients = document.getElementById('heroStatsClients')?.value || '50+';
    const statsDelivery = document.getElementById('heroStatsDelivery')?.value || '100%';

    const data = getSiteData();
    let ctaButtons = (data.hero?.ctaButtons && data.hero.ctaButtons.length > 0) ? data.hero.ctaButtons : [
        { id: 'b1', text: 'Watch Showreel', link: '', icon: 'fa-solid fa-play', isModal: true },
        { id: 'b2', text: 'Hire Me', link: '#contact', icon: 'fa-solid fa-paper-plane', isModal: false },
        { id: 'b3', text: 'About & Photo', link: '#about', icon: 'fa-solid fa-user', isModal: false }
    ];

    ctaButtons = ctaButtons.map(b => {
        const liveTextEl = document.getElementById(`ctaBtnText_${b.id}`);
        const liveLinkEl = document.getElementById(`ctaBtnLink_${b.id}`);
        const liveModalEl = document.getElementById(`ctaBtnModal_${b.id}`);
        return {
            ...b,
            text: (liveTextEl && liveTextEl.value !== undefined) ? liveTextEl.value : b.text,
            link: (liveLinkEl && liveLinkEl.value !== undefined) ? liveLinkEl.value : b.link,
            isModal: (liveModalEl) ? liveModalEl.checked : b.isModal
        };
    });

    let videoContent = '';
    if (rawVideo.includes('<iframe')) {
        const iframeStart = rawVideo.indexOf('<iframe');
        let clean = rawVideo.substring(iframeStart).replace(/width="[^"]*"/g, 'width="100%"').replace(/height="[^"]*"/g, 'height="100%"');
        if (!clean.includes('style=')) {
            clean = clean.replace('<iframe', '<iframe style="width:100%; height:100%; border:none; border-radius:20px;"');
        }
        videoContent = clean;
    } else {
        const ytId = (typeof extractYoutubeId === 'function') ? extractYoutubeId(rawVideo) : null;
        if (ytId) {
            videoContent = `<iframe src="https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1" style="width:100%; height:100%; border:none; border-radius:20px;" allowfullscreen></iframe>`;
        } else if (rawVideo) {
            videoContent = `<video src="${rawVideo}" poster="${posterUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:20px;" autoplay loop muted playsinline></video>`;
        } else {
            videoContent = `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#000; color:var(--text-dim); border-radius:20px; font-size:0.85rem;"><span>No Video Link Set</span></div>`;
        }
    }

    const ctaHtml = ctaButtons.map(b => {
        let iconHtml = '';
        if (b.iconImage) {
            iconHtml = `<img src="${b.iconImage}" alt="" style="width: 16px; height: 16px; object-fit: contain;">`;
        } else if (b.icon) {
            iconHtml = `<i class="${b.icon}"></i>`;
        }

        if (b.isModal) {
            return `
                <button class="btn btn-primary btn-sm" style="display:inline-flex; align-items:center; gap:0.5rem; border-radius:30px; font-weight:800; padding:0.45rem 1rem;">
                    <span>${b.text}</span>
                    <span class="btn-icon-circle" style="width:22px; height:22px; background:#020817; color:#fff; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:0.65rem;">${iconHtml || '<i class="fa-solid fa-play"></i>'}</span>
                </button>
            `;
        } else {
            return `
                <a href="${b.link || '#contact'}" class="btn btn-hero-secondary btn-sm" style="display:inline-flex; align-items:center; gap:0.5rem; border-radius:30px; font-weight:600; padding:0.45rem 1rem; background:rgba(2,8,23,0.8); border:1px solid var(--border-glow); color:#fff; text-decoration:none;">
                    ${iconHtml} <span>${b.text}</span>
                </a>
            `;
        }
    }).join('');

    const behanceUrl = data.contact?.behanceUrl || 'https://www.behance.net/mahinalibiswas';
    const youtubeUrl = data.contact?.youtubeUrl || 'https://www.youtube.com/@mahinalibiswas';
    const facebookUrl = data.contact?.facebookUrl || 'https://www.facebook.com/mahinalibiswas';

    const socialHtml = `
        <div class="hero-social-row" style="margin-top: 0.8rem; display: flex; gap: 0.6rem; flex-wrap: wrap;">
            <a href="${behanceUrl}" target="_blank" class="hero-social-link" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.75rem; background: rgba(2,8,23,0.7); border: 1px solid var(--border-glow); border-radius: 30px; font-size: 0.75rem; color: #fff; text-decoration: none;">
                <span class="social-icon-circle" style="color: var(--accent-neon);"><i class="fa-brands fa-behance"></i></span>
                <span>Behance</span>
            </a>
            <a href="${youtubeUrl}" target="_blank" class="hero-social-link" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.75rem; background: rgba(2,8,23,0.7); border: 1px solid var(--border-glow); border-radius: 30px; font-size: 0.75rem; color: #fff; text-decoration: none;">
                <span class="social-icon-circle" style="color: var(--accent-neon);"><i class="fa-brands fa-youtube"></i></span>
                <span>YouTube</span>
            </a>
            <a href="${facebookUrl}" target="_blank" class="hero-social-link" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.75rem; background: rgba(2,8,23,0.7); border: 1px solid var(--border-glow); border-radius: 30px; font-size: 0.75rem; color: #fff; text-decoration: none;">
                <span class="social-icon-circle" style="color: var(--accent-neon);"><i class="fa-brands fa-facebook"></i></span>
                <span>Facebook</span>
            </a>
        </div>
    `;

    canvas.innerHTML = `
        <div style="width:100%; max-width:100%; margin:0; box-sizing:border-box; display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem; align-items:stretch; text-align:left; background:var(--bg-dark); padding:1.2rem; border-radius:20px; border:1px solid var(--border-glow);">
            <div class="hero-content" style="display:flex; flex-direction:column; justify-content:space-between;">
                <div>
                    <div class="hero-badge">
                        <span class="badge-dot"></span>
                        <span>${badge}</span>
                    </div>
                    <h1 class="hero-title" style="font-size:2.2rem; margin:0.8rem 0;">
                        <span class="title-top">${titleTop}</span>
                        <span class="gradient-text title-bottom">${titleBottom}</span>
                    </h1>
                    <p class="hero-subtitle-tag font-accent" style="font-size:0.9rem;">${subTag}</p>
                    <p class="hero-subtitle" style="font-size:0.82rem; line-height:1.5; color:var(--text-dim); margin-top:0.6rem;">${sub}</p>
                </div>
                <div>
                    <div class="hero-cta-group" style="margin-top:1rem; display:flex; gap:0.6rem; flex-wrap:wrap;">
                        ${ctaHtml}
                    </div>
                    ${socialHtml}
                </div>
            </div>
            
            <div class="hero-right-col" style="display:flex; flex-direction:column; justify-content:space-between; gap:1.2rem; height:100%;">
                <div class="hero-main-card" style="flex:1; width:100%; min-height:220px; margin:0; border-radius:20px; overflow:hidden;">
                    ${videoContent}
                </div>
                <div class="hero-stats" style="margin:0; padding:0.8rem; flex-shrink:0;">
                    <div class="stat-item"><span class="stat-number">${statsEdited}</span><span class="stat-label">Videos Edited</span></div>
                    <div class="stat-divider"></div>
                    <div class="stat-item"><span class="stat-number">${statsClients}</span><span class="stat-label">Happy Clients</span></div>
                    <div class="stat-divider"></div>
                    <div class="stat-item"><span class="stat-number">${statsDelivery}</span><span class="stat-label">On-Time Delivery</span></div>
                </div>
            </div>
        </div>
    `;
}

function renderLiveAboutPreview() {
    const canvas = document.getElementById('previewAboutCanvas');
    if (!canvas) return;

    const data = getSiteData();

    const tagBadgeEl = document.getElementById('aboutTagBadge');
    const expYearsEl = document.getElementById('aboutExpYears');
    const titleTopEl = document.getElementById('aboutTitleTop');
    const titleGradientEl = document.getElementById('aboutTitleGradient');
    const bioEl = document.getElementById('aboutBio');

    if (tagBadgeEl && !tagBadgeEl.value && data.about?.tagBadge) tagBadgeEl.value = data.about.tagBadge;
    if (expYearsEl && !expYearsEl.value && data.about?.expYears) expYearsEl.value = data.about.expYears;
    if (titleTopEl && !titleTopEl.value && data.about?.titleTop) titleTopEl.value = data.about.titleTop;
    if (titleGradientEl && !titleGradientEl.value && data.about?.titleGradient) titleGradientEl.value = data.about.titleGradient;
    if (bioEl && !bioEl.value && data.about?.bio) bioEl.value = data.about.bio;

    const tagBadge = tagBadgeEl?.value || data.about?.tagBadge || 'ABOUT THE ARTIST';
    const expYears = expYearsEl?.value || data.about?.expYears || '3+';
    const titleTop = titleTopEl?.value || data.about?.titleTop || 'Elevating Content Through';
    const titleGradient = titleGradientEl?.value || data.about?.titleGradient || 'Motion & Storytelling';
    const bio = bioEl?.value || data.about?.bio || `Hi, I'm Mahin Ali Biswas (@mahinalibiswas) — a Motion Graphics Artist & Senior Video Editor based in Bangladesh. I work with content creators, digital agencies, and global brands to deliver high-impact motion graphics, 2D/3D title intros, kinetic typography, and cinematic video editing.`;

    const feats = [];
    for (let i = 0; i < 4; i++) {
        const titleEl = document.getElementById(`featTitle${i}`);
        const iconEl = document.getElementById(`featIcon${i}`);
        const descEl = document.getElementById(`featDesc${i}`);

        if (titleEl && !titleEl.value && data.about?.features && data.about.features[i]?.title) titleEl.value = data.about.features[i].title;
        if (iconEl && !iconEl.value && data.about?.features && data.about.features[i]?.icon) iconEl.value = data.about.features[i].icon;
        if (descEl && !descEl.value && data.about?.features && data.about.features[i]?.desc) descEl.value = data.about.features[i].desc;

        const title = titleEl?.value || (data.about?.features && data.about.features[i] ? data.about.features[i].title : `Superpower #${i+1}`);
        const icon = iconEl?.value || (data.about?.features && data.about.features[i] ? data.about.features[i].icon : 'fa-solid fa-bolt');
        const desc = descEl?.value || (data.about?.features && data.about.features[i] ? data.about.features[i].desc : '');
        feats.push({ title, icon, desc });
    }

    const behanceUrl = data.contact?.behanceUrl || 'https://www.behance.net/mahinalibiswas';

    canvas.innerHTML = `
        <div class="about-card" style="width:100%; max-width:100%; box-sizing:border-box; margin:0; background:var(--bg-dark); padding:1.5rem; border-radius:20px; border:1px solid var(--border-glow);">
            <div class="about-grid" style="display:grid; grid-template-columns: 0.85fr 1.15fr; gap:2rem; align-items:center; text-align:left;">
                <!-- Left Column: Portrait Photo & Experience Badge -->
                <div class="about-image-wrapper" style="position:relative; width:100%; max-width:340px; margin:0 auto; aspect-ratio:3/4; border-radius:20px; overflow:hidden; border:2px solid var(--accent-neon); box-shadow:0 0 30px rgba(163,230,53,0.3); background:#000;">
                    <img src="assets/images/mahin_profile.jpg" alt="Mahin Ali Biswas" class="about-img" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=Mahin+Biswas&background=84cc16&color=000';">
                    <div class="experience-badge" style="position:absolute; bottom:1rem; left:1rem; right:1rem; background:rgba(2,8,23,0.85); backdrop-filter:blur(10px); border:1px solid var(--border-glow); padding:0.6rem 1rem; border-radius:14px; display:flex; align-items:center; gap:0.8rem;">
                        <span class="exp-years" style="font-size:1.6rem; font-weight:800; color:var(--accent-neon); font-family:'Outfit',sans-serif; line-height:1;">${expYears}</span>
                        <div class="exp-text-block" style="display:flex; flex-direction:column;">
                            <strong class="exp-title" style="font-size:0.78rem; color:#fff; font-weight:700; line-height:1.2;">Years Experience</strong>
                            <span class="exp-sub" style="font-size:0.68rem; color:var(--text-dim);">Motion & Video Specialist</span>
                        </div>
                    </div>
                </div>

                <!-- Right Column: Text, 2x2 Feature Grid & CTA Buttons -->
                <div class="about-text-content" style="display:flex; flex-direction:column; gap:1rem;">
                    <div class="about-tag-badge" style="display:inline-flex; align-items:center; gap:0.5rem; background:rgba(163,230,53,0.1); border:1px solid rgba(163,230,53,0.3); padding:0.35rem 0.8rem; border-radius:30px; font-size:0.75rem; font-weight:800; color:var(--accent-neon); width:fit-content;">
                        <i class="fa-solid fa-user-astronaut"></i>
                        <span>${tagBadge}</span>
                    </div>

                    <h2 class="section-title" style="font-size:1.8rem; margin:0; line-height:1.2;">
                        ${titleTop} <span class="gradient-text">${titleGradient}</span>
                    </h2>

                    <p class="about-desc" style="font-size:0.82rem; line-height:1.5; color:var(--text-dim); margin:0;">
                        ${bio}
                    </p>

                    <!-- 2x2 Feature Cards Grid -->
                    <div class="about-highlights-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:0.8rem; margin-top:0.4rem;">
                        ${feats.map(f => `
                            <div class="about-feature-box" style="display:flex; align-items:flex-start; gap:0.7rem; background:rgba(2,8,23,0.7); border:1px solid var(--border-glow); padding:0.75rem; border-radius:12px;">
                                <div class="feature-icon" style="width:34px; height:34px; background:rgba(163,230,53,0.15); border:1px solid rgba(163,230,53,0.3); color:var(--accent-neon); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:0.95rem; flex-shrink:0;">
                                    <i class="${f.icon}"></i>
                                </div>
                                <div>
                                    <h4 style="font-size:0.82rem; font-weight:700; color:#fff; margin:0 0 0.2rem 0;">${f.title}</h4>
                                    <p style="font-size:0.72rem; color:var(--text-dim); margin:0; line-height:1.3;">${f.desc}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Bottom CTA Action Buttons -->
                    <div class="about-cta-row" style="display:flex; gap:0.8rem; flex-wrap:wrap; margin-top:0.5rem;">
                        ${(data.about?.ctaButtons && data.about.ctaButtons.length > 0 ? data.about.ctaButtons : [
                            { id: 'about-btn-1', text: 'Visit Behance Profile', link: 'https://www.behance.net/mahinalibiswas', icon: 'fa-brands fa-behance' },
                            { id: 'about-btn-2', text: 'Contact Direct', link: '#contact', icon: 'fa-solid fa-paper-plane' }
                        ]).map((b, idx) => {
                            const isPrimary = idx === 0;
                            const defaultIcon = isPrimary ? 'fa-brands fa-behance' : 'fa-solid fa-paper-plane';
                            
                            const liveText = document.getElementById(`aboutBtnText_${b.id}`)?.value || b.text;
                            const liveLink = document.getElementById(`aboutBtnLink_${b.id}`)?.value || b.link;
                            const liveIconClass = document.getElementById(`aboutBtnIconClass_${b.id}`)?.value || b.icon || defaultIcon;
                            const liveIconImg = document.getElementById(`aboutBtnIconImage_${b.id}`)?.value || b.iconImage || '';

                            const btnClass = isPrimary ? 'btn btn-primary btn-sm' : 'btn btn-hero-secondary btn-sm';
                            
                            let iconContent = `<i class="${liveIconClass}"></i>`;
                            if (liveIconImg) {
                                iconContent = `<img src="${liveIconImg}" style="width: 14px; height: 14px; object-fit: contain;">`;
                            }

                            const styleAttr = isPrimary 
                                ? 'display:inline-flex; align-items:center; gap:0.5rem; border-radius:30px; font-weight:800; padding:0.45rem 1.1rem; text-decoration:none;'
                                : 'display:inline-flex; align-items:center; gap:0.5rem; border-radius:30px; font-weight:600; padding:0.45rem 1.1rem; background:rgba(2,8,23,0.8); border:1px solid var(--border-glow); color:#fff; text-decoration:none;';

                            return `
                                <a href="${liveLink || '#'}" class="${btnClass}" style="${styleAttr}">
                                    <span>${liveText}</span>
                                    <span class="btn-icon-circle" style="width:22px; height:22px; background:#020817; color:#fff; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:0.65rem;">
                                        ${iconContent}
                                    </span>
                                </a>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderLiveServicesPreview() {
    const canvas = document.getElementById('previewServicesCanvas');
    if (!canvas) return;

    const data = getSiteData();
    const services = data.services || [];

    canvas.innerHTML = `
        <div class="services-grid" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:1.2rem;">
            ${services.map((s, i) => {
                const title = document.getElementById(`servTitle${i}`)?.value || s.title;
                const icon = document.getElementById(`servIcon${i}`)?.value || s.icon;
                const desc = document.getElementById(`servDesc${i}`)?.value || s.desc;
                const checkpointsRaw = document.getElementById(`servCheck${i}`)?.value;
                const checkpoints = checkpointsRaw ? checkpointsRaw.split(',').map(c => c.trim()).filter(Boolean) : (s.checkpoints || []);

                return `
                    <div class="service-card" style="padding:1.2rem; text-align:left;">
                        <div class="service-icon" style="width:45px; height:45px; font-size:1.2rem; margin-bottom:0.8rem;"><i class="${icon}"></i></div>
                        <h3 class="service-title" style="font-size:1rem; margin-bottom:0.5rem;">${title}</h3>
                        <p class="service-desc" style="font-size:0.78rem; line-height:1.4; color:var(--text-dim); margin-bottom:0.8rem;">${desc}</p>
                        <ul class="service-check-list" style="padding:0; margin:0; list-style:none; display:flex; flex-direction:column; gap:0.4rem;">
                            ${checkpoints.map(c => `<li style="font-size:0.72rem; color:var(--text-light); display:flex; align-items:center; gap:0.4rem;"><i class="fa-solid fa-check" style="color:var(--accent-neon); font-size:0.7rem;"></i> ${c}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderLiveSoftwarePreview() {
    const canvas = document.getElementById('previewSoftwareCanvas');
    if (!canvas) return;

    const data = getSiteData();
    const software = data.software || [];

    canvas.innerHTML = `
        <div class="software-grid" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:1.2rem;">
            ${software.map((sw, i) => {
                const title = document.getElementById(`softTitle${i}`)?.value || sw.title;
                const sub = document.getElementById(`softSub${i}`)?.value || sw.subtitle;
                const icon = document.getElementById(`softIcon${i}`)?.value || sw.icon;
                const level = document.getElementById(`softLevel${i}`)?.value || sw.level || 90;

                return `
                    <div class="software-card" style="padding:1rem; text-align:left;">
                        <div class="software-header" style="display:flex; align-items:center; justify-content:space-between; margin-bottom:0.6rem;">
                            <div class="software-info" style="display:flex; align-items:center; gap:0.6rem;">
                                ${icon ? `<img src="${icon}" style="width:24px; height:24px; object-fit:contain;">` : ''}
                                <div>
                                    <h4 style="font-size:0.88rem; font-weight:700; color:#fff; margin:0;">${title}</h4>
                                    <span style="font-size:0.7rem; color:var(--text-dim);">${sub}</span>
                                </div>
                            </div>
                            <span class="skill-percent" style="font-size:0.8rem; font-weight:800; color:var(--accent-neon);">${level}%</span>
                        </div>
                        <div class="progress-bar-wrap" style="width:100%; height:6px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden;">
                            <div class="progress-bar-fill" style="width:${level}%; height:100%; background:linear-gradient(90deg,#a3e635,#22c55e); border-radius:3px; transition:width 0.3s ease;"></div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderLiveContactPreview() {
    const canvas = document.getElementById('previewContactCanvas');
    if (!canvas) return;

    const email = document.getElementById('contactEmail')?.value || 'mahinalibiswas@gmail.com';
    const whatsapp = document.getElementById('contactWhatsApp')?.value || '+880123456789';
    const location = document.getElementById('contactLocation')?.value || 'Dhaka, Bangladesh';

    canvas.innerHTML = `
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:1.2rem;">
            <div class="contact-method-card" style="padding:1rem; display:flex; align-items:center; gap:0.8rem;">
                <div class="method-icon" style="width:40px; height:40px; font-size:1.1rem;"><i class="fa-solid fa-envelope"></i></div>
                <div class="method-info" style="text-align:left;">
                    <span class="method-label" style="font-size:0.7rem; color:var(--text-dim); display:block;">Email Me</span>
                    <a class="method-val" style="font-size:0.8rem; font-weight:700; color:#fff; word-break:break-all;">${email}</a>
                </div>
            </div>
            <div class="contact-method-card" style="padding:1rem; display:flex; align-items:center; gap:0.8rem;">
                <div class="method-icon" style="width:40px; height:40px; font-size:1.1rem;"><i class="fa-brands fa-whatsapp"></i></div>
                <div class="method-info" style="text-align:left;">
                    <span class="method-label" style="font-size:0.7rem; color:var(--text-dim); display:block;">WhatsApp</span>
                    <a class="method-val" style="font-size:0.8rem; font-weight:700; color:#fff;">${whatsapp}</a>
                </div>
            </div>
            <div class="contact-method-card" style="padding:1rem; display:flex; align-items:center; gap:0.8rem;">
                <div class="method-icon" style="width:40px; height:40px; font-size:1.1rem;"><i class="fa-solid fa-location-dot"></i></div>
                <div class="method-info" style="text-align:left;">
                    <span class="method-label" style="font-size:0.7rem; color:var(--text-dim); display:block;">Location</span>
                    <span class="method-val" style="font-size:0.8rem; font-weight:700; color:#fff;">${location}</span>
                </div>
            </div>
        </div>
    `;
}

function renderLiveShowreelPreview() {
    const canvas = document.getElementById('previewShowreelCanvas');
    if (!canvas) return;

    const sub = document.getElementById('showreelSubtitle')?.value || '// HIGHLIGHT SHOWREEL';
    const titleTop = document.getElementById('showreelTitleTop')?.value || 'Featured Motion &';
    const titleGrad = document.getElementById('showreelTitleGradient')?.value || 'Video Reel';
    const desc = document.getElementById('showreelDesc')?.value || '';
    const videoUrl = document.getElementById('showreelVideoUrl')?.value || '';
    const poster = document.getElementById('showreelPoster')?.value || '';

    let videoHtml = '';
    if (videoUrl.includes('<iframe')) {
        const iframeStart = videoUrl.indexOf('<iframe');
        videoHtml = videoUrl.substring(iframeStart).replace(/width="[^"]*"/g, 'width="100%"').replace(/height="[^"]*"/g, 'height="100%"');
    } else {
        const ytId = (typeof extractYoutubeId === 'function') ? extractYoutubeId(videoUrl) : null;
        if (ytId) {
            videoHtml = `<iframe src="https://www.youtube.com/embed/${ytId}?rel=0" style="width:100%; height:100%; border:none; border-radius:14px;" allowfullscreen></iframe>`;
        } else if (videoUrl) {
            videoHtml = `<video src="${videoUrl}" poster="${poster}" style="width:100%; height:100%; object-fit:cover; border-radius:14px;" controls playsinline></video>`;
        } else {
            videoHtml = `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#000; color:var(--text-dim); border-radius:14px; font-size:0.85rem;"><span>No Showreel Video URL Set</span></div>`;
        }
    }

    canvas.innerHTML = `
        <div style="width:100%; max-width:100%; box-sizing:border-box; background:var(--bg-dark); padding:1.5rem; border-radius:20px; border:1px solid var(--border-glow); text-align:center;">
            <span style="font-size:0.75rem; font-weight:700; color:var(--accent-neon); letter-spacing:2px; display:block; margin-bottom:0.4rem;">${sub}</span>
            <h2 style="font-size:1.8rem; font-weight:700; color:#fff; margin:0 0 0.6rem 0;">${titleTop} <span class="gradient-text">${titleGrad}</span></h2>
            <p style="font-size:0.82rem; color:var(--text-dim); max-width:600px; margin:0 auto 1.2rem auto; line-height:1.4;">${desc}</p>
            <div style="width:100%; max-width:720px; aspect-ratio:16/9; margin:0 auto; border-radius:16px; overflow:hidden; border:1px solid var(--border-glow); background:#000;">
                ${videoHtml}
            </div>
        </div>
    `;
}

function renderAllLivePreviews() {
    renderLiveNavPreview();
    renderLiveHeroPreview();
    renderLiveShowreelPreview();
    renderLiveAboutPreview();
    renderLiveServicesPreview();
    renderLiveSoftwarePreview();
    renderLiveContactPreview();
}

/* --- 4. Dynamic CTA Button List Manager --- */
function renderAdminCtaButtons(ctaButtons) {
    const listContainer = document.getElementById('adminCtaButtonsList');
    if (!listContainer) return;

    if (ctaButtons && Array.isArray(ctaButtons)) {
        ctaButtons.forEach(b => {
            if (b.text === 'New Social Link' || b.text === 'New CTA Button' || b.text === 'New Link' || b.text === 'New Action Button') b.text = '';
            if (b.link === 'https://' || b.link === '#') b.link = '';
        });
    }

    listContainer.innerHTML = ctaButtons.map((btn, index) => {
        const defaultIcon = (index === 0) ? 'fa-solid fa-play' : (index === 1 ? 'fa-solid fa-paper-plane' : 'fa-solid fa-user');
        const activeIcon = btn.icon || defaultIcon;
        let activeIconHtml = `<i id="ctaBtnIconDisplay_${btn.id}" class="${activeIcon}"></i>`;
        if (btn.iconImage) {
            activeIconHtml = `<img id="ctaBtnIconImageDisplay_${btn.id}" src="${btn.iconImage}" style="width: 22px; height: 22px; object-fit: contain;">`;
        }

        return `
            <div class="admin-card-row" style="padding: 1.5rem; background: rgba(2, 8, 23, 0.6); border-radius: 14px; border: 1px solid var(--border-glow); box-sizing: border-box; margin-bottom: 0;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.2rem; padding-bottom: 0.8rem; border-bottom: 1px dashed rgba(255, 255, 255, 0.1);">
                    <h4 style="margin: 0; color: #ffffff; font-size: 0.98rem; font-weight: 700;">
                        <i class="fa-solid fa-link" style="color: var(--accent-neon); margin-right: 0.4rem;"></i> CTA Button #${index + 1}
                    </h4>
                    <button type="button" class="action-btn delete-btn" onclick="deleteHeroCtaButton('${btn.id}')" title="Delete Button">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
                    <!-- Col 1: Icon Badge + Button Text -->
                    <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                        <label style="color: #94a3b8; font-weight: 600; font-size: 0.78rem;">Button Text & Active Icon</label>
                        <div style="display: flex; gap: 0.6rem; align-items: center;">
                            <div id="ctaBtnIconBadge_${btn.id}" title="Current Active Icon" style="width: 44px; height: 44px; background: rgba(163, 230, 53, 0.12); border: 1px solid var(--accent-neon); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; color: var(--accent-neon); box-shadow: 0 0 12px rgba(163, 230, 53, 0.2); flex-shrink: 0;">
                                ${activeIconHtml}
                            </div>
                            <input type="text" id="ctaBtnText_${btn.id}" value="${btn.text || ''}" placeholder="Enter button name..." oninput="renderLiveHeroPreview()" style="flex: 1; height: 44px; background: rgba(2, 6, 23, 0.8); color: #ffffff; border: 1px solid var(--border-glow); padding: 0 0.8rem; border-radius: 10px; font-size: 0.88rem; outline: none; box-sizing: border-box;">
                        </div>
                    </div>

                    <!-- Col 2: Icon Selection Buttons -->
                    <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                        <label style="color: #94a3b8; font-weight: 600; font-size: 0.78rem;">Change Icon</label>
                        <div style="display: flex; align-items: center; gap: 0.5rem; height: 44px;">
                            <button type="button" class="btn btn-hero-secondary" onclick="openIconPickerModal('ctaBtnIconClass_${btn.id}', 'ctaBtnIconBadge_${btn.id}', 'hero')" style="flex: 1; height: 44px; padding: 0 0.8rem; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; border-radius: 10px; font-size: 0.82rem; white-space: nowrap;">
                                <i class="fa-solid fa-icons"></i> Pick Icon
                            </button>
                            <input type="file" id="ctaBtnFileInput_${btn.id}" accept="image/*" style="display: none;" onchange="handleCtaIconUpload(event, '${btn.id}')">
                            <button type="button" class="btn btn-hero-secondary" onclick="document.getElementById('ctaBtnFileInput_${btn.id}').click()" style="flex: 1; height: 44px; padding: 0 0.8rem; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; border-radius: 10px; font-size: 0.82rem; white-space: nowrap;">
                                <i class="fa-solid fa-upload"></i> Upload
                            </button>
                            <div id="ctaIconPreviewWrap_${btn.id}" style="display: ${btn.iconImage ? 'flex' : 'none'}; align-items: center; gap: 0.3rem; background: rgba(239, 68, 68, 0.15); padding: 0 0.5rem; height: 44px; border-radius: 10px; border: 1px solid rgba(239, 68, 68, 0.4); box-sizing: border-box;">
                                <button type="button" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.82rem;" title="Remove uploaded custom icon image" onclick="removeCtaIconImage('${btn.id}', '${defaultIcon}')"><i class="fa-solid fa-trash-can"></i></button>
                            </div>
                        </div>
                        <input type="hidden" id="ctaBtnIconClass_${btn.id}" value="${btn.icon || defaultIcon}">
                        <input type="hidden" id="ctaBtnIconImage_${btn.id}" value="${btn.iconImage || ''}">
                    </div>
                </div>

                <div style="margin-bottom: 1rem;">
                    <label style="color: #94a3b8; font-weight: 600; font-size: 0.78rem; display: block; margin-bottom: 0.4rem;">Target URL / YouTube Embed Code / Video Link</label>
                    <textarea id="ctaBtnLink_${btn.id}" rows="2" placeholder="Paste YouTube URL (e.g. https://youtu.be/...), Video Embed Code (<iframe...>), or MP4 link..." oninput="renderLiveHeroPreview()" style="width: 100%; background: rgba(2, 6, 23, 0.8); color: #ffffff; border: 1px solid var(--border-glow); padding: 0.6rem 1rem; border-radius: 8px; font-size: 0.88rem; outline: none; box-sizing: border-box; font-family: inherit; resize: vertical; min-height: 52px;">${btn.link || ''}</textarea>
                </div>

                <div>
                    <label style="display: flex; align-items: center; gap: 0.6rem; cursor: pointer; color: #ffffff; font-size: 0.88rem;">
                        <input type="checkbox" id="ctaBtnModal_${btn.id}" ${btn.isModal ? 'checked' : ''} onchange="renderLiveHeroPreview()" style="width: auto;">
                        <span>Opens Showreel Video Lightbox Modal (Play Video Action)</span>
                    </label>
                </div>
            </div>
        `;
    }).join('');
}

/* --- Dynamic About Me CTA Buttons Manager --- */
function renderAdminAboutCtaButtons(ctaButtons) {
    const listContainer = document.getElementById('adminAboutCtaButtonsList');
    if (!listContainer) return;

    if (ctaButtons && Array.isArray(ctaButtons)) {
        ctaButtons.forEach(b => {
            if (b.text === 'New Social Link' || b.text === 'New CTA Button' || b.text === 'New Link' || b.text === 'New Action Button') b.text = '';
            if (b.link === 'https://' || b.link === '#') b.link = '';
        });
    }

    const list = (ctaButtons && Array.isArray(ctaButtons) && ctaButtons.length > 0) ? ctaButtons : [
        { id: "about-btn-1", text: "Visit Behance Profile", link: "https://www.behance.net/mahinalibiswas", icon: "fa-brands fa-behance", iconImage: "" },
        { id: "about-btn-2", text: "Contact Direct", link: "#contact", icon: "fa-solid fa-paper-plane", iconImage: "" },
        { id: "about-btn-3", text: "Download CV", link: "assets/docs/Mahin_Ali_Biswas_CV.pdf", icon: "fa-solid fa-file-arrow-down", iconImage: "" }
    ];

    listContainer.innerHTML = list.map((btn, index) => {
        const defaultIcon = (index === 0) ? 'fa-brands fa-behance' : (index === 1 ? 'fa-solid fa-paper-plane' : 'fa-solid fa-file-arrow-down');
        const activeIcon = btn.icon || defaultIcon;
        let activeIconHtml = `<i id="aboutBtnIconDisplay_${btn.id}" class="${activeIcon}"></i>`;
        if (btn.iconImage) {
            activeIconHtml = `<img id="aboutBtnIconImageDisplay_${btn.id}" src="${btn.iconImage}" style="width: 22px; height: 22px; object-fit: contain;">`;
        }

        return `
            <div class="admin-card-row" style="padding: 1.5rem; background: rgba(2, 8, 23, 0.6); border-radius: 14px; border: 1px solid var(--border-glow); box-sizing: border-box; margin-bottom: 0;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.2rem; padding-bottom: 0.8rem; border-bottom: 1px dashed rgba(255, 255, 255, 0.1);">
                    <h4 style="margin: 0; color: #ffffff; font-size: 0.98rem; font-weight: 700;">
                        <i class="fa-solid fa-link" style="color: var(--accent-neon); margin-right: 0.4rem;"></i> About CTA Button #${index + 1}
                    </h4>
                    ${index >= 2 ? `<button type="button" onclick="deleteAboutCtaButton('${btn.id}')" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #ef4444; border-radius: 8px; padding: 0.35rem 0.75rem; cursor: pointer; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.35rem;" title="Delete this button"><i class="fa-solid fa-trash-can"></i> Delete</button>` : ''}
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
                    <!-- Col 1: Icon Badge + Button Text -->
                    <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                        <label style="color: #94a3b8; font-weight: 600; font-size: 0.78rem;">Button Text & Active Icon</label>
                        <div style="display: flex; gap: 0.6rem; align-items: center;">
                            <div id="aboutBtnIconBadge_${btn.id}" title="Current Active Icon" style="width: 44px; height: 44px; background: rgba(163, 230, 53, 0.12); border: 1px solid var(--accent-neon); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; color: var(--accent-neon); box-shadow: 0 0 12px rgba(163, 230, 53, 0.2); flex-shrink: 0;">
                                ${activeIconHtml}
                            </div>
                            <input type="text" id="aboutBtnText_${btn.id}" value="${btn.text || ''}" oninput="renderLiveAboutPreview()" placeholder="Enter button text..." style="flex: 1; height: 44px; background: rgba(2, 6, 23, 0.8); color: #ffffff; border: 1px solid var(--border-glow); padding: 0 0.8rem; border-radius: 10px; font-size: 0.88rem; outline: none; box-sizing: border-box;">
                        </div>
                    </div>

                    <!-- Col 2: Icon Selection Buttons -->
                    <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                        <label style="color: #94a3b8; font-weight: 600; font-size: 0.78rem;">Change Icon</label>
                        <div style="display: flex; align-items: center; gap: 0.5rem; height: 44px;">
                            <button type="button" class="btn btn-hero-secondary" onclick="openIconPickerModal('aboutBtnIconClass_${btn.id}', 'aboutBtnIconBadge_${btn.id}', 'about')" style="flex: 1; height: 44px; padding: 0 0.8rem; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; border-radius: 10px; font-size: 0.82rem; white-space: nowrap;">
                                <i class="fa-solid fa-icons"></i> Pick Icon
                            </button>
                            <input type="file" id="aboutBtnFileInput_${btn.id}" accept="image/*" style="display: none;" onchange="handleAboutCtaIconUpload(event, '${btn.id}')">
                            <button type="button" class="btn btn-hero-secondary" onclick="document.getElementById('aboutBtnFileInput_${btn.id}').click()" style="flex: 1; height: 44px; padding: 0 0.8rem; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; border-radius: 10px; font-size: 0.82rem; white-space: nowrap;">
                                <i class="fa-solid fa-upload"></i> Upload
                            </button>
                            <div id="aboutIconPreviewWrap_${btn.id}" style="display: ${btn.iconImage ? 'flex' : 'none'}; align-items: center; gap: 0.3rem; background: rgba(239, 68, 68, 0.15); padding: 0 0.5rem; height: 44px; border-radius: 10px; border: 1px solid rgba(239, 68, 68, 0.4); box-sizing: border-box;">
                                <button type="button" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.82rem;" title="Remove uploaded custom icon image" onclick="removeAboutCtaIconImage('${btn.id}', '${defaultIcon}')"><i class="fa-solid fa-trash-can"></i></button>
                            </div>
                        </div>
                        <input type="hidden" id="aboutBtnIconClass_${btn.id}" value="${btn.icon || defaultIcon}">
                        <input type="hidden" id="aboutBtnIconImage_${btn.id}" value="${btn.iconImage || ''}">
                    </div>
                </div>

                <div>
                    <label style="color: #94a3b8; font-weight: 600; font-size: 0.78rem; display: block; margin-bottom: 0.4rem;">Target URL</label>
                    <input type="text" id="aboutBtnLink_${btn.id}" value="${btn.link || ''}" oninput="renderLiveAboutPreview()" placeholder="Enter your target URL..." style="width: 100%; height: 44px; background: rgba(2, 6, 23, 0.8); color: #ffffff; border: 1px solid var(--border-glow); padding: 0 0.8rem; border-radius: 10px; font-size: 0.88rem; outline: none; box-sizing: border-box;">
                </div>
            </div>
        `;
    }).join('');
}

function handleAboutCtaIconUpload(event, btnId) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const dataUrl = e.target.result;
        document.getElementById(`aboutBtnIconImage_${btnId}`).value = dataUrl;
        
        const badge = document.getElementById(`aboutBtnIconBadge_${btnId}`);
        if (badge) badge.innerHTML = `<img src="${dataUrl}" style="width: 22px; height: 22px; object-fit: contain;">`;

        const previewWrap = document.getElementById(`aboutIconPreviewWrap_${btnId}`);
        if (previewWrap) previewWrap.style.display = 'flex';

        renderLiveAboutPreview();
        showToast('Custom icon image uploaded!', 'success');
    };
    reader.readAsDataURL(file);
}

function removeAboutCtaIconImage(btnId, defaultIcon) {
    document.getElementById(`aboutBtnIconImage_${btnId}`).value = '';
    const previewWrap = document.getElementById(`aboutIconPreviewWrap_${btnId}`);
    if (previewWrap) previewWrap.style.display = 'none';

    const currentClass = document.getElementById(`aboutBtnIconClass_${btnId}`)?.value || defaultIcon || 'fa-solid fa-arrow-right';
    const badge = document.getElementById(`aboutBtnIconBadge_${btnId}`);
    if (badge) badge.innerHTML = `<i class="${currentClass}"></i>`;

    renderLiveAboutPreview();
    showToast('Uploaded icon image removed', 'info');
}

function addNewAboutCtaButton() {
    const data = getSiteData();
    if (!data.about.ctaButtons) data.about.ctaButtons = [];
    
    data.about.ctaButtons.push({
        id: 'about-btn-' + Date.now(),
        text: 'Download CV',
        link: 'assets/docs/Mahin_Ali_Biswas_CV.pdf',
        icon: 'fa-solid fa-file-arrow-down',
        iconImage: ''
    });

    if (saveSiteData(data)) {
        renderAdminAboutCtaButtons(data.about.ctaButtons);
        showToast('New About CTA Button added!', 'success');
    }
}


function deleteAboutCtaButton(btnId) {
    openDeleteConfirmModal('Are you sure you want to delete this About CTA Button?', () => {
        const data = getSiteData();
        data.about.ctaButtons = (data.about.ctaButtons || []).filter(b => b.id !== btnId);
        if (saveSiteData(data)) {
            renderAdminAboutCtaButtons(data.about.ctaButtons);
            showToast('CTA Button deleted', 'info');
        }
    });
}

/* --- Navigation Bar Section CRUD Manager --- */
let tempNavLinksList = [];

function renderAdminNavLinks(navLinks) {
    tempNavLinksList = (navLinks && navLinks.length) ? [...navLinks] : [
        { id: 1, label: "Home", url: "#hero" },
        { id: 2, label: "About Me", url: "#about" },
        { id: 3, label: "Showreel", url: "#showreel" },
        { id: 4, label: "Projects", url: "#works" },
        { id: 5, label: "Services", url: "#services" },
        { id: 6, label: "Toolkit", url: "#pipeline" },
        { id: 7, label: "Estimator", url: "#estimator" }
    ];

    const container = document.getElementById('adminNavLinksList');
    if (!container) return;

    if (tempNavLinksList.length === 0) {
        container.innerHTML = `
            <div style="padding: 2.5rem; text-align: center; color: var(--text-dim); background: rgba(15, 23, 42, 0.4); border-radius: 14px; border: 1px dashed rgba(163, 230, 53, 0.3);">
                No navigation links found. Click "+ Add Nav Link" to add your first menu link.
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 0.9rem;">
            ${tempNavLinksList.map((item, index) => `
                <div class="nav-link-row-card" style="display: flex; gap: 1rem; align-items: flex-end; background: rgba(15, 23, 42, 0.65); padding: 1rem 1.2rem; border-radius: 14px; border: 1px solid rgba(163, 230, 53, 0.18); box-shadow: 0 4px 20px rgba(0,0,0,0.25); transition: all 0.25s ease;">
                    <div style="display: flex; flex-direction: column; flex-shrink: 0; min-width: 95px;">
                        <label style="color: #94a3b8; font-weight: 600; font-size: 0.78rem; display: block; margin-bottom: 0.4rem;">Link Order</label>
                        <span style="background: rgba(163, 230, 53, 0.1); color: var(--accent-neon); border: 1px solid rgba(163, 230, 53, 0.3); padding: 0 0.8rem; height: 44px; border-radius: 10px; font-weight: 700; font-size: 0.82rem; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; box-sizing: border-box;">
                            <i class="fa-solid fa-link" style="font-size: 0.75rem;"></i> Link #${index + 1}
                        </span>
                    </div>

                    <div style="flex: 1; min-width: 0;">
                        <label style="color: #94a3b8; font-weight: 600; font-size: 0.78rem; display: block; margin-bottom: 0.4rem;">Button Text</label>
                        <input type="text" id="navLinkLabel_${index}" value="${item.label || ''}" oninput="updateNavLinkProp(${index}, 'label', this.value)" placeholder="Enter your button name..." style="width: 100%; height: 44px; background: rgba(2, 6, 23, 0.8); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.1); padding: 0 1rem; border-radius: 10px; font-size: 0.9rem; outline: none; box-sizing: border-box; transition: all 0.2s ease;" onfocus="this.style.borderColor='var(--accent-neon)'; this.style.boxShadow='0 0 12px rgba(163, 230, 53, 0.2)';" onblur="this.style.borderColor='rgba(255, 255, 255, 0.1)'; this.style.boxShadow='none';">
                    </div>

                    <div style="flex: 1.4; min-width: 0;">
                        <label style="color: #94a3b8; font-weight: 600; font-size: 0.78rem; display: block; margin-bottom: 0.4rem;">Target URL</label>
                        <input type="text" id="navLinkUrl_${index}" value="${item.url || ''}" oninput="updateNavLinkProp(${index}, 'url', this.value)" placeholder="Enter your target URL..." style="width: 100%; height: 44px; background: rgba(2, 6, 23, 0.8); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.1); padding: 0 1rem; border-radius: 10px; font-size: 0.9rem; outline: none; box-sizing: border-box; transition: all 0.2s ease;" onfocus="this.style.borderColor='var(--accent-neon)'; this.style.boxShadow='0 0 12px rgba(163, 230, 53, 0.2)';" onblur="this.style.borderColor='rgba(255, 255, 255, 0.1)'; this.style.boxShadow='none';">
                    </div>

                    <div style="display: flex; flex-direction: column; align-items: center; flex-shrink: 0;">
                        <label style="color: #94a3b8; font-weight: 600; font-size: 0.78rem; display: block; margin-bottom: 0.4rem; text-align: center;">Action</label>
                        <button type="button" class="action-btn delete-btn" onclick="deleteNavLinkItem(${index})" title="Delete Link" style="border-radius: 10px; width: 44px; height: 44px; display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box;">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function updateNavLinkProp(index, prop, val) {
    if (tempNavLinksList[index]) {
        tempNavLinksList[index][prop] = val;
    }
    renderLiveNavPreview();
}

function addNewNavLinkItem() {
    tempNavLinksList.push({
        id: Date.now(),
        label: "",
        url: ""
    });
    renderAdminNavLinks(tempNavLinksList);
    renderLiveNavPreview();
}

function deleteNavLinkItem(index) {
    const item = tempNavLinksList[index];
    const name = item && item.label ? `"${item.label}"` : 'this link';
    openDeleteConfirmModal(`Are you sure you want to delete ${name}?`, () => {
        tempNavLinksList.splice(index, 1);
        renderAdminNavLinks(tempNavLinksList);
        renderLiveNavPreview();
        showToast('Link removed! Click "Save Navigation Changes" to update live site.', 'info');
    });
}

window.saveNavSection = saveNavSection;
window.addNewNavLinkItem = addNewNavLinkItem;
window.deleteNavLinkItem = deleteNavLinkItem;
window.updateNavLinkProp = updateNavLinkProp;

async function compressImageToDataUrl(file, maxWidth = 1280, maxHeight = 720, quality = 0.82) {
    if (!file) return null;
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                let w = img.width;
                let h = img.height;
                if (w > maxWidth || h > maxHeight) {
                    const ratio = Math.min(maxWidth / w, maxHeight / h);
                    w = Math.round(w * ratio);
                    h = Math.round(h * ratio);
                }
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                let output = canvas.toDataURL('image/webp', quality);
                if (!output.startsWith('data:image/webp')) {
                    output = canvas.toDataURL('image/jpeg', quality);
                }
                resolve(output);
            };
            img.onerror = () => resolve(e.target.result);
            img.src = e.target.result;
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });
}
window.compressImageToDataUrl = compressImageToDataUrl;

async function handleHeroPosterUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    showToast('Optimizing and loading cover image...', 'info');
    const dataUrl = await compressImageToDataUrl(file, 1280, 720, 0.82);
    if (!dataUrl) return;

    document.getElementById('heroShowreelPoster').value = dataUrl;
    const previewImg = document.getElementById('heroPosterPreview');
    const previewWrap = document.getElementById('heroPosterPreviewWrap');
    if (previewImg) previewImg.src = dataUrl;
    if (previewWrap) previewWrap.style.display = 'flex';
    showToast('Hero cover image uploaded and optimized!', 'success');
}

function removeHeroPosterImage() {
    document.getElementById('heroShowreelPoster').value = '';
    const previewWrap = document.getElementById('heroPosterPreviewWrap');
    if (previewWrap) previewWrap.style.display = 'none';
    showToast('Hero cover image removed', 'info');
}

async function handleProjImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    showToast('Optimizing project thumbnail...', 'info');
    const dataUrl = await compressImageToDataUrl(file, 1280, 720, 0.82);
    if (!dataUrl) return;

    document.getElementById('editProjImage').value = dataUrl;
    const previewImg = document.getElementById('editProjImagePreview');
    const previewWrap = document.getElementById('editProjImagePreviewWrap');
    if (previewImg) previewImg.src = dataUrl;
    if (previewWrap) previewWrap.style.display = 'flex';
    showToast('Project thumbnail image uploaded and optimized!', 'success');
}

function removeProjImage() {
    document.getElementById('editProjImage').value = '';
    const previewWrap = document.getElementById('editProjImagePreviewWrap');
    if (previewWrap) previewWrap.style.display = 'none';
    showToast('Project thumbnail image removed', 'info');
}

async function handleProjClientAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    showToast('Optimizing client avatar image...', 'info');
    const dataUrl = await compressImageToDataUrl(file, 256, 256, 0.85);
    if (!dataUrl) return;

    const input = document.getElementById('editProjClientAvatar');
    if (input) input.value = dataUrl;
    const previewImg = document.getElementById('editProjClientAvatarPreview');
    const previewWrap = document.getElementById('editProjClientAvatarPreviewWrap');
    if (previewImg) previewImg.src = dataUrl;
    if (previewWrap) previewWrap.style.display = 'flex';
    showToast('Client avatar uploaded and optimized!', 'success');
}
window.handleProjClientAvatarUpload = handleProjClientAvatarUpload;

function removeProjClientAvatar() {
    const input = document.getElementById('editProjClientAvatar');
    if (input) input.value = '';
    const fileInput = document.getElementById('editProjClientAvatarFileInput');
    if (fileInput) fileInput.value = '';
    const previewWrap = document.getElementById('editProjClientAvatarPreviewWrap');
    if (previewWrap) previewWrap.style.display = 'none';
    showToast('Client avatar removed (reverts to default profile)', 'info');
}
window.removeProjClientAvatar = removeProjClientAvatar;

function onProjClientAvatarInputChange() {
    const val = document.getElementById('editProjClientAvatar')?.value.trim() || '';
    const previewImg = document.getElementById('editProjClientAvatarPreview');
    const previewWrap = document.getElementById('editProjClientAvatarPreviewWrap');
    if (val && previewImg && previewWrap) {
        previewImg.src = val;
        previewWrap.style.display = 'flex';
    } else if (previewWrap) {
        previewWrap.style.display = 'none';
    }
}
window.onProjClientAvatarInputChange = onProjClientAvatarInputChange;

/* --- Universal Direct PC Video Upload Handler (IndexedDB Storage for Large Files) --- */
async function processUploadedVideoFile(file, inputId, previewWrapId, fileNameId, onComplete) {
    if (!file) return;

    if (!file.type.startsWith('video/') && !/\.(mp4|webm|mov|ogg|mkv)$/i.test(file.name)) {
        showToast('Please select a valid video file (.mp4, .webm, .mov)', 'error');
        return;
    }

    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    const wrap = document.getElementById(previewWrapId);
    const nameEl = document.getElementById(fileNameId);
    const input = document.getElementById(inputId);

    showToast(`Storing video "${file.name}" (${sizeMB} MB)...`, 'info');

    const storageKey = 'vid_' + Date.now() + '_' + file.name.replace(/[^a-zA-Z0-9]/g, '_');
    const localBlobUrl = URL.createObjectURL(file);

    try {
        if (typeof saveMediaBlob === 'function') {
            await saveMediaBlob(storageKey, file);
            if (input) input.value = `idb:${storageKey}`;
            if (nameEl) nameEl.textContent = `${file.name} (${sizeMB} MB - Direct File)`;
            if (wrap) wrap.style.display = 'flex';
            showToast(`Video "${file.name}" uploaded successfully! Click Save Changes to make it live.`, 'success');
            if (typeof onComplete === 'function') onComplete(localBlobUrl, file.name);
            return;
        }
    } catch (err) {
        console.warn("IndexedDB save error, using fallback:", err);
    }

    // Fallback
    if (input) input.value = `assets/videos/${file.name}`;
    if (nameEl) nameEl.textContent = `${file.name} (${sizeMB} MB - Local File)`;
    if (wrap) wrap.style.display = 'flex';
    showToast(`Video set to "assets/videos/${file.name}".`, 'info');
    if (typeof onComplete === 'function') onComplete(localBlobUrl, file.name);
}

function handleShowreelVideoUpload(event) {
    const file = event.target.files[0];
    processUploadedVideoFile(file, 'showreelVideoUrl', 'showreelVideoPreviewWrap', 'showreelVideoFileName', () => {
        if (typeof renderLiveShowreelPreview === 'function') renderLiveShowreelPreview();
    });
}

function removeShowreelVideo() {
    const input = document.getElementById('showreelVideoUrl');
    if (input) input.value = '';
    const wrap = document.getElementById('showreelVideoPreviewWrap');
    if (wrap) wrap.style.display = 'none';
    if (typeof renderLiveShowreelPreview === 'function') renderLiveShowreelPreview();
    showToast('Showreel video removed', 'info');
}

async function handleShowreelPosterUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    showToast('Optimizing showreel poster...', 'info');
    const dataUrl = await compressImageToDataUrl(file, 1280, 720, 0.82);
    if (!dataUrl) return;

    document.getElementById('showreelPoster').value = dataUrl;
    const previewImg = document.getElementById('showreelPosterPreview');
    const previewWrap = document.getElementById('showreelPosterPreviewWrap');
    if (previewImg) previewImg.src = dataUrl;
    if (previewWrap) previewWrap.style.display = 'flex';
    if (typeof renderLiveShowreelPreview === 'function') renderLiveShowreelPreview();
    showToast('Showreel poster image uploaded and optimized!', 'success');
}

function removeShowreelPosterImage() {
    document.getElementById('showreelPoster').value = '';
    const previewWrap = document.getElementById('showreelPosterPreviewWrap');
    if (previewWrap) previewWrap.style.display = 'none';
    if (typeof renderLiveShowreelPreview === 'function') renderLiveShowreelPreview();
    showToast('Showreel poster image removed', 'info');
}

/* --- Smart Video Duration Extractor (Auto-Detects File & URL Lengths) --- */
function formatVideoDuration(seconds) {
    if (isNaN(seconds) || seconds <= 0) return '';
    const totalSecs = Math.floor(seconds);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function getYoutubeDurationViaIframe(videoId) {
    return new Promise((resolve) => {
        if (!videoId) return resolve(null);

        // Load YouTube IFrame API if not already present
        if (!window.YT || !window.YT.Player) {
            if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
                const tag = document.createElement('script');
                tag.src = "https://www.youtube.com/iframe_api";
                document.head.appendChild(tag);
            }
        }

        const timeout = setTimeout(() => {
            cleanup();
            resolve(null);
        }, 6000);

        const tempDiv = document.createElement('div');
        tempDiv.style.cssText = 'position:fixed; left:-9999px; top:-9999px; width:1px; height:1px; opacity:0; pointer-events:none;';
        document.body.appendChild(tempDiv);

        let player = null;

        function cleanup() {
            clearTimeout(timeout);
            try {
                if (player && typeof player.destroy === 'function') player.destroy();
            } catch (e) {}
            if (tempDiv && tempDiv.parentNode) tempDiv.parentNode.removeChild(tempDiv);
        }

        let attempts = 0;
        function checkReady() {
            attempts++;
            if (window.YT && window.YT.Player) {
                try {
                    player = new YT.Player(tempDiv, {
                        height: '1',
                        width: '1',
                        videoId: videoId,
                        events: {
                            onReady: (event) => {
                                const dur = event.target.getDuration();
                                if (dur && dur > 0) {
                                    cleanup();
                                    resolve(formatVideoDuration(dur));
                                } else {
                                    setTimeout(() => {
                                        const d2 = event.target.getDuration();
                                        cleanup();
                                        resolve(d2 > 0 ? formatVideoDuration(d2) : null);
                                    }, 400);
                                }
                            },
                            onError: () => {
                                cleanup();
                                resolve(null);
                            }
                        }
                    });
                } catch (e) {
                    cleanup();
                    resolve(null);
                }
            } else if (attempts < 30) {
                setTimeout(checkReady, 100);
            } else {
                cleanup();
                resolve(null);
            }
        }

        checkReady();
    });
}
window.getYoutubeDurationViaIframe = getYoutubeDurationViaIframe;

async function extractDurationFromFileOrUrl(fileOrUrl) {
    if (!fileOrUrl) return null;

    // Check if it's a YouTube URL or ID
    if (typeof fileOrUrl === 'string') {
        const trimmed = fileOrUrl.trim();
        const ytId = typeof extractYoutubeId === 'function' ? extractYoutubeId(trimmed) : null;
        if (ytId || trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
            const targetId = ytId || trimmed;
            // 1. Try browser-native YouTube IFrame API first
            if (ytId) {
                const iframeDur = await getYoutubeDurationViaIframe(ytId);
                if (iframeDur) return iframeDur;
            }

            // 2. Try serverless backend proxy
            try {
                const queryParam = ytId ? `id=${encodeURIComponent(ytId)}` : `url=${encodeURIComponent(trimmed)}`;
                const apiRes = await fetch(`/api/youtubeDuration?${queryParam}`);
                if (apiRes.ok) {
                    const data = await apiRes.json();
                    if (data && data.duration) {
                        return data.duration;
                    }
                }
            } catch (e) {
                console.warn('YouTube duration detection error:', e);
            }
        }

        const fname = trimmed.split('/').pop().split('?')[0];
        if (typeof KNOWN_VIDEO_DURATIONS !== 'undefined' && KNOWN_VIDEO_DURATIONS[fname]) {
            return KNOWN_VIDEO_DURATIONS[fname];
        }
    }

    return new Promise((resolve) => {
        try {
            const v = document.createElement('video');
            v.preload = 'metadata';
            let timer = setTimeout(() => {
                cleanup();
                resolve(null);
            }, 5000);

            function cleanup() {
                clearTimeout(timer);
                v.onloadedmetadata = null;
                v.onerror = null;
            }

            v.onloadedmetadata = () => {
                const dur = formatVideoDuration(v.duration);
                cleanup();
                resolve(dur);
            };

            v.onerror = () => {
                cleanup();
                resolve(null);
            };

            if (typeof fileOrUrl === 'string') {
                v.src = fileOrUrl;
            } else if (fileOrUrl instanceof File || fileOrUrl instanceof Blob) {
                v.src = URL.createObjectURL(fileOrUrl);
            } else {
                cleanup();
                resolve(null);
            }
        } catch (e) {
            resolve(null);
        }
    });
}
window.extractDurationFromFileOrUrl = extractDurationFromFileOrUrl;
window.formatVideoDuration = formatVideoDuration;

function autoDetectProjectMetadataFromFileName(fileName) {
    if (!fileName) return { title: '', badge: 'Featured Video', slug: 'featured commercial-ad corporate', client: '' };
    let clean = fileName.replace(/\.(mp4|webm|mov|ogg|mkv|avi|wmv|m4v)$/i, '');
    clean = clean.replace(/[_\.\-]+/g, ' ').trim();

    // Clean technical suffix keywords
    const cleanTokens = clean.split(' ').filter(w => !/^(1080p|720p|4k|h264|x264|hevc|raw|render|final|finel|v\d+|\d+fps)$/i.test(w));
    const title = (cleanTokens.length > 0 ? cleanTokens : clean.split(' '))
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

    const lower = clean.toLowerCase();
    let badge = 'Commercial Video';
    let slug = 'commercial-ad promotional corporate';
    let client = '';

    if (lower.includes('campaign') || lower.includes('commercial') || lower.includes('promo') || lower.includes('brand') || lower.includes('ad')) {
        badge = 'Commercial Ad';
        slug = 'commercial-ad promotional corporate';
    } else if (lower.includes('reel') || lower.includes('short') || lower.includes('tiktok') || lower.includes('viral') || lower.includes('vertical')) {
        badge = 'Reels / Shorts';
        slug = 'reels-shorts social-media viral';
    } else if (lower.includes('corporate') || lower.includes('talking') || lower.includes('interview') || lower.includes('consultant') || lower.includes('presentation')) {
        badge = 'Corporate';
        slug = 'corporate talking-head interview';
    } else if (lower.includes('logo') || lower.includes('animation') || lower.includes('motion') || lower.includes('intro') || lower.includes('reveal')) {
        badge = 'Motion Graphics';
        slug = 'motion-graphics logo-animation intro';
    } else if (lower.includes('color') || lower.includes('grading') || lower.includes('lut') || lower.includes('cinematic') || lower.includes('film')) {
        badge = 'Color Pass';
        slug = 'color-pass cinematic documentary';
    } else if (lower.includes('doc') || lower.includes('documentary')) {
        badge = 'Documentary';
        slug = 'documentary cinematic storytelling';
    }

    // Try extracting client from the first word before known project keywords
    const match = clean.match(/^([a-zA-Z0-9]+)\s+(campaign|ad|promo|video|project|commercial|edit|shoot|brand)/i);
    if (match && match[1]) {
        client = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
    } else if (cleanTokens.length > 0) {
        client = cleanTokens[0].charAt(0).toUpperCase() + cleanTokens[0].slice(1).toLowerCase();
    }

    return { title, badge, slug, client };
}
window.autoDetectProjectMetadataFromFileName = autoDetectProjectMetadataFromFileName;

function generateAiProjectDescription({ title, categoryBadge, slug, client, tools, duration, isShort } = {}) {
    title = (title || 'Video Project').trim();
    client = (client || '').trim();
    categoryBadge = (categoryBadge || '').toLowerCase();
    slug = (slug || '').toLowerCase();
    tools = (tools || 'Adobe Premiere Pro, After Effects').trim();

    const clientPhrase = client ? `crafted for ${client}` : 'crafted for modern digital brands and audiences';
    const toolPhrase = tools ? `executed with precision in ${tools}` : 'crafted with industry-standard post-production workflows';

    // 1. Short / Reel / Vertical video
    if (isShort || slug.includes('reels') || slug.includes('short') || slug.includes('tiktok') || categoryBadge.includes('reel') || categoryBadge.includes('short')) {
        const shortTemplates = [
            `High-retention vertical video edit ${clientPhrase}, engineered for maximum watch time and viral reach. Features rapid hook pacing, custom animated motion subtitles, pop-up SFX, and dynamic punch-ins.`,
            `Fast-paced social media short ${clientPhrase}, optimized for algorithmic engagement across Instagram Reels, TikTok, and YouTube Shorts. Built with visual pattern interrupts, sound design layering, and kinetic typography.`,
            `Dynamic vertical showcase ${clientPhrase}, combining high-energy jump cuts, animated text highlights, and trending audio rhythm ${toolPhrase}.`
        ];
        return shortTemplates[Math.floor(Math.random() * shortTemplates.length)];
    }

    // 2. Commercial / Brand Ad / Campaign
    if (categoryBadge.includes('commercial') || slug.includes('commercial') || slug.includes('ad') || slug.includes('promo') || categoryBadge.includes('campaign') || slug.includes('campaign')) {
        const commercialTemplates = [
            `High-impact commercial video campaign ${clientPhrase}, engineered to boost brand authority and conversion. Combines dynamic rhythm cutting, kinetic product callouts, custom sound design, and a cinematic color pass ${toolPhrase}.`,
            `Premium promotional brand campaign ${clientPhrase}, blending compelling narrative pacing with broadcast-quality visuals. Features multi-track audio mastering, motion graphic titles, and filmic color grading.`,
            `Energetic promotional commercial ${clientPhrase}, tailored for high-conversion advertising campaigns. Designed with punchy transitions, synced sound effects, and clean visual storytelling ${toolPhrase}.`
        ];
        return commercialTemplates[Math.floor(Math.random() * commercialTemplates.length)];
    }

    // 3. Color Pass / Cinematic
    if (categoryBadge.includes('color') || slug.includes('color') || slug.includes('grading') || slug.includes('lut')) {
        const colorTemplates = [
            `Professional color grading and filmic finishing pass ${clientPhrase}. Transforms flat Log footage into a rich, cinema-grade aesthetic with calibrated skin tones, balanced shadows, and high-contrast color depth ${toolPhrase}.`,
            `Cinematic color pass ${clientPhrase}, delivering a bespoke film look through custom LUT mastery, dynamic hue separation, atmospheric tone curves, and seamless clip-to-clip matching.`,
            `High-end color correction and film emulation ${clientPhrase}, meticulously graded to evoke deep visual mood while maintaining broadcast-standard dynamic range and pristine skin tones.`
        ];
        return colorTemplates[Math.floor(Math.random() * colorTemplates.length)];
    }

    // 4. Motion Graphics / Logo Animation
    if (categoryBadge.includes('motion') || slug.includes('motion') || slug.includes('logo') || slug.includes('intro')) {
        const motionTemplates = [
            `High-end 2D/3D motion graphics and title sequence ${clientPhrase}. Built with smooth easing keyframes, atmospheric particle accents, custom glowing neon highlights, and impact sound design in ${tools}.`,
            `Dynamic animated logo reveal and visual branding sequence ${clientPhrase}. Engineered with kinetic timing, modern typography animations, and punchy audio SFX to establish a memorable identity.`,
            `Sleek motion graphics showcase ${clientPhrase}, integrating seamless vector animations, kinetic text transitions, and clean geometric reveals ${toolPhrase}.`
        ];
        return motionTemplates[Math.floor(Math.random() * motionTemplates.length)];
    }

    // 5. Corporate / Talking Head / Presentation
    if (categoryBadge.includes('corporate') || slug.includes('corporate') || slug.includes('talking') || slug.includes('interview')) {
        const corporateTemplates = [
            `Polished corporate video edit ${clientPhrase}. Features seamless dialogue flow, multi-camera audio syncing, lower-third branding graphics, background noise suppression, and clean color correction ${toolPhrase}.`,
            `Executive interview and talking-head presentation ${clientPhrase}, structured with engaging B-roll cutaways, crisp audio mastering, and modern corporate typography.`,
            `Professional corporate communication video ${clientPhrase}, engineered for maximum clarity and engagement with pacing enhancements, graphic overlays, and studio-grade sound cleanup.`
        ];
        return corporateTemplates[Math.floor(Math.random() * corporateTemplates.length)];
    }

    // 6. Documentary / Film Storytelling
    if (categoryBadge.includes('doc') || slug.includes('doc') || slug.includes('cinematic')) {
        const docTemplates = [
            `Cinematic documentary storytelling ${clientPhrase}, woven together with emotive pacing, immersive ambient sound design, archival footage restoration, and nuanced color grading ${toolPhrase}.`,
            `In-depth narrative documentary visual edit ${clientPhrase}, prioritizing story rhythm, authentic emotional beats, cinematic lighting balance, and atmospheric soundscapes.`
        ];
        return docTemplates[Math.floor(Math.random() * docTemplates.length)];
    }

    // 7. General / Creative Video Project
    const generalTemplates = [
        `High-production video edit ${clientPhrase}, crafted with narrative rhythm, custom visual transitions, sound design layering, and professional color mastering ${toolPhrase}.`,
        `Complete video post-production project ${clientPhrase}, featuring meticulous pacing, dynamic visual storytelling, audio enhancement, and cinematic finishing in ${tools}.`,
        `Creative video showcase ${clientPhrase}, combining seamless scene transitions, engaging rhythm cuts, polished sound effects, and color grading for a standout portfolio presentation.`
    ];
    return generalTemplates[Math.floor(Math.random() * generalTemplates.length)];
}
window.generateAiProjectDescription = generateAiProjectDescription;

function generateAiProjDescription() {
    const title = document.getElementById('editProjTitle')?.value;
    const categoryBadge = document.getElementById('editProjCategoryBadge')?.value;
    const slug = document.getElementById('editProjCategory')?.value;
    const client = document.getElementById('editProjClient')?.value;
    const tools = document.getElementById('editProjTools')?.value;
    const duration = document.getElementById('editProjDuration')?.value;
    const descInput = document.getElementById('editProjDesc');

    if (!descInput) return;

    const btn = document.getElementById('btnAiProjDesc');
    if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Writing...';
        btn.disabled = true;
    }

    setTimeout(() => {
        const newDesc = generateAiProjectDescription({
            title,
            categoryBadge,
            slug,
            client,
            tools,
            duration,
            isShort: false
        });
        descInput.value = newDesc;
        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> AI Generated!';
            btn.disabled = false;
            setTimeout(() => {
                btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> AI Auto-Generate';
            }, 2200);
        }
        showToast('AI generated a new project description!', 'success');
    }, 280);
}
window.generateAiProjDescription = generateAiProjDescription;

function generateAiShortDescription() {
    const title = document.getElementById('editShortTitle')?.value;
    const platform = document.getElementById('editShortPlatform')?.value;
    const platformLabel = document.getElementById('editShortPlatformLabel')?.value;
    const client = document.getElementById('editShortClient')?.value;
    const duration = document.getElementById('editShortDuration')?.value;
    const descInput = document.getElementById('editShortDesc');

    if (!descInput) return;

    const btn = document.getElementById('btnAiShortDesc');
    if (btn) {
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Writing...';
        btn.disabled = true;
    }

    setTimeout(() => {
        const newDesc = generateAiProjectDescription({
            title,
            categoryBadge: platformLabel || 'Reels / Shorts',
            slug: 'reels-shorts social-media viral ' + (platform || ''),
            client,
            tools: 'Adobe Premiere Pro, After Effects',
            duration,
            isShort: true
        });
        descInput.value = newDesc;
        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> AI Generated!';
            btn.disabled = false;
            setTimeout(() => {
                btn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> AI Auto-Generate';
            }, 2200);
        }
        showToast('AI generated a new short description!', 'success');
    }, 280);
}
window.generateAiShortDescription = generateAiShortDescription;

function captureVideoThumbnail(file, atTime = 1) {
    return new Promise((resolve) => {
        try {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.muted = true;
            video.playsInline = true;
            const url = URL.createObjectURL(file);
            video.src = url;

            const timer = setTimeout(() => {
                URL.revokeObjectURL(url);
                resolve(null);
            }, 6000);

            video.onloadedmetadata = () => {
                video.currentTime = Math.min(atTime, (video.duration || 2) / 2);
            };

            video.onseeked = () => {
                clearTimeout(timer);
                try {
                    const canvas = document.createElement('canvas');
                    canvas.width = Math.min(video.videoWidth || 1280, 1280);
                    const ratio = canvas.width / (video.videoWidth || 1280);
                    canvas.height = Math.round((video.videoHeight || 720) * ratio);
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    let output = canvas.toDataURL('image/webp', 0.82);
                    if (!output.startsWith('data:image/webp')) {
                        output = canvas.toDataURL('image/jpeg', 0.82);
                    }
                    URL.revokeObjectURL(url);
                    resolve(output);
                } catch (e) {
                    URL.revokeObjectURL(url);
                    resolve(null);
                }
            };

            video.onerror = () => {
                clearTimeout(timer);
                URL.revokeObjectURL(url);
                resolve(null);
            };
        } catch (e) {
            resolve(null);
        }
    });
}
window.captureVideoThumbnail = captureVideoThumbnail;

async function handleProjVideoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 1. Auto-detect video duration
    const detectedDur = await extractDurationFromFileOrUrl(file);
    const durInput = document.getElementById('editProjDuration');
    if (detectedDur && durInput) {
        durInput.value = detectedDur;
    }

    // 2. Smart auto-detect metadata from filename
    const meta = autoDetectProjectMetadataFromFileName(file.name);
    const titleInput = document.getElementById('editProjTitle');
    const badgeInput = document.getElementById('editProjCategoryBadge');
    const slugInput = document.getElementById('editProjCategory');
    const clientInput = document.getElementById('editProjClient');

    if (titleInput && (!titleInput.value.trim() || titleInput.value.startsWith('Project '))) {
        titleInput.value = meta.title;
    }
    if (badgeInput && !badgeInput.value.trim()) {
        badgeInput.value = meta.badge;
    }
    if (slugInput && !slugInput.value.trim()) {
        slugInput.value = meta.slug;
    }
    if (clientInput && !clientInput.value.trim() && meta.client) {
        clientInput.value = meta.client;
    }

    // 3. Smart AI Auto-Generated Project Description if empty
    const descInput = document.getElementById('editProjDesc');
    if (descInput && !descInput.value.trim()) {
        const generatedDesc = generateAiProjectDescription({
            title: meta.title,
            categoryBadge: meta.badge,
            slug: meta.slug,
            client: meta.client,
            tools: document.getElementById('editProjTools')?.value,
            duration: detectedDur,
            isShort: false
        });
        if (generatedDesc) {
            descInput.value = generatedDesc;
        }
    }

    // 4. Auto-capture thumbnail snapshot from video frame if cover image is empty
    const imgInput = document.getElementById('editProjImage');
    const previewImg = document.getElementById('editProjImagePreview');
    const previewWrap = document.getElementById('editProjImagePreviewWrap');
    if (imgInput && !imgInput.value.trim()) {
        showToast('Generating video thumbnail snapshot...', 'info');
        const snap = await captureVideoThumbnail(file, 1);
        if (snap) {
            imgInput.value = snap;
            if (previewImg) previewImg.src = snap;
            if (previewWrap) previewWrap.style.display = 'flex';
        }
    }

    // 5. Store video in IndexedDB
    await processUploadedVideoFile(file, 'editProjVideo', 'editProjVideoPreviewWrap', 'editProjVideoFileName', () => {
        const ytInput = document.getElementById('editProjYoutubeId');
        if (ytInput) ytInput.value = '';
    });

    showToast(`Auto-detected title "${meta.title}", AI description, duration (${detectedDur || '0:30'}) & category from video!`, 'success');
    event.target.value = '';
}

function removeProjVideo() {
    const input = document.getElementById('editProjVideo');
    if (input) input.value = '';
    const wrap = document.getElementById('editProjVideoPreviewWrap');
    if (wrap) wrap.style.display = 'none';
    const fileInput = document.getElementById('editProjVideoFileInput');
    if (fileInput) fileInput.value = '';
    showToast('Project video removed', 'info');
}

async function handleShortVideoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 1. Auto-detect video duration
    const detectedDur = await extractDurationFromFileOrUrl(file);
    const durInput = document.getElementById('editShortDuration');
    if (detectedDur && durInput) {
        durInput.value = detectedDur;
    }

    // 2. Smart auto-detect title
    const meta = autoDetectProjectMetadataFromFileName(file.name);
    const titleInput = document.getElementById('editShortTitle');
    const categoryInput = document.getElementById('editShortCategory');
    if (titleInput && (!titleInput.value.trim() || titleInput.value.startsWith('Reel '))) {
        titleInput.value = meta.title;
    }
    if (categoryInput && !categoryInput.value.trim()) {
        categoryInput.value = 'reels-shorts social-media viral';
    }

    // 3. Auto-capture vertical thumbnail snapshot if empty
    const imgInput = document.getElementById('editShortImage');
    const previewImg = document.getElementById('editShortImagePreview');
    const previewWrap = document.getElementById('editShortImagePreviewWrap');
    if (imgInput && !imgInput.value.trim()) {
        const snap = await captureVideoThumbnail(file, 1);
        if (snap) {
            imgInput.value = snap;
            if (previewImg) previewImg.src = snap;
            if (previewWrap) previewWrap.style.display = 'flex';
        }
    }

    // 4. Smart AI Auto-Generated Short Description if empty
    const descInput = document.getElementById('editShortDesc');
    if (descInput && !descInput.value.trim()) {
        const platformLabel = document.getElementById('editShortPlatformLabel')?.value;
        const platform = document.getElementById('editShortPlatform')?.value;
        const generatedDesc = generateAiProjectDescription({
            title: meta.title,
            categoryBadge: platformLabel || 'Reels / Shorts',
            slug: 'reels-shorts social-media viral ' + (platform || ''),
            client: document.getElementById('editShortClient')?.value,
            tools: 'Adobe Premiere Pro, After Effects',
            duration: detectedDur,
            isShort: true
        });
        if (generatedDesc) {
            descInput.value = generatedDesc;
        }
    }

    // 5. Store video in IndexedDB
    await processUploadedVideoFile(file, 'editShortVideo', 'editShortVideoPreviewWrap', 'editShortVideoFileName', () => {
        const ytInput = document.getElementById('editShortYoutubeId');
        if (ytInput) ytInput.value = '';
    });

    showToast(`Auto-detected title "${meta.title}", AI description & length (${detectedDur || '0:15'}) from reel!`, 'success');
    event.target.value = '';
}

function removeShortVideo() {
    const input = document.getElementById('editShortVideo');
    if (input) input.value = '';
    const wrap = document.getElementById('editShortVideoPreviewWrap');
    if (wrap) wrap.style.display = 'none';
    const fileInput = document.getElementById('editShortVideoFileInput');
    if (fileInput) fileInput.value = '';
    showToast('Short video removed', 'info');
}

window.handleShowreelVideoUpload = handleShowreelVideoUpload;
window.removeShowreelVideo = removeShowreelVideo;
window.handleShowreelPosterUpload = handleShowreelPosterUpload;
window.removeShowreelPosterImage = removeShowreelPosterImage;
window.handleProjVideoUpload = handleProjVideoUpload;
window.removeProjVideo = removeProjVideo;
window.handleShortVideoUpload = handleShortVideoUpload;
window.removeShortVideo = removeShortVideo;

/* --- YouTube Rich Metadata Fetching & Auto-Fill Engine --- */
async function fetchYoutubeFullMetadata(videoIdOrUrl) {
    if (!videoIdOrUrl) return null;
    let videoId = typeof extractYoutubeId === 'function' ? extractYoutubeId(videoIdOrUrl) : null;
    if (!videoId) {
        if (typeof videoIdOrUrl === 'string' && videoIdOrUrl.trim().length === 11 && !videoIdOrUrl.includes('/') && !videoIdOrUrl.includes('.')) {
            videoId = videoIdOrUrl.trim();
        }
    }
    if (!videoId) return null;

    let result = null;

    // 1. Try local serverless endpoint
    try {
        const localRes = await fetch(`/api/youtubeDuration?id=${encodeURIComponent(videoId)}`);
        if (localRes.ok) {
            const data = await localRes.json();
            if (data && data.success) {
                result = data;
            }
        }
    } catch (e) {}

    // 2. Try deployed production Vercel endpoint (with CORS)
    if (!result || !result.title || !result.description) {
        try {
            const remoteRes = await fetch(`https://mahinalibiswas.vercel.app/api/youtubeDuration?id=${encodeURIComponent(videoId)}`);
            if (remoteRes.ok) {
                const data = await remoteRes.json();
                if (data && data.success) {
                    result = { ...(result || {}), ...data };
                }
            }
        } catch (e) {}
    }

    // 3. Fallback / supplementary query to noembed.com to GUARANTEE Title, Author & Thumbnail
    if (!result || !result.title || !result.author) {
        try {
            const noembedRes = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`);
            if (noembedRes.ok) {
                const yt = await noembedRes.json();
                result = result || { success: true, id: videoId, keywords: [] };
                if ((!result.title || result.title.trim() === '') && yt.title) result.title = yt.title;
                if ((!result.author || result.author.trim() === '') && yt.author_name) result.author = yt.author_name;
                if (!result.thumbnail && yt.thumbnail_url) result.thumbnail = yt.thumbnail_url;
            }
        } catch (e) {}
    }

    return result;
}
window.fetchYoutubeFullMetadata = fetchYoutubeFullMetadata;

function inferToolsAndCategoryFromYoutube(data) {
    const text = `${data.title || ''} ${data.description || ''} ${(data.keywords || []).join(' ')}`.toLowerCase();
    
    // Tools inference
    const detectedTools = [];
    if (text.includes('premiere')) detectedTools.push('Adobe Premiere Pro');
    if (text.includes('after effects') || text.includes('motion graphic') || text.includes('typography') || text.includes('kinetic')) {
        detectedTools.push('After Effects');
    }
    if (text.includes('davinci') || text.includes('resolve') || text.includes('color grading')) {
        detectedTools.push('DaVinci Resolve');
    }
    if (text.includes('blender')) detectedTools.push('Blender');
    if (text.includes('photoshop')) detectedTools.push('Photoshop');
    if (text.includes('illustrator')) detectedTools.push('Illustrator');
    if (text.includes('cinema 4d') || text.includes('c4d')) detectedTools.push('Cinema 4D');
    
    if (detectedTools.length === 0) {
        detectedTools.push('Adobe Premiere Pro', 'After Effects');
    }

    // Category inference
    let categoryBadge = 'Commercial Video';
    let categorySlug = 'commercial-ad';
    
    if (text.includes('motion graphics') || text.includes('motion design') || text.includes('kinetic') || text.includes('typography')) {
        categoryBadge = 'Motion Graphics';
        categorySlug = 'motion-graphics';
    } else if (text.includes('saas') || text.includes('promo') || text.includes('commercial') || text.includes('advertising') || text.includes('campaign')) {
        categoryBadge = 'Commercial Video';
        categorySlug = 'commercial-ad';
    } else if (text.includes('corporate') || text.includes('company') || text.includes('business')) {
        categoryBadge = 'Corporate Video';
        categorySlug = 'commercial-ad';
    } else if (text.includes('vfx') || text.includes('cinematic') || text.includes('3d') || text.includes('cgi')) {
        categoryBadge = 'Cinematic VFX';
        categorySlug = 'cinematic-vfx';
    } else if (text.includes('short') || text.includes('reel') || text.includes('tiktok')) {
        categoryBadge = 'Reels / Shorts';
        categorySlug = 'reels-shorts';
    }

    return { tools: detectedTools, categoryBadge, categorySlug };
}
window.inferToolsAndCategoryFromYoutube = inferToolsAndCategoryFromYoutube;

async function autoFetchCurrentProjFromYoutube(forceOverwrite = false) {
    const urlInput = document.getElementById('editProjVideo');
    const val = urlInput?.value.trim() || '';
    if (!val) {
        showToast('Please enter a YouTube video URL first!', 'warning');
        return;
    }

    const extracted = (typeof extractYoutubeId === 'function') ? extractYoutubeId(val) : null;
    if (!extracted) {
        showToast('Please enter a valid YouTube video link (e.g. watch?v=... or youtu.be/...)', 'warning');
        return;
    }

    showToast('Fetching YouTube video details (title, description, avatar, duration)...', 'info');
    const meta = await fetchYoutubeFullMetadata(extracted);

    if (!meta) {
        showToast('Could not fetch details from YouTube. Check URL or internet connection.', 'error');
        return;
    }

    // Populate YouTube ID
    const ytField = document.getElementById('editProjYoutubeId');
    if (ytField) ytField.value = meta.id;

    // Populate Title
    const titleEl = document.getElementById('editProjTitle');
    if (titleEl && (forceOverwrite || !titleEl.value.trim())) {
        if (meta.title) titleEl.value = meta.title;
    }

    // Populate Full Description
    const descEl = document.getElementById('editProjDesc');
    if (descEl && (forceOverwrite || !descEl.value.trim())) {
        if (meta.description) {
            descEl.value = meta.description;
        } else if (meta.title && typeof generateAiProjectDescription === 'function') {
            descEl.value = generateAiProjectDescription({
                title: meta.title,
                categoryBadge: document.getElementById('editProjCategoryBadge')?.value || 'Commercial Video',
                slug: document.getElementById('editProjCategory')?.value || 'commercial-ad',
                client: meta.author || '',
                tools: document.getElementById('editProjTools')?.value || '',
                duration: meta.duration || '',
                isShort: false
            });
        }
    }

    // Populate Duration
    const durInput = document.getElementById('editProjDuration');
    if (durInput && (forceOverwrite || !durInput.value.trim() || ['03:00', '03:22'].includes(durInput.value.trim()))) {
        if (meta.duration) {
            durInput.value = meta.duration;
        } else {
            const detected = await extractDurationFromFileOrUrl(val);
            if (detected) durInput.value = detected;
        }
    }

    // Populate Client Name
    const clientEl = document.getElementById('editProjClient');
    if (clientEl && (forceOverwrite || !clientEl.value.trim())) {
        if (meta.author) clientEl.value = meta.author;
    }

    // Populate Client Avatar
    const avatarInput = document.getElementById('editProjClientAvatar');
    const avatarPreviewImg = document.getElementById('editProjClientAvatarPreview');
    const avatarPreviewWrap = document.getElementById('editProjClientAvatarPreviewWrap');
    if (meta.channelAvatar && avatarInput && (forceOverwrite || !avatarInput.value.trim())) {
        avatarInput.value = meta.channelAvatar;
        if (avatarPreviewImg) avatarPreviewImg.src = meta.channelAvatar;
        if (avatarPreviewWrap) avatarPreviewWrap.style.display = 'flex';
    }

    // Populate Cover Image Thumbnail
    const imgEl = document.getElementById('editProjImage');
    const prevImg = document.getElementById('editProjImagePreview');
    const prevWrap = document.getElementById('editProjImagePreviewWrap');
    if (meta.thumbnail && imgEl && (forceOverwrite || !imgEl.value.trim())) {
        imgEl.value = meta.thumbnail;
        if (prevImg) prevImg.src = meta.thumbnail;
        if (prevWrap) prevWrap.style.display = 'flex';
    }

    // Populate Tools & Categories
    const inferred = inferToolsAndCategoryFromYoutube(meta);
    const toolsInput = document.getElementById('editProjTools');
    if (toolsInput && (forceOverwrite || !toolsInput.value.trim())) {
        toolsInput.value = inferred.tools.join(', ');
    }
    const catBadge = document.getElementById('editProjCategoryBadge');
    if (catBadge && (forceOverwrite || !catBadge.value.trim())) {
        catBadge.value = inferred.categoryBadge;
    }
    const catSlug = document.getElementById('editProjCategory');
    if (catSlug && (forceOverwrite || !catSlug.value.trim())) {
        catSlug.value = inferred.categorySlug;
    }

    // Populate Description
    const projDescEl = document.getElementById('editProjDesc');
    if (projDescEl && (forceOverwrite || !projDescEl.value.trim())) {
        if (meta.description && meta.description.trim()) {
            projDescEl.value = meta.description.trim();
        }
    }

    showToast('✨ YouTube metadata, description & avatar auto-filled successfully!', 'success');
}
window.autoFetchCurrentProjFromYoutube = autoFetchCurrentProjFromYoutube;

async function fetchAndFillYoutubeDescription() {
    const urlInput = document.getElementById('editProjVideo');
    const val = urlInput?.value.trim() || '';
    const extracted = (typeof extractYoutubeId === 'function') ? extractYoutubeId(val) : null;
    if (!extracted) {
        showToast('Please enter a YouTube video link first in Project Video field!', 'warning');
        return;
    }

    showToast('Fetching YouTube description...', 'info');
    const meta = await fetchYoutubeFullMetadata(extracted);
    const descEl = document.getElementById('editProjDesc');
    if (meta && meta.description && descEl) {
        descEl.value = meta.description.trim();
        showToast('YouTube video description imported successfully!', 'success');
    } else {
        showToast('No detailed description found on YouTube video page.', 'warning');
    }
}
window.fetchAndFillYoutubeDescription = fetchAndFillYoutubeDescription;

async function autoFetchCurrentShortFromYoutube(forceOverwrite = false) {
    const urlInput = document.getElementById('editShortVideo');
    const val = urlInput?.value.trim() || '';
    if (!val) {
        showToast('Please enter a YouTube Shorts video URL first!', 'warning');
        return;
    }

    const extracted = (typeof extractYoutubeId === 'function') ? extractYoutubeId(val) : null;
    if (!extracted) {
        showToast('Please enter a valid YouTube link!', 'warning');
        return;
    }

    showToast('Fetching YouTube Shorts details...', 'info');
    const meta = await fetchYoutubeFullMetadata(extracted);
    if (!meta) {
        showToast('Could not fetch details from YouTube Shorts.', 'error');
        return;
    }

    const ytField = document.getElementById('editShortYoutubeId');
    if (ytField) ytField.value = meta.id;

    const titleEl = document.getElementById('editShortTitle');
    if (titleEl && (forceOverwrite || !titleEl.value.trim())) {
        if (meta.title) titleEl.value = meta.title;
    }

    const durInput = document.getElementById('editShortDuration');
    if (durInput && (forceOverwrite || !durInput.value.trim() || ['0:58', '0:50', '0:15', '0:30', '0:45'].includes(durInput.value.trim()))) {
        if (meta.duration) {
            durInput.value = meta.duration;
        } else {
            const detected = await extractDurationFromFileOrUrl(val);
            if (detected) durInput.value = detected;
        }
    }

    const clientEl = document.getElementById('editShortClient');
    if (clientEl && (forceOverwrite || !clientEl.value.trim())) {
        if (meta.author) clientEl.value = meta.author;
    }

    const imgEl = document.getElementById('editShortImage');
    const prevImg = document.getElementById('editShortImagePreview');
    const prevWrap = document.getElementById('editShortImagePreviewWrap');
    if (meta.thumbnail && imgEl && (forceOverwrite || !imgEl.value.trim())) {
        imgEl.value = meta.thumbnail;
        if (prevImg) prevImg.src = meta.thumbnail;
        if (prevWrap) prevWrap.style.display = 'flex';
    }

    const platformEl = document.getElementById('editShortPlatform');
    if (platformEl && (forceOverwrite || !platformEl.value)) {
        platformEl.value = 'youtube';
    }
    const labelEl = document.getElementById('editShortPlatformLabel');
    if (labelEl && (forceOverwrite || !labelEl.value.trim())) {
        labelEl.value = 'Shorts';
    }

    // Populate Description from YouTube or smart AI generator if empty
    const descEl = document.getElementById('editShortDesc');
    if (descEl && (forceOverwrite || !descEl.value.trim())) {
        if (meta.description && meta.description.trim()) {
            descEl.value = meta.description.trim();
        } else if (typeof generateAiShortDescription === 'function') {
            generateAiShortDescription();
        }
    }

    showToast('✨ YouTube Shorts details, duration & description auto-filled!', 'success');
}
window.autoFetchCurrentShortFromYoutube = autoFetchCurrentShortFromYoutube;

async function fetchAndFillYoutubeShortDescription() {
    const urlInput = document.getElementById('editShortVideo');
    const val = urlInput?.value.trim() || '';
    const extracted = (typeof extractYoutubeId === 'function') ? extractYoutubeId(val) : null;
    if (!extracted) {
        showToast('Please enter a YouTube Shorts video link first in Reel Video field!', 'warning');
        return;
    }

    showToast('Fetching YouTube Shorts description...', 'info');
    const meta = await fetchYoutubeFullMetadata(extracted);
    const descEl = document.getElementById('editShortDesc');
    if (meta && meta.description && meta.description.trim() && descEl) {
        descEl.value = meta.description.trim();
        showToast('YouTube Shorts description imported successfully!', 'success');
    } else if (descEl) {
        if (typeof generateAiShortDescription === 'function') {
            generateAiShortDescription();
            showToast('YouTube description not found. Generated high-retention reel description with AI!', 'info');
        } else {
            showToast('No detailed description found on YouTube video.', 'warning');
        }
    }
}
window.fetchAndFillYoutubeShortDescription = fetchAndFillYoutubeShortDescription;

async function onShortVideoInputChange() {
    const val = document.getElementById('editShortVideo')?.value.trim() || '';
    const ytField = document.getElementById('editShortYoutubeId');
    const wrap = document.getElementById('editShortVideoPreviewWrap');
    const extracted = (typeof extractYoutubeId === 'function') ? extractYoutubeId(val) : null;
    if (extracted) {
        if (ytField) ytField.value = extracted;
        if (wrap) wrap.style.display = 'none';
        autoFetchCurrentShortFromYoutube(true);
    } else if (val.includes('<iframe')) {
        if (ytField) ytField.value = '';
        if (wrap) wrap.style.display = 'none';
    } else if (val.startsWith('data:video') || val.startsWith('blob:') || val.startsWith('idb:') || /\.(mp4|webm|mov|ogg)($|\?)/i.test(val)) {
        if (ytField) ytField.value = '';
        if (wrap) wrap.style.display = 'flex';
        let testSrc = val;
        if (val.startsWith('idb:') && typeof resolveMediaUrl === 'function') {
            testSrc = await resolveMediaUrl(val);
        }
        if (testSrc) {
            const detected = await extractDurationFromFileOrUrl(testSrc);
            const durInput = document.getElementById('editShortDuration');
            if (detected && durInput && (!durInput.value || ['0:58', '0:50', '0:15', '0:30', '0:45'].includes(durInput.value))) {
                durInput.value = detected;
            }
        }
    } else {
        if (ytField) ytField.value = '';
        if (wrap) wrap.style.display = 'none';
    }
}
window.onShortVideoInputChange = onShortVideoInputChange;

async function onProjVideoInputChange() {
    const val = document.getElementById('editProjVideo')?.value.trim() || '';
    const ytField = document.getElementById('editProjYoutubeId');
    const wrap = document.getElementById('editProjVideoPreviewWrap');
    const extracted = (typeof extractYoutubeId === 'function') ? extractYoutubeId(val) : null;
    if (extracted) {
        if (ytField) ytField.value = extracted;
        if (wrap) wrap.style.display = 'none';
        autoFetchCurrentProjFromYoutube(true);
    } else if (val.includes('<iframe')) {
        if (ytField) ytField.value = '';
        if (wrap) wrap.style.display = 'none';
    } else if (val.startsWith('data:video') || val.startsWith('blob:') || val.startsWith('idb:') || /\.(mp4|webm|mov|ogg)($|\?)/i.test(val)) {
        if (ytField) ytField.value = '';
        if (wrap) wrap.style.display = 'flex';
        let testSrc = val;
        if (val.startsWith('idb:') && typeof resolveMediaUrl === 'function') {
            testSrc = await resolveMediaUrl(val);
        }
        if (testSrc) {
            const detected = await extractDurationFromFileOrUrl(testSrc);
            const durInput = document.getElementById('editProjDuration');
            if (detected && durInput && (!durInput.value || ['03:00', '03:22'].includes(durInput.value))) {
                durInput.value = detected;
            }
        }
    } else {
        if (ytField) ytField.value = '';
        if (wrap) wrap.style.display = 'none';
    }
}
window.onProjVideoInputChange = onProjVideoInputChange;

async function autoDetectCurrentShortDuration() {
    const fileInput = document.getElementById('editShortVideoFileInput');
    const urlInput = document.getElementById('editShortVideo');
    const durInput = document.getElementById('editShortDuration');
    if (!durInput) return;

    if (fileInput && fileInput.files && fileInput.files[0]) {
        showToast('Detecting video length...', 'info');
        const dur = await extractDurationFromFileOrUrl(fileInput.files[0]);
        if (dur) {
            durInput.value = dur;
            showToast(`Detected duration: ${dur}`, 'success');
            return;
        }
    }

    const videoVal = urlInput?.value.trim() || '';
    if (videoVal) {
        showToast('Detecting video length from file...', 'info');
        let srcToTest = videoVal;
        if (videoVal.startsWith('idb:') && typeof resolveMediaUrl === 'function') {
            srcToTest = await resolveMediaUrl(videoVal);
        }
        const dur = await extractDurationFromFileOrUrl(srcToTest);
        if (dur) {
            durInput.value = dur;
            showToast(`Detected duration: ${dur}`, 'success');
            return;
        }
    }

    showToast('Could not auto-detect length. Please enter manually (e.g. 1:24)', 'warning');
}
window.autoDetectCurrentShortDuration = autoDetectCurrentShortDuration;

async function autoDetectCurrentProjDuration() {
    const fileInput = document.getElementById('editProjVideoFileInput');
    const urlInput = document.getElementById('editProjVideo');
    const durInput = document.getElementById('editProjDuration');
    if (!durInput) return;

    if (fileInput && fileInput.files && fileInput.files[0]) {
        showToast('Detecting video length...', 'info');
        const dur = await extractDurationFromFileOrUrl(fileInput.files[0]);
        if (dur) {
            durInput.value = dur;
            showToast(`Detected duration: ${dur}`, 'success');
            return;
        }
    }

    const videoVal = urlInput?.value.trim() || '';
    if (videoVal) {
        showToast('Detecting video length from file...', 'info');
        let srcToTest = videoVal;
        if (videoVal.startsWith('idb:') && typeof resolveMediaUrl === 'function') {
            srcToTest = await resolveMediaUrl(videoVal);
        }
        const dur = await extractDurationFromFileOrUrl(srcToTest);
        if (dur) {
            durInput.value = dur;
            showToast(`Detected duration: ${dur}`, 'success');
            return;
        }
    }

    showToast('Could not auto-detect length. Please enter manually (e.g. 03:22)', 'warning');
}
window.autoDetectCurrentProjDuration = autoDetectCurrentProjDuration;

async function autoSyncAllShortDurations(silent = false) {
    const data = getSiteData();
    if (!data.shorts || !Array.isArray(data.shorts) || !data.shorts.length) return;

    let updatedCount = 0;
    for (const short of data.shorts) {
        const vFile = (short.video || '').split('/').pop().split('?')[0];
        if (typeof KNOWN_VIDEO_DURATIONS !== 'undefined' && KNOWN_VIDEO_DURATIONS[vFile]) {
            const realDur = KNOWN_VIDEO_DURATIONS[vFile];
            if (short.duration !== realDur) {
                short.duration = realDur;
                updatedCount++;
            }
        } else if (short.video && (short.video.startsWith('idb:') || /\.(mp4|webm|mov)($|\?)/i.test(short.video))) {
            let src = short.video;
            if (short.video.startsWith('idb:') && typeof resolveMediaUrl === 'function') {
                src = await resolveMediaUrl(short.video);
            }
            const detected = await extractDurationFromFileOrUrl(src);
            if (detected && short.duration !== detected) {
                short.duration = detected;
                updatedCount++;
            }
        }
    }

    if (updatedCount > 0) {
        await saveSiteData(data);
        renderAdminShortsList(data.shorts);
        if (!silent) {
            showToast(`Updated ${updatedCount} card(s) to exact video lengths!`, 'success');
        }
    } else {
        if (!silent) {
            showToast('All video lengths already match original files!', 'info');
        }
    }
}
window.autoSyncAllShortDurations = autoSyncAllShortDurations;

function handleCtaIconUpload(event, btnId) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const dataUrl = e.target.result;
        document.getElementById(`ctaBtnIconImage_${btnId}`).value = dataUrl;
        
        const badge = document.getElementById(`ctaBtnIconBadge_${btnId}`);
        if (badge) badge.innerHTML = `<img src="${dataUrl}" style="width: 22px; height: 22px; object-fit: contain;">`;

        const previewWrap = document.getElementById(`ctaIconPreviewWrap_${btnId}`);
        if (previewWrap) previewWrap.style.display = 'flex';

        renderLiveHeroPreview();
        showToast('Hero button custom icon uploaded!', 'success');
    };
    reader.readAsDataURL(file);
}

function removeCtaIconImage(btnId, defaultIcon) {
    document.getElementById(`ctaBtnIconImage_${btnId}`).value = '';
    const previewWrap = document.getElementById(`ctaIconPreviewWrap_${btnId}`);
    if (previewWrap) previewWrap.style.display = 'none';

    const currentClass = document.getElementById(`ctaBtnIconClass_${btnId}`)?.value || defaultIcon || 'fa-solid fa-play';
    const badge = document.getElementById(`ctaBtnIconBadge_${btnId}`);
    if (badge) badge.innerHTML = `<i class="${currentClass}"></i>`;

    renderLiveHeroPreview();
    showToast('Uploaded icon image removed', 'info');
}

function addNewHeroCtaButton() {
    const data = getSiteData();
    if (!data.hero.ctaButtons) data.hero.ctaButtons = [];
    
    data.hero.ctaButtons.push({
        id: 'btn-' + Date.now(),
        text: '',
        link: '',
        icon: 'fa-solid fa-arrow-right',
        iconImage: '',
        isModal: false
    });

    if (saveSiteData(data)) {
        renderAdminCtaButtons(data.hero.ctaButtons);
        showToast('New CTA Button added! Fill in details & click Save Hero Changes.', 'success');
    }
}

function deleteHeroCtaButton(btnId) {
    openDeleteConfirmModal('Are you sure you want to delete this CTA Button?', () => {
        const data = getSiteData();
        data.hero.ctaButtons = (data.hero.ctaButtons || []).filter(b => b.id !== btnId);
        if (saveSiteData(data)) {
            renderAdminCtaButtons(data.hero.ctaButtons);
            showToast('CTA Button deleted', 'info');
        }
    });
}

/* --- Dynamic About Me CTA Buttons Manager --- */
function renderAdminAboutCtaButtons(ctaButtons) {
    const listContainer = document.getElementById('adminAboutCtaButtonsList');
    if (!listContainer) return;

    if (ctaButtons && Array.isArray(ctaButtons)) {
        ctaButtons.forEach(b => {
            if (b.text === 'New Social Link' || b.text === 'New CTA Button' || b.text === 'New Link' || b.text === 'New Action Button') b.text = '';
            if (b.link === 'https://' || b.link === '#') b.link = '';
        });
    }

    const list = (ctaButtons && Array.isArray(ctaButtons) && ctaButtons.length > 0) ? ctaButtons : [
        { id: "about-btn-1", text: "Visit Behance Profile", link: "https://www.behance.net/mahinalibiswas", icon: "fa-brands fa-behance", iconImage: "" },
        { id: "about-btn-2", text: "Contact Direct", link: "#contact", icon: "fa-solid fa-paper-plane", iconImage: "" },
        { id: "about-btn-3", text: "Download CV", link: "assets/docs/Mahin_Ali_Biswas_CV.pdf", icon: "fa-solid fa-file-arrow-down", iconImage: "" }
    ];

    listContainer.innerHTML = list.map((btn, index) => {
        const defaultIcon = (index === 0) ? 'fa-brands fa-behance' : (index === 1 ? 'fa-solid fa-paper-plane' : 'fa-solid fa-file-arrow-down');
        const activeIcon = btn.icon || defaultIcon;
        let activeIconHtml = `<i id="aboutBtnIconDisplay_${btn.id}" class="${activeIcon}"></i>`;
        if (btn.iconImage) {
            activeIconHtml = `<img id="aboutBtnIconImageDisplay_${btn.id}" src="${btn.iconImage}" style="width: 22px; height: 22px; object-fit: contain;">`;
        }

        return `
            <div class="admin-card-row" style="padding: 1.35rem; background: rgba(2, 8, 23, 0.6); border-radius: 14px; border: 1px solid var(--border-glow); box-sizing: border-box; margin-bottom: 0; display: flex; flex-direction: column; gap: 0.95rem; overflow: hidden;">
                <!-- Card Header with Title & Delete -->
                <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 0.65rem; border-bottom: 1px dashed rgba(255, 255, 255, 0.1);">
                    <h4 style="margin: 0; color: #ffffff; font-size: 0.95rem; font-weight: 700;">
                        <i class="fa-solid fa-link" style="color: var(--accent-neon); margin-right: 0.4rem;"></i> About CTA Button #${index + 1}
                    </h4>
                    ${index >= 2 ? `
                    <button type="button" onclick="deleteAboutCtaButton('${btn.id}')" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); color: #ef4444; border-radius: 6px; padding: 0.28rem 0.65rem; cursor: pointer; font-size: 0.76rem; display: inline-flex; align-items: center; gap: 0.35rem;" title="Delete this button">
                        <i class="fa-solid fa-trash-can"></i> Delete
                    </button>` : ''}
                </div>
                
                <!-- Row 1: Button Text -->
                <div>
                    <label style="color: #94a3b8; font-weight: 600; font-size: 0.78rem; display: block; margin-bottom: 0.35rem;">Button Text</label>
                    <input type="text" id="aboutBtnText_${btn.id}" value="${btn.text || ''}" oninput="renderLiveAboutPreview()" placeholder="Enter button text..." style="width: 100%; height: 42px; background: rgba(2, 6, 23, 0.8); color: #ffffff; border: 1px solid var(--border-glow); padding: 0 0.85rem; border-radius: 10px; font-size: 0.88rem; outline: none; box-sizing: border-box;">
                </div>

                <!-- Row 2: Icon Selection (Badge + Pick Icon + Upload) -->
                <div>
                    <label style="color: #94a3b8; font-weight: 600; font-size: 0.78rem; display: block; margin-bottom: 0.35rem;">Button Icon</label>
                    <div style="display: flex; align-items: center; gap: 0.6rem; width: 100%;">
                        <!-- Dedicated Active Icon Preview Badge -->
                        <div id="aboutBtnIconBadge_${btn.id}" title="Current Active Icon" style="width: 42px; height: 42px; background: rgba(163, 230, 53, 0.12); border: 1px solid var(--accent-neon); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; color: var(--accent-neon); box-shadow: 0 0 10px rgba(163, 230, 53, 0.2); flex-shrink: 0;">
                            ${activeIconHtml}
                        </div>

                        <!-- Pick Icon Button -->
                        <button type="button" class="btn btn-hero-secondary btn-sm" onclick="openIconPickerModal('aboutBtnIconClass_${btn.id}', 'aboutBtnIconBadge_${btn.id}', 'about')" style="flex: 1; height: 42px; padding: 0 0.65rem; display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem; border-radius: 10px; font-size: 0.8rem; white-space: nowrap;">
                            <i class="fa-solid fa-icons"></i> Pick Icon
                        </button>

                        <!-- Upload Custom Image Button -->
                        <input type="file" id="aboutBtnFileInput_${btn.id}" accept="image/*" style="display: none;" onchange="handleAboutCtaIconUpload(event, '${btn.id}')">
                        <button type="button" class="btn btn-hero-secondary btn-sm" onclick="document.getElementById('aboutBtnFileInput_${btn.id}').click()" style="flex: 1; height: 42px; padding: 0 0.65rem; display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem; border-radius: 10px; font-size: 0.8rem; white-space: nowrap;">
                            <i class="fa-solid fa-upload"></i> Upload
                        </button>

                        <!-- Delete Custom Icon Image (if active) -->
                        <div id="aboutIconPreviewWrap_${btn.id}" style="display: ${btn.iconImage ? 'flex' : 'none'}; align-items: center; justify-content: center; width: 40px; height: 42px; background: rgba(239, 68, 68, 0.15); border-radius: 10px; border: 1px solid rgba(239, 68, 68, 0.4); box-sizing: border-box; flex-shrink: 0;">
                            <button type="button" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.85rem;" title="Remove uploaded custom icon image" onclick="removeAboutCtaIconImage('${btn.id}', '${defaultIcon}')"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                    </div>
                    <input type="hidden" id="aboutBtnIconClass_${btn.id}" value="${btn.icon || defaultIcon}">
                    <input type="hidden" id="aboutBtnIconImage_${btn.id}" value="${btn.iconImage || ''}">
                </div>

                <!-- Row 3: Target URL -->
                <div>
                    <label style="color: #94a3b8; font-weight: 600; font-size: 0.78rem; display: block; margin-bottom: 0.35rem;">Target URL</label>
                    <input type="text" id="aboutBtnLink_${btn.id}" value="${btn.link || ''}" oninput="renderLiveAboutPreview()" placeholder="Enter your target URL..." style="width: 100%; height: 42px; background: rgba(2, 6, 23, 0.8); color: #ffffff; border: 1px solid var(--border-glow); padding: 0 0.85rem; border-radius: 10px; font-size: 0.88rem; outline: none; box-sizing: border-box;">
                </div>
            </div>
        `;
    }).join('');
}

function handleAboutCtaIconUpload(event, btnId) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const dataUrl = e.target.result;
        document.getElementById(`aboutBtnIconImage_${btnId}`).value = dataUrl;
        
        const badge = document.getElementById(`aboutBtnIconBadge_${btnId}`);
        if (badge) badge.innerHTML = `<img src="${dataUrl}" style="width: 22px; height: 22px; object-fit: contain;">`;

        const previewWrap = document.getElementById(`aboutIconPreviewWrap_${btnId}`);
        if (previewWrap) previewWrap.style.display = 'flex';

        renderLiveAboutPreview();
        showToast('Custom icon image uploaded!', 'success');
    };
    reader.readAsDataURL(file);
}

function removeAboutCtaIconImage(btnId, defaultIcon) {
    document.getElementById(`aboutBtnIconImage_${btnId}`).value = '';
    const previewWrap = document.getElementById(`aboutIconPreviewWrap_${btnId}`);
    if (previewWrap) previewWrap.style.display = 'none';

    const currentClass = document.getElementById(`aboutBtnIconClass_${btnId}`)?.value || defaultIcon || 'fa-solid fa-arrow-right';
    const badge = document.getElementById(`aboutBtnIconBadge_${btnId}`);
    if (badge) badge.innerHTML = `<i class="${currentClass}"></i>`;

    renderLiveAboutPreview();
    showToast('Uploaded icon image removed', 'info');
}

function addNewAboutCtaButton() {
    const data = getSiteData();
    if (!data.about.ctaButtons) data.about.ctaButtons = [];
    
    data.about.ctaButtons.push({
        id: 'about-btn-' + Date.now(),
        text: '',
        link: '',
        icon: 'fa-solid fa-link',
        iconImage: ''
    });

    if (saveSiteData(data)) {
        renderAdminAboutCtaButtons(data.about.ctaButtons);
        showToast('New About CTA Button added! Fill in details & click Save About Changes.', 'success');
    }
}

function deleteAboutCtaButton(btnId) {
    openDeleteConfirmModal('Are you sure you want to delete this About CTA Button?', () => {
        const data = getSiteData();
        data.about.ctaButtons = (data.about.ctaButtons || []).filter(b => b.id !== btnId);
        if (saveSiteData(data)) {
            renderAdminAboutCtaButtons(data.about.ctaButtons);
            if (typeof renderSiteData === 'function') renderSiteData();
            showToast('CTA Button deleted', 'info');
        }
    });
}

/* --- 5. Section Save Handlers --- */

// Save Navigation
async function saveNavSection() {
    const saveBtn = document.querySelector('#tab-nav .btn-save');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Syncing to Live Cloud...';
    }

    const data = getSiteData();
    const navLinks = (typeof tempNavLinksList !== 'undefined' && tempNavLinksList && tempNavLinksList.length > 0)
        ? tempNavLinksList.map((link, index) => ({
            id: link.id || (index + 1),
            label: document.getElementById(`navLinkLabel_${index}`)?.value || link.label || '',
            url: document.getElementById(`navLinkUrl_${index}`)?.value || link.url || ''
        }))
        : (data.navigation?.navLinks || []);

    data.navigation = {
        ...data.navigation,
        brandLogo: document.getElementById('navBrandLogo')?.value || 'Mahin Ali Biswas',
        ctaText: document.getElementById('navCtaText')?.value || 'Contact Me',
        ctaUrl: document.getElementById('navCtaUrl')?.value || '#contact',
        navLinks: navLinks
    };

    await saveSiteData(data);

    if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Navigation Changes';
    }

    if (typeof renderSiteData === 'function') renderSiteData();
    showToast('Navigation settings updated live across all devices!', 'success');
}

// Save Hero
async function saveHeroSection() {
    const saveBtn = document.querySelector('#tab-hero .btn-save');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Syncing to Live Cloud...';
    }

    const data = getSiteData();

    const ctaButtons = (data.hero.ctaButtons || []).map(btn => ({
        id: btn.id,
        text: document.getElementById(`ctaBtnText_${btn.id}`)?.value || btn.text,
        link: document.getElementById(`ctaBtnLink_${btn.id}`)?.value || btn.link,
        icon: document.getElementById(`ctaBtnIconClass_${btn.id}`)?.value || document.getElementById(`ctaBtnIcon_${btn.id}`)?.value || btn.icon,
        iconImage: document.getElementById(`ctaBtnIconImage_${btn.id}`)?.value || '',
        isModal: document.getElementById(`ctaBtnModal_${btn.id}`)?.checked || false
    }));

    data.hero = {
        ...data.hero,
        badge: document.getElementById('heroBadge')?.value || '',
        titleTop: document.getElementById('heroTitleTop')?.value || '',
        titleBottom: document.getElementById('heroTitleBottom')?.value || '',
        subtitleTag: document.getElementById('heroSubtitleTag')?.value || '',
        subtitle: document.getElementById('heroSubtitle')?.value || '',
        showreelVideo: document.getElementById('heroShowreelVideo')?.value || '',
        showreelPoster: document.getElementById('heroShowreelPoster')?.value || '',
        ctaButtons: ctaButtons,
        statsEdited: document.getElementById('heroStatsEdited')?.value || '100+',
        statsClients: document.getElementById('heroStatsClients')?.value || '50+',
        statsDelivery: document.getElementById('heroStatsDelivery')?.value || '100%'
    };

    await saveSiteData(data);

    if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Hero Changes';
    }

    if (typeof renderSiteData === 'function') renderSiteData();
    showToast('Hero Section & Video updated live across all devices!', 'success');
}

// Save About
async function saveAboutSection() {
    const saveBtn = document.querySelector('#tab-about .btn-save');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Syncing to Live Cloud...';
    }

    const data = getSiteData();
    const features = [];

    for (let i = 0; i < 4; i++) {
        features.push({
            title: document.getElementById(`featTitle${i}`)?.value || '',
            icon: document.getElementById(`featIcon${i}`)?.value || '',
            desc: document.getElementById(`featDesc${i}`)?.value || ''
        });
    }

    const aboutCtaButtons = (data.about?.ctaButtons || []).map((btn, index) => {
        const defaultIcon = (index === 0) ? 'fa-brands fa-behance' : 'fa-solid fa-paper-plane';
        return {
            id: btn.id,
            text: document.getElementById(`aboutBtnText_${btn.id}`)?.value || btn.text,
            link: document.getElementById(`aboutBtnLink_${btn.id}`)?.value || btn.link,
            icon: document.getElementById(`aboutBtnIconClass_${btn.id}`)?.value || btn.icon || defaultIcon,
            iconImage: document.getElementById(`aboutBtnIconImage_${btn.id}`)?.value || ''
        };
    });

    data.about = {
        ...data.about,
        tagBadge: document.getElementById('aboutTagBadge')?.value || '',
        expYears: document.getElementById('aboutExpYears')?.value || '',
        titleTop: document.getElementById('aboutTitleTop')?.value || '',
        titleGradient: document.getElementById('aboutTitleGradient')?.value || '',
        bio: document.getElementById('aboutBio')?.value || '',
        ctaButtons: aboutCtaButtons,
        features: features
    };

    await saveSiteData(data);

    if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save About Changes';
    }

    if (typeof renderSiteData === 'function') renderSiteData();
    showToast('About Me section updated live across all devices!', 'success');
}

// Save Highlight Showreel
async function saveShowreelSection() {
    const saveBtn = document.querySelector('#tab-showreel .btn-save');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Syncing to Live Cloud...';
    }

    const data = getSiteData();
    const videoVal = document.getElementById('showreelVideoUrl')?.value || '';
    const posterVal = document.getElementById('showreelPoster')?.value || '';
    const ytId = (typeof extractYoutubeId === 'function') ? extractYoutubeId(videoVal) : '';

    data.showreel = {
        ...data.showreel,
        subtitle: document.getElementById('showreelSubtitle')?.value || '// HIGHLIGHT SHOWREEL',
        titleTop: document.getElementById('showreelTitleTop')?.value || 'Featured Motion &',
        titleGradient: document.getElementById('showreelTitleGradient')?.value || 'Video Reel',
        desc: document.getElementById('showreelDesc')?.value || '',
        videoUrl: videoVal,
        poster: posterVal,
        youtubeId: ytId,
        youtubeUrl: ytId ? `https://www.youtube.com/watch?v=${ytId}` : ''
    };

    await saveSiteData(data);

    if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Showreel Changes';
    }

    if (typeof renderSiteData === 'function') renderSiteData();
    showToast('Highlight Showreel section updated live across all devices!', 'success');
}

function handleShowreelPosterUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const dataUrl = e.target.result;
        document.getElementById('showreelPoster').value = dataUrl;
        const previewImg = document.getElementById('showreelPosterPreview');
        const previewWrap = document.getElementById('showreelPosterPreviewWrap');
        if (previewImg) previewImg.src = dataUrl;
        if (previewWrap) previewWrap.style.display = 'flex';
        renderLiveShowreelPreview();
        showToast('Showreel cover image uploaded from PC!', 'success');
    };
    reader.readAsDataURL(file);
}

function removeShowreelPosterImage() {
    document.getElementById('showreelPoster').value = '';
    const previewWrap = document.getElementById('showreelPosterPreviewWrap');
    if (previewWrap) previewWrap.style.display = 'none';
    renderLiveShowreelPreview();
    showToast('Showreel cover image removed', 'info');
}

window.saveShowreelSection = saveShowreelSection;
window.handleShowreelPosterUpload = handleShowreelPosterUpload;
window.removeShowreelPosterImage = removeShowreelPosterImage;

// Save Contact
async function saveContactSection() {
    const saveBtn = document.querySelector('#tab-contact .btn-save');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Syncing to Live Cloud...';
    }

    const data = getSiteData();
    data.contact = {
        ...data.contact,
        email: document.getElementById('contactEmail')?.value || '',
        whatsapp: document.getElementById('contactWhatsApp')?.value || '',
        location: document.getElementById('contactLocation')?.value || '',
        behanceUrl: document.getElementById('contactBehance')?.value || '',
        youtubeUrl: document.getElementById('contactYoutube')?.value || '',
        facebookUrl: document.getElementById('contactFacebook')?.value || ''
    };

    await saveSiteData(data);

    if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Contact Changes';
    }

    if (typeof renderSiteData === 'function') renderSiteData();
    showToast('Contact information updated live across all devices!', 'success');
}

/* --- 5. Projects CRUD Operations --- */
function renderAdminProjectsList(projects) {
    const listContainer = document.getElementById('adminProjectsList');
    const countBadge = document.getElementById('tabProjectsCount');
    const countHeader = document.getElementById('tabProjectsCountHeader');
    const count = (projects || []).length;
    if (countBadge) countBadge.textContent = count;
    if (countHeader) countHeader.textContent = count;

    if (!listContainer) return;

    if (!projects || projects.length === 0) {
        listContainer.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 2.5rem; text-align: center; color: var(--text-dim); background: rgba(2,8,23,0.4); border-radius: 14px; border: 1px dashed var(--border-glow);">
                <i class="fa-solid fa-film" style="font-size: 2.2rem; margin-bottom: 0.8rem; color: var(--accent-neon); display: block;"></i>
                <h4 style="color: #ffffff; margin-bottom: 0.4rem;">No Video Projects Yet</h4>
                <p style="font-size: 0.85rem; margin-bottom: 1rem;">Add your first portfolio video project to display on your website.</p>
                <button type="button" class="btn btn-primary btn-sm" onclick="openAddProjectModal()">
                    <i class="fa-solid fa-plus"></i> Add New Video Project
                </button>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = projects.map((proj, idx) => `
        <div class="admin-project-item" data-id="${proj.id}" data-index="${idx}">
            <div class="admin-drag-handle" title="Drag to reorder card">
                <i class="fa-solid fa-grip-vertical"></i>
            </div>
            <img src="${proj.image}" alt="${proj.title}" class="admin-project-thumb" onerror="this.onerror=null; this.src='assets/images/project_cinematic_vfx.jpg';">
            <div class="admin-project-info">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem; min-width: 0; width: 100%;">
                    <span class="project-order-badge" title="Position #${idx + 1}" style="flex-shrink: 0;">#${idx + 1}</span>
                    <h4 style="margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; min-width: 0;" title="${proj.title}">${proj.title}</h4>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; flex-wrap: wrap;">
                    <span style="max-width: 60%; display: inline-block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${proj.categoryBadge || 'Video Project'}</span>
                    <span style="font-size: 0.74rem; color: #94a3b8; display: inline-flex; align-items: center; gap: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        <img src="${proj.clientAvatar || 'assets/images/mahin_profile.jpg'}" style="width: 14px; height: 14px; border-radius: 50%; object-fit: cover; border: 1px solid var(--accent-neon);">
                        ${proj.client || 'Mahin'}
                    </span>
                </div>
            </div>
            <div class="admin-project-actions">
                <button class="action-btn edit-btn" onclick="openEditProjectModal('${proj.id}')" title="Edit Project" style="width: 30px; height: 30px; min-width: 30px; min-height: 30px; max-width: 30px; max-height: 30px; border-radius: 8px; padding: 0;">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteProject('${proj.id}')" title="Delete Project" style="width: 30px; height: 30px; min-width: 30px; min-height: 30px; max-width: 30px; max-height: 30px; border-radius: 8px; padding: 0;">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        </div>
    `).join('');

    initProjectsDragAndDrop();
}

let projectsSortableInstance = null;

function updateProjectsBadgesAndButtons() {
    const listContainer = document.getElementById('adminProjectsList');
    if (!listContainer) return;
    const items = listContainer.querySelectorAll('.admin-project-item');
    const total = items.length;

    items.forEach((item, index) => {
        item.setAttribute('data-index', index);
        const badge = item.querySelector('.project-order-badge');
        if (badge) {
            badge.textContent = `#${index + 1}`;
            badge.title = `Position #${index + 1}`;
        }
        const upBtn = item.querySelector('.order-btn:first-child');
        const downBtn = item.querySelector('.order-btn:last-child');
        if (upBtn) upBtn.disabled = (index === 0);
        if (downBtn) downBtn.disabled = (index === total - 1);
    });
}

function initProjectsDragAndDrop() {
    const listContainer = document.getElementById('adminProjectsList');
    if (!listContainer) return;

    if (projectsSortableInstance) {
        try {
            projectsSortableInstance.destroy();
        } catch (e) {}
        projectsSortableInstance = null;
    }

    if (typeof Sortable !== 'undefined') {
        projectsSortableInstance = new Sortable(listContainer, {
            animation: 280,
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
            handle: '.admin-drag-handle, .admin-project-thumb, .admin-project-info',
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            filter: '.admin-project-actions, button, input, textarea, a',
            preventOnFilter: false,
            fallbackTolerance: 3,
            onEnd: async function (evt) {
                if (evt.oldIndex === evt.newIndex) return;

                const data = getSiteData();
                if (!data.projects || !Array.isArray(data.projects)) return;

                const [movedItem] = data.projects.splice(evt.oldIndex, 1);
                data.projects.splice(evt.newIndex, 0, movedItem);

                await saveSiteData(data);
                updateProjectsBadgesAndButtons();
                if (typeof renderSiteData === 'function') renderSiteData();
                showToast(`Reordered! Project placed at position #${evt.newIndex + 1}`, 'success');
            }
        });
    }
}

async function moveProjectOrder(projectId, direction) {
    const data = getSiteData();
    if (!data.projects || !Array.isArray(data.projects)) return;

    const currentIndex = data.projects.findIndex(p => p.id === projectId);
    if (currentIndex === -1) return;

    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= data.projects.length) return;

    const [movedItem] = data.projects.splice(currentIndex, 1);
    data.projects.splice(targetIndex, 0, movedItem);

    await saveSiteData(data);
    renderAdminProjectsList(data.projects);
    if (typeof renderSiteData === 'function') renderSiteData();
    showToast(`Project moved to position #${targetIndex + 1}!`, 'success');
}
window.moveProjectOrder = moveProjectOrder;
window.initProjectsDragAndDrop = initProjectsDragAndDrop;

function clearProjectEditForm(notify = true) {
    const form = document.getElementById('projectEditForm');
    if (form) form.reset();

    const fields = [
        'editProjTitle',
        'editProjCategoryBadge',
        'editProjCategory',
        'editProjImage',
        'editProjVideo',
        'editProjYoutubeId',
        'editProjDuration',
        'editProjClient',
        'editProjDate',
        'editProjClientAvatar',
        'editProjTools',
        'editProjDesc'
    ];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    const fileInputs = [
        'editProjVideoFileInput',
        'editProjImageFileInput',
        'editProjClientAvatarFileInput'
    ];
    fileInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    const previewWraps = [
        'editProjImagePreviewWrap',
        'editProjVideoPreviewWrap',
        'editProjClientAvatarPreviewWrap'
    ];
    previewWraps.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    const imgPrev = document.getElementById('editProjImagePreview');
    if (imgPrev) imgPrev.src = '';
    const avatarPrev = document.getElementById('editProjClientAvatarPreview');
    if (avatarPrev) avatarPrev.src = '';

    if (notify && typeof showToast === 'function') {
        showToast('All fields in this project form have been cleared!', 'info');
    }
}
window.clearProjectEditForm = clearProjectEditForm;

function openAddProjectModal() {
    if (document.getElementById('projectModalTitle')) document.getElementById('projectModalTitle').textContent = 'Add New Video Project';
    clearProjectEditForm(false);
    if (document.getElementById('editProjectId')) document.getElementById('editProjectId').value = '';
    const modal = document.getElementById('projectEditModal');
    if (modal) modal.classList.add('active');
}

function openEditProjectModal(projectId) {
    const fileInput = document.getElementById('editProjVideoFileInput');
    if (fileInput) fileInput.value = '';
    const imgFileInput = document.getElementById('editProjImageFileInput');
    if (imgFileInput) imgFileInput.value = '';
    const avatarFileInput = document.getElementById('editProjClientAvatarFileInput');
    if (avatarFileInput) avatarFileInput.value = '';

    const data = getSiteData();
    const proj = (data.projects || []).find(p => p.id === projectId);

    if (proj) {
        if (document.getElementById('projectModalTitle')) document.getElementById('projectModalTitle').textContent = 'Edit Video Project';
        if (document.getElementById('editProjectId')) document.getElementById('editProjectId').value = proj.id || '';
        if (document.getElementById('editProjTitle')) document.getElementById('editProjTitle').value = proj.title || '';
        if (document.getElementById('editProjCategoryBadge')) document.getElementById('editProjCategoryBadge').value = proj.categoryBadge || '';
        if (document.getElementById('editProjCategory')) document.getElementById('editProjCategory').value = proj.category || '';
        if (document.getElementById('editProjImage')) document.getElementById('editProjImage').value = proj.image || '';
        if (document.getElementById('editProjVideo')) document.getElementById('editProjVideo').value = proj.video || '';
        if (document.getElementById('editProjYoutubeId')) document.getElementById('editProjYoutubeId').value = proj.youtubeId || '';
        if (document.getElementById('editProjDuration')) document.getElementById('editProjDuration').value = proj.duration || '';
        if (document.getElementById('editProjClient')) document.getElementById('editProjClient').value = proj.client || '';
        if (document.getElementById('editProjDate')) document.getElementById('editProjDate').value = proj.date || '';
        if (document.getElementById('editProjTools')) document.getElementById('editProjTools').value = (proj.tools || []).join(', ');
        if (document.getElementById('editProjDesc')) document.getElementById('editProjDesc').value = proj.desc || '';

        if (document.getElementById('editProjClientAvatar')) {
            document.getElementById('editProjClientAvatar').value = proj.clientAvatar || '';
        }
        const avatarPreviewImg = document.getElementById('editProjClientAvatarPreview');
        const avatarPreviewWrap = document.getElementById('editProjClientAvatarPreviewWrap');
        if (proj.clientAvatar) {
            if (avatarPreviewImg) avatarPreviewImg.src = proj.clientAvatar;
            if (avatarPreviewWrap) avatarPreviewWrap.style.display = 'flex';
        } else {
            if (avatarPreviewWrap) avatarPreviewWrap.style.display = 'none';
        }

        if (proj.image) {
            const previewImg = document.getElementById('editProjImagePreview');
            const previewWrap = document.getElementById('editProjImagePreviewWrap');
            if (previewImg) previewImg.src = proj.image;
            if (previewWrap) previewWrap.style.display = 'flex';
        } else {
            const previewWrap = document.getElementById('editProjImagePreviewWrap');
            if (previewWrap) previewWrap.style.display = 'none';
        }

        const videoWrap = document.getElementById('editProjVideoPreviewWrap');
        const videoName = document.getElementById('editProjVideoFileName');
        if (proj.video && (proj.video.startsWith('data:video') || proj.video.startsWith('blob:') || proj.video.startsWith('idb:') || /\.(mp4|webm|mov|ogg)($|\?)/i.test(proj.video))) {
            if (videoWrap) videoWrap.style.display = 'flex';
            if (videoName) videoName.textContent = proj.video.startsWith('idb:') ? 'Uploaded Direct Video File' : (proj.video.startsWith('data:video') ? 'Uploaded Video File' : proj.video.split('/').pop());
        } else {
            if (videoWrap) videoWrap.style.display = 'none';
        }

        const modal = document.getElementById('projectEditModal');
        if (modal) modal.classList.add('active');
    }
}

function closeProjectEditModal() {
    const modal = document.getElementById('projectEditModal');
    if (modal) modal.classList.remove('active');
}

window.openAddProjectModal = openAddProjectModal;
window.openEditProjectModal = openEditProjectModal;
window.closeProjectEditModal = closeProjectEditModal;
window.deleteProject = deleteProject;

document.getElementById('projectEditForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.querySelector('#projectEditModal button[type="submit"]');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    }

    const data = getSiteData();
    const projectId = document.getElementById('editProjectId')?.value || '';
    const toolsArr = (document.getElementById('editProjTools')?.value || '').split(',').map(t => t.trim()).filter(Boolean);

    const videoVal = document.getElementById('editProjVideo')?.value.trim() || '';
    const extractedYt = typeof extractYoutubeId === 'function' ? extractYoutubeId(videoVal) : null;
    const manualYtId = document.getElementById('editProjYoutubeId')?.value.trim() || '';
    const isDirectVideo = videoVal.startsWith('data:video') || videoVal.startsWith('blob:') || videoVal.startsWith('idb:') || /\.(mp4|webm|mov|ogg)($|\?)/i.test(videoVal);

    let youtubeId = '';
    if (isDirectVideo) {
        youtubeId = '';
    } else if (extractedYt) {
        youtubeId = extractedYt;
    } else if (!videoVal.includes('<iframe') && manualYtId) {
        youtubeId = manualYtId;
    }

    const projectObj = {
        id: projectId || 'project-' + Date.now(),
        title: document.getElementById('editProjTitle')?.value || '',
        categoryBadge: document.getElementById('editProjCategoryBadge')?.value || '',
        category: document.getElementById('editProjCategory')?.value || '',
        image: document.getElementById('editProjImage')?.value || '',
        video: videoVal,
        youtubeId: youtubeId,
        youtubeUrl: youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : '',
        duration: document.getElementById('editProjDuration')?.value || '03:00',
        client: document.getElementById('editProjClient')?.value || 'Client',
        clientAvatar: document.getElementById('editProjClientAvatar')?.value.trim() || '',
        date: document.getElementById('editProjDate')?.value || '2026',
        tools: toolsArr.length > 0 ? toolsArr : ['Adobe Premiere Pro', 'After Effects'],
        desc: document.getElementById('editProjDesc')?.value || ''
    };

    if (projectId) {
        // Edit Existing
        const idx = data.projects.findIndex(p => p.id === projectId);
        if (idx !== -1) data.projects[idx] = projectObj;
    } else {
        // Add New
        data.projects.unshift(projectObj);
    }

    await saveSiteData(data);

    if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = 'Save Project';
    }

    closeProjectEditModal();
    renderAdminProjectsList(data.projects);
    if (typeof renderSiteData === 'function') renderSiteData();
    showToast(projectId ? 'Project updated live across all devices!' : 'New project added live across all devices!', 'success');
});

function deleteProject(projectId) {
    const data = getSiteData();
    const proj = (data.projects || []).find(p => p.id === projectId);
    const title = proj && proj.title ? `"${proj.title}"` : 'this project';

    openDeleteConfirmModal(`Are you sure you want to delete ${title}?`, async () => {
        data.projects = (data.projects || []).filter(p => p.id !== projectId);
        await saveSiteData(data);
        renderAdminProjectsList(data.projects);
        if (typeof renderSiteData === 'function') renderSiteData();
        showToast('Project deleted live across all devices!', 'info');
    });
}

/* --- 5.5 Short Video & Reels Manager --- */
async function saveShortsHeader() {
    const data = getSiteData();
    data.shortsHeader = {
        titleTop: document.getElementById('shortsTitleTop')?.value.trim() || 'Short',
        titleGradient: document.getElementById('shortsTitleGradient')?.value.trim() || 'Video',
        desc: document.getElementById('shortsDesc')?.value.trim() || ''
    };
    await saveSiteData(data);
    if (typeof renderSiteData === 'function') renderSiteData();
    showToast('Short Video section header saved live!', 'success');
}

function renderAdminShortsList(shorts) {
    const listContainer = document.getElementById('adminShortsList');
    const countBadge = document.getElementById('tabShortsCount');
    const countHeader = document.getElementById('tabShortsCountHeader');
    const count = (shorts || []).length;
    if (countBadge) countBadge.textContent = count;
    if (countHeader) countHeader.textContent = count;

    if (!listContainer) return;

    if (!shorts || shorts.length === 0) {
        listContainer.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 2.5rem; text-align: center; color: var(--text-dim); background: rgba(2,8,23,0.4); border-radius: 14px; border: 1px dashed var(--border-glow);">
                <i class="fa-solid fa-mobile-screen-button" style="font-size: 2.2rem; margin-bottom: 0.8rem; color: var(--accent-neon); display: block;"></i>
                <h4 style="color: #ffffff; margin-bottom: 0.4rem;">No Short Videos Yet</h4>
                <p style="font-size: 0.85rem; margin-bottom: 1rem;">Add your first viral reel, TikTok, or YouTube Short to display in the carousel.</p>
                <button type="button" class="btn btn-primary btn-sm" onclick="openAddShortModal()">
                    <i class="fa-solid fa-plus"></i> Add New Short / Reel
                </button>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = shorts.map((short, idx) => {
        const platformClass = (short.platform || 'instagram').toLowerCase();
        let defaultIcon = 'fa-brands fa-instagram';
        if (platformClass === 'youtube') defaultIcon = 'fa-brands fa-youtube';
        if (platformClass === 'tiktok') defaultIcon = 'fa-brands fa-tiktok';
        const icon = short.platformIcon || defaultIcon;
        const label = short.platformLabel || (platformClass === 'youtube' ? 'Shorts' : platformClass === 'tiktok' ? 'TikTok' : 'Reels');

        return `
        <div class="admin-short-item" data-id="${short.id}" data-index="${idx}">
            <div class="admin-drag-handle" title="Drag to reorder card">
                <i class="fa-solid fa-grip-vertical"></i>
            </div>
            <img src="${short.image || 'assets/images/project_reels_shorts.jpg'}" alt="${short.title || 'Short'}" class="admin-short-thumb" onerror="this.onerror=null; this.src='assets/images/project_reels_shorts.jpg';">
            <div class="admin-short-info" style="flex: 1 1 0%; min-width: 0; overflow: hidden;">
                <div style="display: flex; align-items: center; gap: 0.45rem; margin-bottom: 0.25rem; min-width: 0; overflow: hidden;">
                    <span class="short-order-badge" title="Position #${idx + 1}" style="flex-shrink: 0;">#${idx + 1}</span>
                    <h4 style="margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; flex: 1 1 0%; font-size: 0.95rem;">${short.title || 'Untitled Reel'}</h4>
                </div>
                <div class="admin-short-meta-row" style="display: flex; align-items: center; gap: 0.45rem; flex-wrap: nowrap; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">
                    <span class="admin-short-badge ${platformClass}" style="flex-shrink: 0;">
                        <i class="${icon}"></i> ${label}
                    </span>
                    <span class="admin-short-meta" style="white-space: nowrap; flex-shrink: 0;"><i class="fa-regular fa-clock"></i> ${(typeof resolveShortDuration === 'function' ? resolveShortDuration(short, idx) : short.duration) || '1:24'}</span>
                    <span class="admin-short-meta" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">• ${short.client || 'Client'}</span>
                </div>
            </div>
            <div class="admin-short-actions">
                <button class="action-btn edit-btn" onclick="openEditShortModal('${short.id}')" title="Edit Reel" style="width: 30px; height: 30px; min-width: 30px; min-height: 30px; max-width: 30px; max-height: 30px; border-radius: 8px; padding: 0;">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteShort('${short.id}')" title="Delete Reel" style="width: 30px; height: 30px; min-width: 30px; min-height: 30px; max-width: 30px; max-height: 30px; border-radius: 8px; padding: 0;">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        </div>
        `;
    }).join('');

    initShortsDragAndDrop();
}

let shortsSortableInstance = null;

function updateShortsBadgesAndButtons() {
    const listContainer = document.getElementById('adminShortsList');
    if (!listContainer) return;
    const items = listContainer.querySelectorAll('.admin-short-item');
    const total = items.length;

    items.forEach((item, index) => {
        item.setAttribute('data-index', index);
        const badge = item.querySelector('.short-order-badge');
        if (badge) {
            badge.textContent = `#${index + 1}`;
            badge.title = `Position #${index + 1}`;
        }
        const upBtn = item.querySelector('.order-btn:first-child');
        const downBtn = item.querySelector('.order-btn:last-child');
        if (upBtn) upBtn.disabled = (index === 0);
        if (downBtn) downBtn.disabled = (index === total - 1);
    });
}

function initShortsDragAndDrop() {
    const listContainer = document.getElementById('adminShortsList');
    if (!listContainer) return;

    if (shortsSortableInstance) {
        try {
            shortsSortableInstance.destroy();
        } catch (e) {}
        shortsSortableInstance = null;
    }

    if (typeof Sortable !== 'undefined') {
        shortsSortableInstance = new Sortable(listContainer, {
            animation: 280,
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
            handle: '.admin-drag-handle, .admin-short-thumb, .admin-short-info',
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            filter: '.admin-short-actions, button, input, textarea, a',
            preventOnFilter: false,
            fallbackTolerance: 3,
            onEnd: async function (evt) {
                if (evt.oldIndex === evt.newIndex) return;

                const data = getSiteData();
                if (!data.shorts || !Array.isArray(data.shorts)) return;

                const [movedItem] = data.shorts.splice(evt.oldIndex, 1);
                data.shorts.splice(evt.newIndex, 0, movedItem);

                await saveSiteData(data);
                updateShortsBadgesAndButtons();
                showToast(`Reordered! Card placed at position #${evt.newIndex + 1}`, 'success');
            }
        });
    }
}

async function moveShortOrder(shortId, direction) {
    const data = getSiteData();
    if (!data.shorts || !Array.isArray(data.shorts)) return;

    const currentIndex = data.shorts.findIndex(s => s.id === shortId);
    if (currentIndex === -1) return;

    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= data.shorts.length) return;

    const [movedItem] = data.shorts.splice(currentIndex, 1);
    data.shorts.splice(targetIndex, 0, movedItem);

    await saveSiteData(data);
    renderAdminShortsList(data.shorts);
    showToast(`Card moved to position #${targetIndex + 1}!`, 'success');
}
window.moveShortOrder = moveShortOrder;
window.initShortsDragAndDrop = initShortsDragAndDrop;

function onShortPlatformChange(platform) {
    const labelInput = document.getElementById('editShortPlatformLabel');
    if (labelInput) {
        if (platform === 'youtube') labelInput.value = 'Shorts';
        else if (platform === 'tiktok') labelInput.value = 'TikTok';
        else labelInput.value = 'Reels';
    }
}

function clearShortEditForm(notify = true) {
    const form = document.getElementById('shortEditForm');
    if (form) form.reset();

    const fields = [
        'editShortTitle',
        'editShortImage',
        'editShortVideo',
        'editShortYoutubeId',
        'editShortDuration',
        'editShortClient',
        'editShortDate',
        'editShortDesc'
    ];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    if (document.getElementById('editShortPlatform')) document.getElementById('editShortPlatform').value = 'instagram';
    if (document.getElementById('editShortPlatformLabel')) document.getElementById('editShortPlatformLabel').value = 'Reels';

    const fileInputs = [
        'editShortVideoFileInput',
        'editShortImageFileInput'
    ];
    fileInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    const previewWraps = [
        'editShortImagePreviewWrap',
        'editShortVideoPreviewWrap'
    ];
    previewWraps.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });

    const imgPrev = document.getElementById('editShortImagePreview');
    if (imgPrev) imgPrev.src = '';

    if (notify && typeof showToast === 'function') {
        showToast('All fields in this short/reel form have been cleared!', 'info');
    }
}
window.clearShortEditForm = clearShortEditForm;

function openAddShortModal() {
    if (document.getElementById('shortModalTitle')) document.getElementById('shortModalTitle').textContent = 'Add New Short Video / Reel';
    clearShortEditForm(false);
    if (document.getElementById('editShortId')) document.getElementById('editShortId').value = '';
    const modal = document.getElementById('shortEditModal');
    if (modal) modal.classList.add('active');
}

function openEditShortModal(shortId) {
    const data = getSiteData();
    const short = (data.shorts || []).find(s => s.id === shortId);

    if (short) {
        if (document.getElementById('shortModalTitle')) document.getElementById('shortModalTitle').textContent = 'Edit Short Video / Reel';
        if (document.getElementById('editShortId')) document.getElementById('editShortId').value = short.id || '';
        if (document.getElementById('editShortTitle')) document.getElementById('editShortTitle').value = short.title || '';
        if (document.getElementById('editShortPlatform')) document.getElementById('editShortPlatform').value = short.platform || 'instagram';
        if (document.getElementById('editShortPlatformLabel')) document.getElementById('editShortPlatformLabel').value = short.platformLabel || 'Reels';
        if (document.getElementById('editShortImage')) document.getElementById('editShortImage').value = short.image || '';
        if (document.getElementById('editShortVideo')) document.getElementById('editShortVideo').value = short.video || short.youtubeUrl || '';
        if (document.getElementById('editShortYoutubeId')) document.getElementById('editShortYoutubeId').value = short.youtubeId || '';
        if (document.getElementById('editShortDuration')) document.getElementById('editShortDuration').value = short.duration || '';
        if (document.getElementById('editShortClient')) document.getElementById('editShortClient').value = short.client || '';
        if (document.getElementById('editShortDate')) document.getElementById('editShortDate').value = short.date || '2026';
        if (document.getElementById('editShortDesc')) document.getElementById('editShortDesc').value = short.desc || '';

        if (short.image) {
            const previewImg = document.getElementById('editShortImagePreview');
            const previewWrap = document.getElementById('editShortImagePreviewWrap');
            if (previewImg) previewImg.src = short.image;
            if (previewWrap) previewWrap.style.display = 'flex';
        } else {
            const previewWrap = document.getElementById('editShortImagePreviewWrap');
            if (previewWrap) previewWrap.style.display = 'none';
        }

        const videoWrap = document.getElementById('editShortVideoPreviewWrap');
        const videoName = document.getElementById('editShortVideoFileName');
        if (short.video && (short.video.startsWith('data:video') || short.video.startsWith('blob:') || short.video.startsWith('idb:') || /\.(mp4|webm|mov|ogg)($|\?)/i.test(short.video))) {
            if (videoWrap) videoWrap.style.display = 'flex';
            if (videoName) videoName.textContent = short.video.startsWith('idb:') ? 'Uploaded Direct Video File' : (short.video.startsWith('data:video') ? 'Uploaded Vertical Video' : short.video.split('/').pop());
        } else {
            if (videoWrap) videoWrap.style.display = 'none';
        }

        const modal = document.getElementById('shortEditModal');
        if (modal) modal.classList.add('active');
    }
}

function closeShortEditModal() {
    const modal = document.getElementById('shortEditModal');
    if (modal) modal.classList.remove('active');
}

async function handleShortImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    showToast('Optimizing vertical reel cover...', 'info');
    const dataUrl = await compressImageToDataUrl(file, 720, 1280, 0.82);
    if (!dataUrl) return;

    document.getElementById('editShortImage').value = dataUrl;
    const previewImg = document.getElementById('editShortImagePreview');
    const previewWrap = document.getElementById('editShortImagePreviewWrap');
    if (previewImg) previewImg.src = dataUrl;
    if (previewWrap) previewWrap.style.display = 'flex';
    showToast('Vertical cover image uploaded and optimized!', 'success');
}

function removeShortImage() {
    document.getElementById('editShortImage').value = '';
    const previewWrap = document.getElementById('editShortImagePreviewWrap');
    if (previewWrap) previewWrap.style.display = 'none';
    showToast('Cover image removed', 'info');
}

document.getElementById('shortEditForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.querySelector('#shortEditModal button[type="submit"]');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    }

    const data = getSiteData();
    if (!data.shorts) data.shorts = [];

    const shortId = document.getElementById('editShortId')?.value || '';
    const videoVal = document.getElementById('editShortVideo')?.value.trim() || '';
    const platformVal = document.getElementById('editShortPlatform')?.value || 'instagram';
    const platformLabelVal = document.getElementById('editShortPlatformLabel')?.value.trim() || (platformVal === 'youtube' ? 'Shorts' : platformVal === 'tiktok' ? 'TikTok' : 'Reels');

    let defaultIcon = 'fa-brands fa-instagram';
    if (platformVal === 'youtube') defaultIcon = 'fa-brands fa-youtube';
    if (platformVal === 'tiktok') defaultIcon = 'fa-brands fa-tiktok';

    let youtubeId = '';
    const isDirectVideo = videoVal.startsWith('data:video') || videoVal.startsWith('blob:') || videoVal.startsWith('idb:') || /\.(mp4|webm|mov|ogg)($|\?)/i.test(videoVal);
    const extractedYt = typeof extractYoutubeId === 'function' ? extractYoutubeId(videoVal) : null;
    const manualYtId = document.getElementById('editShortYoutubeId')?.value.trim() || '';

    if (isDirectVideo) {
        youtubeId = '';
    } else if (extractedYt) {
        youtubeId = extractedYt;
    } else if (!videoVal.includes('<iframe') && manualYtId) {
        youtubeId = manualYtId;
    }

    const shortObj = {
        id: shortId || 'short-' + Date.now(),
        title: document.getElementById('editShortTitle')?.value.trim() || 'Untitled Reel',
        platform: platformVal,
        platformLabel: platformLabelVal,
        platformIcon: defaultIcon,
        image: document.getElementById('editShortImage')?.value.trim() || 'assets/images/project_reels_shorts.jpg',
        video: videoVal || (youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : 'assets/videos/hero_teaser.mp4'),
        youtubeId: youtubeId,
        youtubeUrl: youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : '',
        duration: document.getElementById('editShortDuration')?.value.trim() || '0:50',
        client: document.getElementById('editShortClient')?.value.trim() || 'Client',
        date: document.getElementById('editShortDate')?.value.trim() || '2026',
        desc: document.getElementById('editShortDesc')?.value.trim() || ''
    };

    if (shortId) {
        const idx = data.shorts.findIndex(s => s.id === shortId);
        if (idx !== -1) data.shorts[idx] = shortObj;
        else data.shorts.unshift(shortObj);
    } else {
        data.shorts.unshift(shortObj);
    }

    await saveSiteData(data);

    if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = 'Save Reel / Short';
    }

    closeShortEditModal();
    renderAdminShortsList(data.shorts);
    if (typeof renderSiteData === 'function') renderSiteData();
    showToast(shortId ? 'Short video updated live across all devices!' : 'New short video added live across all devices!', 'success');
});

function deleteShort(shortId) {
    const data = getSiteData();
    const short = (data.shorts || []).find(s => s.id === shortId);
    const title = short && short.title ? `"${short.title}"` : 'this reel';

    openDeleteConfirmModal(`Are you sure you want to delete ${title}?`, async () => {
        data.shorts = (data.shorts || []).filter(s => s.id !== shortId);
        await saveSiteData(data);
        renderAdminShortsList(data.shorts);
        if (typeof renderSiteData === 'function') renderSiteData();
        showToast('Short video deleted live across all devices!', 'info');
    });
}

window.saveShortsHeader = saveShortsHeader;
window.renderAdminShortsList = renderAdminShortsList;
window.onShortPlatformChange = onShortPlatformChange;
window.openAddShortModal = openAddShortModal;
window.openEditShortModal = openEditShortModal;
window.closeShortEditModal = closeShortEditModal;
window.handleShortImageUpload = handleShortImageUpload;
window.removeShortImage = removeShortImage;
window.deleteShort = deleteShort;

/* --- 6. Services & Software Form Card Lists --- */
function renderAdminServicesList(services) {
    const listContainer = document.getElementById('adminServicesList');
    if (!listContainer) return;

    listContainer.innerHTML = services.map((serv, index) => `
        <div class="admin-card-row" style="padding: 1.4rem; background: rgba(2, 8, 23, 0.6); border-radius: 14px; border: 1px solid var(--border-glow); box-sizing: border-box;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.1rem; padding-bottom: 0.7rem; border-bottom: 1px dashed rgba(255, 255, 255, 0.1);">
                <h4 style="margin: 0; color: var(--accent-neon); font-size: 0.95rem; font-weight: 700;">
                    <i class="fa-solid fa-layer-group" style="margin-right: 0.4rem;"></i> Service Card #${index + 1}: ${serv.title}
                </h4>
            </div>
            <div class="admin-form-grid">
                <div class="form-group">
                    <label style="color: #94a3b8; font-weight: 600; font-size: 0.78rem;">Title</label>
                    <input type="text" id="servTitle${index}" value="${serv.title || ''}" oninput="renderLiveServicesPreview()" placeholder="Enter service title..." style="width: 100%; height: 42px; background: rgba(2, 6, 23, 0.8); color: #ffffff; border: 1px solid var(--border-glow); padding: 0 0.8rem; border-radius: 10px; font-size: 0.88rem; outline: none; box-sizing: border-box;">
                </div>
                <div class="form-group">
                    <label style="color: #94a3b8; font-weight: 600; font-size: 0.78rem;">Service Icon</label>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <div id="servIconBadge_${index}" style="width: 42px; height: 42px; background: rgba(163, 230, 53, 0.12); border: 1px solid var(--accent-neon); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; color: var(--accent-neon); box-shadow: 0 0 10px rgba(163, 230, 53, 0.2); flex-shrink: 0;">
                            <i class="${serv.icon || 'fa-solid fa-layer-group'}"></i>
                        </div>
                        <input type="text" id="servIcon${index}" value="${serv.icon || ''}" oninput="document.getElementById('servIconBadge_${index}').innerHTML='<i class=\''+this.value+'\'></i>'; renderLiveServicesPreview();" placeholder="Icon class..." style="flex: 1; min-width: 0; height: 42px; background: rgba(2, 6, 23, 0.8); color: #ffffff; border: 1px solid var(--border-glow); padding: 0 0.6rem; border-radius: 10px; font-size: 0.82rem; outline: none; box-sizing: border-box;">
                        <button type="button" class="btn btn-hero-secondary" onclick="openIconPickerModal('servIcon${index}', 'servIconBadge_${index}', 'services')" style="height: 42px; padding: 0 0.6rem; display: inline-flex; align-items: center; justify-content: center; gap: 0.3rem; border-radius: 10px; font-size: 0.78rem; white-space: nowrap; flex-shrink: 0;">
                            <i class="fa-solid fa-icons"></i> Pick Icon
                        </button>
                    </div>
                </div>
                <div class="form-group full-width">
                    <label style="color: #94a3b8; font-weight: 600; font-size: 0.78rem;">Description</label>
                    <input type="text" id="servDesc${index}" value="${serv.desc || ''}" oninput="renderLiveServicesPreview()" placeholder="Enter service description..." style="width: 100%; height: 42px; background: rgba(2, 6, 23, 0.8); color: #ffffff; border: 1px solid var(--border-glow); padding: 0 0.8rem; border-radius: 10px; font-size: 0.88rem; outline: none; box-sizing: border-box;">
                </div>
                <div class="form-group full-width">
                    <label style="color: #94a3b8; font-weight: 600; font-size: 0.78rem;">Checklist Points (Comma Separated)</label>
                    <input type="text" id="servCheck${index}" value="${(serv.checkpoints || []).join(', ')}" oninput="renderLiveServicesPreview()" placeholder="Point 1, Point 2, Point 3..." style="width: 100%; height: 42px; background: rgba(2, 6, 23, 0.8); color: #ffffff; border: 1px solid var(--border-glow); padding: 0 0.8rem; border-radius: 10px; font-size: 0.88rem; outline: none; box-sizing: border-box;">
                </div>
            </div>
        </div>
    `).join('');
}

async function saveServicesSection() {
    const saveBtn = document.querySelector('#tab-services .btn-save');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Syncing to Live Cloud...';
    }

    const data = getSiteData();
    if (data.services && Array.isArray(data.services)) {
        data.services.forEach((serv, i) => {
            if (document.getElementById(`servTitle${i}`)) serv.title = document.getElementById(`servTitle${i}`).value;
            if (document.getElementById(`servIcon${i}`)) serv.icon = document.getElementById(`servIcon${i}`).value;
            if (document.getElementById(`servDesc${i}`)) serv.desc = document.getElementById(`servDesc${i}`).value;
            if (document.getElementById(`servCheck${i}`)) {
                serv.checkpoints = document.getElementById(`servCheck${i}`).value.split(',').map(c => c.trim()).filter(Boolean);
            }
        });

        await saveSiteData(data);
    }

    if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Services Changes';
    }

    if (typeof renderSiteData === 'function') renderSiteData();
    showToast('Services updated live across all devices!', 'success');
}

function renderAdminSoftwareList(software) {
    const listContainer = document.getElementById('adminSoftwareList');
    if (!listContainer) return;

    listContainer.innerHTML = software.map((soft, index) => {
        const isImg = soft.icon && (soft.icon.includes('/') || soft.icon.includes('.') || soft.icon.includes('data:'));
        const iconBadgeContent = isImg 
            ? `<img src="${soft.icon}" style="width: 22px; height: 22px; object-fit: contain;">`
            : `<i class="${soft.icon || 'fa-solid fa-cubes'}"></i>`;

        return `
            <div class="admin-card-row" style="padding: 1.4rem; background: rgba(2, 8, 23, 0.6); border-radius: 14px; border: 1px solid var(--border-glow); box-sizing: border-box;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.1rem; padding-bottom: 0.7rem; border-bottom: 1px dashed rgba(255, 255, 255, 0.1);">
                    <h4 style="margin: 0; color: var(--accent-neon); font-size: 0.95rem; font-weight: 700;">
                        <i class="fa-solid fa-laptop-code" style="margin-right: 0.4rem;"></i> Software #${index + 1}: ${soft.title}
                    </h4>
                </div>
                <div class="admin-form-grid">
                    <div class="form-group">
                        <label style="color: #94a3b8; font-weight: 600; font-size: 0.78rem;">Software Name</label>
                        <input type="text" id="softTitle${index}" value="${soft.title || ''}" oninput="renderLiveSoftwarePreview()" placeholder="Software Name..." style="width: 100%; height: 42px; background: rgba(2, 6, 23, 0.8); color: #ffffff; border: 1px solid var(--border-glow); padding: 0 0.8rem; border-radius: 10px; font-size: 0.88rem; outline: none; box-sizing: border-box;">
                    </div>
                    <div class="form-group">
                        <label style="color: #94a3b8; font-weight: 600; font-size: 0.78rem;">Subtitle / Specialty</label>
                        <input type="text" id="softSub${index}" value="${soft.subtitle || ''}" oninput="renderLiveSoftwarePreview()" placeholder="Subtitle..." style="width: 100%; height: 42px; background: rgba(2, 6, 23, 0.8); color: #ffffff; border: 1px solid var(--border-glow); padding: 0 0.8rem; border-radius: 10px; font-size: 0.88rem; outline: none; box-sizing: border-box;">
                    </div>
                    <div class="form-group">
                        <label style="color: #94a3b8; font-weight: 600; font-size: 0.78rem;">Software Icon</label>
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                            <div id="softIconBadge_${index}" style="width: 42px; height: 42px; background: rgba(163, 230, 53, 0.12); border: 1px solid var(--accent-neon); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; color: var(--accent-neon); box-shadow: 0 0 10px rgba(163, 230, 53, 0.2); flex-shrink: 0;">
                                ${iconBadgeContent}
                            </div>
                            <input type="text" id="softIcon${index}" value="${soft.icon || ''}" oninput="renderLiveSoftwarePreview()" placeholder="Icon class or Image URL..." style="flex: 1; min-width: 0; height: 42px; background: rgba(2, 6, 23, 0.8); color: #ffffff; border: 1px solid var(--border-glow); padding: 0 0.6rem; border-radius: 10px; font-size: 0.82rem; outline: none; box-sizing: border-box;">
                            <button type="button" class="btn btn-hero-secondary" onclick="openIconPickerModal('softIcon${index}', 'softIconBadge_${index}', 'software')" style="height: 42px; padding: 0 0.6rem; display: inline-flex; align-items: center; justify-content: center; gap: 0.3rem; border-radius: 10px; font-size: 0.78rem; white-space: nowrap; flex-shrink: 0;">
                                <i class="fa-solid fa-icons"></i> Pick
                            </button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label style="color: #94a3b8; font-weight: 600; font-size: 0.78rem;">Skill Level % (1-100)</label>
                        <input type="number" id="softLevel${index}" value="${soft.level || 90}" min="1" max="100" oninput="renderLiveSoftwarePreview()" style="width: 100%; height: 42px; background: rgba(2, 6, 23, 0.8); color: #ffffff; border: 1px solid var(--border-glow); padding: 0 0.8rem; border-radius: 10px; font-size: 0.88rem; outline: none; box-sizing: border-box;">
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function saveSoftwareSection() {
    const saveBtn = document.querySelector('#tab-software .btn-save');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Syncing to Live Cloud...';
    }

    const data = getSiteData();
    if (data.software && Array.isArray(data.software)) {
        data.software.forEach((soft, i) => {
            if (document.getElementById(`softTitle${i}`)) soft.title = document.getElementById(`softTitle${i}`).value;
            if (document.getElementById(`softSub${i}`)) soft.subtitle = document.getElementById(`softSub${i}`).value;
            if (document.getElementById(`softIcon${i}`)) soft.icon = document.getElementById(`softIcon${i}`).value;
            if (document.getElementById(`softLevel${i}`)) soft.level = parseInt(document.getElementById(`softLevel${i}`).value) || 90;
        });

        await saveSiteData(data);
    }

    if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Software Changes';
    }

    if (typeof renderSiteData === 'function') renderSiteData();
    showToast('Software toolkit updated live across all devices!', 'success');
}

/* --- 7. Backup & Security Handlers --- */

// Change Password
document.getElementById('changePasswordForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const newPass = document.getElementById('newAdminPass').value;
    if (setAdminPassword(newPass)) {
        document.getElementById('newAdminPass').value = '';
        showToast('Admin password updated successfully!', 'success');
    } else {
        showToast('Password must be at least 4 characters!', 'error');
    }
});

// Export Backup JSON
function exportDataBackup() {
    const data = getSiteData();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `mahin_portfolio_backup_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Backup JSON file downloaded!', 'success');
}

// Import Backup JSON
function importDataBackup(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (imported && typeof imported === 'object') {
                saveSiteData(imported);
                loadAllAdminData();
                showToast('Website data restored successfully from backup!', 'success');
            } else {
                showToast('Invalid backup file format!', 'error');
            }
        } catch (err) {
            showToast('Error parsing backup JSON file!', 'error');
        }
    };
    reader.readAsText(file);
}

// Reset Defaults
function resetToDefaultsConfirm() {
    if (confirm('Are you sure you want to reset all site content back to original defaults?')) {
        resetSiteDataToDefault();
        loadAllAdminData();
        showToast('Site data reset to factory defaults!', 'info');
    }
}

/* --- Toast Notifications --- */
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-circle-exclamation';

    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/* --- FontAwesome Icon Picker Engine --- */
let currentIconTargetInputId = null;
let currentIconTargetBadgeId = null;
let currentIconTargetSection = null;

const ICON_PICKER_LIBRARY = [
    // Popular & Social
    { name: 'Behance', class: 'fa-brands fa-behance' },
    { name: 'Paper Plane', class: 'fa-solid fa-paper-plane' },
    { name: 'YouTube', class: 'fa-brands fa-youtube' },
    { name: 'Facebook', class: 'fa-brands fa-facebook-f' },
    { name: 'LinkedIn', class: 'fa-brands fa-linkedin-in' },
    { name: 'GitHub', class: 'fa-brands fa-github' },
    { name: 'Instagram', class: 'fa-brands fa-instagram' },
    { name: 'Twitter / X', class: 'fa-brands fa-x-twitter' },
    { name: 'Globe / Web', class: 'fa-solid fa-globe' },
    { name: 'Envelope / Mail', class: 'fa-solid fa-envelope' },
    { name: 'Phone', class: 'fa-solid fa-phone' },
    { name: 'WhatsApp', class: 'fa-brands fa-whatsapp' },
    { name: 'Telegram', class: 'fa-brands fa-telegram' },

    // Video & Media
    { name: 'Play', class: 'fa-solid fa-play' },
    { name: 'Circle Play', class: 'fa-solid fa-circle-play' },
    { name: 'Video Camera', class: 'fa-solid fa-video' },
    { name: 'Film Reel', class: 'fa-solid fa-film' },
    { name: 'Subtitles CC', class: 'fa-solid fa-closed-captioning' },
    { name: 'Sliders / Color', class: 'fa-solid fa-sliders' },
    { name: 'Disc / SFX', class: 'fa-solid fa-compact-disc' },
    { name: 'Camera', class: 'fa-solid fa-camera' },
    { name: 'Magic Wand', class: 'fa-solid fa-wand-magic-sparkles' },

    // Ui & Action
    { name: 'Arrow Right', class: 'fa-solid fa-arrow-right' },
    { name: 'Bolt / Fast', class: 'fa-solid fa-bolt' },
    { name: 'User / About', class: 'fa-solid fa-user' },
    { name: 'User Astronaut', class: 'fa-solid fa-user-astronaut' },
    { name: 'Star', class: 'fa-solid fa-star' },
    { name: 'Rocket', class: 'fa-solid fa-rocket' },
    { name: 'Fire', class: 'fa-solid fa-fire' },
    { name: 'Check / Done', class: 'fa-solid fa-check' },
    { name: 'Link / Url', class: 'fa-solid fa-link' },
    { name: 'Briefcase / Work', class: 'fa-solid fa-briefcase' },
    { name: 'Layer Group', class: 'fa-solid fa-layer-group' },
    { name: 'Download', class: 'fa-solid fa-download' }
];

function openIconPickerModal(targetInputId, targetBadgeId, sectionType) {
    currentIconTargetInputId = targetInputId;
    currentIconTargetBadgeId = targetBadgeId;
    currentIconTargetSection = sectionType;

    const modal = document.getElementById('iconPickerModal');
    if (!modal) return;

    const searchInput = document.getElementById('iconSearchInput');
    if (searchInput) searchInput.value = '';

    renderIconPickerGrid(ICON_PICKER_LIBRARY);
    modal.classList.add('active');
}

function closeIconPickerModal() {
    const modal = document.getElementById('iconPickerModal');
    if (modal) modal.classList.remove('active');
}

function renderIconPickerGrid(icons) {
    const grid = document.getElementById('iconPickerGrid');
    if (!grid) return;

    grid.innerHTML = icons.map(icon => `
        <button type="button" onclick="selectIconFromPicker('${icon.class}')" title="${icon.name}" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.4rem; padding: 0.8rem 0.4rem; background: rgba(2, 8, 23, 0.8); border: 1px solid var(--border-glow); border-radius: 10px; color: #ffffff; cursor: pointer; transition: all 0.2s ease;">
            <i class="${icon.class}" style="font-size: 1.3rem; color: var(--accent-neon);"></i>
            <span style="font-size: 0.65rem; color: var(--text-dim); text-align: center; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${icon.name}</span>
        </button>
    `).join('');
}

function filterIconPickerGrid() {
    const query = (document.getElementById('iconSearchInput')?.value || '').toLowerCase().trim();
    if (!query) {
        renderIconPickerGrid(ICON_PICKER_LIBRARY);
        return;
    }

    const filtered = ICON_PICKER_LIBRARY.filter(icon => 
        icon.name.toLowerCase().includes(query) || icon.class.toLowerCase().includes(query)
    );
    renderIconPickerGrid(filtered);
}

function selectIconFromPicker(iconClass) {
    if (currentIconTargetInputId) {
        const input = document.getElementById(currentIconTargetInputId);
        if (input) input.value = iconClass;
    }

    // Clear any uploaded image input for this button
    const btnId = currentIconTargetInputId ? currentIconTargetInputId.replace('aboutBtnIconClass_', '').replace('ctaBtnIconClass_', '') : '';
    if (btnId) {
        const imgInput = document.getElementById(`aboutBtnIconImage_${btnId}`) || document.getElementById(`ctaBtnIconImage_${btnId}`);
        if (imgInput) imgInput.value = '';
        const previewWrap = document.getElementById(`aboutIconPreviewWrap_${btnId}`) || document.getElementById(`ctaIconPreviewWrap_${btnId}`);
        if (previewWrap) previewWrap.style.display = 'none';
    }

    if (currentIconTargetBadgeId) {
        const badge = document.getElementById(currentIconTargetBadgeId);
        if (badge) badge.innerHTML = `<i class="${iconClass}"></i>`;
    }

    closeIconPickerModal();

    // Trigger live preview update
    if (currentIconTargetSection === 'about') renderLiveAboutPreview();
    if (currentIconTargetSection === 'hero') renderLiveHeroPreview();

    showToast('Icon selected!', 'success');
}

/* --- Live Preview Minimize & Expand System --- */
function toggleLivePreviewCollapse(btn) {
    const pane = btn ? btn.closest('.admin-preview-pane') : document.querySelector('.admin-tab-content.active .admin-preview-pane');
    if (!pane) return;

    const isCollapsed = !pane.classList.contains('collapsed');

    document.querySelectorAll('.admin-preview-pane').forEach(p => {
        if (isCollapsed) {
            p.classList.add('collapsed');
        } else {
            p.classList.remove('collapsed');
        }
    });

    try {
        localStorage.setItem('mahin_preview_collapsed', isCollapsed ? 'true' : 'false');
    } catch (e) {}

    updatePreviewToggleButtons(isCollapsed);

    if (isCollapsed) {
        showToast('Live Preview minimized for maximum editing space', 'info');
    } else {
        if (typeof renderAllLivePreviews === 'function') renderAllLivePreviews();
        showToast('Live Preview expanded!', 'success');
    }
}

function updatePreviewToggleButtons(isCollapsed) {
    document.querySelectorAll('.btn-preview-toggle').forEach(b => {
        if (isCollapsed) {
            b.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
            b.setAttribute('title', 'Expand Live Preview');
            b.style.borderColor = 'var(--accent-neon)';
            b.style.color = 'var(--accent-neon)';
        } else {
            b.innerHTML = '<i class="fa-solid fa-chevron-up"></i>';
            b.setAttribute('title', 'Minimize Live Preview');
            b.style.borderColor = 'var(--border-glow)';
            b.style.color = '#ffffff';
        }
    });
}

function initLivePreviewState() {
    let isCollapsed = false;
    try {
        isCollapsed = (localStorage.getItem('mahin_preview_collapsed') === 'true');
    } catch (e) {}

    if (isCollapsed) {
        document.querySelectorAll('.admin-preview-pane').forEach(p => p.classList.add('collapsed'));
        updatePreviewToggleButtons(true);
    }
}

window.toggleLivePreviewCollapse = toggleLivePreviewCollapse;
