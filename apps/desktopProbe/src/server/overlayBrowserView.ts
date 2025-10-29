import { OverlayBrowserViewResult } from '@/lib/types';
import { BrowserWindow, WebContentsView } from 'electron';

/**
 * Class used to render a WebContentsView on top of the main window
 * to be used as a browser window. The UI (back/forward buttons, URL bar, etc)
 * should be implemented in React.
 */
export class OverlayBrowserView {
  private _mainWindow?: BrowserWindow;
  private _searchView?: WebContentsView;
  private _resizeListener?: () => void;

  /**
   * Set the parent main window.
   */
  setMainWindow(mainWindow: BrowserWindow) {
    this._mainWindow = mainWindow;
    this._searchView = new WebContentsView();
    this._searchView.webContents.debugger.attach('1.3');

    // Add resize listener
    this._resizeListener = this._updateSearchViewBounds.bind(this);
    this._mainWindow.on('resize', this._resizeListener);
    this.navigate('https://www.first2apply.com');
  }

  /**
   * Open the browser view.
   */
  async open(url: string) {
    if (!this._mainWindow) {
      throw new Error('Main window is not set');
    }

    // set the bounds of the view to be the same as the main window
    this._updateSearchViewBounds();

    // Listen for navigation events and send the new URL to the renderer
    const sendUrlUpdate = (_event: Event, newUrl: string) => {
      this._mainWindow?.webContents.send('browser-view-url-changed', newUrl);
    };
    this._searchView.webContents.on('did-navigate', sendUrlUpdate);
    this._searchView.webContents.on('did-navigate-in-page', sendUrlUpdate);

    // this actually adds the view to the window
    this._mainWindow.contentView.addChildView(this._searchView);

    this.navigate(url);
  }

  /**
   * Navigate to a URL.
   */
  navigate(url: string) {
    if (!this._searchView) {
      throw new Error('Search view is not ready');
    }

    // if the url contains spaces, replace them go a google search
    if (url.split(' ').length > 1) {
      url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
    }
    // make sure the string starts with http or https
    else if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    this._searchView.webContents.loadURL(url);
  }

  /**
   * Go back in the browser view history.
   */
  canGoBack(): boolean {
    if (!this._searchView) {
      throw new Error('Search view is not ready');
    }

    return this._searchView.webContents.navigationHistory.canGoBack();
  }
  goBack() {
    if (!this._searchView) {
      throw new Error('Search view is not ready');
    }

    if (this._searchView.webContents.navigationHistory.canGoBack()) {
      this._searchView.webContents.navigationHistory.goBack();
    }
  }

  /**
   * Go forward in the browser view history.
   */
  canGoForward(): boolean {
    if (!this._searchView) {
      throw new Error('Search view is not ready');
    }

    return this._searchView.webContents.navigationHistory.canGoForward();
  }
  goForward() {
    if (!this._searchView) {
      throw new Error('Search view is not ready');
    }

    if (this._searchView.webContents.navigationHistory.canGoForward()) {
      this._searchView.webContents.navigationHistory.goForward();
    }
  }

  /**
   * Update the search view bounds to match the main window
   */
  private _updateSearchViewBounds() {
    if (this._mainWindow && this._searchView) {
      const contentBounds = this._mainWindow.getContentBounds();
      // Start 50px from the top, maintain the width, and adjust the height accordingly

      // width should be 2/3 of the content width
      const searchViewWidth = (contentBounds.width * 2) / 3;

      this._searchView.setBounds({
        x: 0, // Start at left edge of content area
        y: 50, // 50px from top of content area
        width: searchViewWidth,
        height: contentBounds.height - 50,
      });
    }
  }

  /**
   * Get the html content, title, and URL of the current page and close the modal.
   */
  async finish(): Promise<OverlayBrowserViewResult> {
    if (!this._searchView) {
      throw new Error('Search view is not set');
    }

    const html = await this._searchView.webContents.executeJavaScript('document.documentElement.outerHTML');
    const title = await this._searchView.webContents.executeJavaScript('document.title');
    const url = this._searchView.webContents.getURL();

    this.close();

    return {
      url,
      title,
      html,
    };
  }

  /**
   * Close the job board modal.
   * This is used when the user cancels the modal.
   */
  close() {
    if (this._searchView) {
      this._mainWindow.contentView.removeChildView(this._searchView);
    }
  }

  destroy() {
    // Remove the resize listener
    if (this._resizeListener && this._mainWindow) {
      this._mainWindow.removeListener('resize', this._resizeListener);
      this._resizeListener = undefined;
    }

    if (this._searchView) {
      // this._searchView.webContents.debugger.detach();
      this._searchView.webContents.close();
      this._searchView = undefined;
    }
  }
}
