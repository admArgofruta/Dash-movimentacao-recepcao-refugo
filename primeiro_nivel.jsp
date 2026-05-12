<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" isELIgnored="false"%>
<!DOCTYPE html>
<%@ page import="java.util.*" %>
<%@ taglib uri="http://java.sun.com/jstl/core_rt" prefix="c" %>
<%@ taglib prefix="snk" uri="/WEB-INF/tld/sankhyaUtil.tld" %>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt" %>
<%@ page import="br.com.sankhya.modelcore.auth.AuthenticationInfo" %>

<%
    // 🔹 CORREÇÃO DE ENCODING (acentuação: ç, ã, é, etc.)
    response.setContentType("text/html; charset=UTF-8");
    javax.servlet.jsp.jstl.core.Config.set(request, javax.servlet.jsp.jstl.core.Config.FMT_LOCALE, new java.util.Locale("pt", "BR"));
    
    String idUsuario = ((AuthenticationInfo) session.getAttribute("usuarioLogado")).getUserID().toString();
%>

<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <title>Movimentação de Saldos - Dashboard</title>
    
    <snk:load/>
    
    <!-- Font Awesome 6 -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" />
    
    <!-- Google Fonts - Inter -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
    
    <!-- AOS - Animate on Scroll -->
    <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet" />
    
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Bootstrap Icons -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css" rel="stylesheet">
    
    <!-- 🔹 CSS do Dashboard -->
    <link href="${BASE_FOLDER}/assets/css/style.css" rel="stylesheet" />
    
    <!-- JsBarcode - geração de código de barras -->
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>

    <!-- 🔹 Bibliotecas JS -->
    <script src="https://cdn.jsdelivr.net/gh/wansleynery/SankhyaJX@main/jx.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/jquery@3.5.1/dist/jquery.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
    <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
</head>

