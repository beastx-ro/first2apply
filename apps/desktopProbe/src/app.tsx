import { ComponentType, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Route, RouterProvider, createMemoryRouter, createRoutesFromElements } from 'react-router-dom';

import { Toaster } from '@first2apply/ui';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';

import { withAuthGuard } from './components/authGuard';
import { ThemeProvider } from './components/themeProvider';
import { AppStateProvider } from './hooks/appState';
import { LinksProvider } from './hooks/links';
import { SessionProvider } from './hooks/session';
import { SettingsProvider } from './hooks/settings';
import { SitesProvider } from './hooks/sites';
import { AiAgentPage } from './pages/aiAgent';
import { FeedbackPage } from './pages/feedback';
import { FiltersPage } from './pages/filters';
import { ForgotPasswordPage } from './pages/forgotPassword';
import { HelpPage } from './pages/help';
import { Home } from './pages/home';
import { LinksPage } from './pages/links';
import { LoginPage } from './pages/login';
import { ResetPasswordPage } from './pages/resetPassword';
import { SettingsPage } from './pages/settings';
import { SignupPage } from './pages/signup';
import { SubscriptionPage } from './pages/subscription';

TimeAgo.addDefaultLocale(en);

// Auth guarded component wrapper
function AuthGuardedComponent({ component }: { component: ComponentType }) {
  const Component = withAuthGuard(component);
  return <Component />;
}

const router = createMemoryRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<AuthGuardedComponent component={AiAgentPage} />}></Route>
      <Route path="/links" element={<AuthGuardedComponent component={LinksPage} />}></Route>
      <Route path="/filters" element={<AuthGuardedComponent component={FiltersPage} />}></Route>
      <Route path="/settings" element={<AuthGuardedComponent component={SettingsPage} />}></Route>
      <Route path="/help" element={<AuthGuardedComponent component={HelpPage} />} />
      <Route path="/feedback" element={<AuthGuardedComponent component={FeedbackPage} />} />
      <Route path="/subscription" element={<AuthGuardedComponent component={SubscriptionPage} />}></Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/ai-agent" element={<AiAgentPage />} />
    </>,
  ),
  { initialEntries: ['/'] },
);

/**
 * Main app component.
 */
function App() {
  // subscribe to navigation events
  useEffect(() => {
    window.electron?.on('navigate', (_, { path }) => {
      // add a cache buster to the path to force a reload
      let pathWithRefresh = path;
      const separator = path.includes('?') ? '&' : '?';
      pathWithRefresh += `${separator}r=${Date.now().toString()}`;

      router.navigate(pathWithRefresh.toString(), {});
    });
  }, []);

  return (
    <>
      <AppStateProvider>
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme={window.electron?.theme || 'light'}
            // defaultTheme={"light"}
            disableTransitionOnChange
          >
            <SettingsProvider>
              <SitesProvider>
                <LinksProvider>
                  <RouterProvider router={router}></RouterProvider>
                </LinksProvider>
              </SitesProvider>
            </SettingsProvider>
          </ThemeProvider>
        </SessionProvider>
      </AppStateProvider>

      <Toaster />
    </>
  );
}

// Render the app
const root = createRoot(document.body.querySelector('#app')!);
root.render(<App />);

declare global {
  interface Window {
    electron: {
      invoke: (channel: string, params?: object) => Promise<object>;
      on: (
        channel: string,
        callback: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void,
      ) => Electron.IpcRenderer;
      theme: string;
    };
  }
}
