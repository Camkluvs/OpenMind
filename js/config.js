// js/config.js - Configuración global de la aplicación

// Configuración de Supabase
const SUPABASE_URL = 'https://jatcscioqvicmiofsuqt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphdGNzY2lvcXZpY21pb2ZzdXF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2ODUwNDcsImV4cCI6MjA3MjI2MTA0N30.wZ2dXWG7jq7zhzorqKoQYF7I6xz49k2xaFsouQRscGQ';

// Variables globales
let supabaseClient;
let currentTheme = localStorage.getItem('theme') || 'dark';

// Idiomas soportados
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