<body>
    <!-- Glow Orbs -->
    <div class="glow-orb orb1"></div>
    <div class="glow-orb orb2"></div>

    <!-- Particles -->
    <div class="particles" id="particles"></div>

    <!-- Toast Container -->
    <div class="toast-container" id="toastContainer"></div>

    <div class="app-container">
        <!-- SIDEBAR -->
        <aside class="sidebar" id="sidebar">
            <div class="logo-container">
                <img src="https://argofruta.com/wp-content/uploads/2021/05/Logo-text-green.png"
                     alt="Argo Fruta"
                     style="height:40px;object-fit:contain;max-width:140px;"
                     onerror="this.style.display='none';document.getElementById('logoFallback').style.display='flex';">
                <div id="logoFallback" style="display:none;align-items:center;gap:10px;">
                    <div class="logo-icon"><i class="fa-solid fa-leaf"></i></div>
                    <span class="logo-text">ARGOFRUTA</span>
                </div>
            </div>

            <div class="menu-category">Operacional</div>
            <ul class="menu">
                <li>
                    <a href="#" class="active">
                        <i class="fa-solid fa-chart-line"></i>
                        Dashboard
                        <span class="menu-badge">AO VIVO</span>
                    </a>
                </li>
                <li>
                    <a href="#" onclick="document.getElementById('truckContainer').scrollIntoView({behavior:'smooth'});return false;">
                        <i class="fa-solid fa-truck"></i>
                        Recepção
                    </a>
                </li>
                <li>
                    <a href="#" onclick="biparPallet();return false;">
                        <i class="fa-solid fa-barcode"></i>
                        Bipagem
                        <span class="menu-badge" style="background:rgba(168,201,29,0.2);color:#a8c91d;">SCANNER</span>
                    </a>
                </li>
                <li>
                    <a href="#" onclick="UI.showToast('Embalagem em desenvolvimento','info');return false;"
                       style="opacity:0.55;">
                        <i class="fa-solid fa-boxes-stacked"></i>
                        Embalagem
                        <span class="menu-badge" style="background:rgba(255,255,255,0.08);color:#666;">EM BREVE</span>
                    </a>
                </li>
                <li>
                    <a href="#" onclick="document.getElementById('refugoGrid')?.scrollIntoView({behavior:'smooth'});return false;">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        Refugo
                    </a>
                </li>
                <li>
                    <a href="#" onclick="UI.showToast('Histórico em desenvolvimento','info');return false;"
                       style="opacity:0.55;">
                        <i class="fa-solid fa-clock-rotate-left"></i>
                        Histórico
                        <span class="menu-badge" style="background:rgba(255,255,255,0.08);color:#666;">EM BREVE</span>
                    </a>
                </li>
            </ul>
        </aside>

        <!-- MAIN CONTENT -->
        <main class="main-content" id="mainContent">
            
            <!-- TOP BAR -->
            <div class="topbar" data-aos="fade-down" data-aos-duration="600">
                <div class="title-section">
                    <h1>MOVIMENTAÇÃO DE SALDOS</h1>
                    <div class="subtitle">
                        <span class="live-dot"></span>
                        Monitoramento em tempo real • Recepção de Frutos
                    </div>
                </div>

                <div class="topbar-actions">
                    <button class="btn-refresh" onclick="refreshData()" id="btnRefresh" title="Atualizar dados">
                        <i class="fa-solid fa-rotate"></i>
                    </button>
                    <button class="theme-toggle" onclick="toggleTheme()" title="Alternar tema">
                        <i class="fa-solid fa-moon"></i>
                    </button>
                    <button class="mobile-menu-btn" onclick="toggleSidebar()">
                        <i class="fa-solid fa-bars"></i>
                    </button>
                    <div class="clock-widget" id="clock">09:00</div>
                </div>
            </div>

            <!-- STATS CARDS -->
            <section class="stats-grid" id="statsGrid">
                <div class="stat-card" data-aos="fade-up" data-aos-delay="100">
                    <div class="stat-icon entry">
                        <i class="fa-solid fa-arrow-down-wide-short"></i>
                    </div>
                    <div class="stat-label">Entrada Recepção</div>
                    <div class="stat-value" id="entradaRecepcao">
                        <span class="skeleton" style="width: 100px; height: 38px;"></span>
                    </div>
                    <div class="stat-change positive">
                        <i class="fa-solid fa-arrow-up"></i> 12%
                    </div>
                </div>

                <div class="stat-card" data-aos="fade-up" data-aos-delay="200">
                    <div class="stat-icon exit">
                        <i class="fa-solid fa-arrow-up-wide-short"></i>
                    </div>
                    <div class="stat-label">Saída Recepção</div>
                    <div class="stat-value" id="saidaRecepcao">
                        <span class="skeleton" style="width: 80px; height: 38px;"></span>
                    </div>
                    <div class="stat-change negative">
                        <i class="fa-solid fa-arrow-down"></i> 8%
                    </div>
                </div>

                <div class="stat-card" data-aos="fade-up" data-aos-delay="300">
                    <div class="stat-icon balance">
                        <i class="fa-solid fa-scale-balanced"></i>
                    </div>
                    <div class="stat-label">Saldo Matéria Prima</div>
                    <div class="stat-value" id="saldoMP">
                        <span class="skeleton" style="width: 90px; height: 38px;"></span>
                    </div>
                </div>

                <div class="stat-card" data-aos="fade-up" data-aos-delay="400">
                    <div class="stat-icon pallets">
                        <i class="fa-solid fa-pallet"></i>
                    </div>
                    <div class="stat-label">Pallets Processados</div>
                    <div class="stat-value" id="palletsProcessados">
                        <span class="skeleton" style="width: 60px; height: 38px;"></span>
                    </div>
                </div>
            </section>

            <!-- SEARCH BAR -->
            <section class="search-bar" data-aos="fade-up" data-aos-delay="200">
                <i class="fa-solid fa-magnifying-glass" style="color: rgba(255,255,255,0.4); font-size: 18px;"></i>
                <input 
                    type="text" 
                    id="searchInput" 
                    placeholder="Pesquisar/Bipar pallet... Ex: 0517-1026"
                    onkeydown="if(event.key === 'Enter') buscarPallet()"
                />
                <button class="btn btn-primary" onclick="buscarPallet()">
                    <i class="fa-solid fa-magnifying-glass"></i>
                    Buscar
                </button>
                <button class="btn btn-accent" onclick="biparPallet()">
                    <i class="fa-solid fa-barcode"></i>
                    Bipar
                </button>
                <!-- 🔹 NOVO BOTÃO -->
                <button class="btn" onclick="abrirModalNovo()" 
                    style="background: linear-gradient(135deg, #a8c91d, #0b5c39); color: #fff; border-radius: 10px; font-weight: 600;">
                    <i class="fa-solid fa-plus"></i>
                    Nova Movimentação
                </button>
            </section>

            <!-- OPERATION GRID -->
            <section class="operation-grid">
                
                <!-- LEFT: TRUCK & PALLETS -->
                <div class="panel" data-aos="fade-right" data-aos-duration="700">
                    <div class="panel-header">
                        <div class="panel-title">STATUS</div>
                        <div class="status-badge processing" id="statusBadge">
                            <i class="fa-solid fa-spinner fa-spin-pulse"></i>
                            EM PROCESSAMENTO
                        </div>
                    </div>

                    <!-- TRUCK -->
                    <div id="truckContainer"></div>

                
                </div>

                <!-- RIGHT: FLOW & RESUMO -->
                <div class="side-panel" style="display: flex; flex-direction: column; gap: 20px;">
                    
                    <!-- FLOW -->
                    <div class="panel" data-aos="fade-left" data-aos-delay="200">
                        <div class="panel-header">
                            <div class="panel-title">Fluxo Operacional</div>
                        </div>
                        <div class="flow-steps">
                            <div class="flow-step active">ROMANEIO DE ENTRADA</div>
                            <div class="flow-connector">↓</div>
                            <div class="flow-step active">SALDO RECEPÇÃO +</div>
                            <div class="flow-connector">↓</div>
                            <div class="flow-step">BIPAGEM TOMBADOR</div>
                            <div class="flow-connector">↓</div>
                            <div class="flow-step">EMBALAGEM</div>
                            <div class="flow-connector">↓</div>
                            <div class="flow-step">REFUGO</div>
                        </div>
                    </div>

                    <!-- RESUMO -->
                    <div class="panel" data-aos="fade-left" data-aos-delay="300">
                        <div class="panel-header">
                            <div class="panel-title">Resumo do Romaneio</div>
                        </div>
                        <div class="resumo-grid">
                            <div class="resumo-card">
                                <div class="resumo-label">Romaneio</div>
                                <div class="resumo-value" id="resumoRomaneio">---</div>
                            </div>
                            <div class="resumo-card">
                                <div class="resumo-label">Status</div>
                                <div class="resumo-value" id="resumoStatus">---</div>
                            </div>
                            <div class="resumo-card">
                                <div class="resumo-label">Saldo Atual</div>
                                <div class="resumo-value" id="resumoSaldo">---</div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

        </main>
    </div>

    <!-- 🔹 Usuário Logado -->
    <script>
        const USUARIO_LOGADO = '<%= idUsuario %>';
    </script>
<!-- 🔹 Sanitização -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.6/purify.min.js"></script>

<!-- 🔹 Módulos do Projeto -->
<script src="${BASE_FOLDER}/assets/js/config.js"></script>
<script src="${BASE_FOLDER}/assets/js/modules/state.js"></script>
<script src="${BASE_FOLDER}/assets/js/modules/sanitizer.js"></script>
<script src="${BASE_FOLDER}/assets/js/modules/ui.js"></script>
<script src="${BASE_FOLDER}/assets/js/modules/api.js"></script>
<script src="${BASE_FOLDER}/assets/js/modules/renderer.js"></script>
<script src="${BASE_FOLDER}/assets/js/modules/modal.js"></script>
<script src="${BASE_FOLDER}/assets/js/modules/events.js"></script>
<script src="${BASE_FOLDER}/assets/js/dashboard.js"></script>

</body>
</html>