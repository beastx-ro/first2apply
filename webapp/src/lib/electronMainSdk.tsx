"use client";

import { User } from "@supabase/supabase-js";
import urljoin from "url-join";

import {
  AdvancedMatchingConfig,
  DbSchema,
  Job,
  JobLabel,
  JobSite,
  JobStatus,
  Link,
  Note,
  Profile,
  Review,
  StripeConfig,
} from "../../../supabase/functions/_shared/types";
import { JobScannerSettings, NewAppVersion } from "./types";
import { createClient } from "./supabase/client";
import { F2aSupabaseApi } from "./supabase/supabaseApi";
import { getStripeConfig as getStripeConfigByEnv } from "./supabase/stripeConfig";
import { ENV } from "./env";

async function _mainProcessApiCall<T>(
  channel: string,
  params?: object
): Promise<T> {
  const supabaseClient = await createClient<DbSchema>();
  const f2aSupabaseClient = new F2aSupabaseApi(supabaseClient);
  // @ts-ignore
  // const { data, error } = await window.electron.invoke(channel, params);
  // if (error) throw new Error(error);

  return {} as T;
}

async function getSupabaseClient() {
  const supabaseClient = await createClient<DbSchema>();
  const f2aSupabaseClient = new F2aSupabaseApi(supabaseClient);

  return f2aSupabaseClient;
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
  const f2aSupabaseClient = await getSupabaseClient();
  const { user } = await f2aSupabaseClient.signupWithEmail({ email, password });

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
  const supabaseClient = await createClient<DbSchema>();
  const f2aSupabaseClient = new F2aSupabaseApi(supabaseClient);

  const { user } = await f2aSupabaseClient.loginWithEmail({ email, password });

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
  const f2aSupabaseClient = await getSupabaseClient();
  const redirectTo = urljoin(ENV.webappUrl, "reset-password");
  await f2aSupabaseClient.sendPasswordResetEmail({
    email,
    redirectTo,
  });
  console.log(`Password reset email sent: ${redirectTo}`);
}

/**
 * Change the password of the current user.
 */
export async function changePassword({
  password,
}: {
  password: string;
}): Promise<User> {
  const f2aSupabaseClient = await getSupabaseClient();
  const { user } = await f2aSupabaseClient.updatePassword({ password });
  return user;
}

/**
 * Logout user session.
 */
export async function logout(): Promise<void> {
  const f2aSupabaseClient = await getSupabaseClient();
  await f2aSupabaseClient.logout();
}

/**
 * Get user from the current session.
 */
export async function getUser(): Promise<User | null> {
  const supabaseClient = await createClient<DbSchema>();
  const f2aSupabaseClient = new F2aSupabaseApi(supabaseClient);

  const { user } = await f2aSupabaseClient.getUser();
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
  const supabaseClient = await createClient<DbSchema>();
  const f2aSupabaseClient = new F2aSupabaseApi(supabaseClient);

  const links = await f2aSupabaseClient.listLinks();
  return links;
}

/**
 * Delete a link.
 */
export async function deleteLink(linkId: number): Promise<void> {
  const f2aSupabaseClient = await getSupabaseClient();
  await f2aSupabaseClient.deleteLink(linkId);
}

/**
 * List all jobs.
 */
export async function listJobs({
  status,
  search,
  siteIds,
  linkIds,
  limit,
  after,
}: {
  status: JobStatus;
  search?: string;
  siteIds?: number[];
  linkIds?: number[];
  limit?: number;
  after?: string;
}) {
  const supabaseClient = await createClient<DbSchema>();
  const f2aSupabaseClient = new F2aSupabaseApi(supabaseClient);

  const result = await f2aSupabaseClient.listJobs({
    status,
    search,
    siteIds,
    linkIds,
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
  const supabaseClient = await createClient<DbSchema>();
  const f2aSupabaseClient = new F2aSupabaseApi(supabaseClient);

  const sites = await f2aSupabaseClient.listSites();
  return sites;
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
  description?: string;
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
  description?: string;
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
  const supabaseClient = await createClient<DbSchema>();
  const f2aSupabaseClient = new F2aSupabaseApi(supabaseClient);
  const job = await f2aSupabaseClient.getJob(jobId);

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
 * Get the profile of the current user.
 */
export async function getProfile(): Promise<Profile> {
  const supabaseClient = await createClient<DbSchema>();
  const f2aSupabaseClient = new F2aSupabaseApi(supabaseClient);
  const profile = await f2aSupabaseClient.getProfile();
  return profile;
}

/**
 * Get Stripe config.
 */
export async function getStripeConfig(): Promise<StripeConfig> {
  const config = getStripeConfigByEnv(ENV.nodeEnv);
  return config;
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
  const supabaseClient = await createClient<DbSchema>();
  const f2aSupabaseClient = new F2aSupabaseApi(supabaseClient);

  const notes = await f2aSupabaseClient.listNotes(job_id);
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
 * Get the advanced matching configuration for the current user.
 */
export async function getAdvancedMatchingConfig(): Promise<AdvancedMatchingConfig | null> {
  const supabaseClient = await createClient<DbSchema>();
  const f2aSupabaseClient = new F2aSupabaseApi(supabaseClient);

  const config = await f2aSupabaseClient.getAdvancedMatchingConfig();
  return config;
}

/**
 * Update the advanced matching configuration for the current user.
 */
export async function updateAdvancedMatchingConfig(
  config: Pick<
    AdvancedMatchingConfig,
    "chatgpt_prompt" | "blacklisted_companies"
  >
) {
  return await _mainProcessApiCall<AdvancedMatchingConfig>(
    "update-advanced-matching-config",
    {
      config,
    }
  );
}

/**
 * Start debugging a link.
 */
export async function debugLink(linkId: number): Promise<void> {
  await _mainProcessApiCall("debug-link", { linkId });
}

/**
 * Get the current state of the application.
 */
export async function getAppState(): Promise<{
  isScanning: boolean;
  newUpdate?: NewAppVersion;
}> {
  // return await _mainProcessApiCall("get-app-state", {});
  return { isScanning: false };
}

/**
 * Apply the latest app update.
 */
export async function applyAppUpdate(): Promise<void> {
  await _mainProcessApiCall("apply-app-update", {});
}
