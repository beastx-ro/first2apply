/* eslint-disable @typescript-eslint/no-unused-vars */
import type {
  AdvancedMatchingConfig,
  First2ApplyApiSdk,
  Job,
  JobLabel,
  JobSite,
  JobStatus,
  Link,
  ListJobsParams,
  ListJobsResult,
  Note,
  Profile,
  Review,
  StripeConfig,
} from '@first2apply/core';
import { throwError } from '@first2apply/core';
import type { User } from '@supabase/supabase-js';

export class WebappApiSdk implements First2ApplyApiSdk {
  // Auth
  async getUser(): Promise<User | null> {
    return throwError('getUser not implemented');
  }
  async loginWithEmail(_: { email: string; password: string }): Promise<User> {
    return throwError('loginWithEmail not implemented');
  }
  async logout(): Promise<void> {
    return throwError('logout not implemented');
  }
  async signupWithEmail(_: { email: string; password: string }): Promise<User> {
    return throwError('signupWithEmail not implemented');
  }
  async sendPasswordResetEmail(_: { email: string }): Promise<void> {
    return throwError('sendPasswordResetEmail not implemented');
  }
  async changePassword(_: { password: string }): Promise<User> {
    return throwError('changePassword not implemented');
  }

  // Profile & Billing
  async getProfile(): Promise<Profile | null> {
    return throwError('getProfile not implemented');
  }
  async getStripeConfig(): Promise<StripeConfig> {
    return throwError('getStripeConfig not implemented');
  }

  // Jobs
  async listJobs(_: ListJobsParams): Promise<ListJobsResult> {
    return throwError('listJobs not implemented');
  }
  async getJobById(jobId: number): Promise<Job> {
    return throwError('getJobById not implemented');
  }
  async updateJobStatus(_: { jobId: number; status: JobStatus }): Promise<void> {
    return throwError('updateJobStatus not implemented');
  }
  async updateJobLabels(_: { jobId: number; labels: JobLabel[] }): Promise<Job> {
    return throwError('updateJobLabels not implemented');
  }
  async changeAllJobsStatus(_: { from: JobStatus; to: JobStatus }): Promise<void> {
    return throwError('changeAllJobsStatus not implemented');
  }
  async scanJob(job: Job): Promise<Job> {
    return throwError('scanJob not implemented');
  }

  // Links
  async listLinks(): Promise<Link[]> {
    return throwError('listLinks not implemented');
  }
  async createLink(_: { title: string; url: string; html: string }): Promise<Link> {
    return throwError('createLink not implemented');
  }
  async updateLink(_: { linkId: number; title: string; url: string }): Promise<Link> {
    return throwError('updateLink not implemented');
  }
  async deleteLink(linkId: number): Promise<void> {
    return throwError('deleteLink not implemented');
  }

  // Sites
  async listSites(): Promise<JobSite[]> {
    return throwError('listSites not implemented');
  }

  // Notes
  async createNote(_: { job_id: number; text: string; files: string[] }): Promise<Note> {
    return throwError('createNote not implemented');
  }
  async listNotes(job_id: number): Promise<Note[]> {
    return throwError('listNotes not implemented');
  }
  async updateNote(_: { noteId: number; text: string }): Promise<Note> {
    return throwError('updateNote not implemented');
  }
  async addFileToNote(_: { noteId: number; file: string }): Promise<Note> {
    return throwError('addFileToNote not implemented');
  }
  async deleteNote(noteId: number): Promise<void> {
    return throwError('deleteNote not implemented');
  }

  // Reviews
  async createReview(_: { title: string; description: string; rating: number }): Promise<Review> {
    return throwError('createReview not implemented');
  }
  async getUserReview(): Promise<Review | null> {
    return throwError('getUserReview not implemented');
  }
  async updateReview(_: { id: number; title: string; description: string; rating: number }): Promise<Review> {
    return throwError('updateReview not implemented');
  }

  // Advanced Matching
  async getAdvancedMatchingConfig(): Promise<AdvancedMatchingConfig | null> {
    return throwError('getAdvancedMatchingConfig not implemented');
  }
  async updateAdvancedMatchingConfig(
    _: Pick<AdvancedMatchingConfig, 'chatgpt_prompt' | 'blacklisted_companies'>,
  ): Promise<AdvancedMatchingConfig> {
    return throwError('updateAdvancedMatchingConfig not implemented');
  }
}

export const webappApiSdk = new WebappApiSdk();
