// profile-redirect.js - Script global para redirección al perfil
(function() {
    'use strict';
    
    // Función para redireccionar al perfil
    function redirectToProfile() {
        // Obtener el projectId actual si existe
        const currentProject = window.ProjectSession?.getCurrentProject();
        const projectId = currentProject?.projectId;
        
        let profileUrl = 'profile.html';
        
        // Si hay un proyecto activo, agregarlo como parámetro
        if (projectId) {
            profileUrl += `?project=${projectId}`;
            
            // También agregar el código si está disponible
            if (currentProject.projectCode) {
                profileUrl += `&code=${currentProject.projectCode}`;
            }
        }
        
        window.location.href = profileUrl;
    }
    
    // Función para configurar el redireccionamiento del nombre de usuario
    function setupProfileRedirect() {
        const userNameElement = document.getElementById('user-name');
        
        if (userNameElement) {
            userNameElement.style.cursor = 'pointer';
            userNameElement.title = 'Ver mi perfil';
            userNameElement.addEventListener('click', redirectToProfile);
            
            // Agregar estilos hover
            userNameElement.addEventListener('mouseenter', function() {
                this.style.color = '#00d4ff';
                this.style.textDecoration = 'underline';
            });
            
            userNameElement.addEventListener('mouseleave', function() {
                this.style.color = '';
                this.style.textDecoration = 'none';
            });
        }
    }
    
    // Función para hacer clickeable el avatar del header
    function makeHeaderAvatarClickable() {
        const headerAvatar = document.querySelector('.user-menu-toggle');
        if (headerAvatar) {
            headerAvatar.style.cursor = 'pointer';
            
            headerAvatar.addEventListener('click', function(e) {
                // Solo redireccionar si no se hizo clic en el dropdown o icono de chevron
                if (!e.target.closest('.user-dropdown') && 
                    !e.target.classList.contains('fa-chevron-down')) {
                    e.stopPropagation();
                    redirectToProfile();
                }
            });
        }
    }
    
    // Función para hacer clickeables las iniciales del avatar
    function setupInitialsAvatarClick() {
        const initialsAvatar = document.getElementById('headerAvatarInitials');
        if (initialsAvatar) {
            initialsAvatar.style.cursor = 'pointer';
            initialsAvatar.title = 'Ver mi perfil';
            initialsAvatar.addEventListener('click', redirectToProfile);
        }
    }
    
    // Función para hacer clickeable la imagen del avatar
    function setupAvatarImageClick() {
        const avatarImage = document.getElementById('headerAvatarImg');
        if (avatarImage) {
            avatarImage.style.cursor = 'pointer';
            avatarImage.title = 'Ver mi perfil';
            avatarImage.addEventListener('click', redirectToProfile);
        }
    }
    
    // Función principal de inicialización
    function initProfileRedirect() {
        // Esperar a que el DOM esté completamente cargado
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initProfileRedirect);
            return;
        }
        
        // Configurar todos los elementos clickeables
        setupProfileRedirect();
        makeHeaderAvatarClickable();
        setupInitialsAvatarClick();
        setupAvatarImageClick();
        
        console.log('✅ Profile redirect system initialized');
    }
    
    // Inicializar cuando se cargue el script
    initProfileRedirect();
    
    // Hacer disponible globalmente para inicialización manual si es necesario
    window.ProfileRedirect = {
        init: initProfileRedirect,
        redirectToProfile: redirectToProfile
    };
})();