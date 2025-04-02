import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Sparkles, User, Laptop, Smartphone, Code, ChevronRight } from 'lucide-react'; // Added more icons
import { useRouter } from 'next/router';
import { db } from '../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
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

// Add this function near the top of your component to determine the API base URL
const getApiBaseUrl = () => {
  // In production (Vercel), use relative URLs which will use the same domain
  if (process.env.NODE_ENV === 'production') {
    return '';
  }
  // In development, use localhost with the backend port
  return 'http://localhost:3001';
};

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
  const [previewMode, setPreviewMode] = useState<'wide' | 'mobile'>('wide');
  const [inputMode, setInputMode] = useState<'generate' | 'ask'>('generate');
  // Empty initial state for chat messages - no welcome message in the chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [generationSteps, setGenerationSteps] = useState<string[]>([]);
  const [hasInteracted, setHasInteracted] = useState(false); // New state to track if user has interacted
  
  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const editedElements = useRef<{[key: string]: string}>({});
  const { currentUser, login, signInWithGoogle, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const eventSource = useRef<EventSource | null>(null);
  
  // Add this line near your other state declarations
  const apiBaseUrl = getApiBaseUrl();
  
  // Auto-scroll chat when messages change
  useEffect(() => {
    const chatContainer = document.getElementById('chat-messages-container');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [chatMessages, loading]);

  // Debug effect for preview updates
  useEffect(() => {
    if (preview) {
      console.log('Preview updated, length:', preview.length);
      console.log('Preview content starts with:', preview.substring(0, 100));
      
      // Force a reload of the iframe by setting a timeout
      setTimeout(() => {
        if (iframeRef.current) {
          console.log('Forcing iframe refresh');
          // Use the setAttribute method to bypass TypeScript issues
          const iframe = iframeRef.current;
          
          // When iframe is loaded, evaluate any scripts
          const handleIframeLoad = () => {
            if (!iframe.contentDocument) return;
            
            console.log('Iframe loaded, running scripts...');
            
            // Execute all scripts in the iframe
            const scripts = Array.from(iframe.contentDocument.querySelectorAll('script'));
            scripts.forEach(oldScript => {
              if (!iframe.contentDocument) return;
              
              const newScript = iframe.contentDocument.createElement('script');
              Array.from(oldScript.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
              });
              
              newScript.textContent = oldScript.textContent;
              oldScript.parentNode?.replaceChild(newScript, oldScript);
            });
          };
          
          // Set up the load handler
          iframe.onload = handleIframeLoad;
          
          // Store the current content 
          const currentContent = preview;
          // Temporarily clear the content
          iframe.setAttribute('srcDoc', '');
          
          // Set it back after a short delay
          requestAnimationFrame(() => {
            iframe.setAttribute('srcDoc', currentContent);
          });
        }
      }, 100);
    }
  }, [preview]);

  // Auto-scroll chat to bottom when messages or loading state changes
  useEffect(() => {
    const chatContainer = document.getElementById('chat-messages-container');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [chatMessages, loading]);

  const generateWebsite = async () => {
    try {
      setLoading(true);
      setGenerationSteps([]);
      setHasInteracted(true); // Mark that user has interacted
      
      // Close any existing EventSource connection
      if (eventSource.current) {
        eventSource.current.close();
      }
      
      // Create a new EventSource connection with dynamic base URL
      const sseUrl = `${apiBaseUrl}/generate-sse`;
      console.log('Connecting to SSE endpoint:', sseUrl);
      eventSource.current = new EventSource(sseUrl);
      
      // Add specific event handlers for connection open
      eventSource.current.onopen = () => {
        console.log('SSE connection opened successfully');
      };
      
      eventSource.current.onmessage = (event) => {
        console.log('SSE message received:', event.data);
        try {
          const data = JSON.parse(event.data);
          console.log('Parsed SSE data:', data);
          console.log('Data type:', data.type);
          
          if (data.type === 'step') {
            console.log('Processing step event:', data.message);
            setGenerationSteps(prev => [...prev, data.message]);
          } else if (data.type === 'completion') {
            console.log('Processing completion event. Data structure:', JSON.stringify(data));
            
            // Check both data.data.code and data.code to handle different server response formats
            const codeContent = data.data?.code || data.code;
            
            if (codeContent) {
              console.log('Setting generated code, length:', codeContent.length);
              setGeneratedCode(codeContent);
              setPreview(codeContent);
              setShowPreview(true);
              setActiveTab('preview'); // Ensure preview tab is active
              
              // Focus on the iframe to trigger updates
              setTimeout(() => {
                if (iframeRef.current) {
                  console.log('Focusing on iframe after timeout');
                  iframeRef.current.focus();
                  
                  // Force iframe reload using setAttribute to bypass TypeScript issues
                  const iframeElement = iframeRef.current;
                  // Store current content
                  const currentContent = codeContent;
                  // Clear the iframe content
                  iframeElement.setAttribute('srcDoc', '');
                  
                  // Set it back after a short delay
                  setTimeout(() => {
                    if (iframeRef.current) {
                      console.log('Setting iframe content via setAttribute');
                      iframeRef.current.setAttribute('srcDoc', currentContent);
                    }
                  }, 50);
                }
              }, 100);
              
              // Add assistant message to chat
              const assistantMessage: ChatMessage = {
                id: Date.now().toString() + '-response',
                content: "I've generated your website based on your description. You can view it in the preview panel.",
                role: 'assistant',
                timestamp: new Date()
              };
              setChatMessages(prev => [...prev, assistantMessage]);
              
              // Close the connection
              eventSource.current?.close();
              eventSource.current = null;
              setLoading(false);
            } else {
              console.error('Code data is missing in completion event:', data);
            }
          } else if (data.type === 'connected') {
            console.log('SSE connection established:', data.message);
          } else {
            console.log('Unhandled event type:', data.type);
          }
        } catch (parseError) {
          console.error('Error parsing SSE message:', parseError, event.data);
        }
      };
      
      eventSource.current.onerror = (error) => {
        console.error('EventSource error:', error);
        // Check if the connection was refused or not found (404)
        if (eventSource.current?.readyState === 2) { // CLOSED
          console.error('SSE connection was closed or could not be established');
        }
        eventSource.current?.close();
        eventSource.current = null;
        setLoading(false);
        
        // Show error message in chat
        const errorMessage: ChatMessage = {
          id: Date.now().toString() + '-error',
          content: "Sorry, I couldn't generate the website. There was a problem connecting to the server. Please try again later.",
          role: 'assistant',
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, errorMessage]);
      };
      
      // Send the prompt to the server
      const response = await fetch(`${apiBaseUrl}/start-generation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });
      
      if (!response.ok) {
        console.error(`HTTP error: ${response.status}`);
        throw new Error(`Failed to start generation process. Status: ${response.status}`);
      }
      
      // Clear the prompt to prepare for chat mode
      setPrompt('');
    } catch (error) {
      console.error('Error generating website:', error);
      setLoading(false);
      
      if (eventSource.current) {
        eventSource.current.close();
        eventSource.current = null;
      }
      
      // Show error message in chat
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + '-error',
        content: "Sorry, I couldn't generate the website. Please try again later.",
        role: 'assistant',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    }
  };

  const sendChatMessage = async () => {
    if (!prompt.trim()) return;
    
    setHasInteracted(true); // Mark that user has interacted
    // Add user message to chat
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: prompt,
      role: 'user',
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);
    
    // Clear input
    setPrompt('');
    setLoading(true);
    
    try {
      // Call the chatbot API with dynamic base URL
      console.log('Sending chat message to server');
      // Use GET with query parameters instead of POST
      const encodedMessage = encodeURIComponent(prompt);
      const response = await fetch(`${apiBaseUrl}/chat?message=${encodedMessage}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.error(`Chat API HTTP error: ${response.status}`);
        throw new Error(`Failed to get a response. Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Chat response received:', data);
      
      // Check if data contains a response property or message property
      let responseText = '';
      if (data?.response && typeof data.response === 'string') {
        responseText = data.response;
      } else if (data?.message && typeof data.message === 'string') {
        responseText = data.message;
      } else if (typeof data === 'string') {
        responseText = data;
      } else {
        console.error('Invalid response format:', data);
        throw new Error('Received an invalid response format from the server');
      }
      
      const assistantMessage: ChatMessage = {
        id: Date.now().toString() + '-response',
        content: responseText,
        role: 'assistant',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending chat message:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString() + '-error',
        content: "Sorry, I couldn't process your message. Please try again later.",
        role: 'assistant',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setHasInteracted(true); // Mark that user has interacted
    
    if (inputMode === 'generate') {
      // Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        content: prompt,
        role: 'user',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, userMessage]);
      
      // Generate website
      generateWebsite();
    } else {
      // Send chat message
      sendChatMessage();
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

  const togglePreview = () => {
    setShowPreview(prev => !prev);
  };

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
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-950 to-black text-white font-sans">
      <div className="flex flex-col h-screen"> {/* Use flex-col and h-screen for fixed layout */}
        {/* Header bar with logo on left and account on right */}
        <div className="z-50 w-full bg-zinc-900/60 backdrop-blur-sm py-3 px-4 sm:px-8 flex justify-between items-center border-b border-zinc-800/60">
          <div className="flex items-center">
            <Link href={"/about"} className="flex items-center">
              <h1 className="text-xl font-bold tracking-tight flex items-center">
                brix<span className="text-blue-500">.</span><span className="text-blue-500 ml-1">ai</span>
              </h1>
            </Link>
          </div>

          <div className="flex items-center">
            <Link href="/account" className="group flex items-center border-b border-transparent hover:border-white pb-1 transition-colors mr-4">
              <User className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Account</span>
            </Link>
            <button 
              onClick={logout} 
              className="inline-block bg-red-600 hover:bg-red-700 text-white px-3 py-1 sm:px-4 sm:py-2 text-sm font-medium transition-colors duration-300 rounded-md"
            >
              <span className="hidden sm:inline">Logout</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 sm:hidden">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main content area - flex-grow to take up available space */}
        <div className="flex-1 relative z-10 flex overflow-hidden">
          {/* Chat interface - takes the full width or left side based on preview state */}
          <div className={`flex-1 transition-all duration-500 flex flex-col ${
            showPreview ? 'max-w-[50%]' : 'max-w-full'
          }`}>
            {/* Chat content container with fixed height and scrollable messages */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Messages area with proper scrolling */}
              <div className="flex-1 overflow-y-auto" id="chat-messages-container">
                {/* Welcome screen (shown when no interaction has happened) */}
                {!hasInteracted ? (
                  <div className="text-center px-4 max-w-xl mx-auto h-full flex items-center justify-center">
                    <div>
                      <h1 className="text-4xl font-bold mb-4">Welcome to Brix.AI</h1>
                      <p className="text-gray-400 text-lg mb-8">
                        Your personal website builder powered by AI
                      </p>
                      {/* Subtle instruction to get started */}
                      <p className="text-gray-500 text-sm">
                        Use the input below to describe the website you want to create
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Chat messages - shown after interaction begins */
                  <div className="w-full max-w-3xl mx-auto px-4 py-4">
                    <div className="space-y-6">
                      {chatMessages.map((msg, index) => (
                        <div 
                          key={msg.id}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
                        >
                          {/* Assistant message (left-aligned) */}
                          {msg.role === 'assistant' && (
                            <div className="flex max-w-[85%]">
                              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                                <Sparkles className="h-4 w-4 text-white" />
                              </div>
                              <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3">
                                <p className="text-white whitespace-pre-line">{msg.content}</p>
                                
                                {/* Show generation steps */}
                                {loading && 
                                 index === chatMessages.length - 1 && 
                                 inputMode === 'generate' && 
                                 generationSteps.length > 0 && (
                                  <div className="mt-3 text-sm text-gray-400 border-l-2 border-gray-700 pl-3">
                                    {generationSteps.map((step, i) => (
                                      <div key={i} className="mb-1.5">
                                        {step}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Display the Preview button after generation is complete */}
                                {!loading && 
                                 generatedCode && 
                                 index === chatMessages.length - 1 && (
                                  <div className="mt-4">
                                    <button 
                                      onClick={togglePreview} 
                                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-full text-white text-sm transition-colors flex items-center"
                                    >
                                      {showPreview ? 'Collapse' : 'Preview'}
                                      {!showPreview && (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 ml-1.5">
                                          <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* User message (right-aligned) */}
                          {msg.role === 'user' && (
                            <div className="flex max-w-[85%]">
                              <div className="bg-blue-700 rounded-2xl rounded-tr-sm px-4 py-3">
                                <p className="text-white whitespace-pre-line">{msg.content}</p>
                              </div>
                              <div className="h-8 w-8 rounded-full bg-zinc-700 flex items-center justify-center ml-2 mt-1 flex-shrink-0">
                                <User className="h-4 w-4 text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {/* Loading indicator */}
                      {loading && (
                        <div className="flex justify-start mb-4">
                          <div className="flex max-w-[85%]">
                            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                              <Sparkles className="h-4 w-4 text-white" />
                            </div>
                            <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3">
                              <div className="flex items-center">
                                <span className="mr-2 text-gray-300">
                                  {inputMode === 'generate' ? 'Generating website' : 'Thinking'}
                                </span>
                                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                              </div>
                              
                              {/* Show generation steps if we have them */}
                              {inputMode === 'generate' && generationSteps.length > 0 && (
                                <div className="mt-3 text-sm text-gray-400 border-l-2 border-gray-700 pl-3">
                                  {generationSteps.map((step, i) => (
                                    <div key={i} className="mb-1.5">
                                      {step}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area - fixed at bottom */}
              <div className="w-full py-4 px-4 border-t border-zinc-800/40 bg-zinc-900/60 backdrop-blur-sm">
                <div className="max-w-2xl mx-auto">
                  {/* Mode toggle */}
                  <div className="flex justify-center mb-3">
                    <div className="bg-zinc-800 rounded-full p-1 flex shadow-md">
                      <button
                        onClick={() => setInputMode('generate')}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center ${
                          inputMode === 'generate'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <Sparkles className="w-4 h-4 mr-1.5" />
                        Generate
                      </button>
                      <button
                        onClick={() => setInputMode('ask')}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center ${
                          inputMode === 'ask'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mr-1.5">
                          <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                        </svg>
                        Ask
                      </button>
                    </div>
                  </div>
                  
                  {/* Input form */}
                  <form 
                    onSubmit={handleInputSubmit}
                    className="flex gap-2 relative"
                  >
                    <div className="relative flex-1 bg-zinc-800 hover:bg-zinc-700/80 focus-within:bg-zinc-700 transition-colors duration-200 rounded-xl border border-zinc-700">
                      <textarea
                        className="w-full bg-transparent text-white p-4 pr-12 outline-none resize-none max-h-32 overflow-auto"
                        placeholder={inputMode === 'generate' 
                          ? "Describe the website you want to create..." 
                          : "Ask me anything about web development..."
                        }
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={1}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (prompt.trim()) {
                              handleInputSubmit(e);
                            }
                          }
                        }}
                      />
                      <button
                        type="submit"
                        disabled={loading || !prompt.trim()}
                        className={`absolute right-2 bottom-2 p-2 rounded-lg transition-all duration-200 ${
                          loading || !prompt.trim() 
                                ? 'text-gray-500 cursor-not-allowed' 
                                : 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/20'
                        }`}
                      >
                        {loading ? (
                              <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                              <ChevronRight className="w-6 h-6" />
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel - Right Side */}
          {showPreview && generatedCode && (
            <div className="w-1/2 border-l border-zinc-800 bg-zinc-900/60 backdrop-blur-sm flex flex-col">
              <div className="flex justify-between items-center border-b border-zinc-800 p-3">
                <div className="flex space-x-2">
                      <button
                        onClick={() => setActiveTab('preview')}
                        className={`py-1.5 px-3 rounded-md text-sm font-medium flex items-center ${
                          activeTab === 'preview'
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                          : 'text-gray-400 hover:bg-zinc-800'
                        }`}
                      >
                        <Laptop className="w-4 h-4 mr-1.5" />
                          Preview
                        </button>
                        <button
                          onClick={() => setActiveTab('code')}
                          className={`py-1.5 px-3 rounded-md text-sm font-medium flex items-center ${
                            activeTab === 'code'
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                          : 'text-gray-400 hover:bg-zinc-800'
                          }`}
                        >
                          <Code className="w-4 h-4 mr-1.5" />
                          Code
                        </button>
                </div>

                {/* View controls */}
                <div className="flex items-center space-x-2">
                    {activeTab === 'preview' && (
                    <div className="flex items-center space-x-2 bg-zinc-800 rounded-md p-1 mr-2">
                        <button
                          onClick={() => setPreviewMode('wide')}
                        className={`p-1.5 rounded flex items-center text-xs ${
                            previewMode === 'wide' 
                              ? 'bg-blue-500/20 text-blue-400' 
                              : 'text-gray-400 hover:bg-zinc-700'
                          }`}
                          title="Desktop/Laptop View"
                        >
                        <Laptop className="w-3.5 h-3.5 mr-1" />
                        <span className="hidden sm:inline">Wide</span>
                        </button>
                        <button
                          onClick={() => setPreviewMode('mobile')}
                        className={`p-1.5 rounded flex items-center text-xs ${
                            previewMode === 'mobile' 
                              ? 'bg-blue-500/20 text-blue-400' 
                              : 'text-gray-400 hover:bg-zinc-700'
                          }`}
                          title="Mobile View"
                        >
                        <Smartphone className="w-3.5 h-3.5 mr-1" />
                        <span className="hidden sm:inline">Mobile</span>
                        </button>
                      </div>
                    )}
                  
                  <button
                    onClick={togglePreview}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                    title="Close Preview"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                  </div>

              {/* Preview/Code content */}
              <div className="flex-1 overflow-hidden">
                  {activeTab === 'preview' ? (
                  <div className={`h-full flex justify-center items-center ${previewMode === 'mobile' ? 'bg-zinc-800/30 p-4' : ''}`}>
                      <div 
                        className={
                          previewMode === 'mobile'
                            ? 'w-[375px] h-[667px] relative border-8 border-zinc-700 rounded-[36px] overflow-hidden shadow-lg'
                          : 'w-full h-full'
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
                            : 'w-full h-full border border-zinc-800'
                          }`}
                          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-presentation"
                          title="Website Preview"
                          onLoad={() => console.log('iframe loaded, preview length:', preview?.length || 0)}
                        />
                      </div>
                    </div>
                  ) : (
                  <div className="h-full relative overflow-hidden">
                    <div className="bg-zinc-900 text-gray-300 h-full w-full overflow-auto border border-zinc-800 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                      <pre className="p-4 whitespace-pre-wrap text-sm">
                        <code className="font-mono">{generatedCode}</code>
                      </pre>
                    </div>
                    <div className="absolute top-3 right-3 space-x-2">
                      <button
                        onClick={downloadCode}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200 text-xs rounded-md flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Edit mode controls */}
              {activeTab === 'preview' && (
                <div className="p-3 border-t border-zinc-800 flex justify-end space-x-3">
                      <button
                        onClick={toggleEditMode}
                        className={`px-3 py-1.5 text-sm font-medium transition-colors duration-300 rounded-md flex items-center ${
                          editMode 
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {editMode ? 'Save & Exit' : 'Edit Content'}
                      </button>
                      {unsavedChanges && (
                        <button
                          onClick={applyAllEdits}
                        className="px-3 py-1.5 text-sm font-medium bg-yellow-600 hover:bg-yellow-700 text-white transition-colors duration-300 rounded-md flex items-center"
                          >
                          Apply Changes
                        </button>
                      )}
                    </div>
                  )}
            </div>
              )}
        </div>
      </div>
    </div>
  );
}