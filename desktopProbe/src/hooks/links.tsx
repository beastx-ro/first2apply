import { createContext, useContext, useEffect, useState } from "react";
import { Link } from "../../../supabase/functions/_shared/types";
import { useError } from "./error";
import { createLink, deleteLink, listLinks } from "@/lib/electronMainSdk";

// Define the shape of the context data
type LinksContextType = {
  isLoading: boolean;
  links: Link[];
  createLink: (newLink: Pick<Link, "title" | "url">) => Promise<Link>;
  removeLink: (linkId: number) => Promise<void>;
};

// Create the context with an initial default value
export const LinksContext = createContext<LinksContextType>({
  isLoading: true,
  links: [],
  createLink: async () => {
    throw new Error("createLink not implemented");
  },
  removeLink: async () => {
    throw new Error("removeLink not implemented");
  },
});

// Hook for consuming context
export const useLinks = () => {
  const context = useContext(LinksContext);
  if (context === undefined) {
    throw new Error("useLinks must be used within a LinksProvider");
  }
  return context;
};

// Provider component
export const LinksProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const { handleError } = useError();

  const [isLoading, setIsLoading] = useState(true);
  const [links, setLinks] = useState<Link[]>([]);

  // Fetch links on component mount
  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const fetchedLinks = await listLinks();
        setLinks(fetchedLinks);
        setIsLoading(false);
      } catch (error) {
        handleError(error);
      }
    };

    fetchLinks();
  }, []);

  // Create a new link
  const onCreateLink = async (newLink: Pick<Link, "title" | "url">) => {
    const createdLink = await createLink(newLink);
    setLinks((currentLinks) => [createdLink, ...currentLinks]);
    return createdLink;
  };

  // Remove an existing link
  const onRemoveLink = async (linkId: number) => {
    await deleteLink(linkId);
    setLinks((currentLinks) =>
      currentLinks.filter((link) => link.id !== linkId)
    );
  };

  return (
    <LinksContext.Provider
      value={{
        isLoading,
        links,
        createLink: onCreateLink,
        removeLink: onRemoveLink,
      }}
    >
      {children}
    </LinksContext.Provider>
  );
};