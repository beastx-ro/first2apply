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
import { cn } from '@/lib/utils';
import { FilterIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

export type JobFiltersType = {
  sites: number[];
  links: number[];
};

export function JobFiltersMenu({
  selectedSites,
  selectedLinks,
  onApplyFilters,
}: {
  selectedSites: number[];
  selectedLinks: number[];
  onApplyFilters: (filters: JobFiltersType) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  const { siteLogos, sites } = useSites();
  const { links } = useLinks();

  const sortedSites = sites
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter((site) => links.some((link) => link.site_id === site.id));

  const onSelectSite = (siteId: number) => {
    if (selectedSites.includes(siteId)) {
      onApplyFilters({ sites: selectedSites.filter((id) => id !== siteId), links: selectedLinks });
    } else {
      onApplyFilters({ sites: [...selectedSites, siteId], links: selectedLinks });
    }
  };

  const onSelectLink = (linkId: number) => {
    if (selectedLinks.includes(linkId)) {
      onApplyFilters({ sites: selectedSites, links: selectedLinks.filter((id) => id !== linkId) });
    } else {
      onApplyFilters({ sites: selectedSites, links: [...selectedLinks, linkId] });
    }
  };

  const clearSites = () => {
    onApplyFilters({ sites: [], links: selectedLinks });
  };
  const clearLinks = () => {
    onApplyFilters({ sites: selectedSites, links: [] });
  };
  const clearAll = () => {
    onApplyFilters({ sites: [], links: [] });
  };

  useEffect(() => {
    const appliedFiltersCount = [selectedSites.length, selectedLinks.length].filter((count) => count > 0).length;
    setActiveFilterCount(appliedFiltersCount);
  }, [selectedSites, selectedLinks]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={(opened) => setIsOpen(opened)}>
      <DropdownMenuTrigger
        className="relative flex h-12 w-12 items-center justify-center rounded-md bg-transparent transition-colors duration-200 ease-in-out hover:bg-foreground/10 focus-visible:outline-none focus-visible:ring-0"
        onClick={(evt) => {
          evt.preventDefault();
          evt.stopPropagation();
        }}
      >
        <FilterIcon className={cn('h-auto w-6 text-foreground/90', isOpen && 'text-primary')} />
        {activeFilterCount > 0 && (
          <div
            className={cn(
              'absolute bottom-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-foreground p-0 text-[10px] text-background dark:font-bold',
              isOpen && 'bg-primary',
            )}
          >
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

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            clearAll();
          }}
          disabled={selectedSites.length === 0 && selectedLinks.length === 0}
          className="text-destructive"
        >
          Remove Filters
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
