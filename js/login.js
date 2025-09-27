const SUPABASE_URL = 'https://jatcscioqvicmiofsuqt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphdGNzY2lvcXZpY21pb2ZzdXF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2ODUwNDcsImV4cCI6MjA3MjI2MTA0N30.wZ2dXWG7jq7zhzorqKoQYF7I6xz49k2xaFsouQRscGQ';

// Inicializar cliente de Supabase con validación
let supabaseClient;

// Referencias DOM
let tabButtons, loginForm, registerForm, errorMessage, successMessage;

// Variables para tema e idioma
let currentTheme = localStorage.getItem('theme') || 'dark';
let currentLanguage = localStorage.getItem('language') || 'es';

// Idiomas soportados (igual que en index)
const supportedLanguages = {
    'en': { name: 'English', flag: '🇺🇸' },
    'es': { name: 'Español', flag: '🇪🇸' },
    'fr': { name: 'Français', flag: '🇫🇷' },
    'de': { name: 'Deutsch', flag: '🇩🇪' },
    'it': { name: 'Italiano', flag: '🇮🇹' },
    'pt': { name: 'Português', flag: '🇵🇹' },
    'ru': { name: 'Русский', flag: '🇷🇺' },
    'ja': { name: '日本語', flag: '🇯🇵' },
    'ko': { name: '한국어', flag: '🇰🇷' },
    'zh': { name: '中文', flag: '🇨🇳' },
    'ar': { name: 'العربية', flag: '🇸🇦' },
    'hi': { name: 'हिंदी', flag: '🇮🇳' },
    'nl': { name: 'Nederlands', flag: '🇳🇱' }
};

// Traducciones completas para login
const translations = {
    es: {
        'common.themeToggle': 'Cambiar Tema',
        'common.language': 'Idioma',
        'common.back': 'Volver',
        'login.title': 'Bienvenido',
        'login.subtitle': 'Inicia sesión o crea tu cuenta para continuar',
        'login.loginTab': 'Iniciar Sesión',
        'login.registerTab': 'Registrarse',
        'login.email': 'Email',
        'login.password': 'Contraseña',
        'login.fullName': 'Nombre completo',
        'login.confirmPassword': 'Confirmar contraseña',
        'login.loginBtn': 'Iniciar Sesión',
        'login.registerBtn': 'Crear Cuenta',
        'login.forgotPassword': '¿Olvidaste tu contraseña?'
    },
    en: {
        'common.themeToggle': 'Toggle Theme',
        'common.language': 'Language',
        'common.back': 'Back',
        'login.title': 'Welcome',
        'login.subtitle': 'Sign in or create your account to continue',
        'login.loginTab': 'Sign In',
        'login.registerTab': 'Register',
        'login.email': 'Email',
        'login.password': 'Password',
        'login.fullName': 'Full Name',
        'login.confirmPassword': 'Confirm Password',
        'login.loginBtn': 'Sign In',
        'login.registerBtn': 'Create Account',
        'login.forgotPassword': 'Forgot your password?'
    },
    fr: {
        'common.themeToggle': 'Changer le thème',
        'common.language': 'Langue',
        'common.back': 'Retour',
        'login.title': 'Bienvenue',
        'login.subtitle': 'Connectez-vous ou créez votre compte pour continuer',
        'login.loginTab': 'Se connecter',
        'login.registerTab': "S'inscrire",
        'login.email': 'Email',
        'login.password': 'Mot de passe',
        'login.fullName': 'Nom complet',
        'login.confirmPassword': 'Confirmer le mot de passe',
        'login.loginBtn': 'Se connecter',
        'login.registerBtn': 'Créer un compte',
        'login.forgotPassword': 'Mot de passe oublié?'
    }
};

// Función para obtener traducción
function t(key) {
    return translations[currentLanguage] && translations[currentLanguage][key] 
        ? translations[currentLanguage][key] 
        : translations['es'][key] || key;
}

// Esperar a que el DOM cargue completamente
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si Supabase está disponible
    if (typeof supabase === 'undefined') {
        console.error('Supabase no está cargado');
        showError('Error: No se pudo cargar el sistema de autenticación. Por favor recarga la página.');
        return;
    }

    // Inicializar cliente de Supabase
    try {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Cliente de Supabase inicializado correctamente');
    } catch (error) {
        console.error('Error inicializando Supabase:', error);
        showError('Error inicializando el sistema. Por favor recarga la página.');
        return;
    }

    // Inicializar referencias DOM
    initializeDOMReferences();

    // Inicializar tema e idioma
    initializeThemeAndLanguage();

    // Verificar si ya está logueado
    checkExistingSession();

    // Configurar event listeners
    setupEventListeners();
});

