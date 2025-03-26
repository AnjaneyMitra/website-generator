import { useState, useEffect, useRef } from 'react';
import { Loader2, Sparkles, User, Laptop, Smartphone } from 'lucide-react'; // Added new icons
import { useRouter } from 'next/router';
import { db } from '../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import Chatbot from './Chatbot';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Float } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';

// Define proper types for components
interface GeometricElementProps {
  position: [number, number, number];
  color?: string;
  size?: number;
}

// Minimal geometric element for 3D scene
const GeometricElement = ({ position, color = "#ffffff", size = 1 }: GeometricElementProps) => {
  return (
    <Float
      speed={1.5} 
      rotationIntensity={0.2} 
      floatIntensity={0.5}
    >
      <mesh position={position}>
        <octahedronGeometry args={[size, 0]} />
        <meshStandardMaterial color={color} wireframe={true} />
      </mesh>
    </Float>
  );
};

// Futuristic Scene
const XAIScene = () => {
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[0, 0, 5]} intensity={0.5} />
      <GeometricElement position={[-2, 0, 0]} color="#3B82F6" size={0.5} />
      <GeometricElement position={[2, 1, -2]} color="#ffffff" size={0.3} />
      <GeometricElement position={[0, -1, -1]} color="#3B82F6" size={0.4} />
      <Stars radius={50} depth={50} count={1000} factor={4} saturation={0} fade />
      <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
    </>
  );
};

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  sender?: 'user' | 'bot';
  text?: string;
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [previewMode, setPreviewMode] = useState<'wide' | 'mobile'>('wide'); // New state for preview mode
  
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
          timestamp: message.timestamp,
        });
      } catch (error) {
        console.error('Error saving chat history:', error);
      }
    }
  };

  const handleChatMessage = (message: ChatMessage) => {
    // Save chat message to Firestore
    saveChatHistory(message);
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
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // If not authenticated, show the login form with X.AI-inspired style
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-black flex flex-col justify-center py-12 px-6">
        <div className="relative z-0">
          <Canvas className="absolute inset-0">
            <XAIScene />
          </Canvas>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          <h2 className="mt-6 text-center text-3xl font-bold text-white">
            brix<span className="text-blue-500">.</span>ai
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Sign in to continue
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          <div className="bg-zinc-900 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-zinc-800">
            {loginError && (
              <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded mb-4">
                {loginError}
              </div>
            )}
            
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300">
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
                    className="appearance-none block w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300">
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
                    className="appearance-none block w-full px-3 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Sign in
                </button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-800"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-zinc-900 text-gray-400">Or continue with</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleGoogleSignIn}
                  className="w-full flex justify-center py-2 px-4 border border-zinc-800 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-zinc-800 hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Sign in with Google
                </button>
              </div>
            </div>

            <div className="mt-6 text-center text-sm">
              <p className="text-gray-400">
                Don't have an account?{' '}
                <Link href="/signup" className="font-medium text-blue-500 hover:text-blue-400">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise, show the generator UI with X.AI-inspired style
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <div className="flex">
        {/* Sidebar with updated styling */}
        <div className={`fixed inset-y-0 left-0 z-20 w-72 bg-zinc-900 border-r border-zinc-800 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
        </div>
        
        <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-72' : 'ml-0'}`}>
          <div className="min-h-screen relative">
            {/* 3D Background */}
            <div className="absolute inset-0 z-0 opacity-70">
              <Canvas>
                <XAIScene />
              </Canvas>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto p-8">
              {/* Header with Link */}
              <div className="text-center space-y-6 py-16">
                <motion.div 
                  className="inline-block relative"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <Link href={"/about"}>
                    <h1 className="text-7xl sm:text-8xl md:text-9xl font-bold tracking-tight mb-2">
                      brix<span className="text-blue-500">.</span>ai
                    </h1>
                  </Link>
                </motion.div>
                <div className="h-px w-24 bg-gradient-to-r from-transparent via-blue-500 to-transparent mx-auto my-8"></div>
                <p className="text-xl md:text-2xl text-gray-400 max-w-2xl text-center font-light mx-auto">
                  Transform your ideas into production-ready websites with AI-powered precision
                </p>
              </div>

              {/* User account section */}
              <div className="absolute top-4 right-4 flex items-center space-x-4">
                <Link href="/account" className="group flex items-center border-b border-transparent hover:border-white pb-1 transition-colors">
                  <User className="w-4 h-4 mr-2" />
                  <span>Account</span>
                </Link>
                <button 
                  onClick={logout} 
                  className="inline-block bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-medium transition-colors duration-300"
                >
                  Logout
                </button>
              </div>

              <div className="container mx-auto p-4">
                <motion.div 
                  className="border border-zinc-800 p-8 hover:border-blue-500 transition-colors duration-300 bg-black/60 backdrop-blur-sm rounded-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {/* Generator interface */}
                  <div className="mb-8">
                    <label htmlFor="prompt" className="block text-2xl font-medium text-white mb-4">
                      Describe your website
                    </label>
                    <div className="flex gap-4">
                      <textarea
                        id="prompt"
                        className="flex-1 p-4 bg-zinc-800 border border-zinc-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:border-zinc-600 resize-none"
                        placeholder="Describe the website you want to generate..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={3}
                      />
                      <button
                        onClick={generateWebsite}
                        disabled={loading || !prompt.trim()}
                        className={`px-8 py-4 text-lg font-medium flex items-center transition-all duration-200 ${
                          loading || !prompt.trim() 
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
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
                    <motion.div 
                      className="mt-10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <div className="flex justify-between items-center border-b border-zinc-800 mb-6">
                        <nav className="-mb-px flex space-x-8">
                          <button
                            onClick={() => setActiveTab('preview')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                              activeTab === 'preview'
                                ? 'border-blue-500 text-blue-500'
                                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
                            }`}
                          >
                            Preview
                          </button>
                          <button
                            onClick={() => setActiveTab('code')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                              activeTab === 'code'
                                ? 'border-blue-500 text-blue-500'
                                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
                            }`}
                          >
                            Code
                          </button>
                        </nav>

                        {/* Device preview switcher */}
                        {activeTab === 'preview' && (
                          <div className="flex items-center space-x-2 mb-2 bg-zinc-800 rounded-md p-1">
                            <button
                              onClick={() => setPreviewMode('wide')}
                              className={`p-2 rounded flex items-center text-xs ${
                                previewMode === 'wide' 
                                  ? 'bg-blue-500/20 text-blue-400' 
                                  : 'text-gray-400 hover:bg-zinc-700'
                              }`}
                              title="Desktop/Laptop View"
                            >
                              <Laptop className="w-4 h-4 mr-1" />
                              <span>Wide</span>
                            </button>
                            <button
                              onClick={() => setPreviewMode('mobile')}
                              className={`p-2 rounded flex items-center text-xs ${
                                previewMode === 'mobile' 
                                  ? 'bg-blue-500/20 text-blue-400' 
                                  : 'text-gray-400 hover:bg-zinc-700'
                              }`}
                              title="Mobile View"
                            >
                              <Smartphone className="w-4 h-4 mr-1" />
                              <span>Mobile</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {activeTab === 'preview' ? (
                        <div className={`flex justify-center ${previewMode === 'mobile' ? 'bg-zinc-800/50 py-8 rounded-lg' : ''}`}>
                          <div 
                            className={
                              previewMode === 'mobile'
                                ? 'w-[375px] h-[667px] relative border-8 border-zinc-700 rounded-[36px] overflow-hidden shadow-lg'
                                : 'w-full'
                            }
                          >
                            {previewMode === 'mobile' && (
                              <>
                                {/* Notch for mobile view */}
                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-zinc-700 rounded-b-lg z-10"></div>
                                {/* Home indicator for mobile view */}
                                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-zinc-600 rounded-full z-10"></div>
                              </>
                            )}
                            <iframe
                              ref={iframeRef}
                              srcDoc={preview}
                              className={`border-0 bg-white ${
                                previewMode === 'mobile'
                                  ? 'w-full h-full'
                                  : 'w-full h-[600px] border border-zinc-800 rounded-lg'
                              }`}
                              sandbox="allow-same-origin allow-scripts"
                              title="Website Preview"
                              style={{
                                // Add additional styles for mobile version to properly scale content
                                ...(previewMode === 'mobile' ? { 
                                  width: '375px', 
                                  height: '667px', 
                                } : {})
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <pre className="bg-zinc-900 text-gray-300 p-4 rounded-lg overflow-x-auto border border-zinc-800">
                            <code>{generatedCode}</code>
                          </pre>
                          <button
                            onClick={downloadCode}
                            className="absolute top-2 right-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200 text-sm"
                          >
                            Download
                          </button>
                        </div>
                      )}

                      {activeTab === 'preview' && generatedCode && (
                        <div className="mt-6 flex justify-end space-x-4">
                          <button
                            onClick={toggleEditMode}
                            className={`px-8 py-4 text-lg font-medium transition-colors duration-300 ${
                              editMode 
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            {editMode ? 'Save & Exit Edit Mode' : 'Enter Edit Mode'}
                          </button>
                          {unsavedChanges && (
                            <button
                              onClick={applyAllEdits}
                              className="px-8 py-4 text-lg font-medium bg-yellow-600 hover:bg-yellow-700 text-white transition-colors duration-300"
                            >
                              Apply Changes
                            </button>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Chatbot component */}
      <div className="fixed bottom-4 right-4 z-50">
        <Chatbot />
      </div>
    </div>
  );
}