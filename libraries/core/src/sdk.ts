import type { User } from '@supabase/supabase-js';

import type {
  AdvancedMatchingConfig,
  Job,
  JobLabel,
  JobSite,
  JobStatus,
  Link,
  Note,
  Profile,
  Review,
  StripeConfig,
} from './types';

/**
 * Result type for paginated job listings.
 */
export interface ListJobsResult {
  jobs: Job[];
  new: number;
  applied: number;
  archived: number;
  filtered: number;
  nextPageToken?: string;
}

/**
 * Parameters for listing jobs.
 */
export interface ListJobsParams {
  status: JobStatus;
  search?: string;
  siteIds?: number[];
  linkIds?: number[];
  labels?: string[];
  limit?: number;
  after?: string;
}

/**
 * First2Apply API SDK interface.
 *
 * This interface defines all API methods that can be implemented by different
 * platforms (Electron IPC for desktop, server actions for webapp).
 */
export interface First2ApplyApiSdk {
  // ─────────────────────────────────────────────────────────────────────────────
  // Auth
  // ─────────────────────────────────────────────────────────────────────────────

  /** Get the current user from the session */
  getUser(): Promise<User | null>;

  /** Login with email and password */
  loginWithEmail(_: { email: string; password: string }): Promise<User>;

  /** Logout the current user */
  logout(): Promise<void>;

  /** Sign up with email and password */
  signupWithEmail(_: { email: string; password: string }): Promise<User>;

  /** Send a password reset email */
  sendPasswordResetEmail(_: { email: string }): Promise<void>;

  /** Change the password of the current user */
  changePassword(_: { password: string }): Promise<User>;

  // ─────────────────────────────────────────────────────────────────────────────
  // Profile & Billing
  // ─────────────────────────────────────────────────────────────────────────────

  /** Get the profile of the current user */
  getProfile(): Promise<Profile | null>;

  /** Get Stripe billing configuration */
  getStripeConfig(): Promise<StripeConfig>;

  // ─────────────────────────────────────────────────────────────────────────────
  // Jobs
  // ─────────────────────────────────────────────────────────────────────────────

  /** List jobs with filters and pagination */
  listJobs(_: ListJobsParams): Promise<ListJobsResult>;

  /** Get a single job by ID */
  getJobById(jobId: number): Promise<Job>;

  /** Update the status of a job */
  updateJobStatus(_: { jobId: number; status: JobStatus }): Promise<void>;

  /** Update the labels of a job */
  updateJobLabels(_: { jobId: number; labels: JobLabel[] }): Promise<Job>;

  /** Change the status of all jobs from one status to another */
  changeAllJobsStatus(_: { from: JobStatus; to: JobStatus }): Promise<void>;

  /** Scan a job to fetch its details */
  scanJob(job: Job): Promise<Job>;

  // ─────────────────────────────────────────────────────────────────────────────
  // Links (Job Search URLs)
  // ─────────────────────────────────────────────────────────────────────────────

  /** List all links */
  listLinks(): Promise<Link[]>;

  /** Create a new link */
  createLink(_: { title: string; url: string; html: string; webPageRuntimeData: WebPageRuntimeData }): Promise<Link>;

  /** Update an existing link */
  updateLink(_: { linkId: number; title: string; url: string }): Promise<Link>;

  /** Delete a link */
  deleteLink(linkId: number): Promise<void>;

  // ─────────────────────────────────────────────────────────────────────────────
  // Sites
  // ─────────────────────────────────────────────────────────────────────────────

  /** List all job sites */
  listSites(): Promise<JobSite[]>;

  // ─────────────────────────────────────────────────────────────────────────────
  // Notes
  // ─────────────────────────────────────────────────────────────────────────────

  /** Create a new note for a job */
  createNote(_: { job_id: number; text: string; files: string[] }): Promise<Note>;

  /** List all notes for a job */
  listNotes(job_id: number): Promise<Note[]>;

  /** Update a note */
  updateNote(_: { noteId: number; text: string }): Promise<Note>;

  /** Add a file to a note */
  addFileToNote(_: { noteId: number; file: string }): Promise<Note>;

  /** Delete a note */
  deleteNote(noteId: number): Promise<void>;

  // ─────────────────────────────────────────────────────────────────────────────
  // Reviews
  // ─────────────────────────────────────────────────────────────────────────────

  /** Create a user review */
  createReview(_: { title: string; description: string; rating: number }): Promise<Review>;

  /** Get the current user's review */
  getUserReview(): Promise<Review | null>;

  /** Update a user review */
  updateReview(_: { id: number; title: string; description: string; rating: number }): Promise<Review>;

  // ─────────────────────────────────────────────────────────────────────────────
  // Advanced Matching
  // ─────────────────────────────────────────────────────────────────────────────

  /** Get the advanced matching configuration */
  getAdvancedMatchingConfig(): Promise<AdvancedMatchingConfig | null>;

  /** Update the advanced matching configuration */
  updateAdvancedMatchingConfig(
    config: Pick<AdvancedMatchingConfig, 'chatgpt_prompt' | 'blacklisted_companies'>,
  ): Promise<AdvancedMatchingConfig>;
}
