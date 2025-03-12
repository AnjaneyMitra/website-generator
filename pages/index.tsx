import React from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  
  // Redirect to generator page if already logged in
  useEffect(() => {
    if (currentUser && !loading) {
      router.push('/generator');
    }
  }, [currentUser, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8B4513]"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold">
          Welcome to <span className="text-blue-600">Website Generator</span>
        </h1>

        <p className="mt-3 text-2xl">
          Start generating your website now!
        </p>

        <div className="flex flex-wrap items-center justify-around max-w-4xl mt-6 sm:w-full">
          <Link
            href="/generator"
            className="p-6 mt-6 text-left border w-96 rounded-xl hover:text-blue-600 focus:text-blue-600"
          >
            <h3 className="text-2xl font-bold">Generator &rarr;</h3>
            <p className="mt-4 text-xl">
              Start building your website with our AI-powered generator.
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}