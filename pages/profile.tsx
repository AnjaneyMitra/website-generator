import { useEffect, useState } from 'react';
import { db } from '../utils/firebase/firebaseConfig';
import { collection, query, where, getDocs, orderBy, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import { Trash2 } from 'lucide-react';

interface FirestoreChatMessage {
  uid: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Timestamp;
  id?: string;
  pageId?: string | null;
}

export default function Profile() {
  const [chatHistory, setChatHistory] = useState<FirestoreChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();

  const fetchChatHistory = async () => {
    if (currentUser) {
      setIsLoading(true);
      try {
        const q = query(
          collection(db, 'chats'), 
          where('uid', '==', currentUser.uid),
          orderBy('timestamp', 'desc')  // Changed to desc to show newest first
        );
        const querySnapshot = await getDocs(q);
        const chats = querySnapshot.docs.map(doc => ({
          ...(doc.data() as FirestoreChatMessage),
          id: doc.id
        }));
        setChatHistory(chats);
      } catch (error) {
        console.error('Error fetching chat history:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchChatHistory();
  }, [fetchChatHistory]);

  const clearAllChatHistory = async () => {
    if (!currentUser || !window.confirm('Are you sure you want to delete all chat history? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      const q = query(collection(db, 'chats'), where('uid', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      
      const deletePromises = querySnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(deletePromises);
      setChatHistory([]);
    } catch (error) {
      console.error('Error deleting chat history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!messageId || !window.confirm('Delete this message?')) return;
    
    try {
      await deleteDoc(doc(db, 'chats', messageId));
      setChatHistory(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <Navbar />
        
        <div className="container mx-auto p-4">
          {currentUser && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h1 className="text-2xl font-bold mb-4 text-black">Welcome, {currentUser.displayName || currentUser.email}</h1>
              
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-black">Your Chat History</h2>
                  {chatHistory.length > 0 && (
                    <button 
                      onClick={clearAllChatHistory}
                      className="bg-red-100 text-red-700 px-3 py-1 rounded-md hover:bg-red-200 flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear All
                    </button>
                  )}
                </div>
                
                {isLoading ? (
                  <div className="py-4 text-center">Loading chat history...</div>
                ) : chatHistory.length > 0 ? (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {chatHistory.map((chat) => (
                      <div 
                        key={chat.id} 
                        className={`p-3 rounded-lg relative group ${
                          chat.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'
                        }`}
                      >
                        <div className="flex justify-between">
                          <p className="font-semibold text-black">
                            {chat.role === 'user' ? 'You' : 'AI'}
                          </p>
                          <button
                            onClick={() => chat.id && deleteMessage(chat.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-black whitespace-pre-wrap">{chat.content}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {chat.timestamp?.toDate().toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-black py-4">No chat history found.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
