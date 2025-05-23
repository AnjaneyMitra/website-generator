import React, { useRef, useState, useEffect } from 'react';
import Head from 'next/head';
import { useInView } from 'react-intersection-observer';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Sphere, Trail, PointMaterial } from '@react-three/drei';
import Link from 'next/link';
import { ChevronRight, Send, Check, Zap } from 'lucide-react';
import * as THREE from 'three';

// Define proper types for the component props
interface GeometricElementProps {
  position: [number, number, number];
  color?: string;
  size?: number;
}

// Enhanced geometric element with glow effect
const GeometricElement = ({ position, color = "#ffffff", size = 1 }: GeometricElementProps) => {
  return (
    <Float
      speed={1.5} 
      rotationIntensity={0.2} 
      floatIntensity={0.5}
    >
      <mesh position={position}>
        <octahedronGeometry args={[size, 0]} />
        <meshStandardMaterial 
          color={color} 
          wireframe={true} 
          emissive={color}
          emissiveIntensity={0.3}
        />
      </mesh>
    </Float>
  );
};

// Add subtle glowing orbs to enhance the space feel
const GlowOrb = ({ position, color, size = 0.05 }: GeometricElementProps) => {
  return (
    <Float speed={0.5} floatIntensity={0.2}>
      <Sphere args={[size, 16, 16]} position={position}>
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </Sphere>
    </Float>
  );
};

// Enhanced futuristic scene with more elements and better distribution
const XAIScene = () => {
  const { scrollYProgress } = useScroll();
  const elementsOpacity = useTransform(scrollYProgress, [0, 0.1, 0.2, 1], [1, 0.9, 0.8, 0.7]);
  const elementsScale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (groupRef.current) {
      const currentOpacity = elementsOpacity.get();
      const currentScale = elementsScale.get();
      
      groupRef.current.scale.set(currentScale, currentScale, currentScale);
      
      groupRef.current.children.forEach(child => {
        if (child.type === 'Mesh') {
          const mesh = child as THREE.Mesh;
          const material = mesh.material as THREE.MeshStandardMaterial;
          if (material) {
            material.opacity = currentOpacity;
            material.transparent = true;
          }
        }
      });
    }
  });
  
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[0, 0, 5]} intensity={0.5} />
      <fog attach="fog" args={['#000', 5, 20]} />
      
      <group ref={groupRef}>
        {/* Main geometric elements */}
        <GeometricElement position={[-2, 0, 0]} color="#3B82F6" size={0.5} />
        <GeometricElement position={[2, 1, -2]} color="#ffffff" size={0.3} />
        <GeometricElement position={[0, -1, -1]} color="#3B82F6" size={0.4} />
        <GeometricElement position={[-3, 2, -3]} color="#ffffff" size={0.2} />
        <GeometricElement position={[3, -2, -2]} color="#3B82F6" size={0.3} />
        <GeometricElement position={[1, 3, -4]} color="#ffffff" size={0.2} />
        <GeometricElement position={[-1, -3, -3]} color="#3B82F6" size={0.25} />
        
        {/* Additional subtle elements for depth */}
        <GeometricElement position={[-4, 1, -5]} color="#6366F1" size={0.15} />
        <GeometricElement position={[4, -1, -6]} color="#A5B4FC" size={0.18} />
        
        {/* Subtle glowing orbs to add depth and atmosphere */}
        <GlowOrb position={[-1, 2, -2]} color="#3B82F6" />
        <GlowOrb position={[1.5, -1.5, -3]} color="#60A5FA" />
        <GlowOrb position={[3, 2, -4]} color="#93C5FD" />
        <GlowOrb position={[-2.5, -2, -3.5]} color="#3B82F6" />
        <GlowOrb position={[0.5, 3, -2.5]} color="#DBEAFE" />
      </group>
      
      <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={0.5} />
      <OrbitControls 
        enableZoom={false} 
        enablePan={false} 
        autoRotate 
        autoRotateSpeed={0.15}
        rotateSpeed={0.5}
        maxPolarAngle={Math.PI / 1.8}
        minPolarAngle={Math.PI / 3}
      />
    </>
  );
};

