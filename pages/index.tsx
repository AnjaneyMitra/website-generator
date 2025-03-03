import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Text, Stars, useGLTF, PerspectiveCamera } from '@react-three/drei';
import { ArrowRight, BriefcaseBusiness, Clock, Code, Palette, Sparkles } from 'lucide-react';
import Link from 'next/link';
import * as THREE from 'three';

// Modern 3D Element with sleek animations
function GeometricElement({ 
  position, 
  color, 
  scale = 1, 
  rotation = [0, 0, 0],
  hoverColor,
  visible = true,
  delay = 0,
  geometry = 'box' // 'box', 'sphere', 'torus', 'cylinder'
}: {
  position: [number, number, number];
  color: string;
  hoverColor: string;
  scale?: number | [number, number, number];
  rotation?: [number, number, number];
  visible?: boolean;
  delay?: number;
  geometry?: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const [targetColor] = useState(new THREE.Color(color));
  const [currentColor] = useState(new THREE.Color(color));
  const [opacity, setOpacity] = useState(0);
  
  useFrame((state) => {
    if (meshRef.current) {
      // Fade in/out based on visible flag
      if (visible && opacity < 1) {
        setOpacity(Math.min(1, opacity + 0.02));
      } else if (!visible && opacity > 0) {
        setOpacity(Math.max(0, opacity - 0.02));
      }
      
      // Subtle movement
      meshRef.current.position.y += Math.sin((state.clock.getElapsedTime() + delay) * 0.4) * 0.001;
      
      // Gentle rotation
      meshRef.current.rotation.x = Math.sin((state.clock.getElapsedTime() + delay) * 0.2) * 0.04;
      meshRef.current.rotation.y += 0.001;
      
      // Smooth color transition on hover
      if (hovered) {
        currentColor.lerp(new THREE.Color(hoverColor), 0.1);
      } else {
        currentColor.lerp(targetColor, 0.1);
      }
      
      if (meshRef.current.material instanceof THREE.MeshPhysicalMaterial) {
        meshRef.current.material.color = currentColor;
        meshRef.current.material.transparent = true;
        meshRef.current.material.opacity = opacity;
      }
    }
  });

  const renderGeometry = () => {
    switch(geometry) {
      case 'sphere':
        return <sphereGeometry args={[0.5, 32, 32]} />;
      case 'torus':
        return <torusGeometry args={[0.4, 0.2, 16, 32]} />;
      case 'cylinder':
        return <cylinderGeometry args={[0.4, 0.4, 1, 32]} />;
      case 'box':
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  return (
    <mesh 
      ref={meshRef} 
      position={position} 
      rotation={rotation} 
      scale={scale}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {renderGeometry()}
      <meshPhysicalMaterial 
        color={color} 
        roughness={0.1} 
        metalness={0.8} 
        clearcoat={1}
        clearcoatRoughness={0.1}
        envMapIntensity={1.5}
        transparent
        opacity={opacity}
      />
    </mesh>
  );
}

// Professional 3D Text Component
function AnimatedText3D({ 
  text, 
  position = [0, 0, 0], 
  scale = 1, 
  color = "#ffffff" 
}: {
  text: string;
  position?: [number, number, number];
  scale?: number;
  color?: string;
}) {
  const textRef = useRef<THREE.Group>(null!);
  
  useFrame((state) => {
    if (textRef.current) {
      // Subtle floating animation
      textRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 0.3) * 0.05;
      // Subtle rotation
      textRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.02;
    }
  });
  
  return (
    <group position={position} ref={textRef}>
      <Text
        fontSize={1.2 * scale}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#00000020"
        letterSpacing={0.05}
        textAlign="center"
      >
        {text}
      </Text>
    </group>
  );
}

// Modern Abstract Logo Component
function ModernLogo({ scrollProgress, visible = true }: { scrollProgress: number, visible?: boolean }) {
  const baseElements = [
    { position: [3, 0, 0], color: "#2563eb", hoverColor: "#3b82f6", scale: 0.8, delay: 0, geometry: 'box' },
    { position: [4, 0, 0], color: "#0f172a", hoverColor: "#1e293b", scale: 0.8, delay: 0.1, geometry: 'sphere' },
    { position: [5, 0, 0], color: "#2563eb", hoverColor: "#3b82f6", scale: 0.8, delay: 0.2, geometry: 'cylinder' },
    { position: [4, 1, 0], color: "#475569", hoverColor: "#64748b", scale: 0.8, delay: 0.3, geometry: 'box' },
    { position: [4, -1, 0], color: "#2563eb", hoverColor: "#3b82f6", scale: 0.8, delay: 0.4, geometry: 'torus' },
  ];
  
  const dynamicElements = [
    { position: [4, 2, 0], color: "#0f172a", hoverColor: "#1e293b", scale: 0.8, delay: 0.5, geometry: 'sphere' },
    { position: [3, 1, 0], color: "#475569", hoverColor: "#64748b", scale: 0.8, delay: 0.6, geometry: 'box' },
    { position: [5, 1, 0], color: "#2563eb", hoverColor: "#3b82f6", scale: 0.8, delay: 0.7, geometry: 'torus' },
    { position: [3, 2, 0], color: "#475569", hoverColor: "#64748b", scale: 0.8, delay: 0.8, geometry: 'cylinder' },
    { position: [5, 2, 0], color: "#0f172a", hoverColor: "#1e293b", scale: 0.8, delay: 0.9, geometry: 'box' },
    { position: [4, 3, 0], color: "#2563eb", hoverColor: "#3b82f6", scale: 0.8, delay: 1.0, geometry: 'sphere' },
    { position: [3, 3, 0], color: "#0f172a", hoverColor: "#1e293b", scale: 0.8, delay: 1.1, geometry: 'torus' },
  ];
  
  // Calculate visible elements based on scroll progress (kept for potential future use)
  const maxElements = 12;
  const visibleElements = Math.min(maxElements, Math.floor(scrollProgress * maxElements) + 5);
  const allElements = [...baseElements, ...dynamicElements.slice(0, visibleElements - baseElements.length)];
  
  return (
    <group position={[0, 0, 0]}>
      {allElements.map((element, index) => (
        <GeometricElement
          key={index}
          position={element.position as [number, number, number]}
          color={element.color}
          hoverColor={element.hoverColor}
          scale={element.scale}
          delay={element.delay}
          visible={visible}
          geometry={element.geometry as string}
        />
      ))}
    </group>
  );
}

// Advanced Scene Controller with dynamic camera movement
function SceneController({ scrollProgress }: { scrollProgress: number }) {
  const { camera } = useThree();
  
  useFrame(() => {
    // Create dynamic camera movement based on scroll
    const cameraX = -5 + (scrollProgress * 10); 
    const cameraY = 2 + (scrollProgress * 2); 
    const cameraZ = 10 - (scrollProgress * 3); 
    
    // Smoother lerp for camera positioning
    camera.position.lerp(new THREE.Vector3(cameraX, cameraY, cameraZ), 0.03);
    
    // Dynamically adjust look target based on scroll
    const targetX = scrollProgress < 0.5 ? 0 : 4;
    const targetY = scrollProgress * 1.5;
    camera.lookAt(new THREE.Vector3(targetX, targetY, 0));
  });
  
  return null;
}

// Professional Feature Card with more subtle design
function FeatureCard({ 
  icon: Icon, 
  title, 
  description 
}: {
  icon: React.FC<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-700 to-blue-400 rounded-xl opacity-0 group-hover:opacity-70 blur-lg transition-all duration-300"></div>
      
      <div className="relative bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-8 transition-all duration-300 group-hover:translate-y-[-4px] group-hover:bg-white/20">
        <div className="bg-gradient-to-br from-blue-700 to-blue-400 w-12 h-12 rounded-lg flex items-center justify-center mb-5 group-hover:shadow-lg group-hover:shadow-blue-500/20 transition-all duration-300">
          <Icon className="text-white w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-600 text-sm">{description}</p>
      </div>
    </div>
  );
}

// Modern gradient button with more subtle design
function ModernButton({ children, href }: { children: React.ReactNode, href: string }) {
  return (
    <Link href="/generator" className="inline-block group">
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-700 via-blue-500 to-blue-400 rounded-lg blur-sm opacity-50 group-hover:opacity-100 transition-all duration-300"></div>
        <button className="relative px-6 py-3 bg-gradient-to-r from-blue-700 to-blue-500 text-white rounded-lg font-medium text-sm flex items-center gap-2 shadow-lg shadow-blue-700/10">
          {children}
        </button>
      </div>
    </Link>
  );
}

// Sleek scroll indicator
function ScrollIndicator() {
  return (
    <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
      <div className="text-slate-500 text-xs mb-2 opacity-70">Scroll to explore</div>
      <div className="w-5 h-9 rounded-full border-2 border-slate-500 flex items-start justify-center p-1">
        <div className="w-1 h-2 bg-slate-500 rounded-full animate-scroll-indicator"></div>
      </div>
    </div>
  );
}

// Modern heading component
function ModernHeading({ text, className = "" }: { text: string, className?: string }) {
  return (
    <h2 className={`text-3xl font-bold mb-4 relative ${className}`}>
      <span className="absolute inset-0 transform translate-x-0.5 translate-y-0.5 text-blue-400/20 filter blur-sm">
        {text}
      </span>
      <span className="relative z-10 bg-gradient-to-br from-blue-700 to-blue-400 text-transparent bg-clip-text">
        {text}
      </span>
    </h2>
  );
}

export default function AboutUs() {
  const [scrollY, setScrollY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isBrowser, setIsBrowser] = useState(false);
  
  useEffect(() => {
    // Setting browser state
    setIsBrowser(true);
    const initialScrollY = window.scrollY;
    setScrollY(initialScrollY);
      
    const docHeight = Math.max(
      document.body.scrollHeight, 
      document.body.offsetHeight,
      document.documentElement.clientHeight, 
      document.documentElement.scrollHeight, 
      document.documentElement.offsetHeight
    ) - window.innerHeight;
    
    setScrollProgress(Math.min(1, initialScrollY / (docHeight || 1)));
    
    // Scroll handler with throttling for better performance
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          setScrollY(currentScrollY);
          
          const updatedDocHeight = Math.max(
            document.body.scrollHeight, 
            document.body.offsetHeight,
            document.documentElement.clientHeight, 
            document.documentElement.scrollHeight, 
            document.documentElement.offsetHeight
          ) - window.innerHeight;
          
          const progress = Math.min(1, currentScrollY / (updatedDocHeight || 1));
          setScrollProgress(progress);
          
          console.log({ 
            scrollY: currentScrollY, 
            progress,
            docHeight: updatedDocHeight
          });
          
          ticking = false;
        });
        ticking = true;
      }
    };
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Force a layout update to get accurate scroll measurements after initial render
    setTimeout(() => {
      handleScroll();
    }, 100);
    
    // Cleanup
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Blocks (3D elements) only appear when near the top (e.g. scrollY < 100)
  const showBlocks = scrollY < 100;
  // Threshold to switch logo display
  const logoThreshold = 150; // Increased from 100 for more gradual effect

  // Calculate transition progress for smoother animations
  const headerOpacity = isBrowser 
    ? Math.min(1, Math.max(0, (scrollY - (logoThreshold * 0.5)) / (logoThreshold * 0.5)))
    : 0;

  const heroOpacity = isBrowser
    ? Math.min(1, Math.max(0, 1 - (scrollY / logoThreshold)))
    : 1;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-slate-50 overflow-x-hidden">
      
      {/* Fixed Header Logo with improved transition */}
      <header 
        className="fixed top-0 left-0 z-50 p-4 transition-all duration-500"
        style={{ 
          opacity: headerOpacity,
          transform: `translateY(${headerOpacity < 0.1 ? -20 : 0}px)`
        }}
      >
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-800">
            brix<span className="text-blue-500">.ai</span>
          </h1>
        </div>
      </header>

      {/* Subtle background gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -inset-[20px]">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full mix-blend-multiply filter blur-5xl animate-pulse-slow" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-700/10 rounded-full mix-blend-multiply filter blur-5xl animate-pulse-slow delay-1000" />
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-slate-400/10 rounded-full mix-blend-multiply filter blur-5xl animate-pulse-slow delay-2000" />
        </div>
      </div>
      
      {/* Professional 3D Scene */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas dpr={[1, 2]} camera={{ position: [-5, 2, 10], fov: 45 }}>
          <PerspectiveCamera makeDefault position={[-5, 2, 10]} fov={45} />
          <SceneController scrollProgress={scrollProgress} />
          <ambientLight intensity={0.3} />
          <pointLight position={[10, 10, 10]} intensity={1.2} />
          <pointLight position={[-10, -10, -5]} intensity={0.5} color="#2563eb" />
          <Stars radius={100} depth={50} count={1500} factor={2} fade speed={0.5} />
          <ModernLogo scrollProgress={scrollProgress} visible={showBlocks} />
          <OrbitControls enableZoom={false} enablePan={false} enabled={false} />
          <Environment preset="city" />
        </Canvas>
      </div>
      
      {/* Hero Section with smoother transition */}
      <section className="relative h-screen flex items-center justify-center px-8">
        <div 
          className="relative z-10 text-left ml-8 md:ml-16 lg:ml-32 transition-all duration-700" 
          style={{ 
            opacity: heroOpacity,
            transform: `translateY(${Math.min(scrollY * 0.2, 30)}px) scale(${1 - (scrollY * 0.001)})`
          }}
        >
          <div className="inline-block relative">
            <h1 className="text-6xl font-bold tracking-tight text-slate-800 drop-shadow-md bg-clip-text text-transparent bg-gradient-to-r from-blue-800 to-blue-500">
              brix<span className="text-blue-500">.ai</span>
            </h1>
            <Sparkles className="absolute -top-6 -right-6 w-6 h-6 text-blue-500 animate-float" />
          </div>
          
          {/* The rest of the hero content fades out faster */}
          <div style={{ opacity: Math.max(0, 1 - (scrollY / (logoThreshold * 0.7))) }}>
            <p className="text-xl text-slate-700 font-normal tracking-wide bg-white/20 backdrop-blur-md p-5 rounded-lg border border-white/20 shadow-lg mt-6">
              Building the web of tomorrow, one block at a time.
            </p>
            
            <div className="mt-8">
              <ModernButton href="/">
                Try It Out <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </ModernButton>
            </div>
          </div>
        </div>
        
        <ScrollIndicator />
      </section>
      
      {/* About Section with parallax effect */}
      <section 
        className="relative py-32 px-8" 
        style={{ 
          transform: isBrowser ? `translateY(${Math.min(scrollY * 0.06, 150)}px)` : 'none',
          opacity: 1,
        }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-left ml-8 md:ml-16 lg:ml-32 mb-16">
            <ModernHeading text="Revolutionizing Web Development" />
            <div className="w-16 h-0.5 bg-gradient-to-r from-blue-700 to-blue-400"></div>
          </div>
    
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 ml-8 md:ml-16 lg:ml-32">
            <div className="backdrop-blur-md bg-white/10 rounded-xl border border-white/20 shadow-xl shadow-blue-700/5 p-8 transition-all duration-300 hover:translate-y-[-5px] hover:bg-white/20">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Our Mission</h3>
              <p className="text-slate-600 mb-4 text-sm">
                At brix.ai, we're on a mission to democratize web development. We believe that creating beautiful, functional websites should be accessible to everyone, regardless of their coding expertise.
              </p>
              <p className="text-slate-600 text-sm">
                Through the power of artificial intelligence, we're transforming how websites are built—making the process faster, more intuitive, and more creative than ever before.
              </p>
            </div>
            
            <div className="backdrop-blur-md bg-white/10 rounded-xl border border-white/20 shadow-xl shadow-blue-700/5 p-8 transition-all duration-300 hover:translate-y-[-5px] hover:bg-white/20">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Our Technology</h3>
              <p className="text-slate-600 mb-4 text-sm">
                Brix.ai combines cutting-edge AI with intuitive design principles to convert your ideas into production-ready websites. Our advanced models understand your requirements and generate clean, optimized code.
              </p>
              <p className="text-slate-600 text-sm">
                We're constantly refining our technology to deliver websites that not only look stunning but also perform flawlessly across all devices and platforms.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section with staggered reveal */}
      <section 
        className="relative py-32 px-8" 
        style={{ 
          transform: isBrowser ? `translateY(${Math.min(scrollY * 0.04, 100)}px)` : 'none',
          opacity: 1,
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-left ml-8 md:ml-16 lg:ml-32 mb-16">
            <ModernHeading text="Why Choose Brix.ai" />
            <div className="w-16 h-0.5 bg-gradient-to-r from-blue-700 to-blue-400 mb-6"></div>
            <p className="text-lg text-slate-600 max-w-2xl">
              Transform your vision into reality with our powerful AI-driven platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ml-8 md:ml-16 lg:ml-32">
            <FeatureCard 
              icon={Clock}
              title="Save Time"
              description="Generate complete websites in seconds, not days. Focus on your content while we handle the code."
            />
            <FeatureCard 
              icon={Palette}
              title="Stunning Designs"
              description="Access professionally designed templates and custom elements that make your website stand out."
            />
            <FeatureCard 
              icon={Code}
              title="Clean Code"
              description="Our AI generates optimized, standards-compliant code that's easy to maintain and extend."
            />
            <FeatureCard 
              icon={BriefcaseBusiness}
              title="Production Ready"
              description="Download fully functional websites that are ready to deploy to your hosting provider of choice."
            />
            <FeatureCard 
              icon={Sparkles}
              title="AI Innovation"
              description="Leverage the latest in AI technology to bring your creative vision to life with minimal effort."
            />
            <FeatureCard 
              icon={ArrowRight}
              title="Intuitive Process"
              description="Simply describe what you want, and watch as your website takes shape before your eyes."
            />
          </div>
          
          <div className="text-left ml-8 md:ml-16 lg:ml-32 mt-16">
            <ModernButton href="/">
              Start Building Now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </ModernButton>
          </div>
        </div>
      </section>
      
      {/* Modern Footer */}
      <footer className="py-16 px-8 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0">
              <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-200">
                brix<span className="text-blue-300">.ai</span>
              </h3>
              <p className="text-slate-400 mt-2 text-sm">Building the web of tomorrow</p>
            </div>
            
            <div className="flex space-x-8">
              <Link href="/" className="text-slate-300 hover:text-blue-300 transition-colors text-sm">Home</Link>
              <Link href="/about" className="text-slate-300 hover:text-blue-300 transition-colors text-sm">About</Link>
              <Link href="#" className="text-slate-300 hover:text-blue-300 transition-colors text-sm">Blog</Link>
              <Link href="#" className="text-slate-300 hover:text-blue-300 transition-colors text-sm">Contact</Link>
            </div>
          </div>
          
          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-slate-400 text-sm">
            <p>&copy; {new Date().getFullYear()} brix.ai. All rights reserved.</p>
          </div>
        </div>
      </footer>
      
      {/* Custom styles */}
      <style jsx global>{`
        @keyframes scroll-indicator {
          0%, 100% { transform: translateY(0); opacity: 0.6; }
          50% { transform: translateY(4px); opacity: 1; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-6px) rotate(3deg); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.05); }
        }
        
        .animate-scroll-indicator {
          animation: scroll-indicator 1.5s ease-in-out infinite;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
        
        .blur-5xl {
          filter: blur(100px);
        }
        
        * {
          box-sizing: border-box;
        }
        
        html, body {
          margin: 0;
          padding: 0;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
      `}</style>
    </main>
  );
}