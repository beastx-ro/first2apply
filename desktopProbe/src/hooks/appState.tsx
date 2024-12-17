import { getAppState, getSavedResume, saveResumePdf } from '@/lib/electronMainSdk';
import { NewAppVersion, ResumeFile } from '@/lib/types';
import React, { createContext, useContext, useEffect, useState } from 'react';

import { useError } from './error';

// Create a context for the app state
const AppStateContext = createContext<{
  isLoading: boolean;
  isScanning: boolean;
  newUpdate?: NewAppVersion;
  resumeFile?: ResumeFile;
  saveNewResume: () => void;
}>({
  isLoading: true,
  isScanning: false,
  saveNewResume: () => {},
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
  const [resumeFile, setResumeFile] = useState<ResumeFile | undefined>(undefined);

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

  // Load the saved resume file
  useEffect(() => {
    const asyncLoad = async () => {
      try {
        const resumeFile = await getSavedResume();
        if (resumeFile) {
          setResumeFile(resumeFile);
        }
      } catch (error) {
        handleError({ error });
      }
    };

    asyncLoad();
  }, []);

  // Save a new resume file
  const saveNewResume = async () => {
    try {
      const newResumeFile = await saveResumePdf();

      if (newResumeFile) {
        setResumeFile({
          filename: newResumeFile.filename,
          text: '',
        });
      }
    } catch (error) {
      handleError({ error });
    }
  };

  return (
    <AppStateContext.Provider
      value={{
        isLoading,
        isScanning,
        newUpdate,
        resumeFile,
        saveNewResume,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
};
