/**
 * ============================================================
 * MOVIMENTAÇÃO DE SALDOS - DASHBOARD JS (INTEGRAÇÃO REAL)
 * Tabela: AD_ROMANEIOENTRMOVSALDO
 * API:  ←    Configurações (cores, constantes, mapeamentos)
 * ============================================================
 */

/**
 * ============================================================
 * CONFIGURAÇÕES GLOBAIS DO DASHBOARD
 * ============================================================
 */

const CONFIG = {
    // ============ API ============
    ENTITY_NAME: 'AD_ROMANEIOENTRMOVSALDO',
    DATA_SET_ID: '00P',
    REFRESH_INTERVAL: 30000,
    API_RETRY_COUNT: 3,
    API_RETRY_DELAY: 1000,
    
    // ============ PALLET ============
    PESO_PADRAO_PALLET: 1000,

    // ============ UI ============
    DEBOUNCE_DELAY: 300,
    BIP_TIMEOUT: 10000,
    BIP_CHECK_INTERVAL: 200,
    TOAST_DURATION: 3000,
    ANIMATION_DURATION: 800,
    PARTICLE_COUNT: 20,
    
    // ============ TRUCK ============
    MAX_SLOTS: 14,
    TRUCK_HEIGHT: 140,
    TRUCK_PADDING_BOTTOM: 35,
    
    // ============ CONFETTI ============
    CONFETTI_COUNT: 80,
    CONFETTI_SPREAD: 60,
    
    // ============ MODAL ============
    MODAL_INPUT_HIGHLIGHT_DURATION: 3000,
    
    // Status
    STATUS_MAP: {
        'APR': 'À PROCESSAR',
        'EPR': 'EM PROC.',
        'FIN': 'FINALIZADO'
    },
    
    STATUS_COLORS: {
        'EM PROC.': '#ff8c1a',
        'FINALIZADO': '#4ade80',
        'À PROCESSAR': '#60a5fa'
    },
    
    // Etapas
    ETAPAS: {
        'REC': 'Recepção de Frutos',
        'EMB': 'Embalagem',
        'EXP': 'Expedição'
    },
    
    // Tipos de Pallet
    TIPOS_PALLET: {
        'MP': 'Matéria Prima',
        'REF': 'Refugo',
        'PA': 'Produto Acabado'
    },
    
    // Cores dos bloquinhos
    BLOCK_COLORS: {
        processing: 'linear-gradient(135deg, #ff8c1a, #e07800)',
        finished: 'linear-gradient(135deg, #0b8a44, #0a6e35)',
        refugo: 'linear-gradient(135deg, #8b0000, #5c0000)',
        default: 'linear-gradient(135deg, #2448d8, #1a3ab0)',
        empty: 'rgba(255,255,255,0.06)'
    },
    
    // Toast icons
    TOAST_ICONS: {
        success: 'fa-circle-check',
        error: 'fa-circle-xmark',
        info: 'fa-circle-info',
        warning: 'fa-triangle-exclamation'
    },
    
    TOAST_COLORS: {
        success: '#4ade80',
        error: '#f87171',
        info: '#60a5fa',
        warning: '#ff8c1a'
    }
};

// Exporta para uso global
window.CONFIG = CONFIG;