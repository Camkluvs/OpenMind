// js/ui.js - Funciones de interfaz de usuario

function generateLanguageSelector() {
    return `
        <div class="language-selector">
            <button class="control-btn" onclick="toggleLanguageDropdown()">
                <i class="fas fa-globe"></i>
                <span>Idioma</span>
            </button>
            <div class="language-dropdown" id="languageDropdown">
                ${generateLanguageOptions()}
            </div>
        </div>
    `;
}

function generateLanguageOptions() {
    return Object.entries(supportedLanguages).map(([code, lang]) => 
        `<div class="language-option" onclick="changeLanguage('${code}')">
            ${lang.flag} ${lang.name}
         </div>`
    ).join('');
}

function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
}

function toggleLanguageDropdown() {
    const dropdown = document.getElementById('languageDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

function changeLanguage(lang) {
    console.log('Changing language to:', lang);
    // Aquí se implementaría la lógica de cambio de idioma
    const dropdown = document.getElementById('languageDropdown');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
}

// Cerrar dropdown al hacer clic fuera
document.addEventListener('click', function(event) {
    const languageSelector = document.querySelector('.language-selector');
    const dropdown = document.getElementById('languageDropdown');
    
    if (dropdown && languageSelector && !languageSelector.contains(event.target)) {
        dropdown.classList.remove('show');
    }
});

// Aplicar tema guardado
function applyTheme() {
    document.body.setAttribute('data-theme', currentTheme);
}