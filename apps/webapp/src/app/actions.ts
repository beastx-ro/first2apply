'use server';

import { createClient } from '@/lib/supabase/server';
import { JobStatus, ListJobsParams, getExceptionMessage } from '@first2apply/core';
import { F2aSupabaseApi } from '@first2apply/ui';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const api = await buildApi();
    await api.loginWithEmail({ email, password });
  } catch (error) {
    return { error: getExceptionMessage(error, true) };
  }

  redirect('/jobs/list/new');
}

export async function signOut() {
  try {
    const api = await buildApi();
    await api.logout();
  } catch (error) {
    return { error: getExceptionMessage(error) };
  }

  redirect('/');
}

export async function listSites() {
  try {
    const api = await buildApi();
    return api.listSites();
  } catch (error) {
    throw new Error(`failed to list sites: ${getExceptionMessage(error, true)}`);
  }
}

export async function listLinks() {
  try {
    const api = await buildApi();
    return api.listLinks();
  } catch (error) {
    throw new Error(`failed to list links: ${getExceptionMessage(error, true)}`);
  }
}

export async function listJobs(formData: FormData) {
  try {
    const api = await buildApi();
    const params: ListJobsParams = {
      status: formData.get('status') as JobStatus,
      search: formData.get('search') as string,
      labels: (formData.get('labels') as string)?.split(',').map((label) => label.trim()) || [],
      siteIds: (formData.get('siteIds') as string)?.split(',').map((id) => Number(id.trim())) || [],
      linkIds: (formData.get('linkIds') as string)?.split(',').map((id) => Number(id.trim())) || [],
      limit: Number(formData.get('limit') ?? 50),
      after: formData.get('after') as string | undefined,
    };
    return api.listJobs(params);
  } catch (error) {
    throw new Error(`failed to list jobs: ${getExceptionMessage(error, true)}`);
  }
}

export async function getJobById(formData: FormData) {
  try {
    const jobId = Number(formData.get('jobId'));
    if (isNaN(jobId)) throw new Error('invalid job id');

    const api = await buildApi();
    return api.getJob(jobId);
  } catch (error) {
    throw new Error(`failed to get job by id: ${getExceptionMessage(error, true)}`);
  }
}

export async function updateJobStatus(formData: FormData) {
  try {
    const jobId = Number(formData.get('jobId'));
    const status = formData.get('status') as JobStatus;
    if (isNaN(jobId)) throw new Error('invalid job id');

    const api = await buildApi();
    await api.updateJobStatus({ jobId, status });
  } catch (error) {
    throw new Error(`failed to update job status: ${getExceptionMessage(error, true)}`);
  }
}

async function buildApi() {
  const supabase = await createClient();
  const api = new F2aSupabaseApi(supabase);
  return api;
}
