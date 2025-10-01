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

        // Solicitudes aprobadas no leídas
        const { data: solicitudes, error: solError } = await supabaseClient
            .from('solicitudes_aprobadas')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('status', 'unread');

        if (solError) throw solError;
        
        const totalCount = (invitations?.length || 0) + (mentions?.length || 0) + (solicitudes?.length || 0);
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

// Cargar notificaciones completas
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

        // Solicitudes aprobadas
        const { data: solicitudesAprobadas, error: solError } = await supabaseClient
            .from('solicitudes_aprobadas')
            .select('*')
            .eq('user_id', currentUser.id)
            .eq('status', 'unread')
            .order('created_at', { ascending: false });

        if (solError) throw solError;
        
        const notificationsList = document.getElementById('notificationsList');
        
        if ((invitations?.length || 0) === 0 && (mentions?.length || 0) === 0 && (solicitudesAprobadas?.length || 0) === 0) {
            notificationsList.innerHTML = '<div class="notification-item">No hay notificaciones</div>';
            return;
        }

        let html = '';

        // Agregar solicitudes aprobadas PRIMERO
        if (solicitudesAprobadas?.length > 0) {
            html += solicitudesAprobadas.map(solicitud => `
                <div class="notification-item" style="border-left: 3px solid #4caf50;">
                    <div class="notification-title">
                        <i class="fas fa-check-circle" style="color: #4caf50;"></i>
                        Solicitud Aprobada
                    </div>
                    <div class="notification-message">
                        ${solicitud.message}
                    </div>
                    <div class="notification-actions">
                        <button class="notification-btn accept" onclick="dismissSolicitudAprobada('${solicitud.id}', '${solicitud.solicitud_id}')">
                            <i class="fas fa-check"></i> Entendido
                        </button>
                    </div>
                </div>
            `).join('');
        }

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

// Ir a mención
async function goToMention(projectId, discussionId) {
    try {
        await supabaseClient
            .from('mention_notifications')
            .update({ status: 'read' })
            .eq('user_id', currentUser.id)
            .eq('discussion_id', discussionId);

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

// Descartar solicitud aprobada


// Descartar solicitud aprobada
async function dismissSolicitudAprobada(notificationId, solicitudId) {
    try {
        const button = event.target.closest('button');
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        
        console.log('Eliminando notificación:', notificationId);
        console.log('Eliminando solicitud:', solicitudId);
        
        // Eliminar la solicitud original PRIMERO
        const { error: solicitudError } = await supabaseClient
            .from('solicitudes')
            .delete()
            .eq('id', solicitudId);
        
        if (solicitudError) {
            console.error('Error eliminando solicitud:', solicitudError);
            throw solicitudError;
        }
        
        console.log('Solicitud eliminada correctamente');

        // Luego eliminar la notificación de aprobación
        const { error: notifError } = await supabaseClient
            .from('solicitudes_aprobadas')
            .delete()
            .eq('id', notificationId);
        
        if (notifError) {
            console.error('Error eliminando notificación:', notifError);
            throw notifError;
        }
        
        console.log('Notificación eliminada correctamente');
        
        showToast('Perfecto! Ya puedes cambiar tu foto de perfil', 'success');
        
        setTimeout(() => {
            loadNotifications();
            loadNotificationCount();
        }, 500);
        
    } catch (error) {
        console.error('Error dismissing notification:', error);
        showToast('Error: ' + error.message, 'error');
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-check"></i> Entendido';
    }
}

// Suscripción realtime para menciones
function initializeMentionNotifications() {
    if (window.location.pathname.includes('discussions.html')) {
        return;
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
                loadNotificationCount();
                showGlobalMentionNotification(payload.new);
            })
            .subscribe();
            
        console.log('Notificaciones de menciones inicializadas');
    }
}

// Mostrar notificación global de mención
function showGlobalMentionNotification(mention) {
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

    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

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

function goToMentionFromGlobal(projectId, discussionId) {
    markMentionAsReadAndNavigate(discussionId, projectId);
}

async function markMentionAsReadAndNavigate(discussionId, projectId) {
    try {
        await supabaseClient
            .from('mention_notifications')
            .update({ status: 'read' })
            .eq('user_id', currentUser.id)
            .eq('discussion_id', discussionId);

        window.location.href = `discussions.html?project=${projectId}&discussion=${discussionId}`;
        
    } catch (error) {
        console.error('Error going to mention:', error);
        window.location.href = `discussions.html?project=${projectId}&discussion=${discussionId}`;
    }
}

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

// Suscripción realtime para solicitudes aprobadas
function initializeSolicitudNotifications() {
    if (typeof supabaseClient !== 'undefined' && currentUser) {
        const solicitudesChannel = supabaseClient
            .channel('solicitudes_aprobadas_' + currentUser.id)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'solicitudes_aprobadas',
                filter: `user_id=eq.${currentUser.id}`
            }, (payload) => {
                console.log('Notificación de aprobación recibida:', payload);
                loadNotificationCount();
            })
            .subscribe((status) => {
                console.log('Estado de suscripción solicitudes:', status);
            });
            
        console.log('Notificaciones de aprobación inicializadas');
    }
}

// Auto-cargar contador cada 15 segundos
setInterval(() => {
    if (typeof currentUser !== 'undefined' && currentUser) {
        loadNotificationCount();
    }
}, 15000);

// Cargar contador al inicializar
const checkUserInterval = setInterval(() => {
    if (typeof currentUser !== 'undefined' && currentUser) {
        loadNotificationCount();
        clearInterval(checkUserInterval);
    }
}, 100);

// Auto-inicializar menciones
const initMentionNotificationsChecker = setInterval(() => {
    if (typeof currentUser !== 'undefined' && currentUser && 
        typeof supabaseClient !== 'undefined') {
        initializeMentionNotifications();
        clearInterval(initMentionNotificationsChecker);
    }
}, 1000);

// Auto-inicializar solicitudes
const initSolicitudNotificationsChecker = setInterval(() => {
    if (typeof currentUser !== 'undefined' && currentUser && 
        typeof supabaseClient !== 'undefined') {
        initializeSolicitudNotifications();
        clearInterval(initSolicitudNotificationsChecker);
    }
}, 1000);

// Cerrar dropdown al hacer clic fuera
document.addEventListener('click', function(event) {
    const notificationsContainer = document.querySelector('.notifications-container');
    const dropdown = document.getElementById('notificationsDropdown');
    
    if (dropdown && notificationsContainer && !notificationsContainer.contains(event.target)) {
        dropdown.classList.remove('show');
    }
});

// Exponer funciones globales
window.goToMentionFromGlobal = goToMentionFromGlobal;
window.dismissGlobalMention = dismissGlobalMention;
window.markMentionAsReadAndNavigate = markMentionAsReadAndNavigate;
window.goToMention = goToMention;
window.markMentionAsRead = markMentionAsRead;
window.toggleNotifications = toggleNotifications;
window.acceptInvitation = acceptInvitation;
window.rejectInvitation = rejectInvitation;
window.loadNotificationCount = loadNotificationCount;
window.dismissSolicitudAprobada = dismissSolicitudAprobada;