export interface IAnalyticsClient {
  /**
   * Track an event.
   */
  trackEvent(event: string, properties?: Record<string, any>): void;
}
