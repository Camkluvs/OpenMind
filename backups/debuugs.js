//debug de llamadas para hacer seguimiento opcional solo si hay errores
// Función para resetear permisos (solo para testing)
function resetPermissions() {
    localStorage.removeItem(PERMISSIONS_STORAGE_KEY);
    console.log('Permisos reseteados - aparecerá modal en próxima carga');
}

// Exponer para debug
window.resetPermissions = resetPermissions;