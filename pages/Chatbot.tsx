import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../utils/firebase/firebaseConfig';
import { v4 as uuidv4 } from 'uuid';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  sender: 'user' | 'bot';
  text: string;
}

interface LocalStorageChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
  sender: 'user' | 'bot';
  text: string;
}

// Define interfaces for generated pages
interface GeneratedPage {
  id: string;
  name: string;
  code: string;
  timestamp: Date;
}

interface LocalStorageGeneratedPage {
  id: string;
  name: string;
  code: string;
  timestamp: string;
}

export default function Chatbot() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [welcomed, setWelcomed] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();
  
  // New state for tracking generated pages
  const [generatedPages, setGeneratedPages] = useState<GeneratedPage[]>([]);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);

  // Load chat history from localStorage on first render
  useEffect(() => {
    const savedChatHistory = localStorage.getItem('chatHistory');
    if (savedChatHistory) {
      try {
        const parsedHistory = JSON.parse(savedChatHistory) as LocalStorageChatMessage[];
        setChatHistory(parsedHistory.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
        // If we have chat history, we've already welcomed the user
        if (parsedHistory.length > 0) {
          setWelcomed(true);
        }
      } catch (error) {
        console.error('Failed to parse chat history:', error);
      }
    }
    
    // Load generated pages from localStorage
    const savedGeneratedPages = localStorage.getItem('generatedPages');
    if (savedGeneratedPages) {
      try {
        const parsedPages = JSON.parse(savedGeneratedPages) as LocalStorageGeneratedPage[];
        setGeneratedPages(parsedPages.map(page => ({
          ...page,
          timestamp: new Date(page.timestamp)
        })));
      } catch (error) {
        console.error('Failed to parse generated pages:', error);
      }
    }
    
    // Load current page ID
    const savedCurrentPageId = localStorage.getItem('currentPageId');
    if (savedCurrentPageId) {
      setCurrentPageId(savedCurrentPageId);
    }
  }, []);

  // Add welcome message when chat is first opened
  useEffect(() => {
    if (chatOpen && !welcomed) {
      const welcomeMessage: ChatMessage = {
        id: uuidv4(),
        sender: 'bot',
        text: "Hi, I'm Brix.AI! Together we will build a website. Ask me anything and I'll help you with it.",
        content: "Hi, I'm Brix.AI! Together we will build a website. Ask me anything and I'll help you with it.",
        role: 'assistant',
        timestamp: new Date()
      };
      setChatHistory([welcomeMessage]);
      setWelcomed(true);
      
      // Save welcome message to localStorage
      localStorage.setItem('chatHistory', JSON.stringify([{
        ...welcomeMessage,
        timestamp: welcomeMessage.timestamp.toISOString()
      }]));
    }
  }, [chatOpen, welcomed]);

  // Save chat history to localStorage when it changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      const storageFormat = chatHistory.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      }));
      localStorage.setItem('chatHistory', JSON.stringify(storageFormat));
    }
  }, [chatHistory]);
  
  // Save generated pages to localStorage when they change
  useEffect(() => {
    if (generatedPages.length > 0) {
      const storageFormat = generatedPages.map(page => ({
        ...page,
        timestamp: page.timestamp.toISOString()
      }));
      localStorage.setItem('generatedPages', JSON.stringify(storageFormat));
    }
  }, [generatedPages]);
  
  // Save current page ID to localStorage when it changes
  useEffect(() => {
    if (currentPageId) {
      localStorage.setItem('currentPageId', currentPageId);
    } else {
      localStorage.removeItem('currentPageId');
    }
  }, [currentPageId]);

  // Scroll to bottom when chat history updates
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const saveChatMessageToFirestore = async (message: ChatMessage) => {
    if (currentUser) {
      try {
        await addDoc(collection(db, 'chats'), {
          uid: currentUser.uid,
          content: message.content,
          role: message.role,
          timestamp: message.timestamp,
          pageId: currentPageId // Store reference to current page if any
        });
      } catch (error) {
        console.error('Error saving message to Firestore:', error);
      }
    }
  };
  
  const saveGeneratedPageToFirestore = async (page: GeneratedPage) => {
    if (currentUser) {
      try {
        await addDoc(collection(db, 'generatedPages'), {
          uid: currentUser.uid,
          name: page.name,
          code: page.code,
          timestamp: page.timestamp,
          pageId: page.id
        });
      } catch (error) {
        console.error('Error saving generated page to Firestore:', error);
      }
    }
  };

  const clearChatHistory = () => {
    setChatHistory([]);
    setGeneratedPages([]);
    setCurrentPageId(null);
    localStorage.removeItem('chatHistory');
    localStorage.removeItem('generatedPages');
    localStorage.removeItem('currentPageId');
    setWelcomed(false);
  };

  const sendMessage = async () => {
    if (!chatMessage.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: uuidv4(),
      content: chatMessage.trim(),
      role: 'user',
      timestamp: new Date(),
      sender: 'user',
      text: chatMessage.trim()
    };
    
    setChatHistory(prev => [...prev, userMessage]);
    setChatMessage('');
    setIsLoading(true);

    // Save user message to Firestore
    await saveChatMessageToFirestore(userMessage);

    try {
      // Include the current page ID and code if available for context
      const currentPage = currentPageId 
        ? generatedPages.find(p => p.id === currentPageId) 
        : null;
        
      const response = await fetch('http://localhost:3001/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage.text,
          currentPage: currentPage ? {
            id: currentPage.id,
            name: currentPage.name,
            code: currentPage.code
          } : null
        }),
      });

      const data = await response.json();
      
      // Process the response - check if it contains a generated page
      if (data.generatedPage) {
        // Case 1: New page was generated
        if (!currentPageId) {
          const newPage: GeneratedPage = {
            id: uuidv4(),
            name: data.generatedPage.name || 'New Page',
            code: data.generatedPage.code,
            timestamp: new Date()
          };
          
          setGeneratedPages(prev => [...prev, newPage]);
          setCurrentPageId(newPage.id);
          
          // Save to Firestore
          await saveGeneratedPageToFirestore(newPage);
          
          // Append info about the generated page to the bot's message
          data.message = `${data.message}\n\nI've created a new page named "${newPage.name}" for you.`;
        } 
        // Case 2: Existing page was updated
        else {
          const updatedPages = generatedPages.map(page => 
            page.id === currentPageId 
              ? { 
                  ...page, 
                  code: data.generatedPage.code,
                  name: data.generatedPage.name || page.name,
                  timestamp: new Date()
                }
              : page
          );
          
          setGeneratedPages(updatedPages);
          
          // Save updated page to Firestore
          const updatedPage = updatedPages.find(p => p.id === currentPageId);
          if (updatedPage) {
            await saveGeneratedPageToFirestore(updatedPage);
          }
          
          // Append info about the updated page to the bot's message
          data.message = `${data.message}\n\nI've updated the page "${updatedPage?.name}" for you.`;
        }
      }
      
      // Add bot response
      const botMessage: ChatMessage = {
        id: uuidv4(),
        content: data.message,
        role: 'assistant',
        timestamp: new Date(),
        sender: 'bot',
        text: data.message
      };
      
      setChatHistory(prev => [...prev, botMessage]);
      
      // Save bot message to Firestore
      await saveChatMessageToFirestore(botMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      setChatHistory(prev => [...prev, {
        id: uuidv4(),
        content: "Sorry, I couldn't process your request. Please try again.",
        role: 'assistant',
        timestamp: new Date(),
        sender: 'bot',
        text: "Sorry, I couldn't process your request. Please try again."
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
        <div className="fixed bottom-24 right-6 w-80 sm:w-96 bg-white rounded-lg shadow-xl flex flex-col h-96">
          <div className="flex justify-between items-center p-4 border-b">
            <h3 className="font-medium text-gray-800">Brix.AI Assistant</h3>
            <div className="flex gap-2">
              <button 
                onClick={clearChatHistory}
                className="text-gray-500 hover:text-red-500"
                title="Clear chat history"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setChatOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {currentPageId && (
            <div className="px-4 py-2 bg-blue-50 border-b">
              <p className="text-sm text-blue-700">
                Currently modifying: {generatedPages.find(p => p.id === currentPageId)?.name || 'Page'}
              </p>
            </div>
          )}
          
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-3"
          >
            {chatHistory.map((msg) => (
              <div 
                key={msg.id}
                className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-100 ml-6' : 'bg-gray-100 mr-6'}`}
              >
                <p className="font-semibold text-sm text-gray-800">
                  {msg.role === 'user' ? 'You' : 'Brix.AI'}
                </p>
                <p className="text-gray-800 whitespace-pre-line">{msg.content}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
            ))}
            
            {isLoading && (
              <div className="bg-gray-100 p-3 rounded-lg mr-6">
                <p className="text-gray-800">Brix.AI is typing...</p>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-[#8B4513] text-black"
                placeholder="Type your message..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
              />
              <button 
                type="submit" 
                className="bg-[#8B4513] text-white px-4 py-2 rounded-md hover:bg-[#D2B48C]"
                disabled={isLoading}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}