// Inicializar tema e idioma
function initializeThemeAndLanguage() {
    // Aplicar tema
    document.body.setAttribute('data-theme', currentTheme);
    updateThemeIcon();
    
    // Aplicar idioma
    updateLanguageContent();
    generateLanguageDropdown();
}

// Cambiar tema
function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const themeIcon = document.querySelector('.control-btn i.fa-moon, .control-btn i.fa-sun');
    if (themeIcon) {
        themeIcon.className = `fas fa-${currentTheme === 'dark' ? 'sun' : 'moon'}`;
    }
}

// Generar dropdown de idiomas
function generateLanguageDropdown() {
    const dropdown = document.getElementById('languageDropdown');
    if (dropdown) {
        dropdown.innerHTML = Object.entries(supportedLanguages).map(([code, lang]) => 
            `<div class="language-option ${currentLanguage === code ? 'active' : ''}" 
                  onclick="changeLanguage('${code}')">
                ${lang.flag} ${lang.name}
             </div>`
        ).join('');
    }
}

// Cambiar idioma
function changeLanguage(lang) {
    if (supportedLanguages[lang]) {
        currentLanguage = lang;
        localStorage.setItem('language', lang);
        updateLanguageContent();
        generateLanguageDropdown();
        
        const dropdown = document.getElementById('languageDropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    }
}

// Actualizar contenido del idioma
function updateLanguageContent() {
    // Actualizar elementos con data-i18n
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const translation = t(key);
        if (translation && translation !== key) {
            element.textContent = translation;
        }
    });
    
    // Actualizar textos específicos que no tienen data-i18n
    updateSpecificTexts();
}




function updateSpecificTexts() {
    // Actualizar título y subtítulo
    const authTitle = document.querySelector('.auth-title');
    const authSubtitle = document.querySelector('.auth-subtitle');
    
    if (authTitle) authTitle.textContent = t('login.title');
    if (authSubtitle) authSubtitle.textContent = t('login.subtitle');
    
    // Actualizar tabs
    const tabs = document.querySelectorAll('.tab-btn');
    if (tabs.length >= 2) {
        tabs[0].textContent = t('login.loginTab');
        tabs[1].textContent = t('login.registerTab');
    }

    // Actualizar labels de formularios
    const labels = document.querySelectorAll('.form-label');
    labels.forEach((label, index) => {
        const input = label.nextElementSibling;
        if (input) {
            const id = input.id;
            if (id.includes('email')) {
                label.textContent = t('login.email');
            } else if (id.includes('password') && !id.includes('confirm')) {
                label.textContent = t('login.password');
            } else if (id.includes('name')) {
                label.textContent = t('login.fullName');
            } else if (id.includes('confirm')) {
                label.textContent = t('login.confirmPassword');
            }
        }
    });

    // Actualizar botones
    const loginBtn = document.querySelector('#login-btn .btn-text');
    const registerBtn = document.querySelector('#register-btn .btn-text');
    const forgotLink = document.querySelector('#forgot-password');

    if (loginBtn) loginBtn.textContent = t('login.loginBtn');
    if (registerBtn) registerBtn.textContent = t('login.registerBtn');
    if (forgotLink) forgotLink.textContent = t('login.forgotPassword');
}

// Toggle dropdown
function toggleLanguageDropdown() {
    const dropdown = document.getElementById('languageDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// Inicializar referencias DOM
function initializeDOMReferences() {
    tabButtons = document.querySelectorAll('.tab-btn');
    loginForm = document.getElementById('login-form');
    registerForm = document.getElementById('register-form');
    errorMessage = document.getElementById('error-message');
    successMessage = document.getElementById('success-message');
}

// Verificar sesión existente
// Verificar sesión existente
async function checkExistingSession() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (session) {
            // Si hay sesión, redirigir directamente al perfil
            window.location.href = './perfil/profile.html';
        }
    } catch (error) {
        console.error('Error checking session:', error);
    }
}

// Configurar todos los event listeners
function setupEventListeners() {
    // Cambio de tabs
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            
            // Remover clase active de todos los botones
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Mostrar/ocultar formularios
            if (tab === 'login') {
                loginForm.classList.remove('hidden');
                registerForm.classList.add('hidden');
            } else {
                loginForm.classList.add('hidden');
                registerForm.classList.remove('hidden');
            }
            
            hideMessages();
        });
    });

    // Form de login
    const loginFormElement = document.getElementById('loginForm');
    if (loginFormElement) {
        loginFormElement.addEventListener('submit', handleLogin);
    }

    // Form de registro
    const registerFormElement = document.getElementById('registerForm');
    if (registerFormElement) {
        registerFormElement.addEventListener('submit', handleRegister);
    }

    // Forgot password
    const forgotPasswordLink = document.getElementById('forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', handleForgotPassword);
    }

    // Parallax effect
    window.addEventListener('scroll', handleParallax);
}

