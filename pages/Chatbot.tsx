import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';

export default function Chatbot() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ sender: string; text: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [welcomed, setWelcomed] = useState(false);

  // Add welcome message when chat is first opened
  useEffect(() => {
    if (chatOpen && !welcomed) {
      setChatHistory([
        {
          sender: 'bot',
          text: "Hi, I'm Brix.AI! Together we will build a website. Ask me anything and I'll help you with it."
        }
      ]);
      setWelcomed(true);
    }
  }, [chatOpen, welcomed]);

  const sendMessage = async () => {
    if (!chatMessage.trim()) return;

    // Add user message
    const userMessage = { sender: 'user', text: chatMessage };
    setChatHistory(prev => [...prev, userMessage]);
    setChatMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:3001/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.text }),
      });

      const data = await response.json();
      
      // Add single bot response
      setChatHistory(prev => [...prev, { 
        sender: 'bot', 
        text: data.message
      }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { 
        sender: 'bot', 
        text: "I apologize, but I'm having trouble connecting. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        className="fixed bottom-6 right-6 bg-[#8B4513] text-white p-4 rounded-full shadow-lg hover:bg-[#D2B48C] transition-all"
        onClick={() => setChatOpen(!chatOpen)}
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {chatOpen && (
        <div className="fixed bottom-24 right-6 w-96 bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden transition-all">
          <div className="bg-[#8B4513] text-white p-4 flex items-center justify-between rounded-t-3xl">
            <span className="font-semibold">Chat with Brix AI</span>
            <button onClick={() => setChatOpen(false)} className="hover:text-gray-300">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 h-72 overflow-y-auto flex flex-col gap-2">
            {chatHistory.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <span className={`px-4 py-2 rounded-xl text-sm shadow-md ${
                  msg.sender === 'user' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {msg.text}
                </span>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <span className="px-4 py-2 rounded-xl text-sm shadow-md bg-gray-100 text-gray-800 animate-pulse">
                  Typing...
                </span>
              </div>
            )}
          </div>

          <div className="p-4 border-t bg-white flex items-center rounded-b-3xl">
            <input 
              type="text" 
              className="w-full p-3 text-sm border-none bg-gray-100 text-black rounded-full focus:outline-none focus:ring-2 focus:ring-[#8B4513]"
              value={chatMessage} 
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..." 
              disabled={isLoading}
            />
          </div>
        </div>
      )}
    </>
  );
}