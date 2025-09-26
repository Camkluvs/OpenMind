// js/auth.js - Funciones de autenticación

async function checkAuthAndUpdateHeader() {
    try {
        if (!supabaseClient) return showBasicHeader();
        
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        const headerContent = document.getElementById('header-content');
        
        if (session && session.user) {
            // Guardar usuario actual para las notificaciones
            window.currentUser = session.user;
            
            const userName = session.user.user_metadata?.full_name || 
                           session.user.user_metadata?.name || 
                           session.user.email.split('@')[0];
            
            headerContent.innerHTML = `
                <div class="header-controls">
                    <button class="control-btn" onclick="toggleTheme()">
                        <i class="fas fa-palette"></i>
                        <span>Cambiar Tema</span>
                    </button>
                    ${generateLanguageSelector()}
                    
                    <!-- Notificaciones -->
                    <div class="notifications-container">
                        <button class="control-btn notifications-btn" onclick="toggleNotifications()">
                            <i class="fas fa-bell"></i>
                            <span class="notification-count" id="notificationCount" style="display: none;">0</span>
                        </button>
                        <div class="notifications-dropdown" id="notificationsDropdown">
                            <div class="notifications-header">
                                <h4>Notificaciones</h4>
                            </div>
                            <div class="notifications-list" id="notificationsList">
                                <div class="notification-item loading">Cargando...</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="user-menu">
                        <div class="user-menu-toggle" onclick="toggleUserMenu()">
                            <img class="user-avatar-small" id="headerAvatarImg" src="" alt="Avatar" style="display: none;">
                            <span id="headerUserName">${userName}</span>
                            <i class="fas fa-chevron-down"></i>
                        </div>
                        <div class="user-dropdown" id="userDropdown">
                            <a href="perfil/profile.html" class="user-dropdown-item">
                                <i class="fas fa-user"></i>
                                Mi Perfil
                            </a>
                            <a href="perfil/settings-perfil.html" class="user-dropdown-item">
                                <i class="fas fa-cog"></i>
                                Configuración
                            </a>
                            <hr style="margin: 8px 0; border: none; border-top: 1px solid var(--border-color);">
                            <div class="user-dropdown-item logout" onclick="handleLogout()">
                                <i class="fas fa-sign-out-alt"></i>
                                Cerrar Sesión
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // IMPORTANTE: Actualizar header del usuario DESPUÉS de renderizar el HTML
            await updateUserHeader();
            
            // Cargar notificaciones después de actualizar el header
            setTimeout(() => {
                if (typeof loadNotificationCount === 'function') {
                    loadNotificationCount();
                }
            }, 500);
            
        } else {
            showBasicHeader();
        }
    } catch (error) {
        console.error('Error checking auth:', error);
        showBasicHeader();
    }
}

function showBasicHeader() {
    const headerContent = document.getElementById('header-content');
    if (headerContent) {
        headerContent.innerHTML = `
            <div class="header-controls">
                <button class="control-btn" onclick="toggleTheme()">
                    <i class="fas fa-palette"></i>
                    <span>Cambiar Tema</span>
                </button>
                ${generateLanguageSelector()}
                <a href="login.html" class="cta-button">
                    Acceder
                </a>
            </div>
        `;
    }
}

async function handleLogout() {
    try {
        if (!supabaseClient) {
            alert('Error: Cliente de Supabase no inicializado');
            return;
        }
        
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        
        // Limpiar currentUser
        window.currentUser = null;
        
        checkAuthAndUpdateHeader();
        alert('Sesión cerrada exitosamente');
        
    } catch (error) {
        console.error('Error logging out:', error);
        alert('Error: ' + error.message);
    }
}

// Función para toggle del user menu
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// Función para actualizar el header con avatar del usuario
async function updateUserHeader() {
    console.log('updateUserHeader iniciado');
    console.log('currentUser:', window.currentUser);
    
    if (!window.currentUser) {
        console.log('currentUser no disponible aún');
        return;
    }
    
    try {
        console.log('Obteniendo perfil para usuario:', window.currentUser.id);
        
        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', window.currentUser.id)
            .single();

        if (error) {
            console.log('Error obteniendo perfil:', error);
        } else {
            console.log('Perfil obtenido:', profile);
        }

        const userName = profile?.full_name || 
                        window.currentUser.user_metadata?.full_name || 
                        window.currentUser.user_metadata?.name || 
                        window.currentUser.email.split('@')[0];
        
        console.log('Nombre del usuario:', userName);
        
        // Actualizar nombre
        const headerUserName = document.getElementById('headerUserName');
        if (headerUserName) {
            headerUserName.textContent = userName;
            console.log('Nombre actualizado en el DOM');
        } else {
            console.error('Elemento headerUserName no encontrado');
        }

        // Actualizar avatar
        const avatarImg = document.getElementById('headerAvatarImg');
        if (avatarImg) {
            console.log('Elemento avatar encontrado, actualizando...');
            const initials = userName.split(' ').map(word => word.charAt(0)).join('').substring(0, 2).toUpperCase();
            
            if (profile?.avatar_url && profile.avatar_url.trim() !== '') {
                console.log('URL de avatar encontrada:', profile.avatar_url);
                avatarImg.src = profile.avatar_url;
                avatarImg.style.display = 'block';
                
                avatarImg.onload = () => {
                    console.log('Imagen de perfil cargada correctamente');
                };
                
                avatarImg.onerror = () => {
                    console.log('Error cargando imagen, usando iniciales');
                    setInitialsAvatar(avatarImg, userName, initials);
                };
            } else {
                console.log('No hay imagen de perfil, usando iniciales:', initials);
                setInitialsAvatar(avatarImg, userName, initials);
            }
        } else {
            console.error('Elemento headerAvatarImg no encontrado');
        }

    } catch (error) {
        console.error('Error updating user header:', error);
        
        const userName = window.currentUser.email.split('@')[0];
        const headerUserName = document.getElementById('headerUserName');
        const avatarImg = document.getElementById('headerAvatarImg');
        
        if (headerUserName) {
            headerUserName.textContent = userName;
            console.log('Nombre de fallback asignado');
        }
        
        if (avatarImg) {
            const initials = userName.substring(0, 2).toUpperCase();
            setInitialsAvatar(avatarImg, userName, initials);
            console.log('Avatar de fallback asignado');
        }
    }
}

function setInitialsAvatar(avatarElement, userName, initials) {
    console.log('Creando avatar con iniciales:', initials);
    
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=4a9eff&color=ffffff&size=128&rounded=true&bold=true`;
    
    avatarElement.src = avatarUrl;
    avatarElement.style.display = 'block';
    
    avatarElement.onload = () => {
        console.log('Avatar con iniciales cargado:', initials);
    };
    
    avatarElement.onerror = () => {
        console.log('UI Avatars falló, creando avatar CSS');
        createCSSAvatar(avatarElement, initials);
    };
}

function createCSSAvatar(avatarElement, initials) {
    console.log('Creando avatar CSS con iniciales:', initials);
    
    avatarElement.style.display = 'none';
    
    let cssAvatar = avatarElement.parentNode.querySelector('.css-avatar');
    
    if (!cssAvatar) {
        cssAvatar = document.createElement('div');
        cssAvatar.className = 'css-avatar';
        avatarElement.parentNode.insertBefore(cssAvatar, avatarElement);
    }
    
    cssAvatar.textContent = initials;
    cssAvatar.style.cssText = `
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: linear-gradient(135deg, #4a9eff, #00d4ff);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 11px;
        border: 2px solid #4a9eff;
        flex-shrink: 0;
        font-family: inherit;
    `;
    
    console.log('Avatar CSS creado con iniciales:', initials);
}

// Cerrar dropdown del user menu al hacer clic fuera
document.addEventListener('click', function(event) {
    const userMenu = document.querySelector('.user-menu');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userDropdown && userMenu && !userMenu.contains(event.target)) {
        userDropdown.classList.remove('show');
    }
});

// Función para debug - puedes llamarla desde la consola
function debugUserInfo() {
    console.log('=== DEBUG USER INFO ===');
    console.log('currentUser:', window.currentUser);
    console.log('headerUserName element:', document.getElementById('headerUserName'));
    console.log('headerAvatarImg element:', document.getElementById('headerAvatarImg'));
    console.log('supabaseClient:', typeof supabaseClient !== 'undefined' ? 'definido' : 'no definido');
}

window.updateUserHeader = updateUserHeader;
window.toggleUserMenu = toggleUserMenu;
window.debugUserInfo = debugUserInfo