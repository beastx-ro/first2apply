export enum SiteProvider {
  linkedin = "linkedin",
  glassdoor = "glassdoor",
  indeed = "indeed",
  remoteok = "remoteok",
  weworkremotely = "weworkremotely",
  dice = "dice",
  flexjobs = "flexjobs",
  bestjobs = "bestjobs",
  echojobs = "echojobs",
  remotive = "remotive",
  remoteio = "remoteio",
  builtin = "builtin",
  naukri = "naukri",
  robertHalf = "robertHalf",
}

export const JOB_LABELS = {
  CONSIDERING: "Considering",
  SUBMITTED: "Submitted",
  INTERVIEWING: "Interviewing",
  OFFER: "Offer",
  REJECTED: "Rejected",
  GHOSTED: "Ghosted",
} as const;

export type JobLabel = (typeof JOB_LABELS)[keyof typeof JOB_LABELS];

export type JobSite = {
  id: number;
  provider: SiteProvider;
  name: string;
  urls: string[];
  queryParamsToRemove?: string[];
  blacklisted_paths: string[];
  created_at: Date;
  logo_url: string;
};

export type Link = {
  id: number;
  url: string;
  title: string;
  user_id: string;
  site_id: number;
  created_at: Date;
};

export type JobType = "remote" | "hybrid" | "onsite";
export type JobStatus = "new" | "applied" | "archived" | "deleted";
export type Job = {
  id: number;
  user_id: string;
  externalId: string;
  externalUrl: string;
  siteId: number;

  // main info
  title: string;
  companyName: string;
  companyLogo?: string;

  // metadata
  jobType?: JobType;
  location?: string;
  salary?: string;
  tags?: string[];

  description?: string;

  status: JobStatus;
  labels: JobLabel[];

  created_at: Date;
  updated_at: Date;
};

export type Review = {
  id: number;
  user_id: string;
  title: string;
  description?: string;
  rating: number;
  created_at: Date;
};
export type HtmlDump = {
  id: number;
  user_id: string;
  url: string;
  html: string;
  created_at: Date;
};
export type Note = {
  id: number;
  created_at: Date;
  user_id: string;
  job_id: number;
  text: string;
  files: string[];
};

type SalaryOperators = "greaterThan" | "lessThan";
type StringOperators = "includes" | "notIncludes";

type SalaryFilterRule = {
  field: "salary";
  operator: SalaryOperators;
  value: string;
};

type StringFilterRule = {
  field: "title" | "companyName";
  operator: StringOperators;
  value: string;
};

export type FilterRule = SalaryFilterRule | StringFilterRule;

export type AdvancedFilter = {
  name: string;
  rules: FilterRule[];
};

/**
 * Supabase database schema.
 */
export type DbSchema = {
  public: {
    Tables: {
      sites: {
        Row: JobSite;
        Insert: Pick<JobSite, "name" | "urls">;
        Update: never;
      };
      links: {
        Row: Link;
        Insert: Pick<Link, "url" | "title" | "site_id">;
        Update: never;
      };
      jobs: {
        Row: Job;
        Insert: Pick<
          Job,
          | "siteId"
          | "externalId"
          | "externalUrl"
          | "title"
          | "companyName"
          | "companyLogo"
          | "location"
          | "salary"
          | "tags"
          | "jobType"
          | "status"
        >;
        Update:
          | Pick<Job, "status">
          | Pick<Job, "description">
          | Pick<Job, "labels">;
      };
      reviews: {
        Row: Review;
        Insert: Pick<Review, "title" | "description" | "rating">;
        Update: Pick<Review, "title" | "description" | "rating">;
      };
      html_dumps: {
        Row: HtmlDump;
        Insert: Pick<HtmlDump, "url" | "html">;
        Update: never;
      };
      notes: {
        Row: Note;
        Insert: Pick<Note, "job_id" | "text" | "files">;
        Update: Partial<Pick<Note, "text" | "files">>;
      };
    };
    Views: {};
    Functions: {};
  };
};