// Main component
const AboutPage: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  
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
        {/* Try it Out Button in top right corner */}
        <motion.div 
          className="fixed top-6 right-6 z-50"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <Link href="/generator">
            <motion.button
              className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg text-white font-medium shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Zap className="w-4 h-4 mr-2" />
              Try it Out
            </motion.button>
          </Link>
        </motion.div>
        
        {/* 3D Background - Now wrapping the entire page */}
        <div className="fixed inset-0 z-0 bg-gradient-to-b from-black via-[#030712] to-[#050b24]">
          <Canvas>
            <XAIScene />
          </Canvas>
        </div>
        
        {/* Gradient overlay to help with text readability */}
        <div className="fixed inset-0 z-[1] bg-gradient-to-b from-transparent via-transparent to-black/30 pointer-events-none"></div>
        
        {/* Content sections with higher z-index to appear above the 3D background */}
        <div className="relative z-10">
          <HeroSection opacity={heroOpacity} />
          <VisionSection />
          <CapabilitiesSection />
          <TeamSection />
          <CallToAction />
          <ContactFormSection />
          <Footer />
        </div>
      </main>
    </>
  );
};

// Enhanced hero section with subtle animations
const HeroSection: React.FC<{ opacity: any }> = ({ opacity }) => {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Text Overlay */}
      <motion.div 
        className="relative h-full w-full flex flex-col justify-center items-center px-6"
        style={{ opacity }}
      >
        <motion.h1 
          className="text-7xl sm:text-8xl md:text-9xl font-bold tracking-tight mb-2"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          brix<span className="text-blue-500 inline-block">.</span>ai
        </motion.h1>
        
        <motion.div 
          className="h-px w-24 bg-gradient-to-r from-transparent via-blue-500 to-transparent my-8"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        ></motion.div>
        
        <motion.p 
          className="text-xl md:text-2xl text-gray-300 max-w-2xl text-center font-light"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          Building the future of web development with artificial intelligence.
        </motion.p>
      </motion.div>
      
      {/* Scroll Indicator */}
      <motion.div 
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center"
        animate={{ y: [0, 10, 0], opacity: 1 }}
        transition={{ repeat: Infinity, duration: 2, opacity: { delay: 1.5, duration: 1 } }}
        initial={{ opacity: 0 }}
      >
        <span className="text-sm text-gray-400 mb-2">Scroll</span>
        <svg width="16" height="24" viewBox="0 0 16 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="14" height="22" rx="7" stroke="white" strokeOpacity="0.3" strokeWidth="2"/>
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

// Enhanced vision section with better glass morphism
const VisionSection: React.FC = () => {
  const { ref, inView } = useInView({ 
    triggerOnce: false,
    threshold: 0.2
  });
  
  return (
    <section className="py-32 px-6 md:px-12" ref={ref}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 1 }}
          className="backdrop-blur-md bg-gradient-to-br from-black/40 to-blue-900/10 p-10 rounded-xl border border-blue-900/20 shadow-lg shadow-blue-900/5"
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-16 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">Our Vision</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div>
              <p className="text-xl md:text-2xl leading-relaxed text-gray-300">
                At Brix.ai, we're building an AI platform that transforms how websites are created, 
                making advanced web development accessible to everyone.
              </p>
            </div>
            <div>
              <p className="text-xl md:text-2xl leading-relaxed text-gray-300">
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

