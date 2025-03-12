import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Float, Stars } from '@react-three/drei';
import { Sparkles, ArrowRight, BriefcaseBusiness, Clock, Code, Palette } from 'lucide-react';
import Link from 'next/link';
import * as THREE from 'three';

// Modernized Building Block Component with subtle animations
function BuildingBlock({ 
  position, 
  color, 
  scale = 1, 
  rotation = [0, 0, 0],
  hoverColor
}: {
  position: [number, number, number];
  color: string;
  hoverColor: string;
  scale?: number;
  rotation?: [number, number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const [targetColor] = useState(new THREE.Color(color));
  const [currentColor] = useState(new THREE.Color(color));
  
  useFrame((state) => {
    if (meshRef.current) {
      // Subtle floating motion
      meshRef.current.position.y += Math.sin(state.clock.getElapsedTime() * 0.8) * 0.002;
      
      // Gentle rotation
      meshRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.08;
      meshRef.current.rotation.y += 0.003;
      
      // Smooth color transition on hover
      if (hovered) {
        currentColor.lerp(new THREE.Color(hoverColor), 0.1);
      } else {
        currentColor.lerp(targetColor, 0.1);
      }
      
      if (meshRef.current.material instanceof THREE.MeshStandardMaterial) {
        meshRef.current.material.color = currentColor;
      }
    }
  });

  return (
    <mesh 
      ref={meshRef} 
      position={position} 
      rotation={rotation} 
      scale={scale}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial 
        color={color} 
        roughness={0.2} 
        metalness={0.8} 
        envMapIntensity={1.5}
      />
    </mesh>
  );
}

// Enhanced Animated Logo Component
function AnimatedLogo() {
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group position={[0, 0, 0]}>
        <BuildingBlock position={[-1, 0, 0]} color="#8B4513" hoverColor="#a05a2c" scale={0.8} />
        <BuildingBlock position={[0, 0, 0]} color="#D2B48C" hoverColor="#e6c9a8" scale={0.8} />
        <BuildingBlock position={[1, 0, 0]} color="#8B4513" hoverColor="#a05a2c" scale={0.8} />
        <BuildingBlock position={[0, 1, 0]} color="#D2B48C" hoverColor="#e6c9a8" scale={0.8} />
        <BuildingBlock position={[0, -1, 0]} color="#8B4513" hoverColor="#a05a2c" scale={0.8} />
      </group>
    </Float>
  );
}

// Modernized Feature Card Component with enhanced hover effects
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
      {/* Animated background gradient on hover */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-700 to-amber-300 rounded-2xl opacity-0 group-hover:opacity-100 blur-lg transition-all duration-500 group-hover:duration-200"></div>
      
      <div className="relative backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-8 transition-all duration-300 group-hover:translate-y-[-4px] group-hover:bg-white/20">
        <div className="bg-gradient-to-br from-amber-700 to-amber-300 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:shadow-lg group-hover:shadow-amber-500/20 transition-all duration-300">
          <Icon className="text-white w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-neutral-800 mb-3">{title}</h3>
        <p className="text-neutral-600">{description}</p>
      </div>
    </div>
  );
}

// Modern gradient button component
function GradientButton({ children, href }: { children: React.ReactNode, href: string }) {
  return (
    <Link href={href} className="inline-block group">
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-700 via-amber-500 to-amber-300 rounded-xl blur-md opacity-70 group-hover:opacity-100 transition-all duration-500 group-hover:duration-200"></div>
        <button className="relative px-8 py-4 bg-gradient-to-r from-amber-700 to-amber-300 text-white rounded-xl font-bold text-lg flex items-center gap-2 shadow-xl shadow-amber-700/20">
          {children}
        </button>
      </div>
    </Link>
  );
}

// Animated scroll indicator
function ScrollIndicator() {
  return (
    <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
      <div className="text-neutral-600 text-sm mb-2 opacity-70">Scroll</div>
      <div className="w-6 h-10 rounded-full border-2 border-neutral-600 flex items-start justify-center p-1">
        <div className="w-1.5 h-2.5 bg-neutral-600 rounded-full animate-scroll-pulse"></div>
      </div>
    </div>
  );
}

