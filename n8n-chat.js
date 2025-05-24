(() => {
  const config = {
    webhookUrl: 'https://extablers.app.n8n.cloud/webhook-test/n8nagent1', // Your N8N webhook
  };

  const messages = [];
  let isChatOpen = false;
  let loading = false;
  let error = false;

  function escapeHTML(str) {
    return str.replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[m]));
  }

  function toggleChat() {
    isChatOpen = !isChatOpen;
    document.getElementById('chat-widget').classList.toggle('open', isChatOpen);
    
    // Hide the "New" badge when chat is opened
    if (isChatOpen) {
      const badge = document.querySelector('.chat-badge');
      if (badge) badge.style.display = 'none';
    }
  }

  function showError() {
    error = true;
    document.getElementById('chat-error').style.display = 'block';
  }

  function hideError() {
    error = false;
    document.getElementById('chat-error').style.display = 'none';
  }

  async function sendMessage(text) {
    if (!text.trim() || loading) return;

    const input = document.getElementById('message-input');
    input.value = '';
    messages.push({ role: 'user', content: text });
    renderMessages();
    loading = true;
    showLoading();
    hideError();

    // Generate consistent sessionId
    const sessionId = config.sessionId || 'session_' + Date.now();

    try {
      console.log('Sending payload:', {
        chatInput: text,
        sessionId: sessionId,
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'cdn-chat-widget',
          url: window.location.href
        }
      });

      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          chatInput: text,
          sessionId: sessionId,
          metadata: {
            timestamp: new Date().toISOString(),
            source: 'cdn-chat-widget',
            url: window.location.href
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received response:', data);
      
      // Handle different response formats from N8N
      const aiMessage = data?.output || data?.response || data?.message || data?.reply || 'Sorry, I could not understand that.';
      messages.push({ role: 'assistant', content: aiMessage });
      renderMessages();
    } catch (e) {
      console.error('Chat error:', e);
      showError();
    } finally {
      loading = false;
      hideLoading();
    }
  }

  function showLoading() {
    document.getElementById('loading-animation').style.display = 'flex';
  }

  function hideLoading() {
    document.getElementById('loading-animation').style.display = 'none';
  }

  function renderMessages() {
    const chatMessages = document.getElementById('chat-messages');
    const welcomeScreen = document.getElementById('welcome-screen');
    
    if (messages.length === 0) {
      welcomeScreen.style.display = 'flex';
      chatMessages.innerHTML = '';
    } else {
      welcomeScreen.style.display = 'none';
      chatMessages.innerHTML = messages.map(message => `
        <div class="chat-message ${message.role}">
          <div class="bubble ${message.role}">${escapeHTML(message.content)}</div>
        </div>
      `).join('');
    }

    // Scroll to bottom
    setTimeout(() => {
      const container = document.getElementById('messages-container');
      container.scrollTop = container.scrollHeight;
    }, 100);
  }

  function initEvents() {
    document.getElementById('chat-toggle').addEventListener('click', toggleChat);
    document.getElementById('close-chat').addEventListener('click', toggleChat);
    document.getElementById('send-button').addEventListener('click', () => {
      const input = document.getElementById('message-input');
      sendMessage(input.value);
    });
    document.getElementById('retry-button').addEventListener('click', () => {
      hideError();
      const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
      if (lastUserMessage) {
        sendMessage(lastUserMessage.content);
      }
    });
    document.getElementById('message-input').addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(e.target.value);
      }
    });
  }

  function createWidgetHTML() {
    return `
      <style>
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
        }

        #chat-widget {
          position: fixed;
          bottom: 16px;
          right: 16px;
          z-index: 9999;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }

        #chat-toggle {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
          border: none;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;
          position: relative;
        }

        #chat-toggle:hover {
          transform: scale(1.05);
        }

        .chat-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #ef4444;
          color: white;
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 12px;
          font-weight: 500;
        }

        #chat-box {
          display: none;
          flex-direction: column;
          width: 320px;
          height: 480px;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.2);
          position: absolute;
          bottom: 70px;
          right: 0;
        }

        #chat-widget.open #chat-box {
          display: flex;
        }

        @media (max-width: 480px) {
          #chat-box {
            width: calc(100vw - 32px);
            right: 16px;
            left: 16px;
          }
        }

        #chat-header {
          background: rgba(139, 92, 246, 0.05);
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #e5e7eb;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .bot-avatar {
          position: relative;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
          overflow: hidden;
        }

        .bot-avatar::before {
          content: '';
          position: absolute;
          inset: 4px;
          border-radius: 50%;
          background: white;
        }

        .bot-avatar::after {
          content: '';
          position: absolute;
          inset: 8px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
        }

        .bot-icon {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          padding: 6px;
          color: white;
          z-index: 1;
        }

        .chat-title {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }

        #close-chat {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
        }

        #close-chat:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        #messages-container {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        #welcome-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          gap: 16px;
        }

        .welcome-avatar {
          position: relative;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
          overflow: hidden;
        }

        .welcome-avatar::before {
          content: '';
          position: absolute;
          inset: 8px;
          border-radius: 50%;
          background: white;
        }

        .welcome-avatar::after {
          content: '';
          position: absolute;
          inset: 12px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
        }

        .welcome-icon {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          padding: 12px;
          color: white;
          z-index: 1;
        }

        .welcome-text h3 {
          margin: 0 0 4px 0;
          font-weight: 600;
          color: #374151;
        }

        .welcome-text p {
          margin: 0;
          font-size: 14px;
          color: #6b7280;
        }

        #chat-messages {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .chat-message {
          display: flex;
        }

        .chat-message.user {
          justify-content: flex-end;
        }

        .chat-message.assistant {
          justify-content: flex-start;
        }

        .bubble {
          border-radius: 12px;
          padding: 12px 16px;
          max-width: 80%;
          font-size: 14px;
          word-wrap: break-word;
        }

        .bubble.user {
          background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
          color: white;
        }

        .bubble.assistant {
          background: #f3f4f6;
          color: #374151;
        }

        #loading-animation {
          display: none;
          justify-content: flex-start;
          margin-top: 16px;
        }

        .loading-bubble {
          border-radius: 12px;
          padding: 12px 16px;
          background: #f3f4f6;
          max-width: 80%;
        }

        .loading-dots {
          display: flex;
          gap: 4px;
        }

        .loading-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #9ca3af;
          animation: bounce 1.4s infinite;
        }

        .loading-dot:nth-child(2) {
          animation-delay: 0.15s;
        }

        .loading-dot:nth-child(3) {
          animation-delay: 0.3s;
        }

        #chat-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          padding: 12px;
          margin-top: 16px;
          display: none;
        }

        .error-content {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #dc2626;
          font-size: 14px;
          margin-bottom: 8px;
        }

        #retry-button {
          background: none;
          border: none;
          color: #dc2626;
          cursor: pointer;
          font-size: 12px;
          text-decoration: underline;
        }

        #chat-input {
          display: flex;
          padding: 16px;
          border-top: 1px solid #e5e7eb;
          gap: 8px;
          background: white;
        }

        #message-input {
          flex: 1;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          outline: none;
          font-size: 14px;
          resize: none;
          font-family: inherit;
        }

        #message-input:focus {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }

        #send-button {
          background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%);
          border: none;
          border-radius: 8px;
          padding: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        #send-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      </style>

      <div id="chat-widget">
        <button id="chat-toggle">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span class="chat-badge">New</span>
        </button>
        
        <div id="chat-box">
          <div id="chat-header">
            <div class="header-content">
              <div class="bot-avatar">
                <svg class="bot-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" clip-rule="evenodd" />
                </svg>
              </div>
              <h3 class="chat-title">AI Agent Assistant</h3>
            </div>
            <button id="close-chat">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          
          <div id="messages-container">
            <div id="welcome-screen">
              <div class="welcome-avatar">
                <svg class="welcome-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="welcome-text">
                <h3>How can I help you today?</h3>
                <p>Ask me about our AI services, gym facilities, real estate offerings, or anything else!</p>
              </div>
            </div>
            
            <div id="chat-messages"></div>
            
            <div id="loading-animation">
              <div class="loading-bubble">
                <div class="loading-dots">
                  <div class="loading-dot"></div>
                  <div class="loading-dot"></div>
                  <div class="loading-dot"></div>
                </div>
              </div>
            </div>
            
            <div id="chat-error">
              <div class="error-content">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                <span>Sorry, there was an error. Please try again.</span>
              </div>
              <button id="retry-button">Retry</button>
            </div>
          </div>
          
          <div id="chat-input">
            <input id="message-input" type="text" placeholder="Type your message..." />
            <button id="send-button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function mountWidget() {
    const div = document.createElement('div');
    div.innerHTML = createWidgetHTML();
    document.body.appendChild(div);
    initEvents();
    console.log('✅ Chat widget mounted successfully');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountWidget);
  } else {
    mountWidget();
  }
})();
