export type MailerLiteSubscriber = {
  id: number;
  email: string;
  fields: Record<string, string | number>;
  groups?: string[];
};

export class MailerLiteApi {
  /**
   * Class constructor.
   */
  constructor(private _apiKey: string) {}

  /**
   * Add a new subscriber.
   */
  async addSubscriber({
    email,
    fields,
    groups,
  }: {
    email: string;
    fields: Record<string, string | number>;
    groups?: string[];
  }): Promise<MailerLiteSubscriber> {
    const response = await fetch(
      "https://connect.mailerlite.com/api/subscribers",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this._apiKey}`,
        },
        body: JSON.stringify({
          email,
          fields,
          groups,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to add subscriber: ${await response.text()}`);
    }

    const resp: { data: MailerLiteSubscriber } = await response.json();

    return resp.data;
  }

  /**
   * Remove subscriber from a group.
   */
  async removeSubscriberFromGroup({
    subscriberId,
    groupId,
  }: {
    subscriberId: number;
    groupId: string;
  }) {
    const response = await fetch(
      `https://connect.mailerlite.com/api/subscribers/${subscriberId}/groups/${groupId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this._apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to remove subscriber from group: ${await response.text()}`
      );
    }
  }
}
