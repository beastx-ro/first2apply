import { ipcMain } from "electron";
import { F2aSupabaseApi } from "./supabaseApi";
import { getExceptionMessage } from "../lib/error";
import { JobScanner } from "./jobScanner";
import { HtmlDownloader } from "./htmlDownloader";

/**
 * Helper methods used to centralize error handling.
 */
async function _apiCall<T>(method: () => Promise<T>) {
  try {
    return await method();
  } catch (error) {
    console.error(getExceptionMessage(error));
    throw error;
  }
}

/**
 * IPC handlers that expose methods to the renderer process
 * used to interact with the Supabase instance hosted on the node process.
 */
export function initRendererIpcApi({
  supabaseApi,
  jobScanner,
  htmlDownloader,
}: {
  supabaseApi: F2aSupabaseApi;
  jobScanner: JobScanner;
  htmlDownloader: HtmlDownloader;
}) {
  ipcMain.handle("signup-with-email", async (event, { email, password }) =>
    _apiCall(() => supabaseApi.signupWithEmail({ email, password }))
  );

  ipcMain.handle("login-with-email", async (event, { email, password }) =>
    _apiCall(() => supabaseApi.loginWithEmail({ email, password }))
  );

  ipcMain.handle("get-user", async (event) =>
    _apiCall(() => supabaseApi.getUser())
  );

  ipcMain.handle("create-link", async (event, { title, url }) =>
    _apiCall(async () =>
      supabaseApi.createLink({
        title,
        url,
        html: await htmlDownloader.loadUrl(url),
      })
    )
  );

  ipcMain.handle("list-links", async (event, { title, url }) =>
    _apiCall(() => supabaseApi.listLinks())
  );

  ipcMain.handle("list-jobs", async (event, {}) =>
    _apiCall(() => supabaseApi.listJobs())
  );

  ipcMain.handle("update-job-scanner-settings", async (event, { settings }) =>
    _apiCall(async () => jobScanner.updateSettings(settings))
  );

  // handler used to fetch the cron schedule
  ipcMain.handle("get-job-scanner-settings", async (event) =>
    _apiCall(async () => jobScanner.getSettings())
  );
}