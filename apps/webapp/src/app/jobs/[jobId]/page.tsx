'use server';

import { getJobById } from '@/app/actions';
import { SmallNavbar } from '@/app/components/smallNavbar';

import { WithClientProviders } from '../../components/clientProviders';
import { JobDetails } from './JobDetails';

export default async function JobsPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;

  const formData = new FormData();
  formData.set('jobId', jobId);
  const job = await getJobById(formData);

  return (
    <>
      <WithClientProviders>
        <JobDetails job={job} />
      </WithClientProviders>
      <SmallNavbar />
    </>
  );
}
