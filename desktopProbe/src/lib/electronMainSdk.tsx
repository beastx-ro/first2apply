import { User } from "@supabase/supabase-js";
import { JobScannerSettings } from "./types";
import {
  Job,
  JobLabel,
  JobSite,
  JobStatus,
  Link,
  Note,
  Review,
} from "../../../supabase/functions/_shared/types";

async function _mainProcessApiCall<T>(
  channel: string,
  params?: object
): Promise<T> {
  // @ts-ignore
  const { data, error } = await window.electron.invoke(channel, params);
  if (error) throw new Error(error);

  return data;
}

/**
 * Get the currently used operating system.
 */
export async function getOS(): Promise<NodeJS.Platform> {
  return await _mainProcessApiCall("get-os-type", {});
}

/**
 * Create a new account with email and password.
 */
export async function signupWithEmail({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<User> {
  const { user } = await _mainProcessApiCall<{ user: User }>(
    "signup-with-email",
    {
      email,
      password,
    }
  );

  return user;
}

/**
 * Login with email and password.
 */
export async function loginWithEmail({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<User> {
  const { user } = await _mainProcessApiCall<{ user: User }>(
    "login-with-email",
    {
      email,
      password,
    }
  );

  return user;
}

/**
 * Send a password reset email.
 */
export async function sendPasswordResetEmail({
  email,
}: {
  email: string;
}): Promise<void> {
  await _mainProcessApiCall("send-password-reset-email", { email });
}

/**
 * Change the password of the current user.
 */
export async function changePassword({
  password,
}: {
  password: string;
}): Promise<User> {
  const { user } = await _mainProcessApiCall<{ user: User }>(
    "change-password",
    { password }
  );
  return user;
}

/**
 * Logout user session.
 */
export async function logout(): Promise<void> {
  await _mainProcessApiCall("logout", {});
}

/**
 * Get user from the current session.
 */
export async function getUser(): Promise<User | null> {
  const { user } = await _mainProcessApiCall<{ user: User | null }>(
    "get-user",
    {}
  );
  return user;
}

/**
 * Function used to create a new link.
 */
export async function createLink({
  title,
  url,
}: {
  title: string;
  url: string;
}): Promise<Link> {
  const { link } = await _mainProcessApiCall<{ link: Link }>("create-link", {
    title,
    url,
  });
  return link;
}

/**
 * List all links.
 */
export async function listLinks(): Promise<Link[]> {
  const links = await _mainProcessApiCall<Link[]>("list-links", {});
  return links;
}

/**
 * Delete a link.
 */
export async function deleteLink(linkId: number): Promise<void> {
  await _mainProcessApiCall("delete-link", { linkId });
}

/**
 * List all jobs.
 */
export async function listJobs({
  status,
  limit,
  after,
}: {
  status: JobStatus;
  limit?: number;
  after?: string;
}) {
  const result = await _mainProcessApiCall<{
    jobs: Job[];
    new: number;
    applied: number;
    archived: number;
    nextPageToken?: string;
  }>("list-jobs", {
    status,
    limit,
    after,
  });

  return result;
}

/**
 * Update the archived status of a job.
 */
export async function updateJobStatus({
  jobId,
  status,
}: {
  jobId: number;
  status: JobStatus;
}): Promise<void> {
  await _mainProcessApiCall("update-job-status", { jobId, status });
}

/**
 * Update the labels of a job.
 */
export async function updateJobLabels({
  jobId,
  labels,
}: {
  jobId: number;
  labels: JobLabel[];
}): Promise<Job> {
  return await _mainProcessApiCall("update-job-labels", { jobId, labels });
}

/**
 * List all sites.
 */
export async function listSites() {
  return await _mainProcessApiCall<JobSite[]>("list-sites", {});
}

/**
 * Update the settings of the probe.
 */
export async function updateProbeSettings(
  settings: JobScannerSettings
): Promise<void> {
  await _mainProcessApiCall("update-job-scanner-settings", {
    settings,
  });
}

/**
 * Get the current settings of the probe.
 */
export async function getProbeSettings(): Promise<JobScannerSettings> {
  const settings = await _mainProcessApiCall<JobScannerSettings>(
    "get-job-scanner-settings",
    {}
  );
  return settings;
}

/**
 * Open a url in the default browser.
 */
export async function openExternalUrl(url: string): Promise<void> {
  await _mainProcessApiCall("open-external-url", { url });
}

/**
 * Scan a job to fetch the details.
 */
export async function scanJob(job: Job): Promise<Job> {
  const { job: updatedJob } = await _mainProcessApiCall<{ job: Job }>(
    "scan-job-description",
    { job }
  );
  return updatedJob;
}

/**
 * Create a user review.
 */
export async function createReview({
  title,
  description,
  rating,
}: {
  title: string;
  description: string;
  rating: number;
}): Promise<Review> {
  return await _mainProcessApiCall("create-user-review", {
    title,
    description,
    rating,
  });
}

/**
 * Get a user review.
 */
export async function getUserReview(): Promise<Review | null> {
  return await _mainProcessApiCall("get-user-review", {});
}

/**
 * Update a user review.
 */
export async function updateReview({
  id,
  title,
  description,
  rating,
}: {
  id: number;
  title: string;
  description: string;
  rating: number;
}): Promise<Review> {
  return await _mainProcessApiCall("update-user-review", {
    id,
    title,
    description,
    rating,
  });
}

/**
 * Get a job by id.
 */
export async function getJobById(jobId: number): Promise<Job> {
  const { job } = await _mainProcessApiCall<{ job: Job }>("get-job-by-id", {
    jobId,
  });
  return job;
}

/**
 * Export all jobs with the given status to a CSV file.
 */
export async function exportJobsToCsv(status: JobStatus): Promise<void> {
  await _mainProcessApiCall<{ fileName: string }>("export-jobs-csv", {
    status,
  });
}

/**
 * Change the status of all jobs from one status to another.
 */
export async function changeAllJobsStatus({
  from,
  to,
}: {
  from: JobStatus;
  to: JobStatus;
}): Promise<void> {
  await _mainProcessApiCall("change-all-job-status", { from, to });
}

/**
 * Create a new note.
 */
export async function createNote({
  job_id,
  text,
  files,
}: {
  job_id: number;
  text: string;
  files: string[];
}): Promise<Note> {
  return await _mainProcessApiCall("create-note", {
    job_id,
    text,
    files,
  });
}

/**
 * List all notes for a job.
 */
export async function listNotes(job_id: number): Promise<Note[]> {
  const notes = await _mainProcessApiCall<Note[]>("list-notes", { job_id });
  return notes;
}

/**
 * Update a note.
 */
export async function updateNote({
  noteId,
  text,
}: {
  noteId: number;
  text: string;
}): Promise<Note> {
  return await _mainProcessApiCall("update-note", {
    noteId,
    text,
  });
}

/**
 * Add a file to a note.
 */
export async function addFileToNote({
  noteId,
  file,
}: {
  noteId: number;
  file: string;
}): Promise<Note> {
  return await _mainProcessApiCall("add-file-to-note", {
    noteId,
    file,
  });
}

/**
 * Delete a note.
 */
export async function deleteNote(noteId: number): Promise<void> {
  await _mainProcessApiCall("delete-note", { noteId });
}

/**
 * Get jobs based on search query.
 */
export async function getJobsByText(search_query: string): Promise<Job[]> {
  const jobs = await _mainProcessApiCall<Job[]>("get-jobs-by-text", {
    search_query,
  });
  return jobs;
}
