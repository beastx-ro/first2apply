import { dialog, ipcMain, shell } from "electron";
import { F2aSupabaseApi } from "./supabaseApi";
import { getExceptionMessage } from "../lib/error";
import { JobScanner } from "./jobScanner";
import fs from "fs";
import { json2csv } from "json-2-csv";
import { Job } from "../../../supabase/functions/_shared/types";
import os from "os";

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
}: {
  supabaseApi: F2aSupabaseApi;
  jobScanner: JobScanner;
}) {
  ipcMain.handle("get-os-type", (event) =>
    _apiCall(async () => {
      return os.platform();
    })
  );

  ipcMain.handle("signup-with-email", async (event, { email, password }) =>
    _apiCall(() => supabaseApi.signupWithEmail({ email, password }))
  );

  ipcMain.handle("login-with-email", async (event, { email, password }) =>
    _apiCall(() => supabaseApi.loginWithEmail({ email, password }))
  );

  ipcMain.handle("send-password-reset-email", async (event, { email }) =>
    _apiCall(() => supabaseApi.sendPasswordResetEmail({ email }))
  );

  ipcMain.handle("change-password", async (event, { password }) =>
    _apiCall(() => supabaseApi.updatePassword({ password }))
  );

  ipcMain.handle("logout", async (event, {}) =>
    _apiCall(() => supabaseApi.logout())
  );

  ipcMain.handle("get-user", async (event) =>
    _apiCall(() => supabaseApi.getUser())
  );

  ipcMain.handle("create-link", async (event, { title, url }) =>
    _apiCall(async () => {
      const { link } = await supabaseApi.createLink({
        title,
        url,
      });

      // intentionally not awaited to not have the user wait until JDs are in
      jobScanner.scanLinks({ links: [link] }).catch((error) => {
        console.error(getExceptionMessage(error));
      });

      return { link };
    })
  );

  ipcMain.handle("list-links", async (event, { title, url }) =>
    _apiCall(() => supabaseApi.listLinks())
  );

  ipcMain.handle("delete-link", async (event, { linkId }) =>
    _apiCall(() => supabaseApi.deleteLink(linkId))
  );

  ipcMain.handle("list-jobs", async (event, { status, limit, after }) =>
    _apiCall(() => supabaseApi.listJobs({ status, limit, after }))
  );

  ipcMain.handle("update-job-status", async (event, { jobId, status }) =>
    _apiCall(() => supabaseApi.updateJobStatus({ jobId, status }))
  );

  ipcMain.handle("update-job-labels", async (event, { jobId, labels }) =>
    _apiCall(() => supabaseApi.updateJobLabels({ jobId, labels }))
  );

  ipcMain.handle("list-sites", async (event) =>
    _apiCall(() => supabaseApi.listSites())
  );

  ipcMain.handle("update-job-scanner-settings", async (event, { settings }) =>
    _apiCall(async () => jobScanner.updateSettings(settings))
  );

  // handler used to fetch the cron schedule
  ipcMain.handle("get-job-scanner-settings", async (event) =>
    _apiCall(async () => jobScanner.getSettings())
  );

  ipcMain.handle("open-external-url", async (event, { url }) =>
    _apiCall(async () => shell.openExternal(url))
  );

  ipcMain.handle("scan-job-description", async (event, { job }) =>
    _apiCall(async () => {
      const [updatedJob] = await jobScanner.scanJobs([job]);
      return { job: updatedJob };
    })
  );

  ipcMain.handle(
    "create-user-review",
    async (event, { title, description, rating }) =>
      _apiCall(() => supabaseApi.createReview({ title, description, rating }))
  );

  ipcMain.handle("get-user-review", async (event) =>
    _apiCall(async () => supabaseApi.getUserReview())
  );

  ipcMain.handle(
    "update-user-review",
    async (event, { id, title, description, rating }) =>
      _apiCall(async () =>
        supabaseApi.updateReview({ id, title, description, rating })
      )
  );

  ipcMain.handle("get-job-by-id", async (event, { jobId }) =>
    _apiCall(async () => {
      const job = await supabaseApi.getJob(jobId);
      return { job };
    })
  );

  ipcMain.handle("export-jobs-csv", async (event, { status }) =>
    _apiCall(async () => {
      const res = await dialog.showSaveDialog({
        properties: ["createDirectory"],
        filters: [{ name: "CSV Jobs", extensions: ["csv"] }],
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
      } while (!!after);

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
    })
  );

  ipcMain.handle("change-all-job-status", async (event, { from, to }) =>
    _apiCall(async () => {
      const job = await supabaseApi.changeAllJobStatus({ from, to });
      return { job };
    })
  );

  ipcMain.handle("create-note", async (event, { job_id, text, files }) =>
    _apiCall(() => supabaseApi.createNote({ job_id, text, files }))
  );

  ipcMain.handle("list-notes", async (event, { job_id }) =>
    _apiCall(() => supabaseApi.listNotes(job_id))
  );

  ipcMain.handle("update-note", async (event, { noteId, text }) =>
    _apiCall(() => supabaseApi.updateNote({ noteId, text }))
  );

  ipcMain.handle("add-file-to-note", async (event, { noteId, file }) =>
    _apiCall(() => supabaseApi.addFileToNote({ noteId, file }))
  );

  ipcMain.handle("delete-note", async (event, { noteId }) =>
    _apiCall(() => supabaseApi.deleteNote(noteId))
  );

  ipcMain.handle("get-user-advanced-filters", async (event) =>
    _apiCall(async () => {
      const advancedFilters = await supabaseApi.getUserAdvancedFilters();
      return advancedFilters;
    })
  );

  ipcMain.handle("upsert-advanced-filters", async (event, filters) =>
    _apiCall(async () => {
      const advancedFilters = await supabaseApi.upsertAdvancedFilters({
        filters,
      });
      return advancedFilters;
    })
  );
}
