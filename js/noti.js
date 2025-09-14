
// Cargar contador de notificaciones
async function loadNotificationCount() {
    try {
        if (!currentUser) return;
        
        const userEmail = currentUser.email;
        
        const { data: invitations, error } = await supabaseClient
            .from('project_invitations')
            .select('id')
            .eq('invited_email', userEmail)
            .eq('status', 'pending');
        
        if (error) throw error;
        
        const notificationCount = document.getElementById('notificationCount');
        
        if (invitations.length === 0) {
            notificationCount.style.display = 'none';
        } else {
            notificationCount.textContent = invitations.length;
            notificationCount.style.display = 'flex';
        }
        
    } catch (error) {
        console.error('Error loading notification count:', error);
    }
}

// Cargar notificaciones completas
async function loadNotifications() {
    try {
        const userEmail = currentUser.email;
        
        const { data: invitations, error } = await supabaseClient
            .from('project_invitations')
            .select('*')
            .eq('invited_email', userEmail)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const notificationsList = document.getElementById('notificationsList');
        
        if (invitations.length === 0) {
            notificationsList.innerHTML = '<div class="notification-item">No hay notificaciones</div>';
        } else {
            notificationsList.innerHTML = invitations.map(invitation => `
                <div class="notification-item">
                    <div class="notification-title">Invitación a proyecto</div>
                    <div class="notification-message">
                        ${invitation.invited_by_name} te invitó a unirte a "${invitation.project_name}" como ${invitation.role === 'admin' ? 'Administrador' : 'Miembro'}
                    </div>
                    <div class="notification-actions">
                        <button class="notification-btn accept" onclick="acceptInvitation('${invitation.id}')">
                            Aceptar
                        </button>
                        <button class="notification-btn reject" onclick="rejectInvitation('${invitation.id}')">
                            Rechazar
                        </button>
                    </div>
                </div>
            `).join('');
        }
        
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

// Toggle notificaciones
function toggleNotifications() {
    const dropdown = document.getElementById('notificationsDropdown');
    dropdown.classList.toggle('show');
    if (dropdown.classList.contains('show')) {
        loadNotifications();
    }
}

// Toast helper
function showToast(message, type = 'success') {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Aceptar invitación
async function acceptInvitation(invitationId) {
    try {
        const { data: invitation, error: getError } = await supabaseClient
            .from('project_invitations')
            .select('*')
            .eq('id', invitationId)
            .single();
        
        if (getError) throw getError;
        
        const { data: existingMember } = await supabaseClient
            .from('project_members')
            .select('id')
            .eq('project_id', invitation.project_id)
            .eq('user_id', currentUser.id)
            .single();
        
        if (!existingMember) {
            const { error: insertError } = await supabaseClient
                .from('project_members')
                .insert({
                    project_id: invitation.project_id,
                    user_id: currentUser.id,
                    user_name: currentUser.user_metadata?.full_name || currentUser.email.split('@')[0],
                    user_email: currentUser.email,
                    role: invitation.role,
                    status: 'active',
                    joined_at: new Date().toISOString()
                });
            
            if (insertError) throw insertError;
        }
        
        const { error: updateError } = await supabaseClient
            .from('project_invitations')
            .update({ 
                status: 'accepted',
                accepted_at: new Date().toISOString()
            })
            .eq('id', invitationId);
        
        if (updateError) throw updateError;
        
        showToast('Invitación aceptada correctamente');
        
        setTimeout(() => {
            loadNotifications();
            loadNotificationCount();
        }, 500);
        
    } catch (error) {
        console.error('Error accepting invitation:', error);
        showToast('Error aceptando invitación: ' + error.message, 'error');
    }
}

// Rechazar invitación
async function rejectInvitation(invitationId) {
    try {
        const { error } = await supabaseClient
            .from('project_invitations')
            .update({ status: 'rejected' })
            .eq('id', invitationId);
        
        if (error) throw error;
        
        showToast('Invitación rechazada');
        
        setTimeout(() => {
            loadNotifications();
            loadNotificationCount();
        }, 500);
        
    } catch (error) {
        console.error('Error rejecting invitation:', error);
        showToast('Error rechazando invitación', 'error');
    }
}

// Auto-cargar contador cada 15 segundos
setInterval(() => {
    if (typeof currentUser !== 'undefined' && currentUser) {
        loadNotificationCount();
    }
}, 15000);

// Cargar contador al inicializar (esperar a que currentUser esté disponible)
const checkUserInterval = setInterval(() => {
    if (typeof currentUser !== 'undefined' && currentUser) {
        loadNotificationCount();
        clearInterval(checkUserInterval);
    }
}, 100);

// Cerrar dropdown al hacer clic fuera
document.addEventListener('click', function(event) {
    const notificationsContainer = document.querySelector('.notifications-container');
    const dropdown = document.getElementById('notificationsDropdown');
    
    if (dropdown && notificationsContainer && !notificationsContainer.contains(event.target)) {
        dropdown.classList.remove('show');
    }
});

// Exponer funciones globales
window.toggleNotifications = toggleNotifications;
window.acceptInvitation = acceptInvitation;
window.rejectInvitation = rejectInvitation;
window.loadNotificationCount = loadNotificationCount;