// Utilidades para mensajes
function showError(message) {
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    }
    if (successMessage) {
        successMessage.classList.add('hidden');
    }
    console.error('Error:', message);
}

function showSuccess(message) {
    if (successMessage) {
        successMessage.textContent = message;
        successMessage.classList.remove('hidden');
    }
    if (errorMessage) {
        errorMessage.classList.add('hidden');
    }
    console.log('Success:', message);
}

function hideMessages() {
    if (errorMessage) {
        errorMessage.classList.add('hidden');
    }
    if (successMessage) {
        successMessage.classList.add('hidden');
    }
}

// Utilidad para loading states
function setLoading(buttonId, isLoading) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;
    
    const btnText = btn.querySelector('.btn-text');
    if (!btnText) return;
    
    if (isLoading) {
        btn.disabled = true;
        btnText.innerHTML = '<div class="loading"></div>';
    } else {
        btn.disabled = false;
        btnText.textContent = buttonId === 'login-btn' ? t('login.loginBtn') : t('login.registerBtn');
    }
}

// Manejar login

async function handleLogin(e) {
    e.preventDefault();
    
    if (!supabaseClient) {
        showError('Sistema no inicializado. Por favor recarga la página.');
        return;
    }
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        showError('Por favor completa todos los campos');
        return;
    }
    
    setLoading('login-btn', true);
    hideMessages();
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });
        
        if (error) throw error;
        
        showSuccess('¡Inicio de sesión exitoso! Redirigiendo...');
        
        // Redirigir directamente al perfil
        setTimeout(() => {
            window.location.href = './perfil/profile.html';
        }, 1500);
        
    } catch (error) {
        console.error('Login error:', error);
        showError(error.message === 'Invalid login credentials' ? 
            'Credenciales incorrectas' : error.message);
    } finally {
        setLoading('login-btn', false);
    }
}


// Manejar registro

async function handleRegister(e) {
    e.preventDefault();
    
    if (!supabaseClient) {
        showError('Sistema no inicializado. Por favor recarga la página.');
        return;
    }
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm').value;
    
    // Validaciones
    if (!name || !email || !password || !confirmPassword) {
        showError('Por favor completa todos los campos');
        return;
    }

    if (password !== confirmPassword) {
        showError('Las contraseñas no coinciden');
        return;
    }

    if (password.length < 6) {
        showError('La contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    setLoading('register-btn', true);
    hideMessages();
    
    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name,
                }
            }
        });
        
        if (error) throw error;
        
        if (data?.user?.email_confirmed_at) {
            showSuccess('¡Cuenta creada! Redirigiendo...');
            // Redirigir directamente al perfil
            setTimeout(() => {
                window.location.href = './perfil/profile.html';
            }, 1500);
        } else {
            showSuccess('¡Cuenta creada! Revisa tu email para confirmar tu cuenta.');
        }
        
    } catch (error) {
        console.error('Register error:', error);
        let errorMsg = error.message;
        if (error.message.includes('already registered')) {
            errorMsg = 'Este email ya está registrado';
        } else if (error.message.includes('Password should be at least')) {
            errorMsg = 'La contraseña debe tener al menos 6 caracteres';
        }
        showError(errorMsg);
    } finally {
        setLoading('register-btn', false);
    }
}

// Manejar forgot password
async function handleForgotPassword(e) {
    e.preventDefault();
    
    if (!supabaseClient) {
        showError('Sistema no inicializado. Por favor recarga la página.');
        return;
    }
    
    const email = document.getElementById('login-email').value;
    
    if (!email) {
        showError('Por favor ingresa tu email en el campo de login');
        return;
    }
    
    try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html'
        });
        
        if (error) throw error;
        
        showSuccess('Te hemos enviado un enlace para restablecer tu contraseña');
        
    } catch (error) {
        console.error('Forgot password error:', error);
        showError('Error: ' + error.message);
    }
}

// Efecto parallax
function handleParallax() {
    const scrolled = window.pageYOffset;
    const dots = document.querySelectorAll('.floating-dot');
    
    dots.forEach((dot, index) => {
        const speed = 0.5 + (index * 0.1);
        dot.style.transform = `translateY(${scrolled * speed}px)`;
    });
}

// Cerrar dropdown al hacer clic fuera
document.addEventListener('click', function(event) {
    const languageSelector = document.querySelector('.language-selector');
    const dropdown = document.getElementById('languageDropdown');
    
    if (dropdown && languageSelector && !languageSelector.contains(event.target)) {
        dropdown.classList.remove('show');
    }
});