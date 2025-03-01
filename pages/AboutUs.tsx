import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Float, Text, Stars } from '@react-three/drei';
import { Sparkles, ArrowRight, BriefcaseBusiness, Clock, Code, Palette } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as THREE from 'three';

// Properly typed 3D Building Block Component
function BuildingBlock({ 
  position, 
  color, 
  scale = 1, 
  rotation = [0, 0, 0] 
}: {
  position: [number, number, number];
  color: string;
  scale?: number;
  rotation?: [number, number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.1;
      meshRef.current.rotation.y += 0.005;
    }
  });

  return (
    <mesh ref={meshRef} position={position} rotation={rotation} scale={scale}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.5} />
    </mesh>
  );
}

// Animated Logo Component
function AnimatedLogo() {
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <group position={[0, 0, 0]}>
        <BuildingBlock position={[-1, 0, 0]} color="#8B4513" scale={0.8} />
        <BuildingBlock position={[0, 0, 0]} color="#D2B48C" scale={0.8} />
        <BuildingBlock position={[1, 0, 0]} color="#8B4513" scale={0.8} />
        <BuildingBlock position={[0, 1, 0]} color="#D2B48C" scale={0.8} />
        <BuildingBlock position={[0, -1, 0]} color="#8B4513" scale={0.8} />
      </group>
    </Float>
  );
}

// Feature Card Component
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
    <div className="backdrop-blur-xl bg-white/50 rounded-xl border border-neutral-300 p-6 transition-all duration-300 hover:shadow-lg hover:transform hover:scale-105">
      <div className="bg-gradient-to-br from-[#8B4513] to-[#D2B48C] w-12 h-12 rounded-full flex items-center justify-center mb-4">
        <Icon className="text-white w-6 h-6" />
      </div>
      <h3 className="text-xl font-bold text-neutral-800 mb-2">{title}</h3>
      <p className="text-neutral-600">{description}</p>
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
    <main className="min-h-screen bg-gradient-to-b from-neutral-200 via-neutral-100 to-neutral-200 overflow-x-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -inset-[10px] opacity-30">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D2B48C] rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-neutral-400 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000" />
        </div>
      </div>
      
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center px-8">
        <div className="absolute inset-0 z-0">
          <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <Stars radius={100} depth={50} count={5000} factor={4} fade />
            <AnimatedLogo />
            <OrbitControls enableZoom={false} enablePan={false} />
            <Environment preset="sunset" />
          </Canvas>
        </div>
        
        <div className="relative z-10 text-center space-y-8 max-w-4xl mx-auto">
          <div className="inline-block relative">
            <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-[#D2B48C] via-neutral-600 to-[#D2B48C] opacity-30" />
            <h1 className="relative text-8xl font-black tracking-tight text-neutral-800 drop-shadow-2xl">
              brix<span className="text-[#8B4513]">.ai</span>
            </h1>
            <Sparkles className="absolute -top-8 -right-10 w-10 h-10 text-[#8B4513] animate-bounce" />
          </div>
          
          <p className="text-2xl text-neutral-700 font-medium tracking-wide backdrop-blur-sm bg-white/30 p-6 rounded-xl">
            Building the web of tomorrow, one block at a time.
          </p>
          
          <Link to="/" className="inline-block group">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#8B4513] to-[#D2B48C] rounded-xl blur-md opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
              <button className="relative px-8 py-4 bg-gradient-to-r from-[#8B4513] to-[#D2B48C] text-white rounded-xl font-bold text-lg flex items-center gap-2">
                Try It Out <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </Link>
        </div>
        
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-8 h-12 rounded-full border-2 border-neutral-600 flex items-start justify-center p-1">
            <div className="w-1 h-3 bg-neutral-600 rounded-full animate-pulse"></div>
          </div>
        </div>
      </section>
      
      {/* About Section */}
      <section className="relative py-24 px-8" style={{ transform: `translateY(${scrollY * 0.1}px)` }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-800 mb-4">Revolutionizing Web Development</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#8B4513] to-[#D2B48C] mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="backdrop-blur-xl bg-white/60 rounded-2xl border border-neutral-300 shadow-lg p-8">
              <h3 className="text-2xl font-bold text-neutral-800 mb-4">Our Mission</h3>
              <p className="text-neutral-600 mb-4">
                At brix.ai, we're on a mission to democratize web development. We believe that creating beautiful, functional websites should be accessible to everyone, regardless of their coding expertise.
              </p>
              <p className="text-neutral-600">
                Through the power of artificial intelligence, we're transforming how websites are built—making the process faster, more intuitive, and more creative than ever before.
              </p>
            </div>
            
            <div className="backdrop-blur-xl bg-white/60 rounded-2xl border border-neutral-300 shadow-lg p-8">
              <h3 className="text-2xl font-bold text-neutral-800 mb-4">Our Technology</h3>
              <p className="text-neutral-600 mb-4">
                Brix.ai combines cutting-edge AI with intuitive design principles to convert your ideas into production-ready websites. Our advanced models understand your requirements and generate clean, optimized code.
              </p>
              <p className="text-neutral-600">
                We're constantly refining our technology to deliver websites that not only look stunning but also perform flawlessly across all devices and platforms.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="relative py-24 px-8 bg-neutral-100/50" style={{ transform: `translateY(${scrollY * 0.05}px)` }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-800 mb-4">Why Choose Brix.ai</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#8B4513] to-[#D2B48C] mx-auto mb-6"></div>
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
            <Link to="/" className="inline-block group">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#8B4513] to-[#D2B48C] rounded-xl blur-md opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                <button className="relative px-8 py-4 bg-gradient-to-r from-[#8B4513] to-[#D2B48C] text-white rounded-xl font-bold text-lg flex items-center gap-2">
                  Start Building Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 px-8 bg-neutral-800 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0">
              <h3 className="text-3xl font-black">
                brix<span className="text-[#D2B48C]">.ai</span>
              </h3>
              <p className="text-neutral-400 mt-2">Building the web of tomorrow</p>
            </div>
            
            <div className="flex space-x-8">
              <Link to="/" className="hover:text-[#D2B48C] transition-colors">Home</Link>
              <Link to="/about" className="hover:text-[#D2B48C] transition-colors">About</Link>
              <a href="#" className="hover:text-[#D2B48C] transition-colors">Blog</a>
              <a href="#" className="hover:text-[#D2B48C] transition-colors">Contact</a>
            </div>
          </div>
          
          <div className="border-t border-neutral-700 mt-8 pt-8 text-center text-neutral-400">
            <p>&copy; {new Date().getFullYear()} brix.ai. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}