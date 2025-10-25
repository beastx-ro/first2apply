import { DefaultLayout } from '@/components/defaultLayout';
import { F2aHead } from '@/components/head';
import Image, { StaticImageData } from 'next/image';
import ReactTimeAgo from 'react-time-ago';

import alert from '../../public/assets/alert.png';

type ChangelogContent = {
  version: string;
  date: Date;
  image?: StaticImageData;
  changes: { title: string; content: string[] }[];
  texts?: { text: string | JSX.Element }[];
};

const changelogContent: ChangelogContent[] = [
  {
    version: '2.0.0',
    date: new Date('2025-10-25'),
    changes: [
      {
        title: 'New Features',
        content: [
          'Search any job board using AI powered search',
          'Fully in-app browsing experience for applying to jobs',
        ],
      },
    ],
  },
  {
    version: '1.8.0',
    date: new Date('2024-11-17'),
    changes: [
      {
        title: 'New Features',
        content: [
          'Search detected jobs by title or company',
          'Filter jobs by the source site or by search items',
          'Show loading indicator when the app is searching for jobs',
        ],
      },
    ],
  },
  {
    version: '1.7.0',
    date: new Date('2024-09-16'),
    changes: [
      {
        title: 'New Features',
        content: [
          'Send email alerts for new jobs',
          'Send email alerts when a job search starts failing to get results',
        ],
      },
      {
        title: 'Bug fixes',
        content: ['Add debug support for searches to bypass captcha screens.'],
      },
    ],
  },
  {
    version: '1.6.0',
    date: new Date('2024-09-05'),
    changes: [
      {
        title: 'New Features',
        content: [
          'Add detection time to jobs in list',
          'Add support for logging into accounts inside the app scrapper.',
        ],
      },
      {
        title: 'Bug fixes',
        content: ['Add debug support for searches to bypass captcha screens.'],
      },
    ],
  },
  {
    version: '1.5.0',
    date: new Date('2024-06-16'),
    changes: [
      {
        title: 'New Features',
        content: ['Advanced matching using AI'],
      },
    ],
  },
  {
    version: '1.4.0',
    date: new Date('2024-04-19'),
    changes: [
      {
        title: 'New Features',
        content: ['Navigate the job list using keyboard shortcuts', 'Add notes to jobs for easier tracking'],
      },
    ],
  },
  {
    version: '1.3.0',
    date: new Date('2024-03-26'),
    changes: [
      {
        title: 'New Features',
        content: [
          'Add labels to job for easier tracking',
          'Bulk actions for deleting or archiving jobs',
          'Export jobs to CSV file',
        ],
      },
    ],
  },
  {
    version: '1.2.0',
    date: new Date('2024-03-12'),
    changes: [
      {
        title: 'New Features',
        content: ['In-app job description', 'Feedback form'],
      },
      {
        title: 'Improvements',
        content: ['Stability improvements by retrying failed requests'],
      },
    ],
  },
  {
    version: '1.1.0',
    date: new Date('2024-02-18'),
    changes: [
      {
        title: 'New Features',
        content: ['Auto-updater', 'Add more supported sites'],
      },
    ],
  },
  {
    version: '1.0.0',
    date: new Date('2024-02-13'),
    image: alert,
    changes: [
      {
        title: 'New Features',
        content: ['Scan jobs from multiple sources', 'Native desktop notifications for new jobs'],
      },
    ],
  },
];

export default function Changelog() {
  return (
    <>
      <F2aHead
        title="Changelog - First 2 Apply"
        description="Discover the latest updates and improvements to First 2 Apply. Stay informed about new features and enhancements."
        path="/changelog"
      />

      <DefaultLayout>
        <div className="mx-auto min-h-[calc(100vh-56px)] w-full max-w-[936px] px-4 py-[72px] sm:px-12 md:min-h-[calc(100vh-64px)] md:pt-16">
          <h1 className="pb-6 text-center text-6xl font-bold sm:pb-1 sm:text-7xl sm:leading-[72px] sm:tracking-wide">
            Changelog
          </h1>

          {changelogContent.map((release) => (
            <section key={`release-${release.version}`} className="mt-16">
              <div className="px-10">
                <h2 className="mb-4 pt-16 text-[40px] font-medium leading-[48px]">{release.version}</h2>

                <p className="my-4 text-sm leading-7 tracking-wide text-muted-foreground">
                  <ReactTimeAgo date={release.date} locale="en-US" /> &nbsp; • &nbsp;
                  {new Intl.DateTimeFormat('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }).format(release.date)}
                </p>
              </div>
              {release.image && (
                <Image src={release.image} alt={`release ${release.version} image`} className="my-8 w-full" />
              )}
              <div className="px-10">
                {release.changes?.map((change, index) => (
                  <div key={`change-${index}`}>
                    <h4 className="my-4 font-semibold">{change.title}</h4>

                    <ul className="list-inside list-disc pl-3">
                      {change.content.map((item, index) => (
                        <li key={`change-content-${index}`} className="mb-1 mt-2">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                {release.texts?.map((item, index) => (
                  <div key={`text-${index}`} className="my-4">
                    {item.text}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </DefaultLayout>
    </>
  );
}
