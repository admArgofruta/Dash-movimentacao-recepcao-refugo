/**
 * ============================================================
 * DASHBOARD - ORQUESTRADOR PRINCIPAL
 * Módulos carregados: config, state, api, ui, renderer, events
 * ============================================================
 */

// ============ INITIALIZATION ============
AOS.init({ duration: 800, easing: 'ease-out-cubic', once: false, mirror: true });

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Dashboard Movimentação de Saldos v3.0 - Modular');
    
    // Inicializar UI
    UI.createParticles();
    UI.atualizarRelogio();
    setInterval(() => UI.atualizarRelogio(), 1000);
    
    // Inicializar Eventos
    Events.init();
    
    // Injetar Modal
    ModalInjector.init();
    
    // Carregar dados
    carregarDados();
    startAutoRefresh();
    
    UI.showToast('✅ Dashboard carregado!', 'success');
    console.log('⌨️ Atalhos: Ctrl+F=Tela Cheia | Ctrl+R=Atualizar | Ctrl+B=Bipar | Ctrl+N=Novo');
});

// ============ CARREGAR DADOS ============
async function carregarDados() {
    try {
        // Buscar resumo
        const dados = await API.fetchResumo();
        
        if (dados.length > 0) {
            const primeiro = dados[0];
            Store.currentNroUnico = primeiro.NROUNICO;
            Store.currentRomaneio = primeiro.ROMANEIO;
            
            const totalEntrada = dados.reduce((s, d) => s + parseFloat(d.TOTAL_ENTRADA || 0), 0);
            const totalSaida = dados.reduce((s, d) => s + parseFloat(d.TOTAL_SAIDA || 0), 0);
            const totalBaixados = dados.reduce((s, d) => s + parseFloat(d.TOTAL_BAIXADOS || 0), 0);

            Renderer.updateStats({
                entradaRecepcao: totalEntrada,
                saidaRecepcao: totalSaida,
                saldoMP: totalEntrada - totalSaida,
                palletsProcessados: totalBaixados,
                romaneio: primeiro.ROMANEIO,
                status: CONFIG.STATUS_MAP[primeiro.STATUS] || primeiro.STATUS,
                saldoAtual: totalEntrada - totalSaida
            });
        }
        
        // Buscar pallets detalhados
        const pallets = await API.fetchPallets();
        Store.setMovimentacoes(pallets);
        
        // Renderizar
        Renderer.renderizarCaminhoes(pallets);
        Renderer.renderizarRefugos(pallets);
        
    } catch (err) {
        console.error('Erro ao carregar dados:', err);
        UI.showToast('Erro ao carregar dados: ' + err.message, 'error');
    }
}

// ============ AUTO REFRESH ============
function startAutoRefresh() {
    Store.autoRefreshInterval = setInterval(carregarDados, CONFIG.REFRESH_INTERVAL);
}

function stopAutoRefresh() {
    if (Store.autoRefreshInterval) {
        clearInterval(Store.autoRefreshInterval);
    }
}

// ============ SELECIONAR CAMINHÃO ============
function selecionarCaminhao(nroUnico, numCaminhao) {
    Store.selectedTruck = { nroUnico, numCaminhao };

    const pallets = Store.movimentacoes.filter(
        m => String(m.NROUNICO) === String(nroUnico) &&
             String(m.NUMPCAMINHAO || 1) === String(numCaminhao)
    );

    const soma = (campo) => pallets.reduce((s, m) => s + parseFloat(m[campo] || 0), 0);

    const totalEntrada  = soma('ENTRADAKG');
    const totalSaida    = soma('SAIDAKG');
    const totalBaixados = soma('QTDPALLETSBAIXADOS');

    const primeiro = pallets[0];
    const status   = primeiro ? (CONFIG.STATUS_MAP[primeiro.STATUS] || primeiro.STATUS) : '---';

    Renderer.updateStats({
        entradaRecepcao:    totalEntrada,
        saidaRecepcao:      totalSaida,
        saldoMP:            totalEntrada - totalSaida,
        palletsProcessados: totalBaixados,
        romaneio:           `Caminhão ${numCaminhao} · Romaneio #${nroUnico}`,
        status:             status,
        saldoAtual:         totalEntrada - totalSaida
    });

    document.querySelectorAll('.truck-3d-wrapper').forEach(el => el.classList.remove('truck-selected'));
    const el = document.querySelector(`[data-nrounico="${nroUnico}"][data-numcaminhao="${numCaminhao}"]`);
    if (el) {
        el.classList.add('truck-selected');
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    UI.showToast(`🚛 Caminhão ${numCaminhao} · ${pallets.length} pallets`, 'info');
}

// ============ GLOBAL EXPORTS ============
window.toggleSidebar = () => UI.toggleSidebar();
window.toggleTheme = () => UI.toggleTheme();
window.refreshData = () => Events.refreshData();
window.buscarPallet = () => Events.buscarPallet();
window.biparPallet = () => Events.biparPallet();
window.selecionarCaminhao = selecionarCaminhao;