// js/auth.js - Funciones de autenticación

async function checkAuthAndUpdateHeader() {
    try {
        if (!supabaseClient) return showBasicHeader();
        
        const { data: { session }, error } = await supabaseClient.auth.getSession();
        const headerContent = document.getElementById('header-content');
        
        if (session && session.user) {
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
                    <div class="user-info">
                        <div class="welcome-text">
                            Bienvenido, <span class="user-name">${userName}</span>
                        </div>
                        <button class="logout-btn" onclick="handleLogout()">
                            <i class="fas fa-sign-out-alt"></i> 
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            `;
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
        
        checkAuthAndUpdateHeader();
        alert('Sesión cerrada exitosamente');
        
    } catch (error) {
        console.error('Error logging out:', error);
        alert('Error: ' + error.message);
    }
}