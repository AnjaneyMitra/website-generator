import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { Menu } from 'lucide-react';

interface NavbarProps {
  onOpenSidebar?: () => void;
}

export default function Navbar({ onOpenSidebar }: NavbarProps) {
  const { currentUser, logout } = useAuth();

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-4">
            <button
              onClick={onOpenSidebar}
              className="p-2 rounded-md hover:bg-gray-100 lg:hidden"
            >
              <Menu className="h-5 w-5 text-gray-500" />
            </button>
            <Link href="/" className="text-xl font-bold text-gray-800">
              Brix.AI
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/generator" className="text-gray-600 hover:text-gray-900">
              Generator
            </Link>
            {currentUser ? (
              <>
                <Link href="/profile" className="text-gray-600 hover:text-gray-900">
                  Profile
                </Link>
                <button 
                  onClick={() => logout()}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link 
                href="/login"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
