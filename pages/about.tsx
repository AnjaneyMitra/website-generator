import React, { useRef, useState, useEffect } from 'react';
import Head from 'next/head';
import { useInView } from 'react-intersection-observer';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Float } from '@react-three/drei';
import Link from 'next/link';
import * as THREE from 'three';

// Define proper types for the component props
interface GeometricElementProps {
  position: [number, number, number];
  color?: string;
  size?: number;
}

// Minimal geometric element for 3D scene with proper typing
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

// Main component
const AboutPage: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  
  return (
    <>
      <Head>
        <title>About | Brix.ai</title>
        <meta
          name="description"
          content="Brix.ai - AI-powered website generation platform that transforms your ideas into reality."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <main className="bg-black text-white font-sans">
        <HeroSection opacity={opacity} />
        <VisionSection />
        <CapabilitiesSection />
        <TeamSection />
        <CallToAction />
        <Footer />
      </main>
    </>
  );
};

// Minimalist hero section inspired by X.AI
const HeroSection: React.FC<{ opacity: any }> = ({ opacity }) => {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <Canvas>
          <XAIScene />
        </Canvas>
      </div>
      
      {/* Text Overlay */}
      <motion.div 
        className="relative z-10 h-full w-full flex flex-col justify-center items-center px-6"
        style={{ opacity }}
      >
        <h1 className="text-7xl sm:text-8xl md:text-9xl font-bold tracking-tight mb-2">
          brix<span className="text-blue-500">.</span>ai
        </h1>
        <div className="h-px w-24 bg-gradient-to-r from-transparent via-blue-500 to-transparent my-8"></div>
        <p className="text-xl md:text-2xl text-gray-400 max-w-2xl text-center font-light">
          Building the future of web development with artificial intelligence.
        </p>
      </motion.div>
      
      {/* Scroll Indicator */}
      <motion.div 
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <span className="text-sm text-gray-500 mb-2">Scroll</span>
        <svg width="16" height="24" viewBox="0 0 16 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="14" height="22" rx="7" stroke="white" strokeOpacity="0.2" strokeWidth="2"/>
          <motion.rect 
            x="6" y="6" width="4" height="4" rx="2" fill="white" 
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        </svg>
      </motion.div>
    </section>
  );
};

// Vision Section with minimal design
const VisionSection: React.FC = () => {
  const { ref, inView } = useInView({ 
    triggerOnce: false,
    threshold: 0.2
  });
  
  return (
    <section className="py-32 px-6 md:px-12" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1 }}
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-16">Our Vision</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div>
              <p className="text-xl md:text-2xl leading-relaxed text-gray-400">
                At Brix.ai, we're building an AI platform that transforms how websites are created, 
                making advanced web development accessible to everyone.
              </p>
            </div>
            <div>
              <p className="text-xl md:text-2xl leading-relaxed text-gray-400">
                Our goal is to democratize web development by removing technical barriers and 
                allowing creators to focus on what matters most — their ideas.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Capabilities section with minimalist cards
const CapabilitiesSection: React.FC = () => {
  const capabilities = [
    { 
      title: 'AI-Powered Development', 
      description: 'Generate production-ready code with just text instructions.',
    },
    { 
      title: 'Instant Prototypes', 
      description: 'Turn concepts into working prototypes in minutes, not weeks.',
    },
    { 
      title: 'Full Customization', 
      description: 'Fine-tune every aspect of your website with precise control.',
    },
    { 
      title: 'Optimized Performance', 
      description: 'Automatically generate code that follows best practices.',
    }
  ];
  
  return (
    <section className="py-32 px-6 md:px-12 bg-zinc-900">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-5xl md:text-6xl font-bold mb-16">Capabilities</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {capabilities.map((capability, index) => (
            <motion.div 
              key={index}
              className="border border-zinc-800 p-8 hover:border-blue-500 transition-colors duration-300"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <h3 className="text-2xl font-medium mb-4">{capability.title}</h3>
              <p className="text-gray-400">{capability.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Team section with minimal design
const TeamSection: React.FC = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  });
  
  return (
    <section ref={ref} className="py-32 px-6 md:px-12 relative overflow-hidden">
      {/* Abstract geometric background element */}
      <div className="absolute -top-1/3 -right-1/3 w-2/3 h-2/3 rounded-full bg-blue-900/5 blur-3xl"></div>
      
      <div className="max-w-7xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1 }}
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-16">The Team</h2>
          
          <p className="text-xl md:text-2xl leading-relaxed text-gray-400 max-w-3xl mb-16">
            We're a team of AI researchers, developers, and designers passionate about 
            creating technology that augments human creativity.
          </p>
          
          <div className="inline-flex">
            <Link 
              href="/team" 
              className="group flex items-center border-b border-transparent hover:border-white pb-1 transition-colors"
            >
              <span className="mr-2">Meet our team</span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 0L6.59 1.41L12.17 7H0V9H12.17L6.59 14.59L8 16L16 8L8 0Z" fill="currentColor"/>
              </svg>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Minimalist call to action
const CallToAction: React.FC = () => {
  return (
    <section className="py-32 px-6 md:px-12 bg-gradient-to-b from-black to-blue-950">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-5xl md:text-6xl font-bold mb-8">Experience the future</h2>
        <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto mb-12">
          Join us on the cutting edge of AI-powered web development.
        </p>
        
        <Link 
          href="/signup" 
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-medium transition-colors duration-300"
        >
          Get Started
        </Link>
      </div>
    </section>
  );
};

// Minimal footer
const Footer: React.FC = () => {
  return (
    <footer className="py-16 px-6 md:px-12 border-t border-zinc-800">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="mb-8 md:mb-0">
            <h3 className="text-2xl font-bold mb-4">
              brix<span className="text-blue-500">.</span>ai
            </h3>
            <p className="text-gray-500">Building the future of web development</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16">
            <div>
              <h4 className="font-medium mb-4">Product</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Features</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Roadmap</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Company</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Team</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Resources</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Community</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Legal</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t border-zinc-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500">© {new Date().getFullYear()} Brix.ai. All rights reserved.</p>
          
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="#" className="text-gray-400 hover:text-white transition-colors">
              <span className="sr-only">Twitter</span>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
              </svg>
            </Link>
            <Link href="#" className="text-gray-400 hover:text-white transition-colors">
              <span className="sr-only">GitHub</span>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path>
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default AboutPage;