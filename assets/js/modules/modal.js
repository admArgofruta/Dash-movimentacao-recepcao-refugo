/**
 * ============================================================
 * MÓDULO MODAL - Injeção e controle do modal CRUD
 * ============================================================
 */

const ModalInjector = {
    
    init() {
        this._injetarHTML();
        this._injetarHTMLBipagem();
        this._injetarHTMLImpressao();
        console.log('✅ ModalInjector inicializado');
    },
    
    abrirNovo() {
        console.log('🟢 abrirNovo() chamado');
        Store.editandoSequencia = null;
        document.getElementById('modalTitle').innerHTML = '<i class="fa-solid fa-plus-circle" style="color:#a8c91d;"></i> Nova Movimentação';
        this._limparFormulario();

        // Pré-preenche campos padrão (independente do romaneio)
        const peso = CONFIG.PESO_PADRAO_PALLET || 1000;
        const setV = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        setV('frmPesoPallet', peso);
        setV('frmEntradaKG',  peso);

        const nroUnico = Store.currentNroUnico;
        if (nroUnico) {
            setV('frmNroUnico', nroUnico);
        }

        // NROPALLET: readonly (auto-gerado), formato {NROUNICO}-{001}
        const campoNroPallet = document.getElementById('frmNroPallet');
        if (campoNroPallet && nroUnico) {
            campoNroPallet.readOnly = true;
            campoNroPallet.style.opacity = '0.6';
            campoNroPallet.value = 'Gerando...';

            API.fetchProximoNroPallet(nroUnico).then(proximo => {
                const seq = String(proximo).padStart(3, '0');
                campoNroPallet.value = `${nroUnico}-${seq}`;
            }).catch(() => {
                campoNroPallet.value = `${nroUnico}-001`;
            });
        }

        new bootstrap.Modal(document.getElementById('modalMovimentacao')).show();
    },
    
    abrirEditar(seq) {
        console.log('🟡 abrirEditar(' + seq + ') chamado');
        Store.editandoSequencia = seq;
        document.getElementById('modalTitle').innerHTML = '<i class="fa-solid fa-pen-to-square" style="color:#ff8c1a;"></i> Editar #' + seq;

        const mov = Store.movimentacoes.find(m => parseInt(m.SEQUENCIA) === parseInt(seq));
        if (!mov) { UI.showToast('Registro não encontrado', 'error'); return; }

        this._preencherFormulario(mov);

        // No modo edição, NROPALLET é editável
        const campoNroPallet = document.getElementById('frmNroPallet');
        if (campoNroPallet) {
            campoNroPallet.readOnly = false;
            campoNroPallet.style.opacity = '1';
        }

        new bootstrap.Modal(document.getElementById('modalMovimentacao')).show();
    },
    
    async salvar() {
        const nroUnico = document.getElementById('frmNroUnico').value.trim();
        if (!nroUnico) { UI.showToast('Informe o Romaneio!', 'error'); return; }

        const data = this._coletarDadosFormulario();
        const btn = document.getElementById('btnSalvarMov');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando...';

        try {
            if (Store.editandoSequencia) {
                await API.update(nroUnico, Store.editandoSequencia, data);
                UI.showToast('✅ Atualizado!', 'success');
            } else {
                await API.create(data);
                UI.showToast('✅ Cadastrado!', 'success');
                UI.celebrate();
            }

            bootstrap.Modal.getInstance(document.getElementById('modalMovimentacao')).hide();
            Store.currentNroUnico = nroUnico;
            carregarDados();
        } catch (err) {
            console.error('Erro ao salvar:', err);
            UI.showToast('Erro: ' + err.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Salvar';
        }
    },

    _imprimirEtiquetaDados(palletData) {
        const nroPallet = palletData.NROPALLET?.trim();
        if (!nroPallet || typeof JsBarcode === 'undefined') return;

        try {
            JsBarcode('#barcodeLabel', nroPallet, {
                format: 'CODE128', width: 2.5, height: 80,
                displayValue: true, fontSize: 16, margin: 10,
                background: '#ffffff', lineColor: '#000000'
            });
        } catch(e) { return; }

        const infoEl = document.getElementById('printPalletInfo');
        if (infoEl) {
            infoEl.innerHTML =
                `<strong style="font-size:16px;">${nroPallet}</strong><br>
                 <span style="color:#888;">Peso: ${palletData.PESOPALLET || 0} KG &nbsp;|&nbsp; Romaneio #${palletData.NROUNICO}</span>`;
        }

        new bootstrap.Modal(document.getElementById('modalImpressao')).show();
    },
    
    async deletar(nroUnico, sequencia) {
        const result = await Swal.fire({
            title: 'Excluir?',
            text: `Movimentação #${sequencia} será removida.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f87171',
            confirmButtonText: 'Sim, excluir!',
            cancelButtonText: 'Cancelar',
            background: '#1a1a2e',
            color: '#e0e0e0'
        });
        
        if (result.isConfirmed) {
            try {
                await API.remove(nroUnico, sequencia);
                UI.showToast('🗑️ Excluído!', 'success');
                carregarDados();
            } catch (err) {
                UI.showToast('Erro: ' + err.message, 'error');
            }
        }
    },
    
    // ============ BIPAGEM ============

    abrirBipagem() {
        const input  = document.getElementById('bipCodigo');
        const status = document.getElementById('bipStatus');
        const ultimo = document.getElementById('bipUltimo');
        const ctr    = document.getElementById('bipContador');

        if (input)  input.value = '';
        if (status) status.innerHTML = '<span style="color:#60a5fa;"><i class="fa-solid fa-spinner fa-spin"></i> Aguardando leitura...</span>';
        if (ultimo) ultimo.innerHTML = '';
        if (ctr)    ctr.textContent  = '0';

        const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalBipagem'));
        modal.show();
        setTimeout(() => { if (input) input.focus(); }, 400);
    },

    async _processBip() {
        const input  = document.getElementById('bipCodigo');
        const status = document.getElementById('bipStatus');
        const ultimo = document.getElementById('bipUltimo');
        const ctr    = document.getElementById('bipContador');
        const codigo = input?.value?.trim();

        if (!codigo) return;

        if (status) status.innerHTML = '<span style="color:#ff8c1a;"><i class="fa-solid fa-spinner fa-spin"></i> Processando...</span>';

        const ok = await Events.processarBipagem(codigo);

        if (ok) {
            if (ctr) ctr.textContent = String(parseInt(ctr.textContent || '0') + 1);
            if (status) status.innerHTML = '<span style="color:#4ade80;"><i class="fa-solid fa-circle-check"></i> Aguardando próxima leitura...</span>';
            if (ultimo) ultimo.innerHTML = `
                <div style="background:rgba(74,222,128,0.1);border:1px solid #4ade80;
                            border-radius:8px;padding:10px;color:#4ade80;font-weight:600;">
                    ✅ <strong>${codigo}</strong> — bipado com sucesso!
                </div>`;
        } else {
            if (status) status.innerHTML = '<span style="color:#f87171;"><i class="fa-solid fa-circle-xmark"></i> Falha — tente novamente</span>';
            if (ultimo) ultimo.innerHTML = `
                <div style="background:rgba(248,113,113,0.1);border:1px solid #f87171;
                            border-radius:8px;padding:10px;color:#f87171;">
                    ❌ <strong>${codigo}</strong> — não processado
                </div>`;
        }

        if (input) { input.value = ''; input.focus(); }

        setTimeout(() => {
            if (status) status.innerHTML = '<span style="color:#60a5fa;"><i class="fa-solid fa-spinner fa-spin"></i> Aguardando leitura...</span>';
        }, 2500);
    },

    // ============ IMPRESSÃO DE ETIQUETA ============

    async abrirImpressao(seq) {
        const pallet = Store.movimentacoes.find(m => parseInt(m.SEQUENCIA) === parseInt(seq));
        if (!pallet) { UI.showToast('Pallet não encontrado', 'error'); return; }

        const nroPallet = pallet.NROPALLET?.trim();
        if (!nroPallet) { UI.showToast('Pallet sem código para gerar etiqueta', 'warning'); return; }

        if (typeof JsBarcode === 'undefined') {
            UI.showToast('Biblioteca de código de barras não carregada', 'error');
            return;
        }

        try {
            JsBarcode('#barcodeLabel', nroPallet, {
                format:       'CODE128',
                width:        2.5,
                height:       80,
                displayValue: true,
                fontSize:     16,
                margin:       10,
                background:   '#ffffff',
                lineColor:    '#000000'
            });
        } catch (e) {
            UI.showToast('Erro ao gerar código de barras: ' + e.message, 'error');
            return;
        }

        const infoEl = document.getElementById('printPalletInfo');
        if (infoEl) {
            infoEl.innerHTML = `
                <strong style="font-size:16px;">${nroPallet}</strong><br>
                <span style="color:#888;">Peso: ${pallet.PESOPALLET || 0} KG &nbsp;|&nbsp; Romaneio #${pallet.NROUNICO}</span>
            `;
        }

        // Pré-carrega cabecalho para usar em imprimirLabel
        this._currentPalletForPrint    = pallet;
        this._currentCabecalhoForPrint = null;
        API.fetchCabecalhoRomaneio(pallet.NROUNICO)
            .then(cab  => { this._currentCabecalhoForPrint = cab; })
            .catch(()  => {});

        new bootstrap.Modal(document.getElementById('modalImpressao')).show();
    },

    async imprimirLabel() {
        const pallet    = this._currentPalletForPrint || {};
        const nroPallet = pallet.NROPALLET?.trim();
        if (!nroPallet || typeof JsBarcode === 'undefined') return;

        // Abre antes do await para não ser bloqueada pelo browser
        const win = window.open('', 'PRINT', 'width=420,height=400');
        win.document.write(`<!DOCTYPE html><html><head>
            <title>Etiqueta - ${nroPallet}</title>
            <style>${this._labelCSS()}</style>
        </head><body>
            <div style="text-align:center;padding:30px;font-family:Arial;color:#555;">⏳ Gerando etiqueta...</div>
        </body></html>`);
        win.document.close();

        let cab = this._currentCabecalhoForPrint;
        if (!cab) {
            try { cab = await API.fetchCabecalhoRomaneio(pallet.NROUNICO); }
            catch(e) { cab = {}; }
        }

        // Re-renderiza código de barras no tamanho correto para 108x80mm
        const tmp = document.createElement('div');
        tmp.style.cssText = 'position:fixed;left:-9999px;top:-9999px;visibility:hidden;';
        document.body.appendChild(tmp);
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.id = 'tmpbc_single';
        tmp.appendChild(svg);
        try {
            JsBarcode('#tmpbc_single', nroPallet, {
                format: 'CODE128', width: 2, height: 42,
                displayValue: true, fontSize: 11, margin: 3,
                background: '#ffffff', lineColor: '#000000'
            });
        } catch(e) {}
        const svgHTML = svg.outerHTML;
        document.body.removeChild(tmp);

        win.document.open();
        win.document.write(`<!DOCTYPE html><html><head>
            <title>Etiqueta - ${nroPallet}</title>
            <style>${this._labelCSS()}</style>
        </head><body>
            ${this._buildLabelHTML(cab, pallet, svgHTML)}
            <script>window.onload=function(){window.print();};<\/script>
        </body></html>`);
        win.document.close();
    },

    async imprimirTodasEtiquetas(nroUnico, numCaminhao) {
        const pallets = Store.movimentacoes.filter(
            m => String(m.NROUNICO)        === String(nroUnico) &&
                 String(m.NUMPCAMINHAO||1) === String(numCaminhao) &&
                 m.NROPALLET && m.NROPALLET.trim() &&
                 m.STATUS !== 'FIN'
        );

        if (!pallets.length) {
            UI.showToast('Nenhum pallet pendente com código neste caminhão', 'warning');
            return;
        }

        if (typeof JsBarcode === 'undefined') {
            UI.showToast('JsBarcode não carregado', 'error');
            return;
        }

        // Abre janela antes do await para não ser bloqueada pelo browser
        const win = window.open('', 'PRINT_ALL', 'width=900,height=700');
        win.document.write(`<!DOCTYPE html><html><head>
            <title>Etiquetas · Caminhão ${numCaminhao} · ROM #${nroUnico}</title>
            <style>${this._labelCSS()}</style>
        </head><body>
            <div style="text-align:center;padding:40px;font-family:Arial;color:#555;">
                ⏳ Gerando ${pallets.length} etiqueta(s)...
            </div>
        </body></html>`);
        win.document.close();

        // Busca cabecalho uma vez para todos os pallets do romaneio
        let cab = {};
        try { cab = await API.fetchCabecalhoRomaneio(nroUnico); }
        catch(e) {}

        // Pré-renderiza SVGs no DOM oculto (JsBarcode já carregado aqui)
        const tmpContainer = document.createElement('div');
        tmpContainer.style.cssText = 'position:fixed;left:-9999px;top:-9999px;visibility:hidden;';
        document.body.appendChild(tmpContainer);

        const labelsHTML = pallets.map((p, i) => {
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.id = 'tmpbc_' + i;
            tmpContainer.appendChild(svg);
            try {
                JsBarcode('#tmpbc_' + i, p.NROPALLET.trim(), {
                    format: 'CODE128', width: 2, height: 42,
                    displayValue: true, fontSize: 11, margin: 3,
                    background: '#ffffff', lineColor: '#000000'
                });
            } catch(e) { return ''; }
            return this._buildLabelHTML(cab, p, svg.outerHTML);
        }).join('');

        document.body.removeChild(tmpContainer);

        win.document.open();
        win.document.write(`<!DOCTYPE html><html><head>
            <title>Etiquetas · Caminhão ${numCaminhao} · ROM #${nroUnico}</title>
            <style>${this._labelCSS()}</style>
        </head><body>
            ${labelsHTML}
            <script>window.onload=function(){window.print();};<\/script>
        </body></html>`);
        win.document.close();
    },

    // ============ MÉTODOS PRIVADOS ============

    _injetarHTML() {
        const modalHTML = `
        <div class="modal fade" id="modalMovimentacao" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content" style="background: #1a1a2e; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px;">
                    <div class="modal-header" style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <h5 class="modal-title" id="modalTitle" style="color: #e0e0e0;">
                            <i class="fa-solid fa-plus-circle" style="color: #a8c91d;"></i> Nova Movimentação
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" style="color: #e0e0e0;">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label" style="color: #999; font-size: 12px;">ROMANEIO (NROUNICO)</label>
                                <input type="number" class="form-control" id="frmNroUnico" placeholder="Nro. Único do Romaneio"
                                    style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: #fff; border-radius: 10px;">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label" style="color: #999; font-size: 12px;">Nº CAMINHÃO</label>
                                <input type="number" class="form-control" id="frmNumpCaminhao" placeholder="1, 2, 3..."
                                    style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: #fff; border-radius: 10px;">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label" style="color: #999; font-size: 12px;">ETAPA</label>
                                <select class="form-select" id="frmEtapa"
                                    style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: #fff; border-radius: 10px;">
                                    <option value="REC">Recepção de Frutos</option>
                                    <option value="EMB">Embalagem</option>
                                    <option value="EXP">Expedição</option>
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label" style="color: #999; font-size: 12px;">STATUS</label>
                                <select class="form-select" id="frmStatus"
                                    style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: #fff; border-radius: 10px;">
                                    <option value="APR">À Processar</option>
                                    <option value="EPR">Em Processamento</option>
                                    <option value="FIN">Finalizado</option>
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label" style="color: #999; font-size: 12px;">ENTRADA (KG)</label>
                                <input type="number" step="0.01" class="form-control" id="frmEntradaKG" placeholder="0.00"
                                    style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: #fff; border-radius: 10px;">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label" style="color: #999; font-size: 12px;">
                                    SAÍDA (KG) <span style="color:#a8c91d;font-size:10px;font-weight:700;">● AUTO</span>
                                </label>
                                <input type="number" step="0.01" class="form-control" id="frmSaidaKG" placeholder="0.00"
                                    disabled
                                    style="background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.1); color: #666; border-radius: 10px; cursor: not-allowed; opacity: 0.6;">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label" style="color: #999; font-size: 12px;">
                                    PALLETS BAIXADOS <span style="color:#a8c91d;font-size:10px;font-weight:700;">● AUTO</span>
                                </label>
                                <input type="number" class="form-control" id="frmQtdPalletsBaixados" placeholder="0"
                                    disabled
                                    style="background: rgba(255,255,255,0.02); border: 1px dashed rgba(255,255,255,0.1); color: #666; border-radius: 10px; cursor: not-allowed; opacity: 0.6;">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label" style="color: #999; font-size: 12px;">NRO. PALLET</label>
                                <input type="text" class="form-control" id="frmNroPallet" placeholder="0517-1026"
                                    style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: #fff; border-radius: 10px;">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label" style="color: #999; font-size: 12px;">PESO PALLET (KG)</label>
                                <input type="number" step="0.01" class="form-control" id="frmPesoPallet" placeholder="0.00"
                                    style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: #fff; border-radius: 10px;">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label" style="color: #999; font-size: 12px;">TIPO PALLET</label>
                                <select class="form-select" id="frmTipoPallet"
                                    style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: #fff; border-radius: 10px;">
                                    <option value="MP">Matéria Prima</option>
                                    <option value="REF">Refugo</option>
                                    <option value="PA">Produto Acabado</option>
                                </select>
                            </div>
                            <div class="col-12">
                                <label class="form-label" style="color: #999; font-size: 12px;">OBSERVAÇÃO</label>
                                <textarea class="form-control" id="frmObs" rows="2" placeholder="Observações..."
                                    style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: #fff; border-radius: 10px;"></textarea>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer" style="border-top: 1px solid rgba(255,255,255,0.1);">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal" style="border-radius: 10px;">Cancelar</button>
                        <button type="button" class="btn" onclick="salvarMovimentacao()" id="btnSalvarMov"
                            style="background: linear-gradient(135deg, #a8c91d, #0b5c39); color: #fff; border-radius: 10px; font-weight: 600;">
                            <i class="fa-solid fa-floppy-disk"></i> Salvar
                        </button>
                    </div>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        console.log('✅ Modal HTML injetado no DOM');
    },
    
    _limparFormulario() {
        const campos = [
            'frmNroUnico', 'frmNumpCaminhao', 'frmEntradaKG', 'frmSaidaKG',
            'frmQtdPalletsBaixados', 'frmNroPallet', 'frmPesoPallet', 'frmObs'
        ];
        
        campos.forEach(id => { 
            const el = document.getElementById(id); 
            if (el) el.value = ''; 
        });
        
        // Resetar selects
        const frmEtapa = document.getElementById('frmEtapa');
        const frmStatus = document.getElementById('frmStatus');
        const frmTipoPallet = document.getElementById('frmTipoPallet');
        
        if (frmEtapa) frmEtapa.value = 'REC';
        if (frmStatus) frmStatus.value = 'APR';
        if (frmTipoPallet) frmTipoPallet.value = 'MP';
        
        console.log('🧹 Formulário limpo');
    },
    
    _preencherFormulario(mov) {
        console.log('📝 Preenchendo formulário com:', mov);
        
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val || '';
        };
        
        setVal('frmNroUnico', mov.NROUNICO);
        setVal('frmNumpCaminhao', mov.NUMPCAMINHAO || '1');
        setVal('frmEtapa', mov.ETAPA || 'REC');
        setVal('frmStatus', mov.STATUS || 'APR');
        setVal('frmEntradaKG', mov.ENTRADAKG || '0');
        setVal('frmSaidaKG', mov.SAIDAKG || '0');
        setVal('frmQtdPalletsBaixados', mov.QTDPALLETSBAIXADOS || '0');
        setVal('frmNroPallet', mov.NROPALLET || '');
        setVal('frmPesoPallet', mov.PESOPALLET || '0');
        setVal('frmTipoPallet', mov.TIPOPALLET || 'MP');
        setVal('frmObs', mov.OBS || '');
    },
    
    _coletarDadosFormulario() {
        const getVal = (id, def = '') => {
            const el = document.getElementById(id);
            return el ? el.value.trim() || def : def;
        };
        
        return {
            NROUNICO: getVal('frmNroUnico'),
            NUMPCAMINHAO: getVal('frmNumpCaminhao', '1'),
            ETAPA: getVal('frmEtapa', 'REC'),
            STATUS: getVal('frmStatus', 'APR'),
            ENTRADAKG: getVal('frmEntradaKG', '0'),
            SAIDAKG: getVal('frmSaidaKG', '0'),
            QTDPALLETSBAIXADOS: getVal('frmQtdPalletsBaixados', '0'),
            NROPALLET: getVal('frmNroPallet'),
            PESOPALLET: getVal('frmPesoPallet', '0'),
            TIPOPALLET: getVal('frmTipoPallet', 'MP'),
            OBS: getVal('frmObs')
        };
    },

    _labelCSS() {
        return `
            *{box-sizing:border-box;margin:0;padding:0;}
            @page{size:108mm 80mm;margin:1mm;}
            body{font-family:Arial,sans-serif;background:#fff;width:108mm;}
            .label-wrap{
                width:106mm;border:1.5px solid #222;overflow:hidden;
                page-break-after:always;break-after:page;
                page-break-inside:avoid;break-inside:avoid;
            }
            .tbl-header{width:100%;border-collapse:collapse;background:#f0f0f0;border-bottom:1.5px solid #222;}
            .tbl-header .logo-cell{padding:2px 4px;width:20mm;text-align:center;vertical-align:middle;border-right:1px solid #bbb;}
            .tbl-header .title-cell{padding:2px 6px;text-align:center;font-size:8pt;font-weight:700;letter-spacing:1px;}
            .tbl-grid,.tbl-pallet{width:100%;border-collapse:collapse;}
            .tbl-grid td,.tbl-pallet td{border:0.5px solid #ccc;padding:1px 3px;font-size:6.5pt;vertical-align:middle;line-height:1.3;}
            .lbl{background:#efefef;font-weight:700;color:#333;white-space:nowrap;width:17mm;}
            .val{color:#000;}
            .tbl-pallet td{font-size:7.5pt;font-weight:700;}
            .barcode-area{text-align:center;padding:1px 2px;border-top:0.5px solid #ccc;}
            .barcode-area svg{max-width:100%;display:block;margin:0 auto;}
            @media print{body{padding:0;}}
        `;
    },

    _buildLabelHTML(cab, pallet, svgHTML) {
        const nr = (v) => (v != null && String(v).trim() !== '') ? v : '---';
        const enderecoLinha1 = [cab.NOMEEND, cab.NUMEND, cab.COMPLEMENTO]
            .filter(v => v && String(v).trim())
            .join(', ');
        const cidadeUF = [cab.NOMECID, cab.UF]
            .filter(v => v && String(v).trim())
            .join(' - ');
        return `
        <div class="label-wrap">
            <table class="tbl-header">
                <tr>
                    <td class="logo-cell">
                        <img src="https://argofruta.com/wp-content/uploads/2021/05/Logo-text-green.png"
                             style="height:26px;object-fit:contain;"
                             onerror="this.style.display='none'">
                    </td>
                    <td class="title-cell">CONTROLE DE RECEPÇÃO</td>
                </tr>
            </table>
            <table class="tbl-grid">
                <tr>
                    <td class="lbl">PRODUTOR</td>
                    <td class="val" colspan="3">${nr(cab.RAZAOSOCIAL)}</td>
                </tr>
                <tr>
                    <td class="lbl">CNPJ</td>
                    <td class="val">${nr(cab.EMP_CNPJ)}</td>
                    <td class="lbl">TELEFONE</td>
                    <td class="val">${nr(cab.TELEFONE)}</td>
                </tr>
                <tr>
                    <td class="lbl">ENDEREÇO</td>
                    <td class="val" colspan="3">${enderecoLinha1 || '---'}</td>
                </tr>
                <tr>
                    <td class="lbl">BAIRRO</td>
                    <td class="val">${nr(cab.NOMEBAI)}</td>
                    <td class="lbl">CIDADE/UF</td>
                    <td class="val">${cidadeUF || '---'}</td>
                </tr>
                <tr>
                    <td class="lbl">VARIEDADE</td>
                    <td class="val">${nr(cab.VARIEDADE)}</td>
                    <td class="lbl">DT. COLHEITA</td>
                    <td class="val">${nr(cab.FICHA_EMBARQUE)}</td>
                </tr>
            </table>
            <table class="tbl-pallet">
                <tr>
                    <td class="lbl">PALLET Nº</td>
                    <td class="val" style="font-weight:700;">${nr(pallet.NROPALLET)}</td>
                    <td class="lbl">PESO</td>
                    <td class="val" style="font-weight:700;">${pallet.PESOPALLET || 0} KG</td>
                </tr>
            </table>
            <div class="barcode-area">${svgHTML}</div>
        </div>`;
    },

    _injetarHTMLBipagem() {
        const html = `
        <div class="modal fade" id="modalBipagem" tabindex="-1" data-bs-backdrop="static" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" style="max-width:480px;">
                <div class="modal-content" style="background:#0f1c2e;border:1px solid rgba(168,201,29,0.3);border-radius:20px;">
                    <div class="modal-header" style="border-bottom:1px solid rgba(255,255,255,0.08);justify-content:center;flex-direction:column;text-align:center;padding:24px 24px 16px;">
                        <div style="font-size:52px;margin-bottom:8px;">
                            <i class="fa-solid fa-barcode" style="color:#a8c91d;"></i>
                        </div>
                        <h5 style="color:#fff;font-weight:700;font-size:20px;margin:0;">MODO BIPAGEM</h5>
                        <div style="color:#666;font-size:12px;margin-top:4px;">
                            Pallets bipados nesta sessão: <strong id="bipContador" style="color:#a8c91d;">0</strong>
                        </div>
                    </div>
                    <div class="modal-body" style="padding:20px 24px;text-align:center;">
                        <div id="bipStatus" style="font-size:15px;margin-bottom:16px;min-height:24px;">
                            <span style="color:#60a5fa;"><i class="fa-solid fa-spinner fa-spin"></i> Aguardando leitura...</span>
                        </div>
                        <input type="text" id="bipCodigo"
                            autocomplete="off"
                            placeholder="Aponte o leitor ao código de barras..."
                            style="width:100%;padding:14px 16px;font-size:18px;text-align:center;
                                   background:rgba(255,255,255,0.06);border:2px solid #a8c91d;
                                   color:#fff;border-radius:12px;letter-spacing:3px;outline:none;"
                            onkeydown="if(event.key==='Enter'){event.preventDefault();ModalInjector._processBip();}">
                        <div style="color:#555;font-size:11px;margin-top:10px;">
                            <i class="fa-solid fa-circle-info"></i>
                            Aponte o leitor para o código de barras e pressione o gatilho
                        </div>
                        <div id="bipUltimo" style="margin-top:16px;min-height:44px;"></div>
                    </div>
                    <div class="modal-footer" style="border-top:1px solid rgba(255,255,255,0.08);justify-content:center;padding:16px;">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal"
                            style="border-radius:10px;padding:8px 24px;">
                            <i class="fa-solid fa-door-open"></i> Fechar
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    },

    _injetarHTMLImpressao() {
        const html = `
        <div class="modal fade" id="modalImpressao" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" style="max-width:440px;">
                <div class="modal-content" style="background:#1a1a2e;border:1px solid rgba(255,255,255,0.1);border-radius:16px;">
                    <div class="modal-header" style="border-bottom:1px solid rgba(255,255,255,0.1);">
                        <h5 class="modal-title" style="color:#e0e0e0;">
                            <i class="fa-solid fa-barcode" style="color:#a8c91d;"></i> Etiqueta do Pallet
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" style="text-align:center;padding:24px;">
                        <div style="background:#fff;padding:16px;border-radius:10px;display:inline-block;min-width:280px;">
                            <svg id="barcodeLabel"></svg>
                        </div>
                        <div id="printPalletInfo" style="margin-top:14px;color:#e0e0e0;line-height:1.6;"></div>
                    </div>
                    <div class="modal-footer" style="border-top:1px solid rgba(255,255,255,0.1);gap:8px;">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal" style="border-radius:10px;">
                            <i class="fa-solid fa-xmark"></i> Fechar
                        </button>
                        <button type="button" class="btn" onclick="ModalInjector.imprimirLabel()"
                            style="background:linear-gradient(135deg,#a8c91d,#0b5c39);color:#fff;border-radius:10px;font-weight:600;">
                            <i class="fa-solid fa-print"></i> Imprimir
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }
};

// ============ EXPORTAR PARA ESCOPO GLOBAL ============
window.ModalInjector = ModalInjector;
window.abrirModalNovo       = () => ModalInjector.abrirNovo();
window.abrirModalEditar     = (seq) => ModalInjector.abrirEditar(seq);
window.salvarMovimentacao   = () => ModalInjector.salvar();
window.deletarMovimentacao  = (nroUnico, seq) => ModalInjector.deletar(nroUnico, seq);
window.imprimirEtiqueta        = (seq) => ModalInjector.abrirImpressao(seq);
window.imprimirTodasEtiquetas  = (nro, cam) => ModalInjector.imprimirTodasEtiquetas(nro, cam);

console.log('✅ modal.js carregado - ModalInjector pronto');