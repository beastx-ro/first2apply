import { getExceptionMessage } from '@first2apply/core';
import { Job } from '@first2apply/core';
import { dialog, ipcMain, shell } from 'electron';
import fs from 'fs';
import { json2csv } from 'json-2-csv';
import os from 'os';

import { F2aAutoUpdater } from './autoUpdater';
import { JobScanner } from './jobScanner';
import { OverlayBrowserView } from './overlayBrowserView';
import { getStripeConfig } from './stripeConfig';
import { F2aSupabaseApi } from './supabaseApi';

/**
 * Helper methods used to centralize error handling.
 */
async function _apiCall<T>(method: () => Promise<T>) {
  try {
    const data = await method();
    return { data };
  } catch (error) {
    console.error(getExceptionMessage(error));
    return { error: getExceptionMessage(error, true) };
  }
}

/**
 * IPC handlers that expose methods to the renderer process
 * used to interact with the Supabase instance hosted on the node process.
 */
export function initRendererIpcApi({
  supabaseApi,
  jobScanner,
  autoUpdater,
  overlayBrowserView,
  nodeEnv,
}: {
  supabaseApi: F2aSupabaseApi;
  jobScanner: JobScanner;
  autoUpdater: F2aAutoUpdater;
  overlayBrowserView: OverlayBrowserView;
  nodeEnv: string;
}) {
  ipcMain.handle('get-os-type', (event) =>
    _apiCall(async () => {
      return os.platform();
    }),
  );

  ipcMain.handle('signup-with-email', async (event, { email, password }) =>
    _apiCall(() => supabaseApi.signupWithEmail({ email, password })),
  );

  ipcMain.handle('login-with-email', async (event, { email, password }) =>
    _apiCall(() => supabaseApi.loginWithEmail({ email, password })),
  );

  ipcMain.handle('send-password-reset-email', async (event, { email }) =>
    _apiCall(() => supabaseApi.sendPasswordResetEmail({ email })),
  );

  ipcMain.handle('change-password', async (event, { password }) =>
    _apiCall(() => supabaseApi.updatePassword({ password })),
  );

  ipcMain.handle('logout', async (event, {}) => _apiCall(() => supabaseApi.logout()));

  ipcMain.handle('get-user', async (event) => _apiCall(() => supabaseApi.getUser()));

  ipcMain.handle('create-link', async (event, { title, url, html }) =>
    _apiCall(async () => {
      const { link, newJobs } = await supabaseApi.createLink({
        title,
        url,
        html,
      });

      // intentionally not awaited to not have the user wait until JDs are in
      jobScanner.scanJobs(newJobs).catch((error) => {
        console.error(getExceptionMessage(error));
      });

      return { link };
    }),
  );

  ipcMain.handle('update-link', async (event, { linkId, title, url }) =>
    _apiCall(() => supabaseApi.updateLink({ linkId, title, url })),
  );

  ipcMain.handle('list-links', async (event, { title, url }) => _apiCall(() => supabaseApi.listLinks()));

  ipcMain.handle('delete-link', async (event, { linkId }) => _apiCall(() => supabaseApi.deleteLink(linkId)));

  ipcMain.handle('list-jobs', async (event, { status, search, siteIds, linkIds, labels, limit, after }) =>
    _apiCall(() => supabaseApi.listJobs({ status, search, siteIds, linkIds, labels, limit, after })),
  );

  ipcMain.handle('update-job-status', async (event, { jobId, status }) =>
    _apiCall(() => supabaseApi.updateJobStatus({ jobId, status })),
  );

  ipcMain.handle('update-job-labels', async (event, { jobId, labels }) =>
    _apiCall(() => supabaseApi.updateJobLabels({ jobId, labels })),
  );

  ipcMain.handle('list-sites', async (event) => _apiCall(() => supabaseApi.listSites()));

  ipcMain.handle('update-job-scanner-settings', async (event, { settings }) =>
    _apiCall(async () => jobScanner.updateSettings(settings)),
  );

  // handler used to fetch the cron schedule
  ipcMain.handle('get-job-scanner-settings', async (event) => _apiCall(async () => jobScanner.getSettings()));

  ipcMain.handle('open-external-url', async (event, { url }) => _apiCall(async () => shell.openExternal(url)));

  ipcMain.handle('scan-job-description', async (event, { job }) =>
    _apiCall(async () => {
      const [updatedJob] = await jobScanner.scanJobs([job]);
      return { job: updatedJob };
    }),
  );
  ipcMain.handle('get-app-state', async (event, {}) =>
    _apiCall(async () => {
      const isScanning = await jobScanner.isScanning();
      const newUpdate = await autoUpdater.getNewUpdate();
      return { isScanning, newUpdate };
    }),
  );
  ipcMain.handle('apply-app-update', async (event, {}) =>
    _apiCall(async () => {
      await autoUpdater.applyUpdate();
      return {};
    }),
  );

  ipcMain.handle('create-user-review', async (event, { title, description, rating }) =>
    _apiCall(() => supabaseApi.createReview({ title, description, rating })),
  );

  ipcMain.handle('get-user-review', async (event) => _apiCall(async () => supabaseApi.getUserReview()));

  ipcMain.handle('update-user-review', async (event, { id, title, description, rating }) =>
    _apiCall(async () => supabaseApi.updateReview({ id, title, description, rating })),
  );

  ipcMain.handle('get-job-by-id', async (event, { jobId }) =>
    _apiCall(async () => {
      const job = await supabaseApi.getJob(jobId);
      return { job };
    }),
  );

  ipcMain.handle('export-jobs-csv', async (event, { status }) =>
    _apiCall(async () => {
      const res = await dialog.showSaveDialog({
        properties: ['createDirectory'],
        filters: [{ name: 'CSV Jobs', extensions: ['csv'] }],
      });
      const filePath = res.filePath;
      if (res.canceled) return;

      // load all jobs with pagination
      const batchSize = 300;
      let allJobs: Job[] = [];
      let after: string | undefined;
      do {
        const { jobs, nextPageToken } = await supabaseApi.listJobs({
          status,
          limit: batchSize,
          after,
        });
        allJobs = allJobs.concat(jobs);
        after = nextPageToken;
      } while (after);

      // cherry-pick the fields we want to export
      const sanitizedJobs = allJobs.map((job: Job) => ({
        title: job.title,
        company: job.companyName,
        location: job.location,
        salary: job.salary,
        job_type: job.jobType,
        job_status: job.status,
        external_url: job.externalUrl,
      }));

      const csvJobs = json2csv(sanitizedJobs);
      fs.writeFileSync(filePath, csvJobs);
    }),
  );

  ipcMain.handle('change-all-job-status', async (event, { from, to }) =>
    _apiCall(async () => {
      const job = await supabaseApi.changeAllJobStatus({ from, to });
      return { job };
    }),
  );

  ipcMain.handle('get-profile', async (event, {}) =>
    _apiCall(async () => {
      const profile = await supabaseApi.getProfile();
      return { profile };
    }),
  );

  ipcMain.handle('get-stripe-config', async (event, {}) =>
    _apiCall(async () => {
      const config = await getStripeConfig(nodeEnv);
      return { config };
    }),
  );

  ipcMain.handle('create-note', async (event, { job_id, text, files }) =>
    _apiCall(() => supabaseApi.createNote({ job_id, text, files })),
  );

  ipcMain.handle('list-notes', async (event, { job_id }) => _apiCall(() => supabaseApi.listNotes(job_id)));

  ipcMain.handle('update-note', async (event, { noteId, text }) =>
    _apiCall(() => supabaseApi.updateNote({ noteId, text })),
  );

  ipcMain.handle('add-file-to-note', async (event, { noteId, file }) =>
    _apiCall(() => supabaseApi.addFileToNote({ noteId, file })),
  );

  ipcMain.handle('delete-note', async (event, { noteId }) => _apiCall(() => supabaseApi.deleteNote(noteId)));

  ipcMain.handle('get-advanced-matching-config', async (event, {}) =>
    _apiCall(() => supabaseApi.getAdvancedMatchingConfig()),
  );

  ipcMain.handle('update-advanced-matching-config', async (event, { config }) =>
    _apiCall(() => supabaseApi.updateAdvancedMatchingConfig(config)),
  );

  ipcMain.handle('scan-link', async (event, { linkId }) => _apiCall(() => jobScanner.scanLink({ linkId })));

  ipcMain.handle('open-overlay-browser-view', async (event, { url }) => {
    return _apiCall(async () => overlayBrowserView.open(url));
  });
  ipcMain.handle('close-overlay-browser-view', async () => {
    return _apiCall(async () => overlayBrowserView.close());
  });
  ipcMain.handle('overlay-browser-can-view-go-back', async (event, { url }) => {
    return _apiCall(async () => overlayBrowserView.canGoBack());
  });
  ipcMain.handle('overlay-browser-view-go-back', async () => {
    return _apiCall(async () => overlayBrowserView.goBack());
  });
  ipcMain.handle('overlay-browser-can-view-go-forward', async (event, { url }) => {
    return _apiCall(async () => overlayBrowserView.canGoForward());
  });
  ipcMain.handle('overlay-browser-view-go-forward', async () => {
    return _apiCall(async () => overlayBrowserView.goForward());
  });
  ipcMain.handle('finish-overlay-browser-view', async () => {
    return _apiCall(async () => overlayBrowserView.finish());
  });
  ipcMain.handle('overlay-browser-view-navigate', async (event, { url }) => {
    return _apiCall(async () => overlayBrowserView.navigate(url));
  });
}
