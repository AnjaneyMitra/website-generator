import { useRouter } from 'next/router';
import { X, MessageSquarePlus, ChevronLeft, ChevronRight, Menu } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const router = useRouter();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 bg-white/80 backdrop-blur-lg shadow-lg transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } w-72`}
      >
        <div className="h-full flex flex-col px-6 py-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-semibold text-gray-800">Chats</h2>
            <div className="flex items-center space-x-2">
              {/* Toggle button - now always visible */}
              <button
                onClick={onClose}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
              >
                {isOpen ? (
                  <ChevronLeft className="h-5 w-5 text-gray-500" />
                ) : (
                  <Menu className="h-5 w-5 text-gray-500" />
                )}
              </button>
              {/* Mobile close button */}
              <button
                onClick={onClose}
                className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          <button
            onClick={() => router.push('/generator?new=true')}
            className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <MessageSquarePlus className="h-5 w-5" />
            New Chat
          </button>

          <div className="mt-8">
            {/* Chat history can go here */}
          </div>
        </div>
      </div>

      {/* Add a persistent toggle button for collapsed state */}
      {!isOpen && (
        <button
          onClick={onClose}
          className="fixed top-8 left-6 z-50 p-2 rounded-md bg-white/80 backdrop-blur-sm shadow-md hover:bg-gray-100/80 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5 text-gray-500" />
        </button>
      )}
    </>
  );
}
