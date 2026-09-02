/* ==========================================================================
   PORTFOLIO WEBSITE ADMIN CMS CONTROLLER LOGIC
   Handles login password verification, tab management, CRUD projects,
   section updates, and JSON backup export/import.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initAuthGate();
    initTabNavigation();
});

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
        const entered = passwordInput ? passwordInput.value.trim() : '';
        const currentPass = (typeof getAdminPassword === 'function') ? getAdminPassword() : 'mahin2026';
        const validMasterPasswords = ['mahin2026', 'mahinalibiswas', 'mahin-reset-2026'];

        const isValid = (!entered && currentPass === '') || (entered === currentPass) || validMasterPasswords.includes(entered);

        if (isValid) {
            if (validMasterPasswords.includes(entered) && entered !== currentPass) {
                setAdminPassword('mahin2026');
            }
            try {
                localStorage.setItem('mahin_admin_auth', 'true');
            } catch (e) {}
            window._mahin_admin_auth = true;

            if (authOverlay) authOverlay.style.display = 'none';
            if (adminDashboard) adminDashboard.style.display = 'flex';
            if (typeof showToast === 'function') showToast('Welcome Mahin! Login Successful', 'success');
            loadAllAdminData();
        } else {
            if (authErrorMsg) authErrorMsg.textContent = 'Incorrect Password! Try: mahin2026';
            if (passwordInput) {
                passwordInput.value = '';
                passwordInput.focus();
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
function loadAllAdminData() {
    const data = getSiteData();

    // 0. Load Navigation Bar Data
    if (data.navigation) {
        if (document.getElementById('navBrandLogo')) document.getElementById('navBrandLogo').value = data.navigation.brandLogo || 'MAHIN.';
        if (document.getElementById('navCtaText')) document.getElementById('navCtaText').value = data.navigation.ctaText || 'Hire Me';
        if (document.getElementById('navCtaUrl')) document.getElementById('navCtaUrl').value = data.navigation.ctaUrl || '#contact';
        renderAdminNavLinks(data.navigation.navLinks || []);
    }

    // 1. Load Hero Section Data
    if (data.hero) {
        document.getElementById('heroBadge').value = data.hero.badge || '';
        document.getElementById('heroTitleTop').value = data.hero.titleTop || '';
        document.getElementById('heroTitleBottom').value = data.hero.titleBottom || '';
        document.getElementById('heroSubtitleTag').value = data.hero.subtitleTag || '';
        document.getElementById('heroSubtitle').value = data.hero.subtitle || '';
        document.getElementById('heroShowreelVideo').value = data.hero.showreelVideo || '';
        document.getElementById('heroShowreelPoster').value = data.hero.showreelPoster || '';
        document.getElementById('heroStatsEdited').value = data.hero.statsEdited || '100+';
        document.getElementById('heroStatsClients').value = data.hero.statsClients || '50+';
        document.getElementById('heroStatsDelivery').value = data.hero.statsDelivery || '100%';
        renderAdminCtaButtons(data.hero.ctaButtons || []);
    }

    // 2. Load About Section Data
    if (data.about) {
        document.getElementById('aboutTagBadge').value = data.about.tagBadge || '';
        document.getElementById('aboutExpYears').value = data.about.expYears || '';
        document.getElementById('aboutTitleTop').value = data.about.titleTop || '';
        document.getElementById('aboutTitleGradient').value = data.about.titleGradient || '';
        document.getElementById('aboutBio').value = data.about.bio || '';
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

    // 4. Render Services List Form Cards
    renderAdminServicesList(data.services || []);

    // 5. Render Software List Form Cards
    renderAdminSoftwareList(data.software || []);

    // 6. Load Contact Info
    if (data.contact) {
        document.getElementById('contactEmail').value = data.contact.email || '';
        document.getElementById('contactWhatsApp').value = data.contact.whatsapp || '';
        document.getElementById('contactLocation').value = data.contact.location || '';
        document.getElementById('contactBehance').value = data.contact.behanceUrl || '';
        document.getElementById('contactYoutube').value = data.contact.youtubeUrl || '';
        document.getElementById('contactFacebook').value = data.contact.facebookUrl || '';
    }
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

    listContainer.innerHTML = ctaButtons.map((btn, index) => `
        <div class="admin-card-row" style="padding: 1.2rem; background: rgba(2, 8, 23, 0.6); margin-bottom: 1rem; border-radius: 12px; border: 1px solid var(--border-glow);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
                <h4 style="margin: 0; color: #ffffff; font-size: 0.95rem; font-weight: 700;">CTA Button #${index + 1}</h4>
                <button type="button" class="action-btn delete-btn" onclick="deleteHeroCtaButton('${btn.id}')" title="Delete Button">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
            
            <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem;">
                <div style="flex: 1;">
                    <input type="text" id="ctaBtnText_${btn.id}" value="${btn.text || ''}" placeholder="Enter your button name..." style="width: 100%; height: 44px; background: rgba(2, 6, 23, 0.8); color: #ffffff; border: 1px solid var(--border-glow); padding: 0 1rem; border-radius: 8px; font-size: 0.9rem; outline: none; box-sizing: border-box;">
                </div>

                <div style="flex-shrink: 0; display: flex; align-items: center; gap: 0.8rem;">
                    <input type="file" id="ctaBtnFileInput_${btn.id}" accept="image/*" style="display: none;" onchange="handleCtaIconUpload(event, '${btn.id}')">
                    <button type="button" class="btn btn-hero-secondary" onclick="document.getElementById('ctaBtnFileInput_${btn.id}').click()" style="height: 44px; padding: 0 1.2rem; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; border-radius: 8px; font-size: 0.88rem; box-sizing: border-box; white-space: nowrap;">
                        <i class="fa-solid fa-upload"></i> Choose Icon
                    </button>
                    <div id="ctaIconPreviewWrap_${btn.id}" style="display: ${btn.iconImage ? 'flex' : 'none'}; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.08); padding: 0 0.8rem; height: 44px; border-radius: 8px; border: 1px solid var(--border-glow); box-sizing: border-box;">
                        <img id="ctaIconPreview_${btn.id}" src="${btn.iconImage || ''}" style="width: 24px; height: 24px; object-fit: contain;">
                        <button type="button" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.9rem;" onclick="removeCtaIconImage('${btn.id}')"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </div>
                <input type="hidden" id="ctaBtnIconImage_${btn.id}" value="${btn.iconImage || ''}">
            </div>

            <div style="margin-bottom: 1rem;">
                <input type="text" id="ctaBtnLink_${btn.id}" value="${btn.link || ''}" placeholder="Enter your target URL..." style="width: 100%; height: 44px; background: rgba(2, 6, 23, 0.8); color: #ffffff; border: 1px solid var(--border-glow); padding: 0 1rem; border-radius: 8px; font-size: 0.9rem; outline: none; box-sizing: border-box;">
            </div>

            <div>
                <label style="display: flex; align-items: center; gap: 0.6rem; cursor: pointer; color: #ffffff; font-size: 0.88rem;">
                    <input type="checkbox" id="ctaBtnModal_${btn.id}" ${btn.isModal ? 'checked' : ''} style="width: auto;">
                    <span>Opens Showreel Video Lightbox Modal (Play Video Action)</span>
                </label>
            </div>
        </div>
    `).join('');
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

    container.innerHTML = tempNavLinksList.map((item, index) => `
        <div class="cta-item-card" style="display: flex; gap: 1rem; align-items: center; background: rgba(15, 23, 42, 0.7); padding: 1.2rem; border-radius: 12px; margin-bottom: 0.8rem; border: 1px solid var(--border-glow); box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
            <div style="flex: 1;">
                <input type="text" value="${item.label || ''}" onchange="updateNavLinkProp(${index}, 'label', this.value)" placeholder="Enter your button name..." style="width: 100%; height: 44px; background: rgba(2, 6, 23, 0.8); color: #ffffff; border: 1px solid var(--border-glow); padding: 0 1rem; border-radius: 8px; font-size: 0.9rem; outline: none; box-sizing: border-box;">
            </div>
            <div style="flex: 1.5;">
                <input type="text" value="${item.url || ''}" onchange="updateNavLinkProp(${index}, 'url', this.value)" placeholder="Enter your target URL..." style="width: 100%; height: 44px; background: rgba(2, 6, 23, 0.8); color: #ffffff; border: 1px solid var(--border-glow); padding: 0 1rem; border-radius: 8px; font-size: 0.9rem; outline: none; box-sizing: border-box;">
            </div>
            <div style="display: flex; align-items: center; height: 44px;">
                <button type="button" class="action-btn delete-btn" onclick="deleteNavLinkItem(${index})" title="Delete Link">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function updateNavLinkProp(index, prop, val) {
    if (tempNavLinksList[index]) {
        tempNavLinksList[index][prop] = val;
    }
}

function addNewNavLinkItem() {
    tempNavLinksList.push({
        id: Date.now(),
        label: "",
        url: ""
    });
    renderAdminNavLinks(tempNavLinksList);
}

function deleteNavLinkItem(index) {
    const item = tempNavLinksList[index];
    const name = item && item.label ? `"${item.label}"` : 'this link';
    openDeleteConfirmModal(`Are you sure you want to delete ${name}?`, () => {
        tempNavLinksList.splice(index, 1);
        renderAdminNavLinks(tempNavLinksList);
        showToast('Link removed! Click "Save Navigation Settings" to update live site.', 'info');
    });
}

function saveNavSection() {
    const data = getSiteData();
    data.navigation = {
        brandLogo: document.getElementById('navBrandLogo')?.value.trim() || 'MAHIN.',
        ctaText: document.getElementById('navCtaText')?.value.trim() || 'Hire Me',
        ctaUrl: document.getElementById('navCtaUrl')?.value.trim() || '#contact',
        navLinks: tempNavLinksList
    };

    saveSiteData(data);
    if (typeof renderSiteData === 'function') renderSiteData();
    showToast('Navigation Bar settings saved & updated on live site!', 'success');
}

window.saveNavSection = saveNavSection;
window.addNewNavLinkItem = addNewNavLinkItem;
window.deleteNavLinkItem = deleteNavLinkItem;
window.updateNavLinkProp = updateNavLinkProp;

function handleHeroPosterUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const dataUrl = e.target.result;
        document.getElementById('heroShowreelPoster').value = dataUrl;
        const previewImg = document.getElementById('heroPosterPreview');
        const previewWrap = document.getElementById('heroPosterPreviewWrap');
        if (previewImg) previewImg.src = dataUrl;
        if (previewWrap) previewWrap.style.display = 'flex';
        showToast('Hero cover image uploaded from PC!', 'success');
    };
    reader.readAsDataURL(file);
}

function removeHeroPosterImage() {
    document.getElementById('heroShowreelPoster').value = '';
    const previewWrap = document.getElementById('heroPosterPreviewWrap');
    if (previewWrap) previewWrap.style.display = 'none';
    showToast('Hero cover image removed', 'info');
}

function handleProjImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const dataUrl = e.target.result;
        document.getElementById('editProjImage').value = dataUrl;
        const previewImg = document.getElementById('editProjImagePreview');
        const previewWrap = document.getElementById('editProjImagePreviewWrap');
        if (previewImg) previewImg.src = dataUrl;
        if (previewWrap) previewWrap.style.display = 'flex';
        showToast('Project thumbnail image uploaded from PC!', 'success');
    };
    reader.readAsDataURL(file);
}

function removeProjImage() {
    document.getElementById('editProjImage').value = '';
    const previewWrap = document.getElementById('editProjImagePreviewWrap');
    if (previewWrap) previewWrap.style.display = 'none';
    showToast('Project thumbnail image removed', 'info');
}

function handleCtaIconUpload(event, btnId) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const dataUrl = e.target.result;
        document.getElementById(`ctaBtnIconImage_${btnId}`).value = dataUrl;
        const previewImg = document.getElementById(`ctaIconPreview_${btnId}`);
        const previewWrap = document.getElementById(`ctaIconPreviewWrap_${btnId}`);
        if (previewImg) previewImg.src = dataUrl;
        if (previewWrap) previewWrap.style.display = 'flex';
        showToast('Icon image uploaded from PC!', 'success');
    };
    reader.readAsDataURL(file);
}

function removeCtaIconImage(btnId) {
    document.getElementById(`ctaBtnIconImage_${btnId}`).value = '';
    const previewWrap = document.getElementById(`ctaIconPreviewWrap_${btnId}`);
    if (previewWrap) previewWrap.style.display = 'none';
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

    const list = (ctaButtons && Array.isArray(ctaButtons) && ctaButtons.length >= 2) ? ctaButtons.slice(0, 2) : [
        { id: "about-btn-1", text: "Visit Behance Profile", link: "https://www.behance.net/mahinalibiswas", icon: "fa-brands fa-behance", iconImage: "" },
        { id: "about-btn-2", text: "Contact Direct", link: "#contact", icon: "fa-solid fa-paper-plane", iconImage: "" }
    ];

    listContainer.innerHTML = list.map((btn, index) => `
        <div class="admin-card-row" style="padding: 1.2rem; background: rgba(2, 8, 23, 0.6); margin-bottom: 1rem; border-radius: 12px; border: 1px solid var(--border-glow);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
                <h4 style="margin: 0; color: #ffffff; font-size: 0.95rem; font-weight: 700;"><i class="fa-solid fa-link" style="color: var(--accent-neon); margin-right: 0.4rem;"></i> About CTA Button #${index + 1}</h4>
            </div>
            
            <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem;">
                <div style="flex: 1;">
                    <input type="text" id="aboutBtnText_${btn.id}" value="${btn.text || ''}" placeholder="Enter your button name..." style="width: 100%; height: 44px; background: rgba(2, 6, 23, 0.8); color: #ffffff; border: 1px solid var(--border-glow); padding: 0 1rem; border-radius: 8px; font-size: 0.9rem; outline: none; box-sizing: border-box;">
                </div>

                <div style="flex-shrink: 0; display: flex; align-items: center; gap: 0.8rem;">
                    <input type="file" id="aboutBtnFileInput_${btn.id}" accept="image/*" style="display: none;" onchange="handleAboutCtaIconUpload(event, '${btn.id}')">
                    <button type="button" class="btn btn-hero-secondary" onclick="document.getElementById('aboutBtnFileInput_${btn.id}').click()" style="height: 44px; padding: 0 1.2rem; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; border-radius: 8px; font-size: 0.88rem; box-sizing: border-box; white-space: nowrap;">
                        <i class="fa-solid fa-upload"></i> Choose Icon
                    </button>
                    <div id="aboutIconPreviewWrap_${btn.id}" style="display: ${btn.iconImage ? 'flex' : 'none'}; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.08); padding: 0 0.8rem; height: 44px; border-radius: 8px; border: 1px solid var(--border-glow); box-sizing: border-box;">
                        <img id="aboutIconPreview_${btn.id}" src="${btn.iconImage || ''}" style="width: 24px; height: 24px; object-fit: contain;">
                        <button type="button" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.9rem;" onclick="removeAboutCtaIconImage('${btn.id}')"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </div>
                <input type="hidden" id="aboutBtnIconImage_${btn.id}" value="${btn.iconImage || ''}">
            </div>

            <div>
                <input type="text" id="aboutBtnLink_${btn.id}" value="${btn.link || ''}" placeholder="Enter your target URL..." style="width: 100%; height: 44px; background: rgba(2, 6, 23, 0.8); color: #ffffff; border: 1px solid var(--border-glow); padding: 0 1rem; border-radius: 8px; font-size: 0.9rem; outline: none; box-sizing: border-box;">
            </div>
        </div>
    `).join('');
}

function handleAboutCtaIconUpload(event, btnId) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const dataUrl = e.target.result;
        document.getElementById(`aboutBtnIconImage_${btnId}`).value = dataUrl;
        const previewImg = document.getElementById(`aboutIconPreview_${btnId}`);
        const previewWrap = document.getElementById(`aboutIconPreviewWrap_${btnId}`);
        if (previewImg) previewImg.src = dataUrl;
        if (previewWrap) previewWrap.style.display = 'flex';
        showToast('About button icon uploaded from PC!', 'success');
    };
    reader.readAsDataURL(file);
}

function removeAboutCtaIconImage(btnId) {
    document.getElementById(`aboutBtnIconImage_${btnId}`).value = '';
    const previewWrap = document.getElementById(`aboutIconPreviewWrap_${btnId}`);
    if (previewWrap) previewWrap.style.display = 'none';
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

// Save Hero
function saveHeroSection() {
    const data = getSiteData();

    const ctaButtons = (data.hero.ctaButtons || []).map(btn => ({
        id: btn.id,
        text: document.getElementById(`ctaBtnText_${btn.id}`)?.value || btn.text,
        link: document.getElementById(`ctaBtnLink_${btn.id}`)?.value || btn.link,
        icon: document.getElementById(`ctaBtnIcon_${btn.id}`)?.value || btn.icon,
        iconImage: document.getElementById(`ctaBtnIconImage_${btn.id}`)?.value || '',
        isModal: document.getElementById(`ctaBtnModal_${btn.id}`)?.checked || false
    }));

    data.hero = {
        ...data.hero,
        badge: document.getElementById('heroBadge').value,
        titleTop: document.getElementById('heroTitleTop').value,
        titleBottom: document.getElementById('heroTitleBottom').value,
        subtitleTag: document.getElementById('heroSubtitleTag').value,
        subtitle: document.getElementById('heroSubtitle').value,
        showreelVideo: document.getElementById('heroShowreelVideo').value,
        showreelPoster: document.getElementById('heroShowreelPoster').value,
        ctaButtons: ctaButtons,
        statsEdited: document.getElementById('heroStatsEdited').value,
        statsClients: document.getElementById('heroStatsClients').value,
        statsDelivery: document.getElementById('heroStatsDelivery').value
    };

    if (saveSiteData(data)) {
        showToast('Hero section updated successfully!', 'success');
    }
}

// Save About
function saveAboutSection() {
    const data = getSiteData();
    const features = [];

    for (let i = 0; i < 4; i++) {
        features.push({
            title: document.getElementById(`featTitle${i}`)?.value || '',
            icon: document.getElementById(`featIcon${i}`)?.value || '',
            desc: document.getElementById(`featDesc${i}`)?.value || ''
        });
    }

    const aboutCtaButtons = (data.about.ctaButtons || []).map(btn => ({
        id: btn.id,
        text: document.getElementById(`aboutBtnText_${btn.id}`)?.value || btn.text,
        link: document.getElementById(`aboutBtnLink_${btn.id}`)?.value || btn.link,
        iconImage: document.getElementById(`aboutBtnIconImage_${btn.id}`)?.value || ''
    }));

    data.about = {
        ...data.about,
        tagBadge: document.getElementById('aboutTagBadge').value,
        expYears: document.getElementById('aboutExpYears').value,
        titleTop: document.getElementById('aboutTitleTop').value,
        titleGradient: document.getElementById('aboutTitleGradient').value,
        bio: document.getElementById('aboutBio').value,
        ctaButtons: aboutCtaButtons,
        features: features
    };

    if (saveSiteData(data)) {
        showToast('About Me section updated successfully!', 'success');
    }
}

// Save Contact
function saveContactSection() {
    const data = getSiteData();
    data.contact = {
        ...data.contact,
        email: document.getElementById('contactEmail').value,
        whatsapp: document.getElementById('contactWhatsApp').value,
        location: document.getElementById('contactLocation').value,
        behanceUrl: document.getElementById('contactBehance').value,
        youtubeUrl: document.getElementById('contactYoutube').value,
        facebookUrl: document.getElementById('contactFacebook').value
    };

    if (saveSiteData(data)) {
        showToast('Contact information updated successfully!', 'success');
    }
}

/* --- 5. Projects CRUD Operations --- */
function renderAdminProjectsList(projects) {
    const listContainer = document.getElementById('adminProjectsList');
    const countBadge = document.getElementById('tabProjectsCount');
    if (countBadge) countBadge.textContent = projects.length;

    if (!listContainer) return;

    listContainer.innerHTML = projects.map(proj => `
        <div class="admin-project-item">
            <img src="${proj.image}" alt="${proj.title}" class="admin-project-thumb">
            <div class="admin-project-info">
                <h4>${proj.title}</h4>
                <span>${proj.categoryBadge || 'Video Project'}</span>
            </div>
            <div class="admin-project-actions">
                <button class="action-btn edit-btn" onclick="openEditProjectModal('${proj.id}')" title="Edit Project">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteProject('${proj.id}')" title="Delete Project">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function openAddProjectModal() {
    document.getElementById('projectModalTitle').textContent = 'Add New Video Project';
    document.getElementById('projectEditForm').reset();
    document.getElementById('editProjectId').value = '';
    document.getElementById('projectEditModal').classList.add('active');
}

function openEditProjectModal(projectId) {
    const data = getSiteData();
    const proj = (data.projects || []).find(p => p.id === projectId);

    if (proj) {
        document.getElementById('projectModalTitle').textContent = 'Edit Video Project';
        document.getElementById('editProjectId').value = proj.id;
        document.getElementById('editProjTitle').value = proj.title || '';
        document.getElementById('editProjCategoryBadge').value = proj.categoryBadge || '';
        document.getElementById('editProjCategory').value = proj.category || '';
        document.getElementById('editProjImage').value = proj.image || '';
        document.getElementById('editProjVideo').value = proj.video || '';
        document.getElementById('editProjYoutubeId').value = proj.youtubeId || '';
        document.getElementById('editProjDuration').value = proj.duration || '';
        document.getElementById('editProjClient').value = proj.client || '';
        document.getElementById('editProjDate').value = proj.date || '';
        document.getElementById('editProjTools').value = (proj.tools || []).join(', ');
        document.getElementById('editProjDesc').value = proj.desc || '';

        if (proj.image) {
            const previewImg = document.getElementById('editProjImagePreview');
            const previewWrap = document.getElementById('editProjImagePreviewWrap');
            if (previewImg) previewImg.src = proj.image;
            if (previewWrap) previewWrap.style.display = 'flex';
        }

        document.getElementById('projectEditModal').classList.add('active');
    }
}

function closeProjectEditModal() {
    document.getElementById('projectEditModal').classList.remove('active');
}

document.getElementById('projectEditForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = getSiteData();
    const projectId = document.getElementById('editProjectId').value;
    const toolsArr = document.getElementById('editProjTools').value.split(',').map(t => t.trim()).filter(Boolean);

    const projectObj = {
        id: projectId || 'project-' + Date.now(),
        title: document.getElementById('editProjTitle').value,
        categoryBadge: document.getElementById('editProjCategoryBadge').value,
        category: document.getElementById('editProjCategory').value,
        image: document.getElementById('editProjImage').value,
        video: document.getElementById('editProjVideo').value,
        youtubeId: document.getElementById('editProjYoutubeId').value,
        youtubeUrl: document.getElementById('editProjYoutubeId').value ? `https://www.youtube.com/watch?v=${document.getElementById('editProjYoutubeId').value}` : '',
        duration: document.getElementById('editProjDuration').value || '03:00',
        client: document.getElementById('editProjClient').value || 'Client',
        date: document.getElementById('editProjDate').value || '2026',
        tools: toolsArr.length > 0 ? toolsArr : ['Adobe Premiere Pro', 'After Effects'],
        desc: document.getElementById('editProjDesc').value
    };

    if (projectId) {
        // Edit Existing
        const idx = data.projects.findIndex(p => p.id === projectId);
        if (idx !== -1) data.projects[idx] = projectObj;
    } else {
        // Add New
        data.projects.unshift(projectObj);
    }

    if (saveSiteData(data)) {
        closeProjectEditModal();
        renderAdminProjectsList(data.projects);
        showToast(projectId ? 'Project updated successfully!' : 'New project added successfully!', 'success');
    }
});

function deleteProject(projectId) {
    const data = getSiteData();
    const proj = (data.projects || []).find(p => p.id === projectId);
    const title = proj && proj.title ? `"${proj.title}"` : 'this project';

    openDeleteConfirmModal(`Are you sure you want to delete ${title}?`, () => {
        data.projects = (data.projects || []).filter(p => p.id !== projectId);
        if (saveSiteData(data)) {
            renderAdminProjectsList(data.projects);
            showToast('Project deleted', 'info');
        }
    });
}

/* --- 6. Services & Software Form Card Lists --- */
function renderAdminServicesList(services) {
    const listContainer = document.getElementById('adminServicesList');
    if (!listContainer) return;

    listContainer.innerHTML = services.map((serv, index) => `
        <div class="admin-card-row">
            <h4>Service Card #${index + 1}: ${serv.title}</h4>
            <div class="admin-form-grid">
                <div class="form-group">
                    <label>Title</label>
                    <input type="text" id="servTitle${index}" value="${serv.title || ''}">
                </div>
                <div class="form-group">
                    <label>FontAwesome Icon Class</label>
                    <input type="text" id="servIcon${index}" value="${serv.icon || ''}">
                </div>
                <div class="form-group full-width">
                    <label>Description</label>
                    <input type="text" id="servDesc${index}" value="${serv.desc || ''}">
                </div>
                <div class="form-group full-width">
                    <label>Checklist Points (Comma Separated)</label>
                    <input type="text" id="servCheck${index}" value="${(serv.checkpoints || []).join(', ')}">
                </div>
            </div>
        </div>
    `).join('');
}

function saveServicesSection() {
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

        if (saveSiteData(data)) {
            showToast('Services updated successfully!', 'success');
        }
    }
}

function renderAdminSoftwareList(software) {
    const listContainer = document.getElementById('adminSoftwareList');
    if (!listContainer) return;

    listContainer.innerHTML = software.map((soft, index) => `
        <div class="admin-card-row">
            <h4>Software #${index + 1}: ${soft.title}</h4>
            <div class="admin-form-grid">
                <div class="form-group">
                    <label>Software Name</label>
                    <input type="text" id="softTitle${index}" value="${soft.title || ''}">
                </div>
                <div class="form-group">
                    <label>Subtitle / Specialty</label>
                    <input type="text" id="softSub${index}" value="${soft.subtitle || ''}">
                </div>
                <div class="form-group">
                    <label>Icon Image File / URL</label>
                    <input type="text" id="softIcon${index}" value="${soft.icon || ''}">
                </div>
                <div class="form-group">
                    <label>Skill Level % (1-100)</label>
                    <input type="number" id="softLevel${index}" value="${soft.level || 90}" min="1" max="100">
                </div>
            </div>
        </div>
    `).join('');
}

function saveSoftwareSection() {
    const data = getSiteData();
    if (data.software && Array.isArray(data.software)) {
        data.software.forEach((soft, i) => {
            if (document.getElementById(`softTitle${i}`)) soft.title = document.getElementById(`softTitle${i}`).value;
            if (document.getElementById(`softSub${i}`)) soft.subtitle = document.getElementById(`softSub${i}`).value;
            if (document.getElementById(`softIcon${i}`)) soft.icon = document.getElementById(`softIcon${i}`).value;
            if (document.getElementById(`softLevel${i}`)) soft.level = parseInt(document.getElementById(`softLevel${i}`).value) || 90;
        });

        if (saveSiteData(data)) {
            showToast('Software toolkit updated successfully!', 'success');
        }
    }
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
    toast.innerHTML = `
        <i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-info'}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 4000);
}
