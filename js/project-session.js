(function() {
    'use strict';
    
    const PROJECT_SESSION_KEY = 'openmind_current_project';
    const PROJECT_TIMEOUT = 24 * 60 * 60 * 1000; // 24 horas en ms
    
    class ProjectSessionManager {
        constructor() {
            this.init();
        }
        
        init() {
            console.log('🔧 ProjectSessionManager iniciado');
            
            // Capturar parámetros de URL al cargar
            this.captureProjectFromURL();
            
            // Asegurar parámetros en la URL actual
            this.ensureProjectInURL();
            
            // Interceptar navegación
            this.interceptNavigation();
            
            // Limpiar sesiones expiradas
            this.cleanExpiredSessions();
            
            // Heartbeat para mantener sesión activa
            this.startHeartbeat();
        }
        
        captureProjectFromURL() {
            const urlParams = new URLSearchParams(window.location.search);
            const projectId = urlParams.get('project');
            const projectCode = urlParams.get('code');
            
            if (projectId && projectCode) {
                console.log('📊 Capturando proyecto de URL:', projectId);
                this.saveProjectSession(projectId, projectCode);
            }
        }
        
        saveProjectSession(projectId, projectCode) {
            const sessionData = {
                projectId: projectId,
                projectCode: projectCode,
                timestamp: Date.now(),
                lastActivity: Date.now()
            };
            
            try {
                localStorage.setItem(PROJECT_SESSION_KEY, JSON.stringify(sessionData));
                console.log('💾 Sesión de proyecto guardada:', projectId);
            } catch (error) {
                console.error('❌ Error guardando sesión:', error);
            }
        }
        
        getProjectSession() {
            try {
                const sessionStr = localStorage.getItem(PROJECT_SESSION_KEY);
                if (!sessionStr) return null;
                
                const session = JSON.parse(sessionStr);
                
                // Verificar si la sesión no ha expirado
                if (Date.now() - session.timestamp > PROJECT_TIMEOUT) {
                    console.log('⏰ Sesión de proyecto expirada');
                    this.clearProjectSession();
                    return null;
                }
                
                return session;
            } catch (error) {
                console.error('❌ Error leyendo sesión:', error);
                return null;
            }
        }
        
        clearProjectSession() {
            localStorage.removeItem(PROJECT_SESSION_KEY);
            console.log('🗑️ Sesión de proyecto eliminada');
        }
        
        ensureProjectInURL() {
            const currentSession = this.getProjectSession();
            if (!currentSession) return;
            
            const urlParams = new URLSearchParams(window.location.search);
            const urlProjectId = urlParams.get('project');
            
            // Si la URL no tiene el proyecto pero hay sesión activa, agregarla
            if (!urlProjectId && currentSession.projectId) {
                console.log('🔗 Restaurando parámetros de proyecto en URL');
                
                urlParams.set('project', currentSession.projectId);
                urlParams.set('code', currentSession.projectCode);
                
                const newURL = window.location.pathname + '?' + urlParams.toString();
                window.history.replaceState({}, '', newURL);
            }
        }
        
        interceptNavigation() {
            // Interceptar clicks en enlaces
            document.addEventListener('click', (e) => {
                const link = e.target.closest('a');
                if (!link) return;
                
                const href = link.getAttribute('href');
                if (!href || href.startsWith('http') || href.startsWith('#')) return;
                
                // Solo procesar enlaces internos
                if (this.isInternalPage(href)) {
                    e.preventDefault();
                    this.navigateToPageWithProject(href);
                }
            });
            
            // Interceptar cambios de página programáticos
            const originalPushState = history.pushState;
            const originalReplaceState = history.replaceState;
            
            history.pushState = (...args) => {
                this.updateLastActivity();
                return originalPushState.apply(history, args);
            };
            
            history.replaceState = (...args) => {
                this.updateLastActivity();
                return originalReplaceState.apply(history, args);
            };
        }
        
        isInternalPage(href) {
            const internalPages = [
                'dashboard.html',
                'discussions.html',
                'code-editor.html',
                'members.html',
                'voice-calls.html',
                'settings.html'
            ];
            
            return internalPages.some(page => href.includes(page));
        }
        
        navigateToPageWithProject(href) {
            const session = this.getProjectSession();
            if (!session) {
                console.log('⚠️ No hay sesión activa, navegando sin parámetros');
                window.location.href = href;
                return;
            }
            
            // Detectar si estamos en localhost y preservar la carpeta base
            let baseURL;
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                // En localhost, usar la ruta actual como base
                const currentPath = window.location.pathname;
                const basePath = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
                baseURL = window.location.origin + basePath;
            } else {
                // En producción, usar el origin
                baseURL = window.location.origin + '/';
            }
            
            const url = new URL(href, baseURL);
            url.searchParams.set('project', session.projectId);
            url.searchParams.set('code', session.projectCode);
            
            console.log('🚀 Navegando con proyecto:', url.toString());
            window.location.href = url.toString();
        }
        
        updateLastActivity() {
            const session = this.getProjectSession();
            if (session) {
                session.lastActivity = Date.now();
                localStorage.setItem(PROJECT_SESSION_KEY, JSON.stringify(session));
            }
        }
        
        cleanExpiredSessions() {
            const session = this.getProjectSession();
            if (!session) return;
            
            // Si han pasado más de 30 minutos sin actividad, limpiar
            const ACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos
            if (Date.now() - session.lastActivity > ACTIVITY_TIMEOUT) {
                console.log('🧹 Limpiando sesión por inactividad');
                this.clearProjectSession();
                // Opcional: redirigir al dashboard sin proyecto
                // window.location.href = 'dashboard.html';
            }
        }
        
        startHeartbeat() {
            // Actualizar actividad cada 5 minutos
            setInterval(() => {
                this.updateLastActivity();
                this.cleanExpiredSessions();
            }, 5 * 60 * 1000);
        }
        
        // Métodos públicos para usar en otras páginas
        getCurrentProject() {
            const session = this.getProjectSession();
            return session ? {
                projectId: session.projectId,
                projectCode: session.projectCode
            } : null;
        }
        
        isProjectActive() {
            return !!this.getProjectSession();
        }
        
        forceNavigateWithProject(page) {
            this.navigateToPageWithProject(page);
        }
        
        extendSession() {
            this.updateLastActivity();
        }
    }
    
    // Inicializar automáticamente
    const sessionManager = new ProjectSessionManager();
    
    // Exponer globalmente
    window.ProjectSession = sessionManager;
    
    // Event listener para detectar cambios de visibilidad
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            sessionManager.updateLastActivity();
            sessionManager.ensureProjectInURL();
        }
    });
    
    // Event listener para antes de cerrar la página
    window.addEventListener('beforeunload', () => {
        sessionManager.updateLastActivity();
    });
    
    console.log('✅ Project Session Manager cargado globalmente');
})();