import app from './utils/firebase/firebaseConfig';
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@firebasegen/default-connector';

// Get the Data Connect instance using the proper initialization pattern
export const dataConnect = getDataConnect(connectorConfig);

// If we need to connect to the emulator in development
if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_EMULATOR === 'true') {
  import('firebase/data-connect').then(({ connectDataConnectEmulator }) => {
    connectDataConnectEmulator(dataConnect, 'localhost', 9399);
  }).catch(error => {
    console.error('Error loading Data Connect emulator:', error);
  });
}

// Export common hooks and utilities
export * from '@firebasegen/default-connector/react';
