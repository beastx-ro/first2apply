import axios, { ResponseType } from 'axios';
import urljoin from 'url-join';

import { KeezInvoice, KeezItem } from './keezTypes';

export type KeezApiConfig = {
  apiUrl: string;
  apiKey: string;
  apiSecret: string;
  clientId: string;
};

type KeezAccessToken = {
  token_type: string;
  access_token: string;
  expires_in: number; // in seconds
};

/**
 * Wrapper over the Keez REST API.
 */
export class KeezApi {
  private _accessToken?: KeezAccessToken;

  /**
   * Class constructor.
   */
  constructor(private _config: KeezApiConfig) {}

  /**
   * List all items from Keez.
   */
  async listItems(): Promise<KeezItem[]> {
    const items = await this._apiCall<KeezItem[]>({
      method: 'get',
      path: `/api/v1.0/public-api/${this._config.clientId}/items`,
    });

    return items;
  }

  /**
   * Create a new item in Keez.
   */
  async createItem(
    item: Pick<KeezItem, 'name' | 'categoryExternalId' | 'currencyCode' | 'isActive' | 'measureUnitId'>,
  ): Promise<KeezItem> {
    const { externalId: newItemId } = await this._apiCall<{
      externalId: string;
    }>({
      method: 'post',
      path: `/api/v1.0/public-api/${this._config.clientId}/items`,
      body: {
        name: item.name,
        categoryExternalId: item.categoryExternalId,
        currencyCode: item.currencyCode,
        isActive: item.isActive,
        measureUnitId: item.measureUnitId,
      },
    });

    return this.getItemByExternalId(newItemId);
  }

  /**
   * Update an item in Keez.
   */
  async updateItem(
    externalId: string,
    item: Pick<KeezItem, 'name' | 'categoryExternalId' | 'currencyCode' | 'isActive' | 'measureUnitId'>,
  ): Promise<void> {
    await this._apiCall<void>({
      method: 'patch',
      path: `/api/v1.0/public-api/${this._config.clientId}/items/${externalId}`,
      body: {
        name: item.name,
        categoryExternalId: item.categoryExternalId,
        currencyCode: item.currencyCode,
        isActive: item.isActive,
        measureUnitId: item.measureUnitId,
      },
    });
  }

  /**
   * Get an item by its external id.
   */
  async getItemByExternalId(externalId: string): Promise<KeezItem> {
    const item = await this._apiCall<KeezItem>({
      method: 'get',
      path: `/api/v1.0/public-api/${this._config.clientId}/items/${externalId}`,
    });

    return item;
  }

  /**
   * Create a new invoice in Keez.
   */
  async createInvoice(invoice: KeezInvoice): Promise<KeezInvoice> {
    const { externalId: newInvoiceId } = await this._apiCall<{
      externalId: string;
    }>({
      method: 'post',
      path: `/api/v1.0/public-api/${this._config.clientId}/invoices`,
      body: invoice,
    });

    return this.getInvoiceByExternalId(newInvoiceId);
  }

  /**
   * Get an invoice by its external id.
   */
  async getInvoiceByExternalId(externalId: string): Promise<KeezInvoice> {
    const invoice = await this._apiCall<KeezInvoice>({
      method: 'get',
      path: `/api/v1.0/public-api/${this._config.clientId}/invoices/${externalId}`,
    });

    return {
      ...invoice,
      externalId,
    };
  }

  /**
   * Get invoice by series and number.
   */
  async getInvoiceBySeriesAndNumber(series: string, number: number): Promise<KeezInvoice | null> {
    const { data: invoices } = await this._apiCall<{
      data: KeezInvoice[];
    }>({
      method: 'get',
      path: `/api/v1.0/public-api/${this._config.clientId}/invoices`,
      params: {
        filter: encodeURIComponent(`series[eq]:${series} AND number[eq]:${number}`),
      },
    });

    if (invoices.length === 0) {
      return null;
    }

    return invoices[0];
  }

  /**
   * Try to find a reverse invoice for the given invoice.
   */
  async getReverseInvoice({
    series,
    client,
    documentDate,
    originalInvoiceSeries,
    originalInvoiceNumber,
  }: {
    series: string;
    client: string;
    documentDate: string;
    originalInvoiceSeries: string;
    originalInvoiceNumber: string;
  }): Promise<KeezInvoice | null> {
    const { data: invoices } = await this._apiCall<{
      data: KeezInvoice[];
    }>({
      method: 'get',
      path: `/api/v1.0/public-api/${this._config.clientId}/invoices`,
      params: {
        filter: encodeURIComponent(
          `series[eq]:${series} AND partnerName[like]:${client} AND documentDate[eq]:${documentDate} AND comments[like]:${originalInvoiceSeries}${originalInvoiceNumber}`,
        ),
      },
    });

    if (invoices.length === 0) {
      return null;
    }

    return invoices[0];
  }

  /**
   * Validate the invoice.
   */
  async validateInvoice(externalId: string): Promise<void> {
    await this._apiCall<void>({
      method: 'post',
      path: `/api/v1.0/public-api/${this._config.clientId}/invoices/valid`,
      body: {
        externalId,
      },
    });

    return;
  }

  /**
   * Delete an invoice by its external id.
   */
  async deleteInvoice(externalId: string): Promise<void> {
    await this._apiCall<void>({
      method: 'delete',
      path: `/api/v1.0/public-api/${this._config.clientId}/invoices`,
      body: {
        externalId,
      },
    });
  }

  /**
   * Download the invoice PDF.
   */
  async downloadInvoicePdf(invoiceId: string): Promise<Buffer> {
    const pdfBuffer = await this._apiCall<Buffer>({
      method: 'get',
      path: `/api/v1.0/public-api/${this._config.clientId}/invoices/${invoiceId}/pdf`,
      responseType: 'arraybuffer',
    });

    return pdfBuffer;
  }

  /**
   * Get the access token either from the cache or by requesting a new one.
   */
  private async _getAccessToken(): Promise<KeezAccessToken> {
    if (this._accessToken) {
      return this._accessToken;
    }

    const response = await axios.request<KeezAccessToken>({
      method: 'post',
      url: urljoin(this._config.apiUrl, '/idp/connect/token'),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: new URLSearchParams({
        // client_eid: this._config.clientId,
        // application_id: this._config.apiKey,
        // secret: this._config.apiSecret,

        grant_type: 'client_credentials',
        scope: 'public-api',
        client_id: `app${this._config.apiKey}`,
        client_secret: this._config.apiSecret,
      }).toString(),
    });

    this._accessToken = response.data;
    return this._accessToken;
  }

  /**
   * Generic http api call.
   */
  private async _apiCall<T>({
    method = 'get',
    path,
    headers,
    body,
    params,
    responseType,
  }: {
    method?: 'get' | 'post' | 'put' | 'delete' | 'patch';
    path: string;
    headers?: Record<string, string>;
    body?: any;
    params?: Record<string, string>;
    responseType?: ResponseType;
  }): Promise<T> {
    try {
      const accessToken = await this._getAccessToken();
      const url = urljoin(this._config.apiUrl, path);
      const res = await axios.request({
        method,
        url,
        headers: {
          ...headers,
          Authorization: `${accessToken.token_type} ${accessToken.access_token}`,
        },
        data: body,
        params,
        responseType,
      });

      return res.data;
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Error calling Keez API ${method.toUpperCase()} ${path}: ${JSON.stringify(error.response?.data)}
          
${JSON.stringify(error.config?.data ?? {}, null, 2)}`,
        );
      }

      throw error;
    }
  }
}
