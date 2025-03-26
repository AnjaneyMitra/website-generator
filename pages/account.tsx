import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import Navbar from '../components/Navbar';
import { User } from 'firebase/auth';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Float, Sphere } from '@react-three/drei';
import * as THREE from 'three';

// Define proper types for the component props
interface GeometricElementProps {
  position: [number, number, number];
  color?: string;
  size?: number;
}

// Geometric element component for 3D background
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

// Glowing orb component
const GlowOrb = ({ position, color, size = 0.05 }: GeometricElementProps) => {
  return (
    <Float speed={0.5} floatIntensity={0.2}>
      <Sphere args={[size, 16, 16]} position={position}>
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </Sphere>
    </Float>
  );
};

// Static XAI background scene
const StaticXAIScene = () => {
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[0, 0, 5]} intensity={0.5} />
      <fog attach="fog" args={['#000', 5, 20]} />
      
      {/* Main geometric elements */}
      <GeometricElement position={[-2, 0, 0]} color="#3B82F6" size={0.5} />
      <GeometricElement position={[2, 1, -2]} color="#ffffff" size={0.3} />
      <GeometricElement position={[0, -1, -1]} color="#3B82F6" size={0.4} />
      <GeometricElement position={[-3, 2, -3]} color="#ffffff" size={0.2} />
      <GeometricElement position={[3, -2, -2]} color="#3B82F6" size={0.3} />
      
      {/* Subtle glowing orbs */}
      <GlowOrb position={[-1, 2, -2]} color="#3B82F6" />
      <GlowOrb position={[1.5, -1.5, -3]} color="#60A5FA" />
      <GlowOrb position={[3, 2, -4]} color="#93C5FD" />
      
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

export default function Account() {
  const { currentUser, logout } = useAuth();
  const [userDetails, setUserDetails] = useState<User | null>(null);

  useEffect(() => {
    if (currentUser) {
      setUserDetails(currentUser);
    }
  }, [currentUser]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-black text-white relative">
        {/* 3D Background */}
        <div className="fixed inset-0 z-0 bg-gradient-to-b from-black via-[#030712] to-[#050b24]">
          <Canvas>
            <StaticXAIScene />
          </Canvas>
        </div>
        
        {/* Gradient overlay for better readability */}
        <div className="fixed inset-0 z-[1] bg-gradient-to-b from-transparent via-transparent to-black/30 pointer-events-none"></div>
        
        {/* Content */}
        <div className="relative z-10">
          <Navbar />
          <div className="max-w-7xl mx-auto py-12 px-6 lg:px-8">
            <div className="text-center mb-16">
              <h1 className="text-4xl font-bold tracking-tight">
                Your Account<span className="text-blue-500">.</span>
              </h1>
              <div className="h-px w-24 bg-gradient-to-r from-transparent via-blue-500 to-transparent my-8 mx-auto"></div>
            </div>
            
            <div className="backdrop-blur-md bg-gradient-to-br from-black/40 to-blue-900/10 p-8 rounded-xl border border-blue-900/20 shadow-lg shadow-blue-900/5">
              <h3 className="text-2xl font-medium text-white mb-6">Account Information</h3>
              <div className="mt-5">
                <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="bg-gradient-to-br from-black/60 to-blue-900/10 px-6 py-8 rounded-lg border border-blue-900/20">
                    <dt className="text-sm font-medium text-gray-300">Email address</dt>
                    <dd className="mt-2 text-lg text-white">{userDetails?.email}</dd>
                  </div>
                  <div className="bg-gradient-to-br from-black/60 to-blue-900/10 px-6 py-8 rounded-lg border border-blue-900/20">
                    <dt className="text-sm font-medium text-gray-300">Account created</dt>
                    <dd className="mt-2 text-lg text-white">
                      {userDetails?.metadata.creationTime ? new Date(userDetails.metadata.creationTime).toLocaleDateString() : 'N/A'}
                    </dd>
                  </div>
                </dl>
              </div>
              
              <div className="mt-10 flex justify-center">
                <button
                  onClick={() => logout()}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all duration-300"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
