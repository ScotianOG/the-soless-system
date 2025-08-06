/**
 * SOLess Chat Widget
 * 
 * This script creates a chat widget for the SOLess bot that can be embedded on any website.
 */

(function() {
  // Default configuration
  const defaultConfig = {
    position: 'bottom-right',
    primaryColor: '#4a148c',
    welcomeMessage: 'Hello! Ask me about SOLess...'
  };
  
  // Merge default config with user config
  const config = {
    ...defaultConfig,
    ...(window.SOLessConfig || {})
  };
  
  // Widget state
  let conversationId = null;
  let isOpen = false;
  let widgetContainer = null;
  let messagesContainer = null;
  
  // Create widget HTML
  function createWidget() {
    // Create container
    widgetContainer = document.createElement('div');
    widgetContainer.className = 'soless-widget';
    widgetContainer.style.position = 'fixed';
    
    // Set position
    if (config.position.includes('bottom')) {
      widgetContainer.style.bottom = '20px';
    } else {
      widgetContainer.style.top = '20px';
    }
    
    if (config.position.includes('right')) {
      widgetContainer.style.right = '20px';
    } else {
      widgetContainer.style.left = '20px';
    }
    
    // Create chat button
    const chatButton = document.createElement('div');
    chatButton.className = 'soless-widget-button';
    chatButton.style.backgroundColor = config.primaryColor;
    chatButton.style.color = 'white';
    chatButton.style.width = '60px';
    chatButton.style.height = '60px';
    chatButton.style.borderRadius = '50%';
    chatButton.style.display = 'flex';
    chatButton.style.justifyContent = 'center';
    chatButton.style.alignItems = 'center';
    chatButton.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    chatButton.style.cursor = 'pointer';
    chatButton.style.transition = 'transform 0.3s ease';
    chatButton.style.zIndex = '9999';
    chatButton.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
    
    chatButton.addEventListener('mouseenter', () => {
      chatButton.style.transform = 'scale(1.1)';
    });
    
    chatButton.addEventListener('mouseleave', () => {
      chatButton.style.transform = 'scale(1)';
    });
    
    chatButton.addEventListener('click', toggleChat);
    
    // Create chat container (hidden initially)
    const chatContainer = document.createElement('div');
    chatContainer.className = 'soless-chat-container';
    chatContainer.style.display = 'none';
    chatContainer.style.position = 'absolute';
    chatContainer.style.bottom = '80px';
    chatContainer.style.right = '0px';
    chatContainer.style.width = '350px';
    chatContainer.style.height = '500px';
    chatContainer.style.backgroundColor = 'white';
    chatContainer.style.borderRadius = '10px';
    chatContainer.style.boxShadow = '0 5px 40px rgba(0, 0, 0, 0.16)';
    chatContainer.style.overflow = 'hidden';
    chatContainer.style.display = 'flex';
    chatContainer.style.flexDirection = 'column';
    chatContainer.style.zIndex = '9998';
    
    // Chat header
    const chatHeader = document.createElement('div');
    chatHeader.className = 'soless-chat-header';
    chatHeader.style.backgroundColor = config.primaryColor;
    chatHeader.style.color = 'white';
    chatHeader.style.padding = '15px';
    chatHeader.style.fontWeight = 'bold';
    chatHeader.style.display = 'flex';
    chatHeader.style.justifyContent = 'space-between';
    chatHeader.style.alignItems = 'center';
    chatHeader.textContent = 'SOLess Chat';
    
    const closeButton = document.createElement('div');
    closeButton.innerHTML = '&times;';
    closeButton.style.cursor = 'pointer';
    closeButton.style.fontSize = '20px';
    closeButton.addEventListener('click', toggleChat);
    
    chatHeader.appendChild(closeButton);
    
    // Messages area
    messagesContainer = document.createElement('div');
    messagesContainer.className = 'soless-messages';
    messagesContainer.style.flex = '1';
    messagesContainer.style.overflowY = 'auto';
    messagesContainer.style.padding = '15px';
    messagesContainer.style.backgroundColor = '#f5f5f5';
    
    // Input area
    const inputContainer = document.createElement('div');
    inputContainer.className = 'soless-input-container';
    inputContainer.style.display = 'flex';
    inputContainer.style.padding = '10px';
    inputContainer.style.borderTop = '1px solid #e0e0e0';
    inputContainer.style.backgroundColor = 'white';
    
    const messageInput = document.createElement('input');
    messageInput.className = 'soless-message-input';
    messageInput.type = 'text';
    messageInput.placeholder = 'Type your message...';
    messageInput.style.flex = '1';
    messageInput.style.padding = '10px';
    messageInput.style.border = '1px solid #e0e0e0';
    messageInput.style.borderRadius = '4px';
    messageInput.style.marginRight = '10px';
    
    const sendButton = document.createElement('button');
    sendButton.className = 'soless-send-button';
    sendButton.textContent = 'Send';
    sendButton.style.backgroundColor = config.primaryColor;
    sendButton.style.color = 'white';
    sendButton.style.border = 'none';
    sendButton.style.borderRadius = '4px';
    sendButton.style.padding = '0 15px';
    sendButton.style.cursor = 'pointer';
    
    // Add event listeners
    sendButton.addEventListener('click', () => {
      const message = messageInput.value.trim();
      if (message) {
        sendMessage(message);
        messageInput.value = '';
      }
    });
    
    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const message = messageInput.value.trim();
        if (message) {
          sendMessage(message);
          messageInput.value = '';
        }
      }
    });
    
    inputContainer.appendChild(messageInput);
    inputContainer.appendChild(sendButton);
    
    // Assemble chat container
    chatContainer.appendChild(chatHeader);
    chatContainer.appendChild(messagesContainer);
    chatContainer.appendChild(inputContainer);
    
    // Add everything to the widget container
    widgetContainer.appendChild(chatContainer);
    widgetContainer.appendChild(chatButton);
    
    // Add to document
    document.body.appendChild(widgetContainer);
    
    // Initialize chat
    initializeChat();
  }
  
  // Toggle chat open/closed
  function toggleChat() {
    isOpen = !isOpen;
    const chatContainer = widgetContainer.querySelector('.soless-chat-container');
    if (isOpen) {
      chatContainer.style.display = 'flex';
      
      // If first open, initialize chat
      if (!conversationId) {
        initializeChat();
      }
    } else {
      chatContainer.style.display = 'none';
    }
  }
  
  // Initialize chat
  async function initializeChat() {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST'
      });
      const data = await response.json();
      conversationId = data.conversationId;
      
      // Add welcome message
      addBotMessage(config.welcomeMessage);
    } catch (error) {
      console.error('Error initializing chat:', error);
      addBotMessage("Unable to connect to chat interface. Please try again later.");
    }
  }
  
  // Send message to API
  async function sendMessage(message) {
    if (!conversationId) {
      console.error('No active conversation');
      return;
    }
    
    try {
      // Add user message to UI
      addUserMessage(message);
      
      // Call API
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });
      
      const data = await response.json();
      
      // Add bot response to UI
      addBotMessage(data.message);
      
    } catch (error) {
      console.error('Error sending message:', error);
      addBotMessage("Communication error. Please try again later.");
    }
  }
  
  // Add a user message to the UI
  function addUserMessage(text) {
    const messageElement = document.createElement('div');
    messageElement.className = 'soless-message-user';
    messageElement.style.backgroundColor = '#e3f2fd';
    messageElement.style.padding = '10px';
    messageElement.style.borderRadius = '10px';
    messageElement.style.marginBottom = '10px';
    messageElement.style.marginLeft = 'auto';
    messageElement.style.marginRight = '0';
    messageElement.style.maxWidth = '80%';
    messageElement.style.textAlign = 'right';
    messageElement.textContent = text;
    
    messagesContainer.appendChild(messageElement);
    scrollToBottom();
  }
  
  // Add a bot message to the UI
  function addBotMessage(text) {
    const messageElement = document.createElement('div');
    messageElement.className = 'soless-message-bot';
    messageElement.style.backgroundColor = '#f1f1f1';
    messageElement.style.padding = '10px';
    messageElement.style.borderRadius = '10px';
    messageElement.style.marginBottom = '10px';
    messageElement.style.marginLeft = '0';
    messageElement.style.marginRight = 'auto';
    messageElement.style.maxWidth = '80%';
    messageElement.textContent = text;
    
    messagesContainer.appendChild(messageElement);
    scrollToBottom();
  }
  
  // Scroll to the bottom of the messages container
  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
  
  // Create widget when DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();
