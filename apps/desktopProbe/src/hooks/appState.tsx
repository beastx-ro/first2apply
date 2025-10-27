import React, { createContext, useContext, useEffect, useState } from 'react';

import { getAppState } from '@/lib/electronMainSdk';
import { NewAppVersion } from '@/lib/types';

import { useError } from './error';

// Create a context for the app state
const AppStateContext = createContext<{
  isLoading: boolean;
  isScanning: boolean;
  newUpdate?: NewAppVersion;
}>({
  isLoading: true,
  isScanning: false,
});

/**
 * Global hook used to access the app state.
 */
export const useAppState = () => {
  const appState = useContext(AppStateContext);
  if (appState === undefined) {
    throw new Error('useAppState must be used within a AppStateProvider');
  }
  return appState;
};

// Create a provider for the session
export const AppStateProvider = ({ children }: React.PropsWithChildren) => {
  const { handleError } = useError();

  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [newUpdate, setNewUpdate] = useState<NewAppVersion | undefined>();

  // Load the user on mount
  useEffect(() => {
    const asyncLoad = async () => {
      try {
        const { isScanning, newUpdate } = await getAppState();
        setIsScanning(isScanning);
        setNewUpdate(newUpdate);
      } catch (error) {
        handleError({ error });
      }
    };

    asyncLoad().then(() => setIsLoading(false));
    const interval = setInterval(asyncLoad, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppStateContext.Provider
      value={{
        isLoading,
        isScanning,
        newUpdate,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
};
