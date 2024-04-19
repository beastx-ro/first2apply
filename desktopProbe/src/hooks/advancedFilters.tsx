import {
  getUserAdvancedFilters,
  upsertAdvancedFilters,
} from "@/lib/electronMainSdk";
import { createContext, useContext, useEffect, useState } from "react";
import { AdvancedFilter } from "../../../supabase/functions/_shared/types";
import { FormRule } from "../components/advancedFilters/advancedFilters";
import { useError } from "./error";
import { useSession } from "./session";

export type Filter = {
  filterName: string;
  rules: FormRule[];
};

// Define the shape of the context data
type AdvancedFiltersContextType = {
  isLoading: boolean;
  filters: Filter[];
  updateFilters: (filters: Filter[]) => Promise<void>;
};

// Create the context with an initial default value
export const AdvancedFiltersContext = createContext<AdvancedFiltersContextType>(
  {
    isLoading: true,
    filters: [],
    updateFilters: async () => {},
  }
);

// Hook for consuming context
export const useAdvancedFilters = () => {
  const context = useContext(AdvancedFiltersContext);
  if (context === undefined) {
    throw new Error(
      "useAdvancedFilters must be used within a AdvancedFiltersProvider"
    );
  }
  return context;
};

// Provider component
export const AdvancedFiltersProvider = ({
  children,
}: React.PropsWithChildren<{}>) => {
  const { handleError } = useError();
  const { isLoggedIn } = useSession();

  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<Filter[]>([]);

  useEffect(() => {
    const fetchUserFilters = async () => {
      try {
        if (!isLoggedIn) return;
        const fetchedFilters = await getUserAdvancedFilters();
        setFilters(fetchedFilters);
        setIsLoading(false);
      } catch (error) {
        handleError({ error });
      }
    };

    fetchUserFilters();
  }, [isLoggedIn]);

  const onFiltersUpdate = async (filters: AdvancedFilter[]) => {
    console.log("upserting with this", filters);
    try {
      setIsLoading(true);
      const updatedFilters = await upsertAdvancedFilters(filters);
      console.log("updatedFilters", updatedFilters);
      setFilters(updatedFilters);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdvancedFiltersContext.Provider
      value={{
        isLoading,
        filters,
        updateFilters: onFiltersUpdate,
      }}
    >
      {children}
    </AdvancedFiltersContext.Provider>
  );
};
