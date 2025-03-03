import { useState, useEffect, useRef } from 'react';
import { Loader2, Sparkles, Download, Code2, Laptop2, Edit, Save } from 'lucide-react';
import Link from 'next/link';
import Chatbot from './Chatbot';
import { useRouter } from 'next/router';

// Define a type for the message event data
interface TextEditMessage {
  type: string;
  originalText: string;
  newText: string;
  nodeType: string;
}

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState('');
  const [activeTab, setActiveTab] = useState('preview');
  const [editMode, setEditMode] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const editedElements = useRef<{[key: string]: string}>({});

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
    let updatedCode = generatedCode;
    
    // Apply text edits
    Object.entries(editedElements.current).forEach(([originalText, newText]) => {
      // Use a more targeted replacement to avoid issues with similar text
      const escapedText = escapeRegExp(originalText);
      const regex = new RegExp(`(>\\s*)(${escapedText})(\\s*<)`, 'g');
      
      updatedCode = updatedCode.replace(regex, (match, before, target, after) => {
        return `${before}${newText}${after}`;
      });
    });
    
    setGeneratedCode(updatedCode);
    setPreview(updatedCode);
    setUnsavedChanges(false);
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
              if (this.hasAttribute('contenteditable')) {
                e.preventDefault();
              }
            });
          });
          
          // Make elements editable
          document.body.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button, li, div').forEach(element => {
            // Check if the element contains only text (no nested elements) or is a specific tag
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
                if (this.innerText !== this.getAttribute('data-original-text')) {
                  // Send message to parent window with the updated text
                  window.parent.postMessage({
                    type: 'text-edited',
                    originalText: this.getAttribute('data-original-text'),
                    newText: this.innerText,
                    nodeType: this.tagName.toLowerCase()
                  }, '*');
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

  return (
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
            <Link href={"/"} className="inline-block cursor-pointer">
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

        {/* Main Content */}
        <div className="space-y-8">
          {/* Input Section */}
          <div className="backdrop-blur-xl bg-white/60 rounded-2xl border border-neutral-300 shadow-2xl p-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="inline-flex items-center space-x-2 text-lg font-medium text-neutral-700">
                  <Code2 className="w-5 h-5 text-[#2563eb]" />
                  <span>Describe your perfect website</span>
                </label>
                <div className="relative group">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., Create a modern landing page for a coffee shop with a dark theme, hero section, and menu..."
                    className="w-full h-28 p-4 bg-white/80 text-neutral-800 placeholder-neutral-500 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all resize-none text-lg font-light backdrop-blur-sm"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#2563eb] opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none" />
                </div>
              </div>
              
              <button 
                onClick={generateWebsite}
                disabled={loading || !prompt}
                className="w-full relative group overflow-hidden bg-gradient-to-r from-[#2563eb] to-[#3b82f6] text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Crafting your masterpiece...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Website
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#3b82f6] to-[#2563eb] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </div>
          </div>

          {/* Output Section */}
          {generatedCode && (
            <div className="space-y-6">
              <div className="backdrop-blur-xl bg-white/60 rounded-2xl border border-neutral-300 shadow-2xl overflow-hidden">
                {/* Tab Navigation */}
                <div className="flex border-b border-neutral-300">
                  <button
                    onClick={() => {
                      // Apply any unsaved changes when switching tabs
                      if (unsavedChanges && editMode) {
                        applyAllEdits();
                      }
                      setActiveTab('preview');
                    }}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                      activeTab === 'preview' 
                        ? 'text-[#2563eb] border-b-2 border-[#2563eb]' 
                        : 'text-neutral-600 hover:text-neutral-800'
                    }`}
                  >
                    <Laptop2 className="w-4 h-4" />
                    Preview
                  </button>
                  <button
                    onClick={() => {
                      // Don't allow switching tabs if in edit mode with unsaved changes
                      if (editMode && unsavedChanges) {
                        alert("Please save your changes first by clicking 'Save & Exit'");
                        return;
                      }
                      
                      // Only switch tabs if not in edit mode or no unsaved changes
                      setActiveTab('code');
                    }}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                      activeTab === 'code' 
                        ? 'text-[#2563eb] border-b-2 border-[#2563eb]' 
                        : 'text-neutral-600 hover:text-neutral-800'
                    }`}
                  >
                    <Code2 className="w-4 h-4" />
                    Code
                  </button>
                  
                  {activeTab === 'preview' && (
                    <div className="ml-auto flex">
                      <button
                        onClick={toggleEditMode}
                        className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                          editMode 
                            ? 'text-green-600 border-b-2 border-green-600' 
                            : 'text-neutral-600 hover:text-neutral-800'
                        }`}
                      >
                        <Edit className="w-4 h-4" />
                        {editMode ? 'Editing Mode' : 'Edit Text'}
                      </button>
                      
                      {editMode && (
                        <button
                          onClick={() => {
                            applyAllEdits();
                            setEditMode(false); // Turn off edit mode after saving
                          }}
                          className="flex items-center gap-2 px-6 py-4 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors border-b-2 border-blue-600"
                        >
                          <Save className="w-4 h-4" />
                          Save & Exit
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Content Area */}
                <div className="p-6">
                  <div className={`h-[600px] rounded-lg overflow-hidden ${activeTab === 'preview' ? 'bg-white' : 'bg-neutral-100'}`}>
                    {activeTab === 'preview' ? (
                      <iframe
                        ref={iframeRef}
                        id="preview-frame"
                        srcDoc={preview}
                        className="w-full h-full border-0"
                        title="Preview"
                        sandbox="allow-same-origin allow-scripts"
                      />
                    ) : (
                      <pre className="p-4 text-neutral-800 font-mono text-sm h-full overflow-auto">
                        {generatedCode}
                      </pre>
                    )}
                  </div>
                </div>
              </div>

              <button 
                onClick={downloadCode}
                className="w-full group relative overflow-hidden bg-white text-neutral-700 border border-[#2563eb] py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 hover:text-white"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Download className="w-5 h-5" />
                  Download Source Code
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#2563eb] to-[#3b82f6] opacity-0 group-hover:opacity-100 transition-all duration-300" />
              </button>
            </div>
          )}
        </div>
      </div>
      
      <Chatbot />
    </main>
  );
}