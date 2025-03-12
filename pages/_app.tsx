import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { Providers } from '../components/Providers';
import { AuthProvider } from '../contexts/AuthContext';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Providers>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </Providers>
  );
}

export default MyApp;
