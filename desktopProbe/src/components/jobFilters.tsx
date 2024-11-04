import { debounce } from 'lodash';
import { useCallback, useEffect, useState } from 'react';

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

  // Debounced search for input value
  const emitDebouncedSearch = useCallback(
    debounce((value: string, currentFilters: JobFiltersType) => {
      onSearchJobs({ search: value, filters: currentFilters });
    }, 250),
    [filters],
  );

  // Initial call to load jobs
  useEffect(() => {
    onSearchJobs({ search: inputValue, filters: filters });
  }, []); // Empty dependency array to run only once on mount

  // Emit search on inputValue change, debounced
  useEffect(() => {
    emitDebouncedSearch(inputValue, filters);
  }, [inputValue, filters, emitDebouncedSearch]);

  // Emit filter changes immediately without debounce
  useEffect(() => {
    onSearchJobs({ search: inputValue, filters: filters });
  }, [filters]);

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
