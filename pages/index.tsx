import { useState } from 'react';
import { Loader2, Sparkles, Download, Code2, Laptop2 } from 'lucide-react';
import Link from 'next/link';
import Chatbot from './Chatbot';



export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState('');
  const [activeTab, setActiveTab] = useState('preview');

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
      
      const data = await response.json();
      setGeneratedCode(data.code);
      setPreview(data.code);
    } catch (error) {
      console.error('Error generating website:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCode = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedCode], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = 'generated-website.html';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-200 via-neutral-100 to-neutral-200">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -inset-[10px] opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D2B48C] rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-neutral-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000" />
        </div>
      </div>

     
      <div className="relative max-w-6xl mx-auto p-8">
        {/* Header with Next.js Link */}
        <div className="text-center space-y-6 py-16">
          <div className="inline-block relative">
            <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-[#D2B48C] via-neutral-600 to-[#D2B48C] opacity-30" />
            <Link href="/about" className="inline-block cursor-pointer">
    {/* Remove the <a> wrapper and place content directly in Link */}
    <h1 className="relative text-8xl font-black tracking-tight text-neutral-800 drop-shadow-2xl transition-transform hover:scale-105">
      brix<span className="text-[#8B4513]">.ai</span>
    </h1>
    <Sparkles className="absolute -top-8 -right-10 w-10 h-10 text-[#8B4513] animate-bounce" />
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
                  <Code2 className="w-5 h-5 text-[#8B4513]" />
                  <span>Describe your perfect website</span>
                </label>
                <div className="relative group">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., Create a modern landing page for a coffee shop with a dark theme, hero section, and menu..."
                    className="w-full h-28 p-4 bg-white/80 text-neutral-800 placeholder-neutral-500 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#8B4513] focus:border-transparent transition-all resize-none text-lg font-light backdrop-blur-sm"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#D2B48C] to-[#8B4513] opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none" />
                </div>
              </div>
              
              <button 
                onClick={generateWebsite}
                disabled={loading || !prompt}
                className="w-full relative group overflow-hidden bg-gradient-to-r from-[#8B4513] to-[#D2B48C] text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
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
                <div className="absolute inset-0 bg-gradient-to-r from-[#D2B48C] to-[#8B4513] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
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
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                      activeTab === 'preview' 
                        ? 'text-[#8B4513] border-b-2 border-[#8B4513]' 
                        : 'text-neutral-600 hover:text-neutral-800'
                    }`}
                  >
                    <Laptop2 className="w-4 h-4" />
                    Preview
                  </button>
                  <button
                    onClick={() => setActiveTab('code')}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                      activeTab === 'code' 
                        ? 'text-[#8B4513] border-b-2 border-[#8B4513]' 
                        : 'text-neutral-600 hover:text-neutral-800'
                    }`}
                  >
                    <Code2 className="w-4 h-4" />
                    Code
                  </button>
                </div>

                {/* Content Area */}
                <div className="p-6">
                  <div className={`h-[600px] rounded-lg overflow-hidden ${activeTab === 'preview' ? 'bg-white' : 'bg-neutral-100'}`}>
                    {activeTab === 'preview' ? (
                      <iframe
                        srcDoc={preview}
                        className="w-full h-full border-0"
                        title="Preview"
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
                className="w-full group relative overflow-hidden bg-white text-neutral-700 border border-[#8B4513] py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 hover:text-white"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Download className="w-5 h-5" />
                  Download Source Code
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#8B4513] to-[#D2B48C] opacity-0 group-hover:opacity-100 transition-all duration-300" />
              </button>
            </div>
          )}
        </div>
      </div>
      
    
      <Chatbot />
    </main>
  );
}