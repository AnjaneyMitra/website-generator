import { QueryClient } from '@tanstack/react-query';

// Instead of using React's cache, we'll implement a simple singleton pattern
let queryClientInstance = null;

// This ensures we don't create multiple instances during SSR/client hydration
export const getQueryClient = () => {
  if (!queryClientInstance) {
    queryClientInstance = new QueryClient({
      defaultOptions: {
        queries: {
          // Default query options
          staleTime: 60 * 1000,
          // Other options can be added here
        },
      },
    });
  }
  return queryClientInstance;
};

// For client-side usage, we can export a singleton instance
const queryClient = typeof window !== 'undefined' ? getQueryClient() : null;

export default queryClient;
