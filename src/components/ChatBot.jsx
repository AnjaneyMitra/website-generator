import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Loader2, MinusCircle } from 'lucide-react';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m your Brix.AI assistant. How can I help you with your website?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const chatWindowRef = useRef(null);
  const textareaRef = useRef(null);
  const messageContainerRef = useRef(null);

  // Improved scroll handling
  const scrollToBottom = () => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTo({
        top: messageContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  // Dynamic textarea height
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '40px';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 80)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chatWindowRef.current && !chatWindowRef.current.contains(event.target)) {
        setIsMinimized(true);
      }
    };

    if (isOpen && !isMinimized) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isMinimized]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    adjustTextareaHeight();
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input.trim() }),
      });
      
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.message 
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleChat = () => {
    if (!isOpen) {
      setIsOpen(true);
      setIsMinimized(false);
    } else {
      setIsMinimized(!isMinimized);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="group flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-[#8B4513] to-[#D2B48C] text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          aria-label="Open chat"
        >
          <MessageSquare className="w-6 h-6 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {isOpen && (
        <div
          ref={chatWindowRef}
          className={`transform transition-transform duration-300 ease-in-out ${
            isMinimized ? 'translate-y-[calc(100%-48px)]' : 'translate-y-0'
          }`}
        >
          <div className="w-72 sm:w-80 bg-white rounded-lg shadow-xl flex flex-col border border-neutral-200">
            {/* Header */}
            <div 
              onClick={toggleChat}
              className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#8B4513] to-[#D2B48C] text-white rounded-t-lg cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span className="font-medium text-sm">Brix.AI Assistant</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMinimized(!isMinimized);
                  }}
                  className="p-1 hover:bg-white/20 rounded-md transition-colors"
                >
                  <MinusCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }}
                  className="p-1 hover:bg-white/20 rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={messageContainerRef}
              className="flex-1 overflow-y-auto px-3 py-2 space-y-2 bg-neutral-50"
              style={{ height: '300px', scrollbarWidth: 'thin' }}
            >
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-[#8B4513] to-[#D2B48C] text-white'
                        : 'bg-white shadow-sm border border-neutral-200'
                    }`}
                  >
                    <p className={`whitespace-pre-wrap break-words text-sm ${
                      message.role === 'user' ? 'text-white' : 'text-black'
                    }`}>
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-2 rounded-lg shadow-sm border border-neutral-200">
                    <Loader2 className="w-4 h-4 animate-spin text-[#8B4513]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-2 bg-white border-t border-neutral-200 rounded-b-lg">
              <div className="flex gap-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 p-2 bg-neutral-50 border border-neutral-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-[#8B4513] focus:border-transparent text-black placeholder-neutral-500 min-h-[40px] text-sm"
                  style={{ maxHeight: '80px' }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="p-2 rounded-md bg-gradient-to-r from-[#8B4513] to-[#D2B48C] text-white disabled:opacity-50 hover:shadow-md transition-all duration-300 hover:scale-105 disabled:hover:scale-100 self-end"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;