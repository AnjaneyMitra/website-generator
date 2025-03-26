import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Sphere } from '@react-three/drei';
import { useScroll, useTransform } from 'framer-motion';
import * as THREE from 'three';

// Team member interface
interface TeamMember {
  id: number;
  name: string;
  role: string;
  bio: string;
  imageSrc: string;
}

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

export default function Team() {
  // Team data with the two specified developers
  const teamMembers: TeamMember[] = [
    {
      id: 1,
      name: "Anjaney Mitra",
      role: "Software Developer",
      bio: "Software developer pursuing MCA at Christ University. Passionate about creating innovative products and providing quality technical services. Focused on building solutions that make a difference.",
      imageSrc: "/images/anj_profile_pic.png"
    },
    {
      id: 2,
      name: "Dave Vanlalchhuanga Sharma",
      role: "Software Developer",
      bio: "Dedicated software developer currently pursuing MCA at Christ University. Specializes in product development and technical service delivery. Committed to crafting efficient and user-friendly software solutions.",
      imageSrc: "/images/dave_profile_pic.png"
    }
  ];

  return (
    <>
      <Head>
        <title>Our Team | Brix.AI</title>
        <meta name="description" content="Meet the talented team behind Brix.AI who are revolutionizing web development with artificial intelligence." />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
        {/* 3D Background */}
        <div className="fixed inset-0 z-0 bg-gradient-to-b from-black via-[#030712] to-[#050b24]">
          <Canvas>
            <XAIScene />
          </Canvas>
        </div>
        
        {/* Gradient overlay to help with text readability */}
        <div className="fixed inset-0 z-[1] bg-gradient-to-b from-transparent via-transparent to-black/30 pointer-events-none"></div>
        
        {/* Content sections with higher z-index to appear above the 3D background */}
        <div className="relative z-10">
          <Navbar />
          
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            {/* Back to About link */}
            <div className="mb-8">
              <Link href="/about" className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors">
                <ChevronLeft className="h-5 w-5 mr-1" />
                Back to About
              </Link>
            </div>
            
            {/* Header */}
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                Our Team
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
                Meet the passionate experts behind Brix.AI who are revolutionizing web development with artificial intelligence.
              </p>
            </motion.div>
            
            {/* Team Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {teamMembers.map((member, index) => {
                const { ref, inView } = useInView({
                  triggerOnce: true,
                  threshold: 0.1
                });
                
                return (
                  <motion.div
                    key={member.id}
                    ref={ref}
                    initial={{ opacity: 0, y: 30 }}
                    animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                    transition={{ duration: 0.7, delay: index * 0.1 }}
                    className="backdrop-blur-md bg-gradient-to-br from-blue-900/20 to-purple-900/10 p-6 rounded-xl border border-blue-900/20 shadow-lg overflow-hidden"
                  >
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="h-16 w-16 rounded-full overflow-hidden">
                        <img 
                          src={member.imageSrc} 
                          alt={member.name} 
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{member.name}</h3>
                        <p className="text-blue-400">{member.role}</p>
                      </div>
                    </div>
                    <p className="text-gray-300">{member.bio}</p>
                  </motion.div>
                );
              })}
            </div>
            
            {/* Join Our Team Section */}
            <motion.div 
              className="mt-20 text-center py-16 px-6 backdrop-blur-md bg-gradient-to-br from-blue-900/20 to-purple-900/10 rounded-xl border border-blue-900/20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Join Our Team</h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
                We're always looking for talented individuals passionate about AI and web development to join our growing team.
              </p>
              <Link href="/careers" className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 transition-colors">
                View Open Positions
              </Link>
            </motion.div>
          </main>
        </div>
      </div>
    </>
  );
}
