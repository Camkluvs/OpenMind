// Referencias a los elementos del chat
const chatHistory = document.getElementById('ai-chat-history');
const chatForm = document.getElementById('ai-chat-form');
const chatInput = document.getElementById('ai-chat-input');

// Manejar el envío del formulario (mensaje del usuario)
chatForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const userMsg = chatInput.value.trim();
    if (!userMsg) return;

    // Mostrar mensaje del usuario en el historial
    appendMessage(userMsg, 'user');
    chatInput.value = '';
    chatInput.disabled = true;

    // Mostrar "escribiendo..." (IA está respondiendo)
    appendMessage('...', 'ai', true);

    try {
        // Llama a tu backend para obtener la respuesta de la IA
        // Cambia la URL si tu endpoint es diferente
        const response = await fetch('https://open-analy.vercel.app/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: userMsg })
        });

        const result = await response.json();
        // Borra el mensaje de "escribiendo..."
        removeTyping();

        // Mostrar respuesta de la IA
        appendMessage(result.reply || 'Sin respuesta de la IA.', 'ai');

    } catch (err) {
        removeTyping();
        appendMessage('Error al contactar la IA.', 'ai');
    } finally {
        chatInput.disabled = false;
        chatInput.focus();
        scrollToBottom();
    }
});

// Función para agregar mensaje al historial
function appendMessage(text, sender = 'ai', isTyping = false) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('ai-chat-message', sender);
    if (isTyping) msgDiv.classList.add('typing');
    msgDiv.textContent = text;
    chatHistory.appendChild(msgDiv);
    scrollToBottom();
}

// Borra el mensaje de "escribiendo..."
function removeTyping() {
    const typingMsg = chatHistory.querySelector('.ai-chat-message.ai.typing');
    if (typingMsg) typingMsg.remove();
}

// Baja el scroll al fondo (último mensaje)
function scrollToBottom() {
    chatHistory.scrollTop = chatHistory.scrollHeight;
}