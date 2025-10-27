import { createContext, useContext, useEffect, useState } from 'react';

import { useError } from '@/hooks/error';
import { getProbeSettings, updateProbeSettings } from '@/lib/electronMainSdk';
import { JobScannerSettings } from '@/lib/types';

import { useSession } from './session';

// Define the shape of the context data
interface SettingsContextType {
  isLoading: boolean;
  settings: JobScannerSettings;
  updateSettings: (newSettings: JobScannerSettings) => Promise<void>;
}

// Create the context with a default value
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Hook for consuming context
export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

// Provider component
export const SettingsProvider = ({ children }: React.PropsWithChildren<unknown>) => {
  const { handleError } = useError();
  const { isLoggedIn } = useSession();

  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<JobScannerSettings>({
    cronRule: undefined,
    useSound: false,
    preventSleep: false,
    areEmailAlertsEnabled: true,
    inAppBrowserEnabled: true,
  });

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        if (!isLoggedIn) return;
        const fetchedSettings = await getProbeSettings();
        setSettings(fetchedSettings);
        setIsLoading(false);
      } catch (error) {
        handleError({ error });
      }
    };

    loadSettings();
  }, [isLoggedIn]);

  // Update settings
  const onUpdateSettings = async (newSettings: JobScannerSettings) => {
    await updateProbeSettings(newSettings);
    setSettings(newSettings);
  };

  return (
    <SettingsContext.Provider value={{ settings, isLoading, updateSettings: onUpdateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
