/**
 * User Dropdown System
 * Sistema completo para el dropdown de usuario con avatar
 */

class UserDropdown {
    constructor(supabaseClient) {
        this.supabaseClient = supabaseClient;
        this.currentUser = null;
        this.userProfile = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadUserData();
    }

    setupEventListeners() {
        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', (event) => {
            const userMenu = document.querySelector('.user-menu');
            const userDropdown = document.getElementById('userDropdown');
            
            if (userDropdown && userMenu && !userMenu.contains(event.target)) {
                userDropdown.classList.remove('show');
            }
        });
    }

    async loadUserData() {
        try {
            const { data: { session }, error } = await this.supabaseClient.auth.getSession();
            
            if (error || !session) {
                console.error('No hay sesión activa');
                return;
            }

            this.currentUser = session.user;
            await this.loadUserProfile();
            this.updateHeaderDisplay();
            
        } catch (error) {
            console.error('Error cargando datos del usuario:', error);
        }
    }

    async loadUserProfile() {
        try {
            const { data: profile, error } = await this.supabaseClient
                .from('profiles')
                .select('*')
                .eq('id', this.currentUser.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            this.userProfile = profile;
            
        } catch (error) {
            console.error('Error cargando perfil:', error);
            this.userProfile = null;
        }
    }

    updateHeaderDisplay() {
        // Actualizar nombre del usuario
        const userName = this.getUserDisplayName();
        const headerUserName = document.getElementById('headerUserName');
        if (headerUserName) {
            headerUserName.textContent = userName;
        }

        // Actualizar avatar
        this.updateUserAvatar(userName);
    }

    getUserDisplayName() {
        if (this.userProfile?.full_name) {
            return this.userProfile.full_name;
        }
        
        if (this.currentUser?.user_metadata?.full_name) {
            return this.currentUser.user_metadata.full_name;
        }
        
        if (this.currentUser?.user_metadata?.name) {
            return this.currentUser.user_metadata.name;
        }
        
        return this.currentUser?.email?.split('@')[0] || 'Usuario';
    }

    updateUserAvatar(userName) {
        const avatarImg = document.getElementById('headerAvatarImg');
        if (!avatarImg) return;

        if (this.userProfile?.avatar_url) {
            avatarImg.src = this.userProfile.avatar_url;
        } else {
            // Generar avatar por defecto usando UI Avatars
            const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=4a9eff&color=fff&size=128&rounded=true`;
            avatarImg.src = avatarUrl;
        }

        // Manejar error de carga de imagen
        avatarImg.onerror = () => {
            avatarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=4a9eff&color=fff&size=128&rounded=true`;
        };
    }

    // Función pública para toggle del dropdown
    toggleDropdown() {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    }

    // Función para cerrar sesión
    async handleLogout() {
        try {
            const { error } = await this.supabaseClient.auth.signOut();
            if (error) throw error;
            
            // Limpiar datos locales
            localStorage.removeItem('current_project_id');
            localStorage.removeItem('theme');
            
            // Redirigir al login
            window.location.href = 'login.html';
            
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
            this.showNotification('Error al cerrar sesión: ' + error.message, 'error');
        }
    }

    // Función para mostrar notificaciones
    showNotification(message, type = 'success') {
        // Crear notificación temporal
        const notification = document.createElement('div');
        const bgColor = type === 'error' ? '#ff4444' : '#4a9eff';
        
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideInNotification 0.3s ease;
            max-width: 300px;
            font-size: 14px;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Auto-remover después de 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOutNotification 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    // Función para actualizar datos del usuario (pública)
    async refreshUserData() {
        await this.loadUserProfile();
        this.updateHeaderDisplay();
    }

    // Getters públicos
    getCurrentUser() {
        return this.currentUser;
    }

    getUserProfile() {
        return this.userProfile;
    }
}

// Funciones globales para compatibilidad
let userDropdownInstance = null;

function initializeUserDropdown(supabaseClient) {
    userDropdownInstance = new UserDropdown(supabaseClient);
    
    // Agregar estilos de animación si no existen
    if (!document.getElementById('user-dropdown-animations')) {
        const style = document.createElement('style');
        style.id = 'user-dropdown-animations';
        style.textContent = `
            @keyframes slideInNotification {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOutNotification {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    return userDropdownInstance;
}

function toggleUserMenu() {
    if (userDropdownInstance) {
        userDropdownInstance.toggleDropdown();
    }
}

function handleLogout() {
    if (userDropdownInstance) {
        userDropdownInstance.handleLogout();
    }
}

function refreshUserDropdown() {
    if (userDropdownInstance) {
        userDropdownInstance.refreshUserData();
    }
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UserDropdown, initializeUserDropdown, toggleUserMenu, handleLogout, refreshUserDropdown };
}

// Hacer disponibles las funciones globalmente
window.UserDropdown = UserDropdown;
window.initializeUserDropdown = initializeUserDropdown;
window.toggleUserMenu = toggleUserMenu;
window.handleLogout = handleLogout;
window.refreshUserDropdown = refreshUserDropdown;