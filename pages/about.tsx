import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import Link from 'next/link';

export default function AboutUs() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <Canvas className="w-full h-96">
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Stars />
        <OrbitControls />
      </Canvas>
      <div className="text-center mt-8">
        <h1 className="text-4xl font-bold mb-4">About Brix.AI</h1>
        <p className="text-lg mb-6">
          Brix.AI is a cutting-edge platform that transforms your ideas into production-ready websites with ease.
        </p>
        <Link href="/">
          <a className="inline-block bg-gradient-to-r from-[#8B4513] to-[#D2B48C] text-white px-8 py-3 rounded-lg hover:scale-105 transition-transform duration-300">
            Try It Out
          </a>
        </Link>
      </div>
    </div>
  );
} 