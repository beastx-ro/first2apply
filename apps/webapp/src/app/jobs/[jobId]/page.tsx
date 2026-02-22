'use server';

import { getJobById, listLinks, listSites } from '@/app/actions';
import { SmallNavbar } from '@/app/components/smallNavbar';

import { WithClientProviders } from '../../components/clientProviders';
import { JobDetails } from './JobDetails';

export default async function JobsPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;

  const formData = new FormData();
  formData.set('jobId', jobId);

  const [sites, links, job] = await Promise.all([listSites(), listLinks(), getJobById(formData)]);

  return (
    <>
      <WithClientProviders sites={sites} links={links}>
        <JobDetails job={job} />
      </WithClientProviders>
      <SmallNavbar />
    </>
  );
}
