/**
 * ============================================================
 * MÓDULO DE EVENTOS - Event listeners e handlers
 * Dependências: CONFIG, UI, Store
 * ============================================================
 */

const Events = {
    
    // Estado interno da bipagem
    _bipInterval: null,
    _bipTimeout: null,
    
    init() {
        this._keyboardShortcuts();
        this._sidebarClickOutside();
        console.log('✅ Events inicializado');
    },
    
    // ============ BUSCAR PALLET ============
    buscarPallet() {
        const val = document.getElementById('searchInput')?.value?.trim();
        if (!val) { 
            UI.showToast('Digite um código', 'warning'); 
            return; 
        }
        UI.showToast('🔍 Buscando ' + val + '...', 'info');
        this._highlightPallet(val);
    },
    
    // ============ BIPAR PALLET — abre modal de bipagem ============
    biparPallet() {
        ModalInjector.abrirBipagem();
    },

    // ============ PROCESSAR BIPAGEM (chamado pelo modal) ============
    async processarBipagem(codigo) {
        const cod = (codigo || '').trim();
        if (!cod) return false;

        const pallet = Store.movimentacoes.find(
            m => m.NROPALLET && m.NROPALLET.trim() === cod
        );

        if (!pallet) {
            UI.showToast(`❌ Pallet "${cod}" não encontrado`, 'error');
            return false;
        }

        if (pallet.STATUS === 'FIN' || pallet.STATUS === 'EPR') {
            UI.showToast(`⚠️ Pallet ${cod} já processado`, 'warning');
            return false;
        }

        try {
            await API.bipar(pallet.NROUNICO, pallet.SEQUENCIA, pallet);
            UI.showToast(`✅ ${cod} — ${pallet.PESOPALLET || 0} KG baixados`, 'success');
            if (typeof carregarDados === 'function') carregarDados();
            return true;
        } catch (err) {
            UI.showToast(`Erro ao bipar: ${err.message}`, 'error');
            return false;
        }
    },
    
    // ============ REFRESH ============
    refreshData() {
        const btn = document.getElementById('btnRefresh');
        if (btn) btn.classList.add('spinning');
        UI.showToast('Atualizando...', 'info');
        
        setTimeout(() => {
            if (typeof carregarDados === 'function') {
                carregarDados();
            }
            if (btn) btn.classList.remove('spinning');
            UI.showToast('✅ Atualizado!', 'success');
        }, 500);
    },
    
    // ============ MÉTODOS PRIVADOS ============
    
    /**
     * Debounce - atrasa a execução até que pare de chamar
     */
    _debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    },
    
    /**
     * Limpa intervalos e timeouts da bipagem
     */
    _limparBipagem() {
        if (this._bipInterval) {
            clearInterval(this._bipInterval);
            this._bipInterval = null;
        }
        if (this._bipTimeout) {
            clearTimeout(this._bipTimeout);
            this._bipTimeout = null;
        }
    },
    
    /**
     * Destaca visualmente o pallet buscado
     */
    _highlightPallet(id) {
        let encontrado = false;
        
        document.querySelectorAll('.fruit-box').forEach(box => {
            box.style.outline = '';
            box.style.transform = '';
            box.style.zIndex = '';
            
            if (box.title && box.title.includes(id)) {
                box.style.outline = '3px solid #a8c91d';
                box.style.transform = 'scale(1.15)';
                box.style.zIndex = '50';
                box.scrollIntoView({ behavior: 'smooth', block: 'center' });
                encontrado = true;
            }
        });
        
        if (encontrado) {
            UI.showToast('✅ Pallet ' + id + ' encontrado!', 'success');
        } else {
            UI.showToast('❌ Pallet ' + id + ' não encontrado', 'warning');
            
            // Perguntar se quer criar
            Swal.fire({
                title: 'Pallet não encontrado',
                text: `Deseja criar uma nova movimentação para "${id}"?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Sim, criar!',
                cancelButtonText: 'Não',
                background: '#1a1a2e',
                color: '#e0e0e0',
                confirmButtonColor: '#a8c91d',
                cancelButtonColor: '#6c757d'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Preencher o NRO Pallet automaticamente
                    const input = document.getElementById('searchInput');
                    if (input) input.value = id;
                    
                    // Abrir modal com o pallet preenchido
                    if (typeof abrirModalNovo === 'function') {
                        abrirModalNovo();
                        // Preencher o campo NRO Pallet no modal
                        setTimeout(() => {
                            const frmPallet = document.getElementById('frmNroPallet');
                            if (frmPallet) frmPallet.value = id;
                        }, 300);
                    }
                }
            });
        }
    },
    
    /**
     * Atalhos de teclado
     */
    _keyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+F = Fullscreen
            if (e.ctrlKey && e.key === 'f') { 
                e.preventDefault(); 
                UI.toggleFullscreen(); 
            }
            
            // Ctrl+R = Refresh
            if (e.ctrlKey && e.key === 'r') { 
                e.preventDefault(); 
                this.refreshData(); 
            }
            
            // Ctrl+B = Bipar
            if (e.ctrlKey && e.key === 'b') { 
                e.preventDefault(); 
                this.biparPallet(); 
            }
            
            // Ctrl+N = Nova Movimentação
            if (e.ctrlKey && e.key === 'n') { 
                e.preventDefault(); 
                if (typeof abrirModalNovo === 'function') {
                    abrirModalNovo(); 
                }
            }
            
            // Escape = Fechar sidebar (mobile)
            if (e.key === 'Escape') {
                const s = document.getElementById('sidebar');
                if (s?.classList.contains('open')) {
                    s.classList.remove('open');
                }
            }
        });
        
        console.log('⌨️ Atalhos: Ctrl+F=Tela Cheia | Ctrl+R=Atualizar | Ctrl+B=Bipar | Ctrl+N=Novo');
    },
    
    /**
     * Fecha sidebar ao clicar fora (mobile)
     */
    _sidebarClickOutside() {
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            const menuBtn = document.querySelector('.mobile-menu-btn');
            
            if (sidebar?.classList.contains('open') && 
                !sidebar.contains(e.target) && 
                menuBtn && !menuBtn.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });
    }
};

// ============ EXPORTAR PARA ESCOPO GLOBAL ============
window.Events = Events;
window.buscarPallet  = () => Events.buscarPallet();
window.biparPallet   = () => Events.biparPallet();
window.refreshData   = () => Events.refreshData();
window.processarBipagem = (cod) => Events.processarBipagem(cod);

console.log('✅ events.js carregado');