// Enhanced capabilities section with improved cards
const CapabilitiesSection: React.FC = () => {
  const capabilities = [
    { 
      title: 'AI-Powered Development', 
      description: 'Generate production-ready code with just text instructions.',
      icon: (
        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    { 
      title: 'Instant Prototypes', 
      description: 'Turn concepts into working prototypes in minutes, not weeks.',
      icon: (
        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    { 
      title: 'Full Customization', 
      description: 'Fine-tune every aspect of your website with precise control.',
      icon: (
        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      )
    },
    { 
      title: 'Optimized Performance', 
      description: 'Automatically generate code that follows best practices.',
      icon: (
        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    }
  ];
  
  return (
    <section className="py-32 px-6 md:px-12 backdrop-blur-md">
      <div className="max-w-7xl mx-auto">
        <motion.h2 
          className="text-5xl md:text-6xl font-bold mb-16 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          Capabilities
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {capabilities.map((capability, index) => (
            <motion.div 
              key={index}
              className="border border-blue-900/20 p-8 rounded-xl hover:border-blue-500 transition-all duration-500 bg-gradient-to-br from-black/60 to-blue-900/10 backdrop-blur-md shadow-lg hover:shadow-blue-900/20"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true, margin: "-100px" }}
              whileHover={{ y: -5, borderColor: "#3B82F6" }}
            >
              <div className="flex items-start">
                <div className="mr-5 p-3 rounded-lg bg-blue-900/20">
                  {capability.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-medium mb-4">{capability.title}</h3>
                  <p className="text-gray-300">{capability.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Enhanced team section with a modern design
const TeamSection: React.FC = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  });
  
  return (
    <section ref={ref} className="py-32 px-6 md:px-12 relative overflow-hidden">
      {/* Enhanced abstract background elements */}
      <div className="absolute -top-1/4 -right-1/4 w-2/3 h-2/3 rounded-full bg-blue-600/5 blur-3xl"></div>
      <div className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-indigo-600/5 blur-3xl"></div>
      
      <div className="max-w-7xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0 }}
          transition={{ duration: 1 }}
          className="backdrop-blur-sm bg-gradient-to-br from-black/40 to-blue-900/5 p-10 rounded-xl border border-blue-900/10"
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-16 bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">The Team</h2>
          
          <p className="text-xl md:text-2xl leading-relaxed text-gray-300 max-w-3xl mb-16">
            We're a team of AI researchers, developers, and designers passionate about 
            creating technology that augments human creativity.
          </p>
          
          <motion.div 
            className="inline-flex"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Link 
              href="/team" 
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 transition-colors"
            >
              Meet Our Team
              <ChevronRight className="ml-2 h-5 w-5" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

// Enhanced call to action with more dynamic design
const CallToAction: React.FC = () => {
  return (
    <section className="py-32 px-6 md:px-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/10 to-blue-900/20 backdrop-blur-md"></div>
      
      <div className="max-w-7xl mx-auto text-center relative z-10">
        <motion.h2 
          className="text-5xl md:text-6xl font-bold mb-8"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          Experience the future
        </motion.h2>
        
        <motion.p 
          className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Join us on the cutting edge of AI-powered web development.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          whileHover={{ scale: 1.05 }}
        >
          <Link 
            href="/generator" 
            className="inline-block bg-gradient-to-r from-blue-600 to-blue-500 text-white px-10 py-5 text-lg font-medium rounded-lg shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all duration-300"
          >
            Get Started
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

// Particles component for visual effect around the form
const FormParticles = () => {
  const count = 100;
  const points = useRef<THREE.Points>(null);
  const particlePositions = useRef<Float32Array>(new Float32Array(count * 3));
  
  useEffect(() => {
    // Initialize particle positions
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      particlePositions.current[i3] = (Math.random() - 0.5) * 10;
      particlePositions.current[i3 + 1] = (Math.random() - 0.5) * 6;
      particlePositions.current[i3 + 2] = (Math.random() - 0.5) * 4;
    }
    
    if (points.current) {
      points.current.geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(particlePositions.current, 3)
      );
      points.current.geometry.attributes.position.needsUpdate = true;
    }
  }, []);
  
  useFrame((state) => {
    if (points.current) {
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const x = particlePositions.current[i3];
        const y = particlePositions.current[i3 + 1];
        const z = particlePositions.current[i3 + 2];
        
        // Slow oscillating movement
        particlePositions.current[i3] = x + Math.sin(state.clock.elapsedTime * 0.1 + i) * 0.005;
        particlePositions.current[i3 + 1] = y + Math.cos(state.clock.elapsedTime * 0.08 + i) * 0.005;
        particlePositions.current[i3 + 2] = z + Math.sin(state.clock.elapsedTime * 0.05 + i) * 0.002;
      }
      
      points.current.geometry.attributes.position.needsUpdate = true;
    }
  });
  
  return (
    <points ref={points}>
      <bufferGeometry />
      <pointsMaterial size={0.05} color="#3B82F6" transparent opacity={0.6} />
    </points>
  );
};

// Interactive Form Component with wow factor
const ContactFormSection: React.FC = () => {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    interest: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { ref, inView } = useInView({
    triggerOnce: false,
    threshold: 0.3
  });
  
  // Mouse position for interactive effects
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { damping: 50, stiffness: 400 });
  const smoothMouseY = useSpring(mouseY, { damping: 50, stiffness: 400 });
  
  // Track mouse position for form interactivity
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    
    mouseX.set(x);
    mouseY.set(y);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors: Record<string, string> = {};
    if (!formState.name.trim()) newErrors.name = "Name is required";
    if (!formState.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formState.email)) {
      newErrors.email = "Email is invalid";
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Send the data to our API endpoint
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formState),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }
      
      // If we're in development, log the preview URL
      if (data.previewUrl) {
        console.log('Email preview URL:', data.previewUrl);
      }
      
      setIsSubmitting(false);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      setIsSubmitting(false);
      setSubmitError(error instanceof Error ? error.message : 'Failed to send message');
    }
  };
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
    
    // Clear error on field change
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Handle returning to the form after submission
  const handleSendAnother = () => {
    // Reset form state
    setFormState({
      name: '',
      email: '',
      interest: '',
      message: ''
    });
    
    // Clear errors
    setErrors({});
    setSubmitError(null);
    
    // Reset submission state - this should trigger re-render to show the form
    setIsSubmitted(false);
  };
  
  // Form animation variants
  const formVariants = {
    hidden: { 
      opacity: 0,
      y: 50
    },
    visible: { 
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        staggerChildren: 0.1
      }
    }
  };
  
  const formItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };
  
  // Success animation variants
  const successVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 10
      }
    }
  };
  
  // Interactive form container style
  const formContainerStyle = {
    x: useTransform(smoothMouseX, [-0.5, 0.5], [-5, 5]),
    y: useTransform(smoothMouseY, [-0.5, 0.5], [-5, 5]),
    rotateX: useTransform(smoothMouseY, [-0.5, 0.5], [2, -2]),
    rotateY: useTransform(smoothMouseX, [-0.5, 0.5], [-2, 2])
  };
  
  // Border glow effect based on mouse position
  const glowStyle = {
    background: useTransform(
      smoothMouseX,
      [-0.5, 0.5],
      ['radial-gradient(circle at 0% 50%, rgba(59, 130, 246, 0.5) 0%, transparent 50%)', 
       'radial-gradient(circle at 100% 50%, rgba(59, 130, 246, 0.5) 0%, transparent 50%)']
    )
  };
  
  return (
    <section className="py-32 px-6 md:px-12 relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 left-1/3 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative">
        <motion.h2 
          className="text-4xl md:text-5xl font-bold mb-12 text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          Get in Touch
        </motion.h2>
        
        <div className="relative h-[500px] sm:h-[600px]" ref={ref}>
          {/* Form Canvas with 3D elements */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            <Canvas dpr={[1, 2]}>
              <ambientLight intensity={0.2} />
              <FormParticles />
              <OrbitControls 
                enableZoom={false} 
                enablePan={false} 
                enableRotate={false} 
              />
            </Canvas>
          </div>
          
          {/* Interactive Form Container */}
          <div className="flex items-center justify-center h-full relative z-10" onMouseMove={handleMouseMove}>
            <motion.div 
              className="relative w-full max-w-xl"
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              variants={formVariants}
            >
              {/* Animated glow border */}
              <motion.div 
                className="absolute -inset-px rounded-2xl opacity-70"
                style={glowStyle}
              ></motion.div>
              
              {/* Form Panel */}
              <motion.div
                className="relative backdrop-blur-lg bg-gradient-to-br from-black/60 to-blue-900/10 border border-blue-900/30 p-8 sm:p-10 rounded-2xl shadow-2xl overflow-hidden"
                style={formContainerStyle}
              >
                {/* Connection lines animation in background */}
                <div className="absolute inset-0 opacity-10">
                  <svg width="100%" height="100%" className="absolute inset-0">
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(59, 130, 246, 0.5)" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>
                
                {!isSubmitted ? (
                  <form onSubmit={handleSubmit} className="relative z-20">
                    {/* Show error message if submission failed */}
                    {submitError && (
                      <motion.div 
                        className="mb-6 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-200 text-sm"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <p>{submitError}</p>
                      </motion.div>
                    )}
                    
                    <motion.div className="mb-6" variants={formItemVariants}>
                      <label className="block text-blue-100 text-sm font-medium mb-2" htmlFor="name">
                        Name
                      </label>
                      <div className="relative">
                        <input
                          className={`w-full bg-black/30 border ${errors.name ? 'border-red-500' : 'border-blue-700'} rounded-lg p-3 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300`}
                          type="text"
                          id="name"
                          name="name"
                          placeholder="Your name"
                          value={formState.name}
                          onChange={handleChange}
                        />
                        {errors.name && (
                          <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                        )}
                      </div>
                    </motion.div>
                    
                    <motion.div className="mb-6" variants={formItemVariants}>
                      <label className="block text-blue-100 text-sm font-medium mb-2" htmlFor="email">
                        Email
                      </label>
                      <div className="relative">
                        <input
                          className={`w-full bg-black/30 border ${errors.email ? 'border-red-500' : 'border-blue-700'} rounded-lg p-3 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300`}
                          type="email"
                          id="email"
                          name="email"
                          placeholder="your.email@example.com"
                          value={formState.email}
                          onChange={handleChange}
                        />
                        {errors.email && (
                          <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                        )}
                      </div>
                    </motion.div>
                    
                    <motion.div className="mb-6" variants={formItemVariants}>
                      <label className="block text-blue-100 text-sm font-medium mb-2" htmlFor="interest">
                        Interest
                      </label>
                      <div className="relative">
                        <select
                          className="w-full bg-black/30 border border-blue-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 appearance-none"
                          id="interest"
                          name="interest"
                          value={formState.interest}
                          onChange={handleChange}
                        >
                          <option value="" className="bg-gray-900">Select your interest</option>
                          <option value="website" className="bg-gray-900">Website Generation</option>
                          <option value="api" className="bg-gray-900">API Integration</option>
                          <option value="custom" className="bg-gray-900">Custom Solution</option>
                          <option value="other" className="bg-gray-900">Other</option>
                        </select>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <ChevronRight className="text-blue-400 h-4 w-4 rotate-90" />
                        </div>
                      </div>
                    </motion.div>
                    
                    <motion.div className="mb-8" variants={formItemVariants}>
                      <label className="block text-blue-100 text-sm font-medium mb-2" htmlFor="message">
                        Message
                      </label>
                      <textarea
                        className="w-full bg-black/30 border border-blue-700 rounded-lg p-3 text-white h-32 placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 resize-none relative z-10"
                        id="message"
                        name="message"
                        placeholder="Tell us about your project..."
                        value={formState.message}
                        onChange={handleChange}
                        style={{ position: 'relative' }}
                      ></textarea>
                    </motion.div>
                    
                    <motion.div variants={formItemVariants}>
                      <motion.button
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white py-3 px-6 rounded-lg flex items-center justify-center font-medium shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
                        type="submit"
                        disabled={isSubmitting}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isSubmitting ? (
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <>
                            <span>Send Message</span>
                            <Send className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </motion.button>
                    </motion.div>
                  </form>
                ) : (
                  <motion.div 
                    className="flex flex-col items-center justify-center h-72"
                    variants={successVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-6">
                      <Check className="h-8 w-8 text-blue-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                    <p className="text-blue-200 text-center mb-6">
                      Thanks for reaching out. We'll get back to you soon.
                    </p>
                    <motion.button
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                      onClick={handleSendAnother}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Send another message
                    </motion.button>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Enhanced footer with better organization and subtle design improvements
const Footer: React.FC = () => {
  return (
    <footer className="py-16 px-6 md:px-12 border-t border-blue-900/20 backdrop-blur-md bg-gradient-to-b from-black/60 to-blue-900/10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="mb-8 md:mb-0">
            <h3 className="text-2xl font-bold mb-4">
              brix<span className="text-blue-500">.</span>ai
            </h3>
            <p className="text-gray-400">Building the future of web development</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16">
            <div>
              <h4 className="font-medium mb-4 text-white">Product</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Features</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Pricing</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Roadmap</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4 text-white">Company</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">About</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Team</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4 text-white">Resources</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Documentation</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Blog</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Community</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4 text-white">Legal</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Privacy</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t border-blue-900/20 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500">© {new Date().getFullYear()} Brix.ai. All rights reserved.</p>
          
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
              <span className="sr-only">Twitter</span>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
              </svg>
            </Link>
            <Link href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
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