export default function AboutUs() {
  const [scrollY, setScrollY] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 via-neutral-100 to-neutral-50 overflow-x-hidden">
      {/* Modern gradient background with subtle animation */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -inset-[20px]">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-300/30 rounded-full mix-blend-multiply filter blur-5xl animate-pulse-slow" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-amber-700/20 rounded-full mix-blend-multiply filter blur-5xl animate-pulse-slow delay-1000" />
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-neutral-400/20 rounded-full mix-blend-multiply filter blur-5xl animate-pulse-slow delay-2000" />
        </div>
      </div>
      
      {/* Enhanced Hero Section */}
      <section className="relative h-screen flex items-center justify-center px-8">
        <div className="absolute inset-0 z-0">
          <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={1.5} />
            <pointLight position={[-10, -10, -5]} intensity={0.5} color="#D2B48C" />
            <Stars radius={100} depth={50} count={3000} factor={3} fade speed={0.5} />
            <AnimatedLogo />
            <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
            <Environment preset="sunset" />
          </Canvas>
        </div>
        
        <div className="relative z-10 text-center space-y-8 max-w-4xl mx-auto">
          <div className="inline-block relative">
            <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-amber-700 via-amber-500 to-amber-300 opacity-30" />
            <h1 className="relative text-8xl font-black tracking-tight text-neutral-800 drop-shadow-xl bg-clip-text text-transparent bg-gradient-to-r from-amber-900 to-amber-500">
              brix<span className="text-amber-600">.ai</span>
            </h1>
            <Sparkles className="absolute -top-8 -right-10 w-10 h-10 text-amber-600 animate-float" />
          </div>
          
          <p className="text-2xl text-neutral-700 font-medium tracking-wide backdrop-blur-md bg-white/20 p-6 rounded-xl border border-white/30 shadow-xl">
            Building the web of tomorrow, one block at a time.
          </p>
          
          <GradientButton href="/">
            Try It Out <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </GradientButton>
        </div>
        
        <ScrollIndicator />
      </section>
      
      {/* Enhanced About Section with parallax effect */}
      <section 
        className="relative py-32 px-8" 
        style={{ 
          transform: `translateY(${scrollY * 0.08}px)`,
          opacity: Math.min(1, (scrollY * 2) / window.innerHeight)
        }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-amber-900 to-amber-600">
              Revolutionizing Web Development
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-amber-700 to-amber-300 mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl shadow-amber-700/5 p-8 transform transition-all duration-500 hover:translate-y-[-5px] hover:bg-white/20">
              <h3 className="text-2xl font-bold text-neutral-800 mb-4">Our Mission</h3>
              <p className="text-neutral-600 mb-4">
                At brix.ai, we&apos;re on a mission to democratize web development. We believe that creating beautiful, functional websites should be accessible to everyone, regardless of their coding expertise.
              </p>
              <p className="text-neutral-600">
                Through the power of artificial intelligence, we&apos;re transforming how websites are built—making the process faster, more intuitive, and more creative than ever before.
              </p>
            </div>
            
            <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 shadow-2xl shadow-amber-700/5 p-8 transform transition-all duration-500 hover:translate-y-[-5px] hover:bg-white/20">
              <h3 className="text-2xl font-bold text-neutral-800 mb-4">Our Technology</h3>
              <p className="text-neutral-600 mb-4">
                Brix.ai combines cutting-edge AI with intuitive design principles to convert your ideas into production-ready websites. Our advanced models understand your requirements and generate clean, optimized code.
              </p>
              <p className="text-neutral-600">
                We&apos;re constantly refining our technology to deliver websites that not only look stunning but also perform flawlessly across all devices and platforms.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Enhanced Features Section with staggered reveal */}
      <section 
        className="relative py-32 px-8" 
        style={{ 
          transform: `translateY(${scrollY * 0.05}px)`,
          opacity: Math.min(1, Math.max(0, (scrollY - window.innerHeight / 2) / window.innerHeight))
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-amber-900 to-amber-600">
              Why Choose Brix.ai
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-amber-700 to-amber-300 mx-auto mb-6"></div>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Transform your vision into reality with our powerful AI-driven platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
          
          <div className="text-center mt-16">
            <GradientButton href="/">
              Start Building Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </GradientButton>
          </div>
        </div>
      </section>
      
      {/* Modernized Footer */}
      <footer className="py-16 px-8 bg-gradient-to-br from-neutral-900 to-neutral-800 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0">
              <h3 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">
                brix<span className="text-amber-300">.ai</span>
              </h3>
              <p className="text-neutral-400 mt-2">Building the web of tomorrow</p>
            </div>
            
            <div className="flex space-x-8">
              <Link href="/" className="text-neutral-300 hover:text-amber-300 transition-colors">Home</Link>
              <Link href="/about" className="text-neutral-300 hover:text-amber-300 transition-colors">About</Link>
              <Link href="#" className="text-neutral-300 hover:text-amber-300 transition-colors">Blog</Link>
              <Link href="#" className="text-neutral-300 hover:text-amber-300 transition-colors">Contact</Link>
            </div>
          </div>
          
          <div className="border-t border-neutral-700 mt-8 pt-8 text-center text-neutral-400">
            <p>&copy; {new Date().getFullYear()} brix.ai. All rights reserved.</p>
          </div>
        </div>
      </footer>
      
      {/* Custom styles */}
      <style jsx global>{`
        @keyframes scroll-pulse {
          0%, 100% { transform: translateY(0); opacity: 0.6; }
          50% { transform: translateY(5px); opacity: 1; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
        
        .animate-scroll-pulse {
          animation: scroll-pulse 1.5s ease-in-out infinite;
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
      `}</style>
    </main>
  );
}