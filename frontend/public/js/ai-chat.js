document.addEventListener('DOMContentLoaded', () => {
    // 1. Inyectar HTML del chat
    const chatHTML = `
        <div class="ai-chat-fab" id="aiChatFab">
            <i class="ph ph-robot"></i>
        </div>
        <div class="ai-chat-window" id="aiChatWindow">
            <div class="ai-chat-header">
                <h3><i class="ph ph-robot"></i> Asistente Hub</h3>
                <i class="ph ph-x ai-chat-close" id="aiChatClose"></i>
            </div>
            <div class="ai-chat-body" id="aiChatBody">
                <div class="ai-message bot">¡Hola! Soy el Asistente de Incident Hub. ¿En qué te puedo ayudar hoy con tus reportes o dudas sobre la plataforma?</div>
            </div>
            <div class="ai-chat-input-area">
                <input type="text" id="aiChatInput" placeholder="Escribe tu duda aquí..." autocomplete="off">
                <button id="aiChatSendBtn"><i class="ph ph-paper-plane-right"></i></button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', chatHTML);

    const aiChatFab = document.getElementById('aiChatFab');
    const aiChatWindow = document.getElementById('aiChatWindow');
    const aiChatClose = document.getElementById('aiChatClose');
    const aiChatInput = document.getElementById('aiChatInput');
    const aiChatSendBtn = document.getElementById('aiChatSendBtn');
    const aiChatBody = document.getElementById('aiChatBody');

    // 2. Toggle Chat Window
    aiChatFab.addEventListener('click', () => {
        aiChatWindow.classList.add('active');
        aiChatFab.style.display = 'none';
        aiChatInput.focus();
    });

    aiChatClose.addEventListener('click', () => {
        aiChatWindow.classList.remove('active');
        aiChatFab.style.display = 'flex';
    });

    // 3. Enviar mensaje
    const sendMessage = async () => {
        const text = aiChatInput.value.trim();
        if (!text) return;

        // Añadir mensaje del usuario
        addMessage(text, 'user');
        aiChatInput.value = '';

        // Añadir loader
        const loaderId = addLoader();

        try {
            const response = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });
            const data = await response.json();
            
            removeLoader(loaderId);
            
            if (response.ok) {
                // Formatear markdown básico (negritas y saltos de línea)
                let reply = data.reply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                reply = reply.replace(/\n/g, '<br>');
                addMessage(reply, 'bot');
            } else {
                addMessage('Lo siento, hubo un error de conexión con la IA.', 'bot');
            }
        } catch (error) {
            removeLoader(loaderId);
            addMessage('Lo siento, el servicio no está disponible en este momento.', 'bot');
        }
    };

    aiChatSendBtn.addEventListener('click', sendMessage);
    aiChatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Funciones Helper
    function addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `ai-message ${sender}`;
        msgDiv.innerHTML = text; // Usamos innerHTML por el formato markdown básico
        aiChatBody.appendChild(msgDiv);
        aiChatBody.scrollTop = aiChatBody.scrollHeight;
    }

    function addLoader() {
        const id = 'loader-' + Date.now();
        const loaderDiv = document.createElement('div');
        loaderDiv.className = `ai-message bot ai-loading`;
        loaderDiv.id = id;
        loaderDiv.innerHTML = `<div class="ai-dot"></div><div class="ai-dot"></div><div class="ai-dot"></div>`;
        aiChatBody.appendChild(loaderDiv);
        aiChatBody.scrollTop = aiChatBody.scrollHeight;
        return id;
    }

    function removeLoader(id) {
        const loader = document.getElementById(id);
        if (loader) loader.remove();
    }
});
