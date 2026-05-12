/**
 * ============================================================
 * MOVIMENTAÇÃO DE SALDOS - DASHBOARD JS (INTEGRAÇÃO REAL)
 * Tabela: AD_ROMANEIOENTRMOVSALDO
 * API:  ←   ← UI helpers (toast, particles, clock, tema, sidebar)
 * ============================================================
 */
/**
 * ============================================================
 * MÓDULO DE UI - Interface do usuário
 * ============================================================
 */

const UI = {
    
    // ============ TOAST ============
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.classList.add('toast');
        toast.innerHTML = `
            <i class="fa-solid ${CONFIG.TOAST_ICONS[type] || CONFIG.TOAST_ICONS.info}" 
               style="color: ${CONFIG.TOAST_COLORS[type] || CONFIG.TOAST_COLORS.info}; font-size: 20px;"></i>
            ${message}
        `;
        container.appendChild(toast);
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, CONFIG.TOAST_DURATION);
    },
    
    // ============ RELÓGIO ============
    atualizarRelogio() {
        const el = document.getElementById('clock');
        if (el) {
            el.innerText = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }
    },
    
    // ============ PARTÍCULAS ============
    createParticles() {
        const container = document.getElementById('particles');
        if (!container) return;
        for (let i = 0; i < 20; i++) {
            const p = document.createElement('div');
            p.classList.add('particle');
            p.style.left = Math.random() * 100 + '%';
            p.style.top = Math.random() * 100 + '%';
            p.style.width = (Math.random() * 6 + 2) + 'px';
            p.style.height = p.style.width;
            p.style.animationDelay = Math.random() * 6 + 's';
            p.style.animationDuration = (Math.random() * 6 + 4) + 's';
            container.appendChild(p);
        }
    },
    
    // ============ SIDEBAR ============
    toggleSidebar() {
        const s = document.getElementById('sidebar');
        if (s) s.classList.toggle('open');
    },
    
    // ============ TEMA ============
    toggleTheme() {
        Store.isDark = !Store.isDark;
        const themeIcon = document.querySelector('.theme-toggle i');
        
        if (Store.isDark) {
            document.documentElement.style.setProperty('--glass-bg', 'rgba(255,255,255,0.08)');
            document.documentElement.style.setProperty('--text-primary', '#e0e0e0');
            if (themeIcon) themeIcon.className = 'fa-solid fa-moon';
            document.body.style.background = 'linear-gradient(135deg, #0a0e27 0%, #1a1a2e 50%, #16213e 100%)';
            document.body.style.color = '#e0e0e0';
        } else {
            document.documentElement.style.setProperty('--glass-bg', 'rgba(255,255,255,0.6)');
            document.documentElement.style.setProperty('--text-primary', '#1a1a2e');
            if (themeIcon) themeIcon.className = 'fa-solid fa-sun';
            document.body.style.background = 'linear-gradient(135deg, #f0f2f5 0%, #e8edf2 50%, #f5f7fa 100%)';
            document.body.style.color = '#1a1a2e';
        }
        
        this.showToast(Store.isDark ? '🌙 Modo escuro' : '☀️ Modo claro', 'info');
    },
    
    // ============ CONFETTI ============
    celebrate() {
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 80,
                spread: 60,
                origin: { y: 0.7 },
                colors: ['#a8c91d', '#0b5c39', '#ff8c1a', '#2448d8']
            });
        }
    },
    
    // ============ FULLSCREEN ============
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen();
        }
    }
};

window.UI = UI;