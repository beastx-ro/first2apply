import { useSites } from '@/hooks/sites';
import { Link } from '@first2apply/core';
import { CopyIcon, Pencil1Icon, QuestionMarkCircledIcon, TrashIcon } from '@radix-ui/react-icons';
import { useMemo, useState } from 'react';
import ReactTimeAgo from 'react-time-ago';

import { EditLink } from './editLink';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

const scrapeFailureThreshold = 3;

export function LinksList({
  links,
  onDeleteLink,
  onDebugLink,
  onUpdateLink,
}: {
  links: Link[];
  onDeleteLink: (linkId: number) => void;
  onDebugLink: (linkId: number) => void;
  onUpdateLink: (data: { linkId: number; title: string }) => Promise<void>;
}) {
  const { siteLogos, sites } = useSites();
  const sitesMap = useMemo(() => new Map(sites.map((s) => [s.id, s])), [sites]);

  const [editedLink, setEditedLink] = useState<Link | null>(null);

  const isInFailureState = (link: Link) => link.scrape_failure_count >= scrapeFailureThreshold;

  return (
    <>
      <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:gap-6">
        {links.map((link) => {
          return (
            <li
              key={link.id}
              className={`flex cursor-pointer flex-col gap-4 rounded-lg border bg-card px-6 pb-6 pt-8 shadow-sm ${isInFailureState(link) ? 'border-destructive' : 'border-border'}`}
              onClick={() => {
                onDebugLink(link.id);
              }}
            >
              <div className="flex items-center gap-2">
                <Avatar
                  className="h-12 w-12 cursor-pointer"
                  onClick={() => {
                    onDebugLink(link.id);
                  }}
                >
                  <AvatarImage src={siteLogos[link.site_id]} />
                  <AvatarFallback className="text-xl tracking-wider">LI</AvatarFallback>
                </Avatar>

                <div>
                  <p className="p-0 text-sm text-muted-foreground">{sitesMap.get(link.site_id)?.name}</p>
                  <p className="text-balance text-lg leading-6">{link.title}</p>
                </div>
              </div>

              {/* <p className="mb-4 mt-6 grow whitespace-pre-wrap text-pretty break-all text-xs text-muted-foreground">
              {link.url}
            </p> */}

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-light text-foreground/40">
                    {'Last checked '}
                    <ReactTimeAgo date={link.last_scraped_at} locale="en-US" />
                  </p>
                  <p className="text-xs font-light text-foreground/40">
                    {'Added '}
                    <ReactTimeAgo date={link.created_at} locale="en-US" />
                  </p>
                </div>

                {/* actions */}
                <div>
                  {isInFailureState(link) && (
                    <Button
                      variant="secondary"
                      size="default"
                      className="rounded-full px-2 py-1 text-sm"
                      onClick={(evt) => {
                        evt.stopPropagation();
                        onDebugLink(link.id);
                      }}
                    >
                      <QuestionMarkCircledIcon className="h-5 w-5 text-primary" />
                    </Button>
                  )}

                  {/* Copy URL */}
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger>
                        <Button
                          variant="secondary"
                          size="default"
                          className="ml-2 rounded-full bg-secondary/50 px-[9px] py-2 text-sm transition-colors duration-200 ease-in-out hover:bg-secondary focus:bg-secondary"
                          onClick={(evt) => {
                            evt.stopPropagation();
                            navigator.clipboard.writeText(link.url);
                          }}
                        >
                          <CopyIcon className="h-[18px] w-[18px]" />
                        </Button>
                      </TooltipTrigger>

                      <TooltipContent side="left">Copy URL</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* edit search */}
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger>
                        <Button
                          variant="secondary"
                          size="default"
                          className="ml-2 rounded-full bg-secondary/50 px-[9px] py-2 text-sm transition-colors duration-200 ease-in-out hover:bg-secondary focus:bg-secondary"
                          onClick={(evt) => {
                            evt.stopPropagation();
                            setEditedLink(link);
                          }}
                        >
                          <Pencil1Icon className="h-[18px] w-[18px]" />
                        </Button>
                      </TooltipTrigger>

                      <TooltipContent side="left">Edit</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Button
                    variant="destructive"
                    size="default"
                    className="ml-2 rounded-full bg-destructive/10 px-2 py-1 text-sm transition-colors duration-200 ease-in-out hover:bg-destructive/20 focus:bg-destructive/20"
                    onClick={(evt) => {
                      evt.stopPropagation();
                      onDeleteLink(link.id);
                    }}
                  >
                    <TrashIcon className="h-5 w-5 text-destructive" />
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <EditLink
        isOpen={!!editedLink}
        link={editedLink}
        onUpdateLink={async (data) => {
          if (!editedLink) {
            return;
          }

          await onUpdateLink({ linkId: editedLink.id, title: data.title });
          setEditedLink(null);
        }}
        onCancel={() => {
          setEditedLink(null);
        }}
      />
    </>
  );
}
