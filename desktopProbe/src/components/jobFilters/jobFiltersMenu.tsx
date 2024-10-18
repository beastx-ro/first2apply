import {
  DropdownMenu,
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

import { Checkbox } from '../ui/checkbox';

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

  const { siteLogos, sites } = useSites();
  const sortedSites = sites.sort((a, b) => a.name.localeCompare(b.name));

  const { links } = useLinks();

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

  return (
    <DropdownMenu open={isOpen} onOpenChange={(opened) => setIsOpen(opened)}>
      <DropdownMenuTrigger
        className="h-6 w-6 focus-visible:outline-none focus-visible:ring-0"
        onClick={(evt) => {
          evt.preventDefault();
          evt.stopPropagation();
        }}
      >
        <FilterIcon className={cn('m-auto h-6 w-auto text-muted-foreground', isOpen && 'text-primary')} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {/* sites */}
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Site</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                {sortedSites.map((site) => (
                  <DropdownMenuItem
                    key={site.id}
                    onClick={() => {}}
                    onSelect={(evt) => {
                      evt.preventDefault();
                      onSelectSite(site.id);
                    }}
                  >
                    <div className="flex items-center">
                      <Checkbox className="mr-2 text-muted" checked={selectedSites.includes(site.id)} />
                      <img src={siteLogos[site.id]} alt={site.name} className="mr-2 h-4 w-4 rounded-full" />
                      <p>{site.name}</p>
                    </div>
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(evt) => {
                    evt.preventDefault();
                    clearSites();
                  }}
                >
                  Clear All
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>

        {/* links */}
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>My Searches</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                {links.map((link) => (
                  <DropdownMenuItem
                    key={link.id}
                    onClick={() => {}}
                    onSelect={(evt) => {
                      evt.preventDefault();
                      onSelectLink(link.id);
                    }}
                  >
                    <div className="flex items-center">
                      <Checkbox className="mr-2 text-muted" checked={selectedLinks.includes(link.id)} />
                      <img src={siteLogos[link.site_id]} alt={link.title} className="mr-2 h-4 w-4 rounded-full" />
                      <p>{link.title}</p>
                    </div>
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(evt) => {
                    evt.preventDefault();
                    clearLinks();
                  }}
                >
                  Clear All
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
        >
          Clear All
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
