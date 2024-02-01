import { PostgrestError, SupabaseClient, User } from "@supabase/supabase-js";
import { DbSchema, Link } from "../../../supabase/functions/_shared/types";

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
  async createLink({
    title,
    url,
    html,
  }: {
    title: string;
    url: string;
    html: string;
  }): Promise<{ link: Link }> {
    return this._supabaseApiCall(() =>
      this._supabase.functions.invoke("create-link", {
        body: {
          title,
          url,
          html,
        },
      })
    );
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
  scanHtmls(htmls: { linkId: number; content: string }[]) {
    return this._supabaseApiCall(() =>
      this._supabase.functions.invoke("scan-urls", {
        body: {
          htmls,
        },
      })
    );
  }

  /**
   * List all jobs for the current user.
   */
  listJobs() {
    return this._supabaseApiCall(
      async () =>
        await this._supabase
          .from("jobs")
          .select("*")
          // .eq("visible", true)
          .order("created_at", { ascending: false })
          .limit(200)
    );
  }

  /**
   *
   * Update the archived status of a job.
   */
  archiveJob(jobId: string) {
    return this._supabaseApiCall(
      async () =>
        await this._supabase
          .from("jobs")
          .update({ archived: true })
          .eq("id", jobId)
    );
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
   * Wrapper around a Supabase method that handles errors.
   */
  private async _supabaseApiCall<T, E extends Error | PostgrestError>(
    method: () => Promise<{ data?: T; error: E }>
  ) {
    // this._supabase.auth.updateUser({password: 'test'});
    const { data, error } = await method();
    if (error) throw error;

    return data;
  }
}
