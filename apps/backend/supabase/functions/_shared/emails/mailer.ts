import { getExceptionMessage } from '@first2apply/core';
import { EmailParams, MailerSend, Recipient, Sender } from 'npm:mailersend';

import { EmailTemplate } from '../emails/emailTemplates.ts';
import { ILogger } from '../logger.ts';

/**
 * Interface for mailer services.
 */
export interface IMailer {
  /**
   * Send an email.
   */
  sendEmail(_: { logger: ILogger; from?: string; to: string; template: EmailTemplate }): Promise<void>;
}

/**
 * Mailersend-based implementation of the IMailer interface.
 */
export class MailersendMailer implements IMailer {
  private _client: MailerSend;

  /**
   * Class constructor.
   */
  constructor(
    private _apiKey: string,
    private _defaultFromAddress: string,
    private _defaultFromName: string,
  ) {
    this._client = new MailerSend({
      apiKey: this._apiKey,
    });
  }

  /**
   * Send an email using a Mailersend template.
   */
  async sendEmail({
    logger,
    from,
    to,
    template,
  }: {
    logger: ILogger;
    from?: string;
    to: string;
    template: EmailTemplate;
  }): Promise<void> {
    try {
      logger.info(`Sending ${template.type} email to ${to} ...`);
      const sentFrom = new Sender(from ?? this._defaultFromAddress, this._defaultFromName);
      const recipients = [new Recipient(to, 'Recipient')];

      const personalization = [
        {
          email: to,
          data: template.payload,
        },
      ];

      // Create email parameters, using the template ID (templateAlias) and the payload for variables
      const emailParams = new EmailParams()
        .setFrom(sentFrom)
        .setTo(recipients)
        .setReplyTo(sentFrom)
        .setTemplateId(template.templateId) // Use the template ID (templateAlias)
        .setPersonalization(personalization);

      // Send the email via MailerSend
      await this._client.email.send(emailParams);

      logger.info(`Email sent successfully to ${to}`);
    } catch (error) {
      throw new Error(`Error sending email: ${getExceptionMessage(error)}`);
    }
  }
}
