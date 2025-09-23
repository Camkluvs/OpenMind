// js/main.js - Archivo principal de inicialización

document.addEventListener('DOMContentLoaded', function() {
    // Mantener las estrellas
    maintainStars();
    
    // Inicializar la aplicación
    initializeApp();
});

function initializeApp() {
    // Inicializar cliente de Supabase si está disponible
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        checkAuthAndUpdateHeader();
    } else {
        showBasicHeader();
    }

    // Aplicar tema guardado
    applyTheme();
    
    // Inicializar animaciones y efectos
    initSmoothScroll();
    initScrollAnimations();
    initAllAnimations();
    
    // Iniciar efecto de escritura después de un delay
    setTimeout(initTypingEffect, 2000);
}