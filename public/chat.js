document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const widgetBtn = document.getElementById('chatWidgetBtn');
  const widgetWindow = document.getElementById('chatWidgetWindow');
  const widgetClose = document.getElementById('chatWidgetClose');
  const widgetInput = document.getElementById('widgetInput');
  const widgetSendBtns = document.getElementById('widgetSendBtns');
  const widgetMessages = document.getElementById('widgetMessages');

  if (!widgetBtn) return; // Exit if chat widget is not present

  // --- State Management ---

  function saveChatState() {
    const isOpen = widgetWindow.classList.contains('active');

    // Save state
    localStorage.setItem('ayurvaidya_chat_open', isOpen);
    localStorage.setItem('ayurvaidya_chat_history', widgetMessages.innerHTML);
  }

  function loadChatState() {
    // Restore Open/Closed State
    const isOpen = localStorage.getItem('ayurvaidya_chat_open') === 'true';
    if (isOpen) {
      widgetWindow.classList.add('active');
    }

    // Restore History
    const history = localStorage.getItem('ayurvaidya_chat_history');
    if (history && history.trim() !== '') {
      widgetMessages.innerHTML = history;
      // Scroll to bottom after restoring
      setTimeout(() => {
        widgetMessages.scrollTop = widgetMessages.scrollHeight;
      }, 0);
    }
  }

  // Initial Load
  loadChatState();

  // --- Chat Nudge Logic ---
  function initChatNudge() {
    // Check if already dismissed
    if (localStorage.getItem('ayurvaidya_nudge_dismissed') === 'true') return;

    // Check if chat is already open
    if (widgetWindow.classList.contains('active')) return;

    // Create Nudge Element
    const nudge = document.createElement('div');
    nudge.className = 'chat-nudge';
    nudge.innerHTML = `
            <p class="chat-nudge-text">Need help? Chat with our AI assistant!</p>
            <button class="chat-nudge-close" id="chatNudgeClose">&times;</button>
        `;
    document.body.appendChild(nudge);

    // Show after delay
    setTimeout(() => {
      if (!widgetWindow.classList.contains('active')) {
        nudge.classList.add('visible');
      }
    }, 3000);

    // Open chat when clicking message
    nudge.addEventListener('click', (e) => {
      if (e.target.closest('.chat-nudge-close')) return;
      widgetWindow.classList.add('active');
      nudge.classList.remove('visible');
      saveChatState();
      setTimeout(() => widgetInput.focus(), 300);

      // Mark as interacting effectively dismisses the need for the nudge
      localStorage.setItem('ayurvaidya_nudge_dismissed', 'true');
    });

    // Close logic
    const closeBtn = nudge.querySelector('#chatNudgeClose');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      nudge.classList.remove('visible');
      localStorage.setItem('ayurvaidya_nudge_dismissed', 'true');
      setTimeout(() => nudge.remove(), 500);
    });

    // Hide when chat is opened manually
    widgetBtn.addEventListener('click', () => {
      nudge.classList.remove('visible');
      localStorage.setItem('ayurvaidya_nudge_dismissed', 'true');
    });
  }

  initChatNudge();

  // --- Event Listeners ---

  // Open Chat
  widgetBtn.addEventListener('click', () => {
    widgetWindow.classList.add('active');
    saveChatState();
    // Focus input when opening
    setTimeout(() => widgetInput.focus(), 300);
  });

  // Close Chat
  widgetClose.addEventListener('click', () => {
    widgetWindow.classList.remove('active');
    saveChatState();
  });

  // Send Message Logic
  function sendWidgetMessage() {
    const text = widgetInput.value.trim();
    if (!text) return;

    // Add User Message
    appendMessage(text, 'user');
    widgetInput.value = '';

    // AI Response
    generateAIResponse(text).then(response => {
      appendMessage(response, 'bot');
    });
  }

  // Click Send
  widgetSendBtns.addEventListener('click', sendWidgetMessage);

  // Enter Key Send
  widgetInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendWidgetMessage();
  });

  // Helper: Append Message & Save
  function appendMessage(html, type) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${type}`;
    msgDiv.innerHTML = html; // Using innerHTML to support rich text/cards
    widgetMessages.appendChild(msgDiv);
    widgetMessages.scrollTop = widgetMessages.scrollHeight;

    saveChatState();
  }

  // --- AI Logic (Real) ---
  function generateAIResponse(input) {
    return fetch('/api/v1/chat/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: input })
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          return data.data.reply;
        } else {
          console.error('Chat API Error:', data.error);
          return "I apologize, but I'm having trouble connecting to the server right now.";
        }
      })
      .catch(error => {
        console.error('Chat Network Error:', error);
        return "I apologize, but I'm having trouble connecting to the server right now.";
      });
  }
});
