import { createLink, deleteLink, listLinks, updateLink } from '@/lib/electronMainSdk';
import { createContext, useContext, useEffect, useState } from 'react';

import { Link } from '../../../../supabase/functions/_shared/types';
import { useError } from './error';
import { useSession } from './session';

// Define the shape of the context data
type LinksContextType = {
  isLoading: boolean;
  links: Link[];
  createLink: (
    newLink: Pick<Link, 'title' | 'url'> & {
      html: string;
    },
  ) => Promise<Link>;
  updateLink: (linkId: number, data: { title: string; url: string }) => Promise<void>;
  removeLink: (linkId: number) => Promise<void>;
  reloadLinks: () => Promise<void>;
};

// Create the context with an initial default value
export const LinksContext = createContext<LinksContextType>({
  isLoading: true,
  links: [],
  createLink: async () => {
    throw new Error('createLink not implemented');
  },
  updateLink: async () => {
    throw new Error('updateLink not implemented');
  },
  removeLink: async () => {
    throw new Error('removeLink not implemented');
  },
  reloadLinks: async () => {
    throw new Error('reloadLinks not implemented');
  },
});

// Hook for consuming context
export const useLinks = () => {
  const context = useContext(LinksContext);
  if (context === undefined) {
    throw new Error('useLinks must be used within a LinksProvider');
  }
  return context;
};

// Provider component
export const LinksProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const { handleError } = useError();
  const { isLoggedIn } = useSession();

  const [isLoading, setIsLoading] = useState(true);
  const [links, setLinks] = useState<Link[]>([]);

  const fetchLinks = async () => {
    try {
      if (!isLoggedIn) return;
      const fetchedLinks = await listLinks();
      setLinks(fetchedLinks);
      setIsLoading(false);
    } catch (error) {
      handleError({ error });
    }
  };

  // Fetch links on component mount
  useEffect(() => {
    fetchLinks();
  }, [isLoggedIn]);

  // Create a new link
  const onCreateLink = async (
    newLink: Pick<Link, 'title' | 'url'> & {
      html: string;
    },
  ) => {
    const createdLink = await createLink(newLink);
    setLinks((currentLinks) => [createdLink, ...currentLinks]);
    return createdLink;
  };

  // Update an existing link
  const onUpdateLink = async (linkId: number, data: { title: string; url: string }) => {
    const updatedLink = await updateLink({
      linkId,
      title: data.title,
      url: data.url,
    });
    setLinks((currentLinks) => currentLinks.map((link) => (link.id === linkId ? { ...link, ...updatedLink } : link)));
  };

  // Remove an existing link
  const onRemoveLink = async (linkId: number) => {
    await deleteLink(linkId);
    setLinks((currentLinks) => currentLinks.filter((link) => link.id !== linkId));
  };

  // Reload links
  const onReloadLinks = async () => {
    await fetchLinks();
  };

  return (
    <LinksContext.Provider
      value={{
        isLoading,
        links,
        createLink: onCreateLink,
        updateLink: onUpdateLink,
        removeLink: onRemoveLink,
        reloadLinks: onReloadLinks,
      }}
    >
      {children}
    </LinksContext.Provider>
  );
};
