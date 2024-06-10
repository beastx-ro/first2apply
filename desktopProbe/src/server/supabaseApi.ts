import {
  FunctionsHttpError,
  PostgrestError,
  SupabaseClient,
  User,
} from "@supabase/supabase-js";
import {
  DbSchema,
  Job,
  JobLabel,
  JobStatus,
  Link,
  Review,
} from "../../../supabase/functions/_shared/types";
import * as luxon from "luxon";
import { backOff } from "exponential-backoff";

/**
 * Class used to interact with our Supabase API.
 */
export class F2aSupabaseApi {
  constructor(private _supabase: SupabaseClient<DbSchema>) {}

  /**
   * Create a new user account using an email and password.
   */
  signupWithEmail({ email, password }: { email: string; password: string }) {
    return this._supabaseApiCall(() =>
      this._supabase.auth.signUp({ email, password })
    );
  }

  /**
   * Login using an email and password.
   */
  loginWithEmail({ email, password }: { email: string; password: string }) {
    return this._supabaseApiCall(() =>
      this._supabase.auth.signInWithPassword({ email, password })
    );
  }

  /**
   * Send a password reset email.
   */
  sendPasswordResetEmail({ email }: { email: string }) {
    return this._supabaseApiCall(() =>
      this._supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "first2apply://reset-password",
      })
    );
  }

  /**
   * Update the password for the current user.
   */
  updatePassword({ password }: { password: string }) {
    return this._supabaseApiCall(() =>
      this._supabase.auth.updateUser({ password })
    );
  }

  /**
   * Logout the current user.
   */
  async logout() {
    return this._supabaseApiCall(async () => this._supabase.auth.signOut());
  }

  /**
   * Get the user from the current supabase session
   */
  getUser(): Promise<{ user: User | null }> {
    return this._supabaseApiCall(
      async () => await this._supabase.auth.getUser()
    ).catch(() => ({
      user: null,
    }));
  }

  /**
   * Create a new link.
   */
  async createLink({ title, url }: { title: string; url: string }) {
    const { link, newJobs } = await this._supabaseApiCall(() =>
      this._supabase.functions.invoke<{ link: Link; newJobs: Job[] }>(
        "create-link",
        {
          body: {
            title,
            url,
          },
        }
      )
    );

    return { link, newJobs };
  }

  /**
   * Get all registered links for the current user.
   */
  listLinks() {
    return this._supabaseApiCall(async () =>
      this._supabase.from("links").select("*").order("id", { ascending: false })
    );
  }

  /**
   * Delete a link.
   */
  deleteLink(linkId: string) {
    return this._supabaseApiCall(async () =>
      this._supabase.from("links").delete().eq("id", linkId)
    );
  }

  /**
   * Scan a list of htmls for new jobs.
   */
  scanHtmls(
    htmls: {
      linkId: number;
      content: string;
      maxRetries: number;
      retryCount: number;
    }[]
  ) {
    return this._supabaseApiCall(() =>
      this._supabase.functions.invoke<{ newJobs: Job[]; parseFailed: boolean }>(
        "scan-urls",
        {
          body: {
            htmls,
          },
        }
      )
    );
  }

  /**
   * Scan HTML for a job description.
   */
  scanJobDescription({
    jobId,
    html,
    maxRetries,
    retryCount,
  }: {
    jobId: number;
    html: string;
    maxRetries: number;
    retryCount: number;
  }) {
    return this._supabaseApiCall(() =>
      this._supabase.functions.invoke<{ job: Job; parseFailed: boolean }>(
        "scan-job-description",
        {
          body: {
            jobId,
            html,
            maxRetries,
            retryCount,
          },
        }
      )
    );
  }

  /**
   * List all jobs for the current user.
   */
  async listJobs({
    status,
    limit = 50,
    after,
  }: {
    status: JobStatus;
    limit?: number;
    after?: string;
  }) {
    const jobs = await this._supabaseApiCall<Job[], PostgrestError>(
      async () => {
        // @ts-ignore
        const res = await this._supabase.rpc("list_jobs", {
          jobs_status: status,
          jobs_after: after ?? null,
          jobs_page_size: limit,
        });

        return res;
      }
    );

    // also return counters for grouped statuses
    const statusses: JobStatus[] = ["new", "archived", "applied"];
    const counters = await Promise.all(
      statusses.map(async (status) => {
        const { count, error } = await this._supabase
          .from("jobs")
          .select("*", { count: "exact", head: true })
          .eq("status", status);
        if (error) throw error;

        return { status, count };
      })
    );

    let nextPageToken: string | undefined;
    if (jobs.length === limit) {
      // the next page token will include the last id as well as it's last updated_at
      const lastJob = jobs[jobs.length - 1];
      nextPageToken = `${lastJob.id}!${lastJob.updated_at}`;
    }

    return {
      jobs,
      new: counters[0].count,
      archived: counters[1].count,
      applied: counters[2].count,
      nextPageToken,
    };
  }

  /**
   * Update the status of a job.
   */
  updateJobStatus({ jobId, status }: { jobId: string; status: JobStatus }) {
    return this._supabaseApiCall(
      async () =>
        await this._supabase
          .from("jobs")
          .update({
            status,
            updated_at: luxon.DateTime.now().toUTC().toJSDate(),
          })
          .eq("id", jobId)
    );
  }

  /**
   * Update the labels of a job.
   * @returns the updated job
   */
  async updateJobLabels({
    jobId,
    labels,
  }: {
    jobId: string;
    labels: JobLabel[];
  }) {
    const [updatedJob] = await this._supabaseApiCall(
      async () =>
        await this._supabase
          .from("jobs")
          .update({
            labels,
          })
          .eq("id", jobId)
          .select("*")
    );

    return updatedJob;
  }

  /**
   * List all sites.
   */
  listSites() {
    return this._supabaseApiCall(
      async () => await this._supabase.from("sites").select("*")
    );
  }

  /**
   * Get a job by id.
   */
  async getJob(jobId: number) {
    const [job] = await this._supabaseApiCall(async () =>
      this._supabase.from("jobs").select("*").eq("id", jobId)
    );
    return job;
  }

  /**
   * Change the status of all jobs with a certain status to another status.
   */
  async changeAllJobStatus({ from, to }: { from: JobStatus; to: JobStatus }) {
    return this._supabaseApiCall(async () =>
      this._supabase
        .from("jobs")
        .update({
          status: to,
          updated_at: luxon.DateTime.now().toUTC().toJSDate(),
        })
        .eq("status", from)
    );
  }

  /**
   * Wrapper around a Supabase method that handles errors.
   */
  private async _supabaseApiCall<
    T,
    E extends Error | PostgrestError | FunctionsHttpError
  >(method: () => Promise<{ data?: T; error: E }>) {
    const { data, error } = await backOff(
      async () => {
        const result = await method();
        if (result.error) throw result.error;

        return result;
      },
      {
        numOfAttempts: 5,
        jitter: "full",
        startingDelay: 300,
      }
    );

    // edge functions don't throw errors, instead they return an errorMessage field in the data object
    // work around for this issue https://github.com/supabase/functions-js/issues/45
    if (
      !!data &&
      typeof data === "object" &&
      "errorMessage" in data &&
      // @ts-ignore
      typeof data.errorMessage === "string"
    ) {
      // @ts-ignore
      throw new Error(data.errorMessage);
    }

    if (error) throw error;

    return data;
  }

  /**
   * Create a user review.
   */
  async createReview({
    title,
    description,
    rating,
  }: {
    title: string;
    description?: string;
    rating: number;
  }) {
    const [createdReview] = await this._supabaseApiCall(
      async () =>
        await this._supabase
          .from("reviews")
          .insert({
            title: title.trim(),
            description: description?.trim(),
            rating,
          })
          .select("*")
    );

    return createdReview;
  }

  /**
   * Get user's review.
   */
  async getUserReview() {
    const [review] = await this._supabaseApiCall(
      async () => await this._supabase.from("reviews").select("*")
    );

    return review;
  }

  /**
   * Update a user review.
   */
  async updateReview({
    id,
    title,
    description,
    rating,
  }: {
    id: number;
    title: string;
    description?: string;
    rating: number;
  }) {
    const [updatedReview] = await this._supabaseApiCall(
      async () =>
        await this._supabase
          .from("reviews")
          .update({
            title: title.trim(),
            description: description?.trim(),
            rating,
          })
          .eq("id", id)
          .select("*")
    );

    return updatedReview;
  }

  /**
   * Create a new note for the current user.
   */
  async createNote({
    job_id,
    text,
    files,
  }: {
    job_id: number;
    text: string;
    files?: string[];
  }) {
    const [createdNote] = await this._supabaseApiCall(
      async () =>
        await this._supabase
          .from("notes")
          .insert({ job_id, text, files })
          .select("*")
    );

    return createdNote;
  }

  /**
   * Fetch all notes for the current user for a job.
   */
  async listNotes(job_id: number) {
    return this._supabaseApiCall(async () =>
      this._supabase
        .from("notes")
        .select("*")
        .eq("job_id", job_id)
        .order("created_at", { ascending: false })
    );
  }

  /**
   * Update an existing note by ID.
   */
  async updateNote({ noteId, text }: { noteId: number; text: string }) {
    return this._supabaseApiCall(async () =>
      this._supabase
        .from("notes")
        .update({ text })
        .eq("id", noteId)
        .select("*")
        .single()
    );
  }

  /**
   * Add a file to a note.
   */
  async addFileToNote({ noteId, file }: { noteId: number; file: string }) {
    const result = await this._supabase
      .from("notes")
      .select("files")
      .eq("id", noteId)
      .single();

    if (result.error) {
      throw result.error;
    }

    const updatedFiles = result.data.files
      ? [...result.data.files, file]
      : [file];

    return this._supabaseApiCall(async () =>
      this._supabase
        .from("notes")
        .update({ files: updatedFiles })
        .eq("id", noteId)
        .single()
    );
  }

  /**
   * Delete a specific note by ID.
   */
  async deleteNote(noteId: number) {
    return this._supabaseApiCall(async () =>
      this._supabase.from("notes").delete().eq("id", noteId)
    );
  }

  /**
   * Get jobs based on search query.
   */
  async getJobsByText({
    search_query,
    status,
  }: {
    search_query: string;
    status: JobStatus;
  }) {
    const parsedQuery = search_query.split(" ").join(" & ");
    const jobs = await this._supabaseApiCall<Job[], PostgrestError>(
      async () => {
        const res = await this._supabase.rpc("text_search_jobs", {
          search_query: parsedQuery,
          jobs_status: status,
        });
        return res;
      }
    );
    return jobs;
  }
}
