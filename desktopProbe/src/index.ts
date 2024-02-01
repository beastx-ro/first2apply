import {
  app,
  BrowserWindow,
  safeStorage,
  nativeTheme,
  session,
  dialog,
} from "electron";
import path from "path";
import { ENV } from "./env";

// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

const APP_PROTOCOL = "first2apply";

// register the custom protocol
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(APP_PROTOCOL, process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient(APP_PROTOCOL);
}

let mainWindow: BrowserWindow | null = null;
const createMainWindow = (): void => {
  // Create the browser window.
  if (mainWindow) return;
  const theme = nativeTheme.shouldUseDarkColors ? "dark" : "light";
  mainWindow = new BrowserWindow({
    height: 800,
    width: 1024,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      additionalArguments: [theme],
    },
    autoHideMenuBar: true,
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  mainWindow.on("close", (event) => {
    event.preventDefault();
    mainWindow?.hide();

    // hide the dock icon on macOS and hide the taskbar icon on Windows
    if (process.platform === "darwin") {
      app.dock.hide();
    } else if (process.platform === "win32") {
      mainWindow?.setSkipTaskbar(true);
    }
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  bootstrap();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  app.quit();
});

function onActivate() {
  if (!mainWindow?.isVisible()) {
    // show the dock icon on macOS and show the taskbar icon on Windows
    if (process.platform === "darwin") {
      app.dock.show();
    } else if (process.platform === "win32") {
      mainWindow?.setSkipTaskbar(false);
    }

    mainWindow?.show();
  }

  if (mainWindow?.isMinimized()) {
    mainWindow?.restore();
  }

  mainWindow?.focus();
}
app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  onActivate();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
import fs from "fs";

import { createClient } from "@supabase/supabase-js";
import { DbSchema } from "../../supabase/functions/_shared/types";
import { getExceptionMessage } from "./lib/error";
import { F2aSupabaseApi } from "./server/supabaseApi";
import { JobScanner } from "./server/jobScanner";
import { initRendererIpcApi } from "./server/rendererIpcApi";
import { TrayMenu } from "./server/trayMenu";
import { HtmlDownloader } from "./server/htmlDownloader";

// globals
const supabase = createClient<DbSchema>(ENV.supabase.url, ENV.supabase.key);
const supabaseApi = new F2aSupabaseApi(supabase);
const htmlDownloader = new HtmlDownloader();
let jobScanner: JobScanner | undefined;
let trayMenu: TrayMenu | undefined;

function navigate({ path }: { path: string }) {
  console.log(`sending nav event to ${path}`);
  mainWindow?.webContents.send("navigate", { path });
  onActivate(); // make sure the window is visible
}

async function handleDeepLink(url: string) {
  try {
    onActivate();
    const path = url.replace(`${APP_PROTOCOL}:/`, "");

    // handle password reset links, parse hash and extract supabase tokens
    if (path.startsWith("/reset-password")) {
      const hash = path.replace("/reset-password#", "");
      const params = new URLSearchParams(hash);
      const allHashParams = Object.fromEntries(params.entries());

      dialog.showMessageBoxSync({
        type: "info",
        message: `allHashParams: ${JSON.stringify(allHashParams)}`,
      });

      // @ts-ignore
      await supabase.auth.setSession(allHashParams);
    }

    navigate({ path });
  } catch (error) {
    console.error(getExceptionMessage(error));
  }
}

/**
 * Bootstrap probe service.
 */
async function bootstrap() {
  try {
    // do not allow multiple instances on Windows
    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
      app.quit();
      return;
    }

    session.defaultSession.clearCache();
    if (!ENV.appBundleId) throw new Error(`missing APP_BUNDLE_ID`);
    if (process.platform === "win32") {
      app.setAppUserModelId(ENV.appBundleId);
    }

    // init the HTML downloader
    htmlDownloader.init();

    // init the job scanner
    jobScanner = new JobScanner(supabaseApi, htmlDownloader, navigate);

    // init the renderer IPC API
    initRendererIpcApi({ supabaseApi, jobScanner, htmlDownloader });

    // init the tray menu
    trayMenu = new TrayMenu({ onQuit: quit, onNavigate: navigate });

    const userDataPath = app.getPath("userData");
    const sessionPath = path.join(userDataPath, "encrypted-session.json");

    // manual logout for testing
    // fs.unlinkSync(sessionPath);

    // load the session from disk if it exists
    if (fs.existsSync(sessionPath)) {
      const encryptedSession = fs.readFileSync(sessionPath, "utf-8");
      const plaintextSession = safeStorage.decryptString(
        Buffer.from(encryptedSession, "base64")
      );
      const session = JSON.parse(plaintextSession);
      console.log(`finished loading session from disk`);
      const { error } = await supabase.auth.setSession(session);
      if (error) throw error;
    } else {
      console.log(`no session found on disk`);
    }

    // save the session to disk when it changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        // clear the session from disk if it's being removed
        if (event === "SIGNED_OUT") {
          console.log(`removing session from disk`);
          fs.unlinkSync(sessionPath);
          return;
        } else if (
          event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED" ||
          event === "PASSWORD_RECOVERY"
        ) {
          console.log(`saving new session to disk`);
          const encryptedSession = safeStorage.encryptString(
            JSON.stringify(session)
          );
          fs.writeFileSync(
            sessionPath,
            encryptedSession.toString("base64"),
            "utf-8"
          );
        }
      } catch (error) {
        console.error(getExceptionMessage(error));
      }
    });

    // perform an initial scan
    // await jobScanner.scanLinks();
  } catch (error) {
    console.error(getExceptionMessage(error));
  }

  // create the main window after everything is setup
  createMainWindow();

  // handle deep links on macOS and linux
  app.on("open-url", (event, url) => {
    event.preventDefault();
    handleDeepLink(url);
  });

  // handle deep links on Windows
  app.on("second-instance", (event, commandLine) => {
    handleDeepLink(commandLine[1]);
  });
}

/**
 * Method used to quit the app.
 */
async function quit() {
  try {
    console.log(`quitting...`);

    jobScanner?.close();
    console.log(`closed job scanner`);

    htmlDownloader.close();
    console.log(`closed html downloader`);

    trayMenu?.close();
    console.log(`closed tray menu`);

    mainWindow?.removeAllListeners();
    console.log(`removed all main window listeners`);
  } catch (error) {
    console.error(getExceptionMessage(error));
  } finally {
    mainWindow?.close();
    console.log(`closed main window`);
  }
}
