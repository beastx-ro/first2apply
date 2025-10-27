/**
 * Base email template type
 */
export type EmailTemplateBase = {
  type: EmailTemplateType;
  templateId: string; // This will store the template ID
};

export enum EmailTemplateType {
  searchParsingFailure = 'searchParsingFailure',
  newJobAlert = 'newJobAlert',
}

export type SearchParsingFailureEmailTemplate = EmailTemplateBase & {
  type: EmailTemplateType.searchParsingFailure;
  templateId: '3z0vklorkzpl7qrx';
  payload: {
    links: Array<{ title: string; site_name: string }>;
  };
};
export type NewJobAlertEmailTemplate = EmailTemplateBase & {
  type: EmailTemplateType.newJobAlert;
  templateId: 'pr9084z32r8lw63d';
  payload: {
    new_jobs_count: number;
    new_jobs: Array<{
      title: string;
      url: string;
      description?: string;
      company: string;
      location?: string;
    }>;
  };
};

export type EmailTemplate = SearchParsingFailureEmailTemplate | NewJobAlertEmailTemplate;
