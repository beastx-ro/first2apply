import {
  closeOverlayBrowserView,
  finishOverlayBrowserView,
  openOverlayBrowserView,
  overlayBrowserViewGoBack,
  overlayBrowserViewGoForward,
  overlayBrowserViewNavigate,
} from '@/lib/electronMainSdk';
import { OverlayBrowserViewResult } from '@/lib/types';
import { ArrowLeftIcon, ArrowRightIcon, Cross1Icon } from '@radix-ui/react-icons';
import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

export type BrowserWindowProps = {
  onClose: () => void;
  customActionButton: {
    text: string;
    onClick: () => void;
    tooltip?: string;
  };
};

export type BrowserWindowHandle = {
  open: (url: string) => void;
  finish: () => Promise<OverlayBrowserViewResult>;
};

/**
 * Component used to create a browser window with
 * back/forward buttons, URL bar, etc.  The component uses
 * Electron's WebContentsView class under the hood, but
 * does not expose it directly. Instead, it provides
 * methods to navigate, go back, go forward, and close
 * the window.
 *
 * This is not a standalone window like Electron's BrowserWindow,
 * but rather a view that can be embedded in an existing window.
 * The parent window is responsible for creating and managing
 * the BrowserWindow instance.
 */
export const BrowserWindow = forwardRef<BrowserWindowHandle, BrowserWindowProps>(
  ({ onClose, customActionButton }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentUrl, setCurrentUrl] = useState('');

    useEffect(() => {
      // Listen for URL changes from the main process
      // @ts-ignore
      const removeListener = window.electron.on('browser-view-url-changed', (_, newUrl) => {
        if (typeof newUrl === 'string') {
          setCurrentUrl(newUrl);
        }
      });

      closeOverlayBrowserView();

      return () => {
        removeListener();
      };
    }, []);

    useImperativeHandle(ref, () => ({
      open: async (url: string) => {
        console.log('Opening URL in browser window:', url);
        setCurrentUrl(url);
        await openOverlayBrowserView(url);
        setIsOpen(true);
      },
      finish: async () => {
        const result = await finishOverlayBrowserView();
        setIsOpen(false);
        return result;
      },
    }));

    if (!isOpen) {
      return null;
    }

    const handleClose = async () => {
      try {
        await closeOverlayBrowserView();
        setIsOpen(false);
        onClose();
      } catch (error) {
        console.error('Error closing browser window:', error);
      }
    };

    return (
      <div className="justify-left fixed left-0 top-0 z-50 flex h-[50px] w-full items-center border-b bg-background px-4">
        <div className="flex gap-2" id="navigation-buttons">
          <div id="back-button" className="rounded-full">
            <Button variant="ghost" size="icon" onClick={() => overlayBrowserViewGoBack()}>
              <ArrowLeftIcon className="h-7 w-7 rounded-full" />
            </Button>
          </div>
          <div id="fwd-button" className="rounded-full">
            <Button variant="ghost" size="icon" onClick={() => overlayBrowserViewGoForward()}>
              <ArrowRightIcon className="h-7 w-7 rounded-full" />
            </Button>
          </div>
        </div>

        <div id="url-input" className="ml-2 w-full">
          <Input
            type="text"
            onClick={(e) => (e.target as HTMLInputElement).select()}
            value={currentUrl}
            onChange={(e) => setCurrentUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                overlayBrowserViewNavigate(currentUrl);
              }
            }}
          />
        </div>

        {/* close btn */}
        <div className="ml-2">
          <Button variant="ghost" size="icon" onClick={() => handleClose()}>
            <Cross1Icon className="h-5 w-5 rounded-full" />
          </Button>
        </div>

        {/* custom action button */}
        <div className="ml-2">
          <TooltipProvider delayDuration={500}>
            <Tooltip>
              <TooltipTrigger className="flex gap-3">
                <Button variant="default" onClick={() => customActionButton.onClick()}>
                  {customActionButton.text}
                </Button>
              </TooltipTrigger>

              {customActionButton.tooltip && (
                <TooltipContent side="left" className="text-base 2xl:hidden">
                  {customActionButton.tooltip}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    );
  },
);
