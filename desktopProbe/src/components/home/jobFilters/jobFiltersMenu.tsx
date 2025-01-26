import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLinks } from '@/hooks/links';
import { useSites } from '@/hooks/sites';
import { LABEL_COLOR_CLASSES } from '@/lib/labels';
import { FilterIcon } from 'lucide-react';
import { useState } from 'react';

import { JOB_LABELS } from '../../../../../supabase/functions/_shared/types';

export type JobFiltersType = {
  sites: number[];
  links: number[];
  labels: string[];
};

const ALL_LABELS = Object.values(JOB_LABELS);

/**
 * Job filters menu component.
 */
export function JobFiltersMenu({
  selectedSites,
  selectedLinks,
  selectedLabels,
  onApplyFilters,
}: {
  selectedSites: number[];
  selectedLinks: number[];
  selectedLabels: string[];
  onApplyFilters: (filters: JobFiltersType) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const { siteLogos, sites } = useSites();
  const { links } = useLinks();

  // Sort sites alphabetically and filter out sites that don't have any links
  const sortedSites = sites
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter((site) => links.some((link) => link.site_id === site.id));

  const onSelectSite = (siteId: number) => {
    if (selectedSites.includes(siteId)) {
      onApplyFilters({
        sites: selectedSites.filter((id) => id !== siteId),
        links: selectedLinks,
        labels: selectedLabels,
      });
    } else {
      onApplyFilters({ sites: [...selectedSites, siteId], links: selectedLinks, labels: selectedLabels });
    }
  };

  const onSelectLink = (linkId: number) => {
    if (selectedLinks.includes(linkId)) {
      onApplyFilters({
        sites: selectedSites,
        links: selectedLinks.filter((id) => id !== linkId),
        labels: selectedLabels,
      });
    } else {
      onApplyFilters({ sites: selectedSites, links: [...selectedLinks, linkId], labels: selectedLabels });
    }
  };

  const onSelectLabel = (label: string) => {
    if (selectedLabels.includes(label)) {
      onApplyFilters({
        sites: selectedSites,
        links: selectedLinks,
        labels: selectedLabels.filter((l) => l !== label),
      });
    } else {
      onApplyFilters({ sites: selectedSites, links: selectedLinks, labels: [...selectedLabels, label] });
    }
  };

  const clearSites = () => {
    onApplyFilters({ sites: [], links: selectedLinks, labels: selectedLabels });
  };
  const clearLinks = () => {
    onApplyFilters({ sites: selectedSites, links: [], labels: selectedLabels });
  };
  const clearLabels = () => {
    onApplyFilters({ sites: selectedSites, links: selectedLinks, labels: [] });
  };
  const clearAll = () => {
    onApplyFilters({ sites: [], links: [], labels: [] });
  };

  const activeFilterCount = selectedSites.length + selectedLinks.length + selectedLabels.length;

  return (
    <DropdownMenu open={isOpen} onOpenChange={(opened) => setIsOpen(opened)}>
      <DropdownMenuTrigger
        className={`relative flex h-12 w-12 items-center justify-center rounded-md bg-transparent transition-colors duration-200 ease-in-out hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-0 ${isOpen && 'bg-foreground/10'}`}
        onClick={(evt) => {
          evt.preventDefault();
          evt.stopPropagation();
        }}
      >
        <FilterIcon className="h-auto w-6 text-foreground/90" />
        {activeFilterCount > 0 && (
          <div className="absolute bottom-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-foreground p-0 text-[10px] text-background dark:font-bold">
            {activeFilterCount}
          </div>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" side="right" sideOffset={8} align="start">
        {/* Job Boards */}
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Job Boards</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent sideOffset={8} alignOffset={-5}>
                {sortedSites.map((site) => (
                  <DropdownMenuCheckboxItem
                    key={site.id}
                    checked={selectedSites.includes(site.id)}
                    onSelect={(evt) => {
                      evt.preventDefault();
                      onSelectSite(site.id);
                    }}
                    className="pr-8"
                  >
                    <img src={siteLogos[site.id]} alt={site.name} className="mr-2 h-4 w-4 rounded-full" />
                    <p>{site.name}</p>
                  </DropdownMenuCheckboxItem>
                ))}

                <DropdownMenuSeparator />
                {/* Reset filter button */}
                <DropdownMenuItem
                  onSelect={(evt) => {
                    evt.preventDefault();
                    clearSites();
                  }}
                  disabled={selectedSites.length === 0}
                  className="px-8 text-destructive"
                >
                  Reset Board Selection
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        {/* Links */}
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Searches</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent sideOffset={8} alignOffset={-37}>
                {links.map((link) => (
                  <DropdownMenuCheckboxItem
                    key={link.id}
                    checked={selectedLinks.includes(link.id)}
                    onSelect={(evt) => {
                      evt.preventDefault();
                      onSelectLink(link.id);
                    }}
                    className="pr-8"
                  >
                    <img src={siteLogos[link.site_id]} alt={link.title} className="mr-2 h-4 w-4 rounded-full" />
                    <p>{link.title}</p>
                  </DropdownMenuCheckboxItem>
                ))}

                <DropdownMenuSeparator />
                {/* Reset filter button */}
                <DropdownMenuItem
                  onSelect={(evt) => {
                    evt.preventDefault();
                    clearLinks();
                  }}
                  disabled={selectedLinks.length === 0}
                  className="px-8 text-destructive"
                >
                  Reset Search Selection
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        {/* Labels */}
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Labels</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent sideOffset={8} alignOffset={-37}>
                {ALL_LABELS.map((label) => {
                  const colorClass = LABEL_COLOR_CLASSES[label];

                  return (
                    <DropdownMenuCheckboxItem
                      key={label}
                      checked={selectedLabels.includes(label)}
                      onSelect={(evt) => {
                        evt.preventDefault();
                        onSelectLabel(label);
                      }}
                      className="pr-8"
                    >
                      <div className={`h-4 w-4 rounded-full ${colorClass}`}></div>
                      <p className="ml-2">{label}</p>
                    </DropdownMenuCheckboxItem>
                  );
                })}

                <DropdownMenuSeparator />
                {/* Reset filter button */}
                <DropdownMenuItem
                  onSelect={(evt) => {
                    evt.preventDefault();
                    clearLabels();
                  }}
                  disabled={selectedLabels.length === 0}
                  className="px-8 text-destructive"
                >
                  Reset Labels
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Reset all filters button */}
        <DropdownMenuItem
          onSelect={() => {
            clearAll();
          }}
          disabled={selectedSites.length === 0 && selectedLinks.length === 0 && selectedLabels.length === 0}
          className="text-destructive"
        >
          Remove Filters
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
