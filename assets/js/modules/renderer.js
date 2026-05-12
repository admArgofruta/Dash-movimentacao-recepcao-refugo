/**
 * ============================================================
 * MOVIMENTAÇÃO DE SALDOS - DASHBOARD JS (INTEGRAÇÃO REAL)
 * Tabela: AD_ROMANEIOENTRMOVSALDO
 * API:  ←  ← Renderização visual (caminhões, pallets, refugo)
 * ============================================================
 */


/**
 * ============================================================
 * MÓDULO RENDERER - Renderização visual
 * ============================================================
 */

const Renderer = {
    
    /**
     * Renderiza estatísticas nos cards
     */
    updateStats(data) {
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerHTML = val; };
        
        set('entradaRecepcao', `${(data.entradaRecepcao || 0).toLocaleString()} <span class="stat-unit">KG</span>`);
        set('saidaRecepcao', `${(data.saidaRecepcao || 0).toLocaleString()} <span class="stat-unit">KG</span>`);
        set('saldoMP', `${(data.saldoMP || 0).toLocaleString()} <span class="stat-unit">KG</span>`);
        set('palletsProcessados', `${data.palletsProcessados || 0} <span class="stat-unit">PLTS</span>`);
        set('resumoRomaneio', data.romaneio || '---');
        set('resumoSaldo', (data.saldoAtual || 0).toLocaleString() + ' KG');
        
        // Status
        const statusEl = document.getElementById('resumoStatus');
        if (statusEl && data.status) {
            statusEl.innerText = data.status;
            statusEl.style.color = CONFIG.STATUS_COLORS[data.status] || '#fff';
        }
        
        // Badge
        const badge = document.getElementById('statusBadge');
        if (badge && data.status) {
            badge.className = 'status-badge';
            if (data.status === 'EM PROC.') {
                badge.classList.add('processing');
                badge.innerHTML = '<i class="fa-solid fa-spinner fa-spin-pulse"></i> EM PROCESSAMENTO';
            } else if (data.status === 'FINALIZADO') {
                badge.classList.add('finished');
                badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> FINALIZADO';
            } else {
                badge.classList.add('pending');
                badge.innerHTML = '<i class="fa-solid fa-clock"></i> À PROCESSAR';
            }
        }
    },
    
    /**
     * Renderiza caminhões agrupados por romaneio
     */
    renderizarCaminhoes(movimentacoes) {
        const container = document.getElementById('truckContainer');
        if (!container) return;
        
        if (!movimentacoes || movimentacoes.length === 0) {
            container.innerHTML = this._emptyState();
            return;
        }
        
        // Agrupar por NROUNICO + NUMPCAMINHAO
        const romaneios = {};
        movimentacoes.forEach(mov => {
            const nroUnico = mov.NROUNICO || '---';
            const numCaminhao = mov.NUMPCAMINHAO || 1;
            if (!romaneios[nroUnico]) romaneios[nroUnico] = {};
            if (!romaneios[nroUnico][numCaminhao]) romaneios[nroUnico][numCaminhao] = [];
            romaneios[nroUnico][numCaminhao].push(mov);
        });
        
        container.innerHTML = '';
        
        Object.keys(romaneios).sort().forEach(nroUnico => {
            const caminhoes = romaneios[nroUnico];
            
            // Título do Romaneio
            container.insertAdjacentHTML('beforeend', this._romaneioHeader(nroUnico, caminhoes));
            
            // Caminhões
            Object.keys(caminhoes).sort((a, b) => Number(a) - Number(b)).forEach(numCaminhao => {
                const pallets = caminhoes[numCaminhao];
                container.insertAdjacentHTML('beforeend', this._truckHTML(numCaminhao, pallets, nroUnico));
            });
            
            container.insertAdjacentHTML('beforeend', '<hr style="border-color: rgba(255,255,255,0.1); margin: 16px 0;">');
        });
    },
    
    /**
     * Renderiza cards de refugo
     */
    renderizarRefugos(movimentacoes) {
        const grid = document.getElementById('refugoGrid');
        if (!grid) return;
        
        const refugos = movimentacoes.filter(m => m.TIPOPALLET === 'REF');
        
        if (refugos.length === 0) {
            grid.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-secondary);">
                <i class="fa-solid fa-circle-check" style="color:#4ade80;font-size:24px;"></i>
                <p style="margin-top:8px;">Nenhum refugo</p></div>`;
            return;
        }
        
        grid.innerHTML = '';
        refugos.forEach(ref => {
            const card = document.createElement('div');
            card.classList.add('pallet-card', 'refugo');
            card.innerHTML = this._refugoCardHTML(ref);
            card.onclick = () => abrirModalEditar(ref.SEQUENCIA);
            card.setAttribute('data-aos', 'fade-up');
            grid.appendChild(card);
        });
        
        AOS.refresh();
    },
    
    // ============ HELPERS PRIVADOS ============
    
    _emptyState() {
        return `<div style="text-align:center;padding:40px;">
            <i class="fa-solid fa-truck" style="font-size:48px;color:rgba(255,255,255,0.2);margin-bottom:12px;"></i>
            <p style="color:var(--text-secondary);">Nenhum caminhão registrado</p>
            <button onclick="abrirModalNovo()" class="btn" 
                style="background:linear-gradient(135deg,#a8c91d,#0b5c39);color:#fff;border-radius:10px;margin-top:12px;">
                <i class="fa-solid fa-plus"></i> Nova Movimentação</button></div>`;
    },
    
    _romaneioHeader(nroUnico, caminhoes) {
        return `<div style="margin-bottom:20px;padding:12px 16px;background:rgba(168,201,29,0.1);border-left:4px solid #a8c91d;border-radius:8px;">
            <span style="color:#a8c91d;font-weight:700;font-size:18px;">📋 ROMANEIO #${nroUnico}</span>
            <span style="color:var(--text-secondary);margin-left:12px;font-size:14px;">
                ${Object.values(caminhoes).flat().length} registros</span></div>`;
    },
    
    _truckHTML(numCaminhao, pallets, nroUnico) {
        const total = pallets.length;
        const cols = total === 0 ? 4 : Math.min(Math.max(Math.ceil(total / 2), 3), 8);

        const blocosHTML = total > 0
            ? pallets.map(p => this._blockHTML3D(p)).join('')
            : `<div style="grid-column:1/-1;text-align:center;padding:16px;color:rgba(255,255,255,0.35);font-size:12px;">
                   <i class="fa-solid fa-box-open"></i> Sem pallets
               </div>`;

        return `
        <div class="truck-3d-wrapper truck-wrapper"
             data-nrounico="${nroUnico}"
             data-numcaminhao="${numCaminhao}">

            <div class="truck-selected-badge">
                <i class="fa-solid fa-circle-check"></i> SELECIONADO
            </div>

            <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
                <i class="fa-solid fa-truck" style="color:#ff8c1a;font-size:16px;"></i>
                <span style="color:#fff;font-weight:700;font-size:14px;">🚛 CAMINHÃO ${numCaminhao}</span>
                <span class="truck-header-select" onclick="event.stopPropagation();selecionarCaminhao('${nroUnico}','${numCaminhao}')">
                    <i class="fa-solid fa-hand-pointer" style="font-size:10px;"></i>
                    ${total} pallets · ver saldos
                </span>
                <span class="truck-header-select"
                      onclick="event.stopPropagation();imprimirTodasEtiquetas('${nroUnico}','${numCaminhao}')"
                      style="background:rgba(168,201,29,0.15);border-color:rgba(168,201,29,0.4);color:#a8c91d;">
                    <i class="fa-solid fa-print" style="font-size:10px;"></i>
                    Imprimir etiquetas
                </span>
            </div>

            <div class="truck-perspective">
                <div class="truck-3d-scene"
                     onclick="selecionarCaminhao('${nroUnico}','${numCaminhao}')">
                    <div class="truck-svg-container">
                        ${this._truckSVG()}
                        <div class="pallet-overlay"
                             style="grid-template-columns:repeat(${cols},1fr);">
                            ${blocosHTML}
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    },

    _truckSVG() {
        return `<svg class="truck-svg" viewBox="0 0 520 180" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="260" cy="175" rx="220" ry="5" fill="rgba(0,0,0,0.35)"/>
            <rect x="8" y="143" width="504" height="11" rx="4" fill="#111827"/>
            <rect class="cargo-body" x="95" y="12" width="415" height="132" rx="6"
                  fill="#0f2236" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
            <line x1="95" y1="72" x2="510" y2="72" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
            <line x1="205" y1="12" x2="205" y2="144" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
            <line x1="320" y1="12" x2="320" y2="144" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
            <line x1="420" y1="12" x2="420" y2="144" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
            <rect x="95" y="138" width="415" height="6" fill="#0a1a2e" opacity="0.9"/>
            <path d="M90,12 L90,148 L8,148 L8,82 Q8,52 28,36 L90,12 Z"
                  fill="#122840" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
            <path d="M28,32 L90,12 L90,19 L30,38 Z" fill="#1a3a50" opacity="0.7"/>
            <path d="M30,40 Q32,28 86,16 L86,68 L30,82 Z"
                  fill="rgba(96,165,250,0.35)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
            <path d="M38,43 Q43,32 80,22 L80,42 L40,54 Z" fill="rgba(255,255,255,0.07)"/>
            <rect x="10" y="65" width="35" height="32" rx="5"
                  fill="rgba(96,165,250,0.3)" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
            <line x1="45" y1="62" x2="45" y2="148" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
            <rect x="35" y="103" width="18" height="3" rx="1.5" fill="rgba(255,255,255,0.25)"/>
            <rect x="6" y="116" width="14" height="12" rx="3" fill="#fef9c3" opacity="0.95"/>
            <rect x="6" y="116" width="14" height="12" rx="3" fill="none"
                  stroke="rgba(255,220,0,0.5)" stroke-width="1"/>
            <rect x="6" y="132" width="14" height="8" rx="2" fill="#0a1628"/>
            <line x1="9"  y1="133" x2="9"  y2="139" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
            <line x1="12" y1="133" x2="12" y2="139" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
            <line x1="15" y1="133" x2="15" y2="139" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
            <rect x="84" y="40" width="16" height="10" rx="3"
                  fill="#0a1e30" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
            <rect x="84" y="2"  width="6"  height="22" rx="3" fill="#2a2a2a"/>
            <ellipse cx="87" cy="3" rx="3" ry="2" fill="#1a1a1a"/>
            <rect x="95" y="133" width="415" height="6" fill="rgba(168,201,29,0.5)"/>
            <circle cx="50"  cy="157" r="21" fill="#0d0d0d"/>
            <circle cx="50"  cy="157" r="14" fill="#1a1a1a"/>
            <circle cx="50"  cy="157" r="7"  fill="#252525"/>
            <circle cx="50"  cy="157" r="3"  fill="#3a3a3a"/>
            <line x1="50" y1="143" x2="50" y2="150" stroke="#3a3a3a" stroke-width="2"/>
            <line x1="50" y1="164" x2="50" y2="171" stroke="#3a3a3a" stroke-width="2"/>
            <line x1="36" y1="157" x2="43" y2="157" stroke="#3a3a3a" stroke-width="2"/>
            <line x1="57" y1="157" x2="64" y2="157" stroke="#3a3a3a" stroke-width="2"/>
            <circle cx="385" cy="157" r="21" fill="#0d0d0d"/>
            <circle cx="385" cy="157" r="14" fill="#1a1a1a"/>
            <circle cx="385" cy="157" r="7"  fill="#252525"/>
            <circle cx="385" cy="157" r="3"  fill="#3a3a3a"/>
            <line x1="385" y1="143" x2="385" y2="150" stroke="#3a3a3a" stroke-width="2"/>
            <line x1="385" y1="164" x2="385" y2="171" stroke="#3a3a3a" stroke-width="2"/>
            <line x1="371" y1="157" x2="378" y2="157" stroke="#3a3a3a" stroke-width="2"/>
            <line x1="392" y1="157" x2="399" y2="157" stroke="#3a3a3a" stroke-width="2"/>
            <circle cx="430" cy="157" r="21" fill="#0d0d0d"/>
            <circle cx="430" cy="157" r="14" fill="#1a1a1a"/>
            <circle cx="430" cy="157" r="7"  fill="#252525"/>
            <circle cx="430" cy="157" r="3"  fill="#3a3a3a"/>
            <line x1="430" y1="143" x2="430" y2="150" stroke="#3a3a3a" stroke-width="2"/>
            <line x1="430" y1="164" x2="430" y2="171" stroke="#3a3a3a" stroke-width="2"/>
            <line x1="416" y1="157" x2="423" y2="157" stroke="#3a3a3a" stroke-width="2"/>
            <line x1="437" y1="157" x2="444" y2="157" stroke="#3a3a3a" stroke-width="2"/>
        </svg>`;
    },

    _blockHTML3D(pallet) {
        if (!pallet) {
            return `<div class="fruit-box fruit-box-3d"
                         style="background:${CONFIG.BLOCK_COLORS.empty};
                                border:1px dashed rgba(255,255,255,0.1);
                                border-radius:4px;cursor:default;"
                         title="Slot vazio"></div>`;
        }

        // Pallet finalizado: some do caminhão (slot vazio com checkmark)
        if (pallet.STATUS === 'FIN') {
            const nro = pallet.NROPALLET || '---';
            return `<div class="fruit-box fruit-box-3d"
                         style="background:rgba(74,222,128,0.04);
                                border:1px dashed rgba(74,222,128,0.18);
                                border-radius:4px;cursor:default;
                                display:flex;align-items:center;justify-content:center;"
                         title="Finalizado: ${nro}">
                        <i class="fa-solid fa-circle-check"
                           style="color:rgba(74,222,128,0.35);font-size:11px;"></i>
                    </div>`;
        }

        let bgColor = CONFIG.BLOCK_COLORS.default;
        if (pallet.STATUS === 'EPR')          bgColor = CONFIG.BLOCK_COLORS.processing;
        else if (pallet.TIPOPALLET === 'REF') bgColor = CONFIG.BLOCK_COLORS.refugo;

        const nroPallet = pallet.NROPALLET || '---';
        const peso      = pallet.PESOPALLET || 0;
        const seq       = pallet.SEQUENCIA;
        const nroUnico  = pallet.NROUNICO;
        const label     = nroPallet.length > 12 ? nroPallet.substring(0, 12) : nroPallet;

        const actionsHTML = `
            <div class="pallet-actions-mini" onclick="event.stopPropagation();">
                <button class="btn-action-mini btn-barcode"
                        onclick="event.stopPropagation();imprimirEtiqueta(${seq})"
                        title="Etiqueta">
                    <i class="fa-solid fa-barcode"></i>
                </button>
                <button class="btn-action-mini btn-edit"
                        onclick="event.stopPropagation();abrirModalEditar(${seq})"
                        title="Editar">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn-action-mini btn-delete"
                        onclick="event.stopPropagation();deletarMovimentacao(${nroUnico},${seq})"
                        title="Excluir">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>`;

        return `<div onclick="event.stopPropagation();abrirModalEditar(${seq})"
                     class="fruit-box fruit-box-3d"
                     title="Pallet: ${nroPallet} • ${peso} KG"
                     style="background:${bgColor};
                            border:1px solid rgba(0,0,0,0.3);
                            border-radius:4px;cursor:pointer;
                            display:flex;align-items:center;justify-content:center;
                            position:relative;overflow:visible;">
                    <span class="pallet-label">
                        ${label}<br>
                        <span class="peso">${peso}kg</span>
                    </span>
                    ${actionsHTML}
                </div>`;
    },
    
    _blockHTML(pallet) {
        const temPallet = !!pallet;
        
        let bgColor = CONFIG.BLOCK_COLORS.empty;
        let borderStyle = '1px dashed rgba(255,255,255,0.1)';
        let cursorStyle = 'default';
        let onclickAttr = '';
        let labelHTML = '';
        let actionsHTML = '';
        let titleAttr = 'Slot vazio';
        
        if (temPallet) {
            if (pallet.STATUS === 'EPR') bgColor = CONFIG.BLOCK_COLORS.processing;
            else if (pallet.STATUS === 'FIN') bgColor = CONFIG.BLOCK_COLORS.finished;
            else if (pallet.TIPOPALLET === 'REF') bgColor = CONFIG.BLOCK_COLORS.refugo;
            else bgColor = CONFIG.BLOCK_COLORS.default;
            
            borderStyle = '1px solid rgba(0,0,0,0.3)';
            cursorStyle = 'pointer';
            
            const nroPallet = pallet.NROPALLET || '---';
            const peso = pallet.PESOPALLET || 0;
            const seq = pallet.SEQUENCIA;
            const nroUnico = pallet.NROUNICO;
            
            onclickAttr = 'onclick="abrirModalEditar(' + seq + ')"';
            titleAttr = 'Pallet: ' + nroPallet + ' • ' + peso + ' KG';
            
            labelHTML = '<span class="pallet-label">' + 
                (nroPallet.length > 8 ? nroPallet.substring(0, 8) : nroPallet) + 
                '<br><span class="peso">' + peso + 'kg</span></span>';
            
            actionsHTML = '<div class="pallet-actions-mini" onclick="event.stopPropagation();">' +
                '<button class="btn-action-mini btn-edit" onclick="event.stopPropagation();abrirModalEditar(' + seq + ')" title="Editar">' +
                '<i class="fa-solid fa-pen"></i></button>' +
                '<button class="btn-action-mini btn-delete" onclick="event.stopPropagation();deletarMovimentacao(' + nroUnico + ',' + seq + ')" title="Excluir">' +
                '<i class="fa-solid fa-trash"></i></button></div>';
        }
        
        return '<div ' + onclickAttr + ' class="fruit-box" title="' + titleAttr + '" style="' +
            'background:' + bgColor + ';border:' + borderStyle + ';border-radius:4px;cursor:' + cursorStyle + ';' +
            'display:flex;align-items:center;justify-content:center;position:relative;overflow:visible;">' + 
            labelHTML + actionsHTML + '</div>';
    },
    
    _refugoCardHTML(ref) {
        return `<div class="pallet-stack">${Array(4).fill('<div class="crate" style="background:rgba(248,113,113,0.5);"></div>').join('')}</div>
            <div class="pallet-id" style="color:#f87171;">REFUGO ${ref.NROPALLET || '---'}</div>
            <div class="pallet-weight">${ref.PESOPALLET || 0} KG</div>
            <div class="pallet-actions" style="display:flex;gap:4px;margin-top:4px;">
                <button onclick="event.stopPropagation();abrirModalEditar(${ref.SEQUENCIA})" 
                    style="background:rgba(255,140,26,0.2);border:none;color:#ff8c1a;border-radius:6px;padding:2px 8px;font-size:11px;cursor:pointer;">
                    <i class="fa-solid fa-pen"></i></button>
                <button onclick="event.stopPropagation();deletarMovimentacao(${ref.NROUNICO},${ref.SEQUENCIA})" 
                    style="background:rgba(248,113,113,0.2);border:none;color:#f87171;border-radius:6px;padding:2px 8px;font-size:11px;cursor:pointer;">
                    <i class="fa-solid fa-trash"></i></button></div>`;
    }
};

window.Renderer = Renderer;