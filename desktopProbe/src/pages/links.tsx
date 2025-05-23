import { CreateLink } from '@/components/createLink';
import { LinksList } from '@/components/linksList';
import { LinksListSkeleton } from '@/components/skeletons/linksListSkeleton';
import { useAppState } from '@/hooks/appState';
import { useError } from '@/hooks/error';
import { useLinks } from '@/hooks/links';
import { debugLink } from '@/lib/electronMainSdk';
import { throwError } from '@/lib/error';
import { useEffect } from 'react';

import { DefaultLayout } from './defaultLayout';

export function LinksPage() {
  const { handleError } = useError();
  const { isLoading, links, removeLink, updateLink, reloadLinks } = useLinks();
  const { isScanning } = useAppState();

  // refresh links on component mount
  useEffect(() => {
    const asyncLoad = async () => {
      try {
        await reloadLinks();
      } catch (error) {
        handleError({ error });
      }
    };

    asyncLoad();
  }, []);

  // Delete an existing link
  const handleDeleteLink = async (linkId: number) => {
    try {
      await removeLink(linkId);
    } catch (error) {
      handleError({ error });
    }
  };

  // start debugging link
  const handleDebugLink = async (linkId: number) => {
    try {
      await debugLink(linkId);
    } catch (error) {
      handleError({ error });
    }
  };

  // update link
  const handleUpdateLink = async (data: { linkId: number; title: string }) => {
    try {
      // for now, we only update the title
      const link = links.find((l) => l.id === data.linkId) ?? throwError('Link not found');

      await updateLink(data.linkId, { title: data.title, url: link.url });
    } catch (error) {
      handleError({ error });
    }
  };

  if (isLoading) {
    return (
      <DefaultLayout className="p-6 md:p-10">
        <LinksListSkeleton />
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout className="p-6 md:p-10">
      <div className="flex justify-between">
        <div className="flex items-end">
          <h1 className="text-2xl font-medium tracking-wide">Job Searches</h1>
          {isScanning && <span className="ml-4 pb-1 text-xs">( currently scanning for new jobs )</span>}
        </div>

        {links.length > 0 && <CreateLink />}
      </div>

      {links.length === 0 && (
        <div className="flex h-[calc(100vh-200px)] flex-col items-center justify-center">
          <h2 className="mb-10 w-3/5 whitespace-break-spaces break-normal text-center text-xl tracking-wide md:text-2xl xl:w-1/2">
            First 2 Apply periodically visits your <span className="whitespace-nowrap font-medium">pre-configured</span>{' '}
            job searches and fetches the list of jobs. If there are new jobs since the last visit, you will be notified.
          </h2>

          <div className="w-fit">
            <CreateLink />
          </div>
        </div>
      )}

      {links.length > 0 && (
        <LinksList
          links={links}
          onDeleteLink={handleDeleteLink}
          onDebugLink={handleDebugLink}
          onUpdateLink={handleUpdateLink}
        />
      )}
    </DefaultLayout>
  );
}
