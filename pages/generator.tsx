import { useState, useEffect, useRef } from 'react';
import { Loader2, Sparkles, User } from 'lucide-react';
import { useRouter } from 'next/router';
import { db } from '../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Chatbot from './Chatbot';  // Add this import

// Remove or use the unused interfaces and variables
interface ChatMessage {
  content: string;
  role: 'user' | 'assistant';
}

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [preview, setPreview] = useState('');
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);  // Changed default to true
  
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const editedElements = useRef<{[key: string]: string}>({});
  const { currentUser, login, signInWithGoogle, logout, loading: authLoading } = useAuth();
  const router = useRouter();

  const generateWebsite = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setGeneratedCode(data.code);
      setPreview(data.code);
      // Clear any previously edited elements
      editedElements.current = {};
    } catch (error) {
      console.error('Error generating website:', error);
      // Show an error message to the user
      alert('Failed to generate website. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const downloadCode = () => {
    if (!generatedCode) return;
    
    try {
      const element = document.createElement('a');
      const file = new Blob([generatedCode], { type: 'text/html' });
      element.href = URL.createObjectURL(file);
      element.download = 'generated-website.html';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error('Error downloading code:', error);
      alert('Failed to download code. Please try again.');
    }
  };

  // Function to safely execute code in iframe without reloading
  const executeInIframe = (iframe: HTMLIFrameElement | null, script: string) => {
    if (!iframe || !iframe.contentWindow) return;
    
    try {
      // Create a script element in the iframe document
      const scriptEl = iframe.contentDocument?.createElement('script');
      if (!scriptEl) return;
      
      scriptEl.textContent = script;
      iframe.contentDocument?.body.appendChild(scriptEl);
      
      // Clean up after execution
      setTimeout(() => {
        scriptEl.remove();
      }, 0);
    } catch (error) {
      console.error('Error executing script in iframe:', error);
    }
  };

  // Function to apply all saved edits to the code
  const applyAllEdits = () => {
    if (Object.keys(editedElements.current).length === 0) {
      // No edits to apply
      setUnsavedChanges(false);
      return;
    }
  
    let updatedCode = generatedCode;
    
    // Apply text edits with a more reliable approach
    Object.entries(editedElements.current).forEach(([originalText, newText]) => {
      try {
        // First try with HTML content surrounding approach
        const escapedText = escapeRegExp(originalText);
        // Look for text between tags
        const regex = new RegExp(`(>\\s*)(${escapedText})(\\s*<)`, 'g');
        
        // Count matches to ensure we're making the right replacements
        const matches = updatedCode.match(regex);
        
        if (matches && matches.length > 0) {
          updatedCode = updatedCode.replace(regex, (match, before, target, after) => {
            return `${before}${newText}${after}`;
          });
        } else {
          // Fallback for cases where the text might be in attributes or other locations
          updatedCode = updatedCode.replace(
            new RegExp(escapedText, 'g'), 
            newText
          );
        }
      } catch (err) {
        console.error("Error applying edit:", err);
      }
    });
    
    // Update both code and preview with the same content
    setGeneratedCode(updatedCode);
    setPreview(updatedCode);
    setUnsavedChanges(false);
    
    // Clear edited elements after successfully applying them
    console.log("Applied edits successfully");
    console.log("Applied edits:", Object.keys(editedElements.current).length);
  };

  // Helper function to escape special regex characters
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Function to toggle edit mode
  const toggleEditMode = () => {
    if (editMode) {
      // If we're turning off edit mode, require saving first
      if (unsavedChanges) {
        // Don't allow exiting edit mode if changes aren't saved
        alert("Please save your changes first by clicking 'Save & Exit'");
        return;
      }
      
      // Turn off edit mode only if no unsaved changes
      const iframe = iframeRef.current;
      if (iframe && iframe.contentDocument) {
        const disableEditScript = `
          document.body.classList.remove('editing-mode');
          document.body.querySelectorAll('[contenteditable="true"]').forEach(element => {
            element.removeAttribute('contenteditable');
            element.style.outline = 'none';
            element.style.padding = '';
            element.removeAttribute('data-original-text');
          });
          
          console.log('Edit mode disabled');
        `;
        
        executeInIframe(iframe, disableEditScript);
      }
      setEditMode(false);
    } else {
      // Enable edit mode
      const iframe = iframeRef.current;
      if (iframe && iframe.contentDocument) {
        const editScript = `
          // Prevent normal link navigation inside the iframe
          document.body.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function(e) {
              if (this.hasAttribute('contenteditable') || document.body.classList.contains('editing-mode')) {
                e.preventDefault();
                e.stopPropagation();
              }
            });
          });
          
          // Add a class to the body to indicate edit mode
          document.body.classList.add('editing-mode');
          
          // Make elements editable
          document.body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button, li, div').forEach(element => {
            // Skip elements that shouldn't be editable
            if (element.closest('[data-no-edit]')) return;
            
            // Check if the element contains mostly text
            if ((element.childElementCount === 0) || element.tagName === 'BUTTON' || element.tagName === 'A') {
              // Store original text
              const originalText = element.innerText || element.textContent;
              if (!originalText || originalText.trim() === '') return; // Skip empty elements
              
              element.setAttribute('contenteditable', 'true');
              element.setAttribute('data-original-text', originalText);
              element.style.outline = '1px dashed #2563eb';
              element.style.padding = '2px';
              
              element.addEventListener('focus', function() {
                this.style.outline = '2px solid #2563eb';
              });
              
              element.addEventListener('blur', function() {
                this.style.outline = '1px dashed #2563eb';
                const newText = this.innerText || this.textContent;
                if (newText !== this.getAttribute('data-original-text')) {
                  try {
                    // Send message to parent window with the updated text
                    window.parent.postMessage({
                      type: 'text-edited',
                      originalText: this.getAttribute('data-original-text'),
                      newText: newText,
                      nodeType: this.tagName.toLowerCase()
                    }, '*');
                  } catch (err) {
                    console.error("Error sending edit message:", err);
                  }
                }
              });
            }
          });
          
          console.log('Edit mode enabled');
        `;
        
        // Wait for iframe to be fully loaded
        if (iframe.contentDocument.readyState === 'complete') {
          executeInIframe(iframe, editScript);
        } else {
          iframe.onload = () => executeInIframe(iframe, editScript);
        }
      }
      setEditMode(true);
      // Reset unsaved changes when entering edit mode
      setUnsavedChanges(false);
    }
  };

  // Listen for messages from the iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      
      if (data && data.type === 'text-edited') {
        // Store the edit in the editedElements ref
        editedElements.current[data.originalText] = data.newText;
        setUnsavedChanges(true);
        
        // The iframe contents stay as they are since the user is directly editing them
        // No need to update setPreview here as the visual changes are already visible
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Add this to help debug issues
  useEffect(() => {
    if (unsavedChanges) {
      console.log("Unsaved changes:", editedElements.current);
    }
  }, [unsavedChanges]);

  const saveChatHistory = async (message: ChatMessage) => {
    if (currentUser) {
      try {
        await addDoc(collection(db, 'chats'), {
          uid: currentUser.uid,
          content: message.content,
          role: message.role,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error('Error saving chat history:', error);
      }
    }
  };

  const handleChatMessage = (message: ChatMessage) => {
    // Save chat message to Firestore
    saveChatHistory(message);
    
    // If you need to perform additional actions with the chat message,
    // add them here
  };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    
    try {
      setLoginError('');
      await login(email, password);
    } catch (error) {
      setLoginError('Failed to sign in. Please check your credentials.');
      console.error(error);
    }
  }

  async function handleGoogleSignIn() {
    try {
      setLoginError('');
      await signInWithGoogle();
    } catch (error) {
      setLoginError('Failed to sign in with Google.');
      console.error(error);
    }
  }

  // If authentication is loading, show a loading spinner
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#8B4513]" />
      </div>
    );
  }

  // If not authenticated, show the login form
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col justify-center py-12 px-6">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Website Generator
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {loginError && (
              <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {loginError}
              </div>
            )}
            
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Sign in
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleGoogleSignIn}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Sign in with Google
                </button>
              </div>
            </div>

            <div className="mt-6 text-center text-sm">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, show the generator UI
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
        
        <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-72' : 'ml-0'}`}>
          <main className="min-h-screen bg-gradient-to-b from-neutral-200 via-neutral-100 to-neutral-200">
            {/* Animated background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -inset-[10px] opacity-30">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#2563eb] rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
                <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-neutral-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000" />
              </div>
            </div>

            <div className="relative max-w-6xl mx-auto p-8">
              {/* Header with Next.js Link */}
              <div className="text-center space-y-6 py-16">
                <div className="inline-block relative">
                  <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-[#2563eb] via-neutral-600 to-[#2563eb] opacity-30" />
                  <Link href={"/about"} className="inline-block cursor-pointer">
                    <h1 className="relative text-8xl font-black tracking-tight text-neutral-800 drop-shadow-2xl transition-transform hover:scale-105">
                      brix<span className="text-[#2563eb]">.ai</span>
                    </h1>
                    <Sparkles className="absolute -top-8 -right-10 w-10 h-10 text-[#2563eb] animate-bounce" />
                  </Link>
                </div>
                <p className="text-xl text-neutral-600 font-medium tracking-wide max-w-2xl mx-auto">
                  Transform your ideas into production-ready websites with AI-powered precision
                </p>
              </div>

              {/* User account section */}
              <div className="absolute top-4 right-4 flex items-center space-x-4">
                <Link href="/account" className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                  <User className="w-4 h-4 mr-2 inline" />
                  Account
                </Link>
                <button onClick={logout} className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600">
                  Logout
                </button>
              </div>

              <div className="container mx-auto p-4">
                <div className="bg-white rounded-lg shadow-md p-6">
                  
                  
                  {/* Rest of the generator interface */}
                  <div className="mb-4">
                    <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-3">
                      Describe your website
                    </label>
                    <div className="flex gap-2">
                      <textarea
                        id="prompt"
                        className="flex-1 p-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-black shadow-sm transition-all duration-200 hover:border-gray-300 resize-none"
                        placeholder="Describe the website you want to generate..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={3}
                      />
                      <button
                        onClick={generateWebsite}
                        disabled={loading || !prompt.trim()}
                        className={`px-6 py-2 bg-blue-600 text-white rounded-2xl flex items-center transition-all duration-200 ${
                          loading || !prompt.trim() 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:bg-blue-700 hover:shadow-md active:scale-95'
                        }`}
                      >
                        {loading ? (
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        ) : (
                          <Sparkles className="w-5 h-5 mr-2" />
                        )}
                        {loading ? 'Generating...' : 'Generate'}
                      </button>
                    </div>
                  </div>

                  {/* Preview/Code tabs and content section */}
                  {generatedCode && (
                    <div className="mt-6">
                      <div className="border-b border-gray-200 mb-4">
                        <nav className="-mb-px flex space-x-8">
                          <button
                            onClick={() => setActiveTab('preview')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                              activeTab === 'preview'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            Preview
                          </button>
                          <button
                            onClick={() => setActiveTab('code')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                              activeTab === 'code'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            Code
                          </button>
                        </nav>
                      </div>

                      {activeTab === 'preview' ? (
                        <iframe
                          ref={iframeRef}
                          srcDoc={preview}
                          className="w-full h-[600px] border border-gray-200 rounded-lg"
                          sandbox="allow-same-origin allow-scripts"
                          title="Website Preview"
                        />
                      ) : (
                        <div className="relative">
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                            <code>{generatedCode}</code>
                          </pre>
                          <button
                            onClick={downloadCode}
                            className="absolute top-2 right-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                          >
                            Download
                          </button>
                        </div>
                      )}

                      {activeTab === 'preview' && generatedCode && (
                        <div className="mt-4 flex justify-end space-x-4">
                          <button
                            onClick={toggleEditMode}
                            className={`px-4 py-2 rounded ${
                              editMode 
                                ? 'bg-green-500 hover:bg-green-600 text-white'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                          >
                            {editMode ? 'Save & Exit Edit Mode' : 'Enter Edit Mode'}
                          </button>
                          {unsavedChanges && (
                            <button
                              onClick={applyAllEdits}
                              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                            >
                              Apply Changes
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Actions section with download button, edit mode toggle, etc. would go here */}
                </div>
              </div>
            </div>
          </main>
        </main>
      </div>
      {/* Add Chatbot component */}
      <div className="fixed bottom-4 right-4 z-50">
        <Chatbot />
      </div>
    </div>
  );
}