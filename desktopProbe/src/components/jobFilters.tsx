import { debounce } from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';

import { JobFiltersMenu, JobFiltersType } from './jobFilters/jobFiltersMenu';
import { SearchBox } from './jobFilters/searchBox';

/**
 * Component for managing job filters.
 */
export function JobFilters({
  search,
  siteIds,
  linkIds,
  onSearchJobs,
}: {
  search?: string;
  siteIds: number[];
  linkIds: number[];
  onSearchJobs: (_: { search: string; filters: JobFiltersType }) => void;
}) {
  const [inputValue, setInputValue] = useState('');
  const [filters, setFilters] = useState<JobFiltersType>({
    sites: [],
    links: [],
  });

  // Debounce the function to emit the inputValue + filters pair
  const emitChanges = useCallback(
    debounce((value, updatedFilters) => {
      onSearchJobs({ search: value, filters: updatedFilters });
    }, 500),
    [],
  );

  // Handle changes to inputValue or filters
  // how to avoid emitting changes when the component is first mounted?
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    emitChanges(inputValue, filters);
  }, [inputValue, filters, emitChanges]);

  return (
    <div className="flex items-center justify-center gap-2 pr-2">
      <SearchBox inputValue={inputValue} setInputValue={setInputValue} />

      <JobFiltersMenu
        selectedSites={siteIds || []}
        selectedLinks={linkIds || []}
        onApplyFilters={(newFilters) => {
          setFilters(newFilters);
        }}
      />
    </div>
  );
}
