// Cargar contador de notificaciones (MODIFICADO)
async function loadNotificationCount() {
    try {
        if (!currentUser) return;
        
        const userEmail = currentUser.email;
        
        // Invitaciones pendientes
        const { data: invitations, error: invError } = await supabaseClient
            .from('project_invitations')
            .select('id')
            .eq('invited_email', userEmail)
            .eq('status', 'pending');
        
        if (invError) throw invError;

        // Menciones no leídas
        const { data: mentions, error: mentError } = await supabaseClient
            .from('mention_notifications')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('status', 'unread');

        if (mentError) throw mentError;
        
        const totalCount = (invitations?.length || 0) + (mentions?.length || 0);
        const notificationCount = document.getElementById('notificationCount');
        
        if (totalCount === 0) {
            notificationCount.style.display = 'none';
        } else {
            notificationCount.textContent = totalCount;
            notificationCount.style.display = 'flex';
        }
        
    } catch (error) {
        console.error('Error loading notification count:', error);
    }
}

// Cargar notificaciones completas (MODIFICADO)
async function loadNotifications() {
    try {
        const userEmail = currentUser.email;
        
        // Invitaciones
        const { data: invitations, error: invError } = await supabaseClient
            .from('project_invitations')
            .select('*')
            .eq('invited_email', userEmail)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        
        if (invError) throw invError;

        // Menciones
        const { data: mentions, error: mentError } = await supabaseClient
            .from('mention_notifications')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('status', 'unread')
            .order('created_at', { ascending: false });

        if (mentError) throw mentError;
        
        const notificationsList = document.getElementById('notificationsList');
        
        if ((invitations?.length || 0) === 0 && (mentions?.length || 0) === 0) {
            notificationsList.innerHTML = '<div class="notification-item">No hay notificaciones</div>';
            return;
        }

        let html = '';

        // Agregar invitaciones
        if (invitations?.length > 0) {
            html += invitations.map(invitation => `
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

        // Agregar menciones
        if (mentions?.length > 0) {
            html += mentions.map(mention => `
                <div class="notification-item">
                    <div class="notification-title">Te mencionaron en ${mention.project_name}</div>
                    <div class="notification-message">
                        ${mention.mentioned_by_name} te mencionó en "${mention.discussion_title}": 
                        <br><em>"${mention.mention_content}"</em>
                    </div>
                    <div class="notification-actions">
                        <button class="notification-btn accept" onclick="goToMention('${mention.project_id}', '${mention.discussion_id}')">
                            Ver discusión
                        </button>
                        <button class="notification-btn reject" onclick="markMentionAsRead('${mention.id}')">
                            Marcar como leída
                        </button>
                    </div>
                </div>
            `).join('');
        }

        notificationsList.innerHTML = html;
        
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


// Ir a mención
async function goToMention(projectId, discussionId) {
    try {
        // Marcar mención como leída
        await supabaseClient
            .from('mention_notifications')
            .update({ status: 'read' })
            .eq('user_id', currentUser.id)
            .eq('discussion_id', discussionId);

        // Navegar a la discusión
        window.location.href = `discussions.html?project=${projectId}&discussion=${discussionId}`;
        
    } catch (error) {
        console.error('Error going to mention:', error);
    }
}

// Marcar mención como leída
async function markMentionAsRead(mentionId) {
    try {
        const { error } = await supabaseClient
            .from('mention_notifications')
            .update({ status: 'read' })
            .eq('id', mentionId);
        
        if (error) throw error;
        
        showToast('Mención marcada como leída');
        
        setTimeout(() => {
            loadNotifications();
            loadNotificationCount();
        }, 500);
        
    } catch (error) {
        console.error('Error marking mention as read:', error);
        showToast('Error marcando mención como leída', 'error');
    }
}

// Función para verificar si el usuario mencionado está viendo la discusión actual
function isUserViewingDiscussion(mentionedUserId) {
    // Si no estamos en la página de discusiones, siempre mostrar notificación
    if (!window.location.pathname.includes('discussions.html')) {
        return false;
    }

    // Si estamos en la lista de discusiones, no en una específica
    const urlParams = new URLSearchParams(window.location.search);
    const currentDiscussionId = urlParams.get('discussion');
    
    if (!currentDiscussionId) {
        return false;
    }

    // Aquí podrías implementar lógica más sofisticada
    // Por ahora, asumimos que si está en la página, está viendo
    return true;
}


// AGREGAR AL FINAL DE TU ARCHIVO noti.js

// Suscripción realtime para menciones (para todas las páginas)
function initializeMentionNotifications() {
    // Solo ejecutar si NO estamos en discussions.html
    if (window.location.pathname.includes('discussions.html')) {
        return; // En discussions.html ya se maneja por separado
    }
    
    if (typeof supabaseClient !== 'undefined' && currentUser) {
        const mentionsChannel = supabaseClient
            .channel('global_mention_notifications_' + currentUser.id)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'mention_notifications',
                filter: `user_id=eq.${currentUser.id}`
            }, (payload) => {
                // En otras páginas, SIEMPRE mostrar notificaciones de menciones
                loadNotificationCount();
                showGlobalMentionNotification(payload.new);
            })
            .subscribe();
            
        console.log('Notificaciones de menciones inicializadas para página:', window.location.pathname);
    }
}

// Mostrar notificación global de mención
function showGlobalMentionNotification(mention) {
    // Crear notificación flotante específica para menciones
    const notification = document.createElement('div');
    notification.className = 'global-mention-notification';
    notification.innerHTML = `
        <div class="mention-notification-header">
            <i class="fas fa-at"></i>
            <span>Te mencionaron</span>
        </div>
        <div class="mention-notification-content">
            <strong>${mention.mentioned_by_name}</strong> te mencionó en "${mention.discussion_title}"
            <br><em>"${mention.mention_content.substring(0, 80)}..."</em>
        </div>
        <div class="mention-notification-actions">
            <button onclick="goToMentionFromGlobal('${mention.project_id}', '${mention.discussion_id}')" class="mention-btn-go">
                Ver discusión
            </button>
            <button onclick="dismissGlobalMention(this)" class="mention-btn-dismiss">
                ✕
            </button>
        </div>
    `;

    // Agregar estilos si no existen
    if (!document.getElementById('global-mention-styles')) {
        const styles = document.createElement('style');
        styles.id = 'global-mention-styles';
        styles.textContent = `
            .global-mention-notification {
                position: fixed;
                top: 80px;
                right: 20px;
                background: rgba(74, 158, 255, 0.95);
                color: white;
                padding: 16px;
                border-radius: 12px;
                font-size: 14px;
                z-index: 10000;
                transform: translateX(100%);
                transition: all 0.3s ease;
                max-width: 350px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            .global-mention-notification.show {
                transform: translateX(0);
            }
            .mention-notification-header {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 600;
                margin-bottom: 8px;
                font-size: 15px;
            }
            .mention-notification-content {
                line-height: 1.4;
                margin-bottom: 12px;
            }
            .mention-notification-actions {
                display: flex;
                gap: 8px;
                justify-content: flex-end;
            }
            .mention-btn-go, .mention-btn-dismiss {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                padding: 6px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s ease;
            }
            .mention-btn-go:hover {
                background: rgba(255, 255, 255, 0.3);
            }
            .mention-btn-dismiss {
                padding: 6px 8px;
                font-weight: bold;
            }
            .mention-btn-dismiss:hover {
                background: rgba(255, 0, 0, 0.3);
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(notification);

    // Mostrar animación
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // Auto-ocultar después de 8 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 8000);
}

// Ir a mención desde notificación global
function goToMentionFromGlobal(projectId, discussionId) {
    // Marcar como leída y navegar
    markMentionAsReadAndNavigate(discussionId, projectId);
}

// Marcar mención como leída y navegar
async function markMentionAsReadAndNavigate(discussionId, projectId) {
    try {
        await supabaseClient
            .from('mention_notifications')
            .update({ status: 'read' })
            .eq('user_id', currentUser.id)
            .eq('discussion_id', discussionId);

        // Navegar a la discusión
        window.location.href = `discussions.html?project=${projectId}&discussion=${discussionId}`;
        
    } catch (error) {
        console.error('Error going to mention:', error);
        // Navegar aunque haya error
        window.location.href = `discussions.html?project=${projectId}&discussion=${discussionId}`;
    }
}

// Cerrar notificación global
function dismissGlobalMention(button) {
    const notification = button.closest('.global-mention-notification');
    if (notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }
}

// Auto-inicializar notificaciones de menciones
const initMentionNotificationsChecker = setInterval(() => {
    if (typeof currentUser !== 'undefined' && currentUser && 
        typeof supabaseClient !== 'undefined') {
        initializeMentionNotifications();
        clearInterval(initMentionNotificationsChecker);
    }
}, 1000);

// También inicializar cuando se detecte que currentUser está disponible
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (typeof currentUser !== 'undefined' && currentUser) {
                initializeMentionNotifications();
            }
        }, 2000);
    });
}

// Exponer funciones globales
window.goToMentionFromGlobal = goToMentionFromGlobal;
window.dismissGlobalMention = dismissGlobalMention;
window.markMentionAsReadAndNavigate = markMentionAsReadAndNavigate;
// Exponer funciones globales (AGREGAR AL FINAL)
window.goToMention = goToMention;
window.markMentionAsRead = markMentionAsRead;
window.toggleNotifications = toggleNotifications;
window.acceptInvitation = acceptInvitation;
window.rejectInvitation = rejectInvitation;
window.loadNotificationCount = loadNotificationCount;