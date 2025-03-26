import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'backdrop-blur-md bg-gray-900/80 shadow-lg' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0">
              <img className="h-8 w-auto" src="/logo.png" alt="Brix.AI" />
            </Link>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link href="/" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Home
                </Link>
                <Link href="/about" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  About
                </Link>
                <Link href="/features" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Features
                </Link>
                <Link href="/pricing" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Pricing
                </Link>
                <Link href="/contact" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Contact
                </Link>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <Link href="/get-started" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors">
              Get Started
            </Link>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden backdrop-blur-md bg-gray-900/90">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="/" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
              Home
            </Link>
            <Link href="/about" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
              About
            </Link>
            <Link href="/features" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
              Features
            </Link>
            <Link href="/pricing" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
              Pricing
            </Link>
            <Link href="/contact" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">
              Contact
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-700">
            <div className="px-2">
              <Link href="/get-started"
                className="block w-full px-5 py-3 text-center font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
