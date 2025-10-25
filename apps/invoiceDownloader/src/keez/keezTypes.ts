export type KeezItem = {
  externalId?: string; // Optional: Keez identifier for the item
  name: string; // Required: Name of the product/service (max 500 characters)
  categoryExternalId: string; // Required: Keez identifier for the category
  currencyCode: string; // Required: Currency code (3 characters, ISO 4217)
  isActive: boolean; // Required: Status of the item (true for active, false for inactive)
  measureUnitId?: number; // Optional: Unit of measure (refer to Measure Unit nomenclature)
  lastPrice?: number; // Optional: Last price of the item from the most recent invoice
  hasExcise?: boolean; // Optional: Indicates if the item is excisable
  exciseValue?: number; // Optional: Value of the excise (numeric with up to 6 decimal places)
};

export type KeezInvoice = {
  externalId?: string; // Optional: Keez identifier for the invoice
  series: string; // Required: Invoice series
  number?: number; // Optional: Invoice number, auto-generated if not provided
  documentDate: string; // Required: Invoice date in 'yyyyMMdd' format
  comments?: string; // Optional: Comments for the invoice
  dueDate: string; // Required: Due date in 'yyyyMMdd' format
  vatOnCollection: boolean; // Required: VAT on collection (true/false)
  storno?: {
    series: string;
    number: number;
    date: string;
  }; // Optional: Reference to the invoice being canceled
  currencyCode: string; // Required: Currency code (ISO 4217)
  referenceCurrencyCode?: string; // Optional: Reference currency code (ISO 4217)
  exchangeRate?: number; // Optional: Exchange rate in RON if currency is not RON
  paymentTypeId: number; // Required: Payment type ID
  partner: KeezParter; // Required: Client identification data
  invoiceDetails: KeezInvoiceDetail[]; // Required: Invoice details

  discountType?: "Percent" | "Value"; // Optional: Type of global discount
  discountPercent?: number; // Optional: Discount percentage (if discountType is Percent)
  discountValueOnNet?: boolean; // Optional: Applies discount to net value (true/false)

  originalNetAmount: number; // Required: Original net amount in RON
  originalVatAmount: number; // Required: Original VAT amount in RON
  discountNetValue?: number; // Optional: Net discount value in RON (if discountType is provided)
  discountGrossValue?: number; // Optional: Gross discount value in RON (if discountType is provided)
  discountVatValue?: number; // Optional: VAT discount value in RON (if discountType is provided)

  netAmount: number; // Required: Total net amount in RON (Net - Discount)
  vatAmount: number; // Required: Total VAT amount in RON (VAT - VAT discount)
  grossAmount: number; // Required: Total gross amount in RON (Net + VAT)
  exciseAmount?: number; // Optional: Total excise amount in RON

  originalNetAmountCurrency?: number; // Optional: Original net amount in invoice currency
  originalVatAmountCurrency?: number; // Optional: Original VAT amount in invoice currency
  discountNetValueCurrency?: number; // Optional: Net discount value in invoice currency
  discountGrossValueCurrency?: number; // Optional: Gross discount value in invoice currency
  discountVatValueCurrency?: number; // Optional: VAT discount value in invoice currency

  netAmountCurrency?: number; // Optional: Total net amount in invoice currency (Net - Discount)
  vatAmountCurrency?: number; // Optional: Total VAT amount in invoice currency (VAT - VAT discount)
  grossAmountCurrency?: number; // Optional: Total gross amount in invoice currency (Net + VAT)
  exciseAmountCurrency?: number; // Optional: Total excise amount in invoice currency
};

export type KeezInvoiceDetail = {
  itemExternalId: string; // Required: Keez identifier for the item
  itemName?: string; // Optional: Name of the item
  itemDescription?: string; // Optional: Description of the item
  measureUnitId: number; // Required: Unit of measure ID
  quantity: number; // Required: Quantity of the item (2 decimal places)
  unitPrice: number; // Required: Item price in RON (4 decimal places)
  unitPriceCurrency: number; // Required: Item price in invoice currency (4 decimal places)
  vatPercent?: number; // Optional: VAT percentage (2 decimal places)

  discountType?: "Percent" | "Value"; // Optional: Type of discount
  discountPercent?: number; // Optional: Discount percentage if discountType is Percent
  discountValueOnNet?: boolean; // Optional: Indicates if discount applies to net or gross value

  originalNetAmount: number; // Required: Original net amount in RON (2 decimal places)
  originalVatAmount: number; // Required: Original VAT amount in RON (2 decimal places)
  discountNetValue?: number; // Optional: Net discount amount in RON (2 decimal places)
  discountGrossValue?: number; // Optional: Gross discount amount in RON (2 decimal places)
  discountVatValue?: number; // Optional: VAT discount amount in RON (2 decimal places)

  netAmount: number; // Required: Total net amount in RON after discount (2 decimal places)
  vatAmount: number; // Required: Total VAT amount in RON after discount (2 decimal places)
  grossAmount: number; // Required: Total gross amount in RON (2 decimal places)
  exciseAmount?: number; // Optional: Total excise amount in RON (2 decimal places)

  originalNetAmountCurrency?: number; // Optional: Original net amount in invoice currency (2 decimal places)
  originalVatAmountCurrency?: number; // Optional: Original VAT amount in invoice currency (2 decimal places)
  discountNetValueCurrency?: number; // Optional: Net discount value in invoice currency (2 decimal places)
  discountGrossValueCurrency?: number; // Optional: Gross discount value in invoice currency (2 decimal places)
  discountVatValueCurrency?: number; // Optional: VAT discount value in invoice currency (2 decimal places)

  netAmountCurrency?: number; // Optional: Total net amount in invoice currency (2 decimal places)
  vatAmountCurrency?: number; // Optional: Total VAT amount in invoice currency (2 decimal places)
  grossAmountCurrency?: number; // Optional: Total gross amount in invoice currency (2 decimal places)
  exciseAmountCurrency?: number; // Optional: Total excise amount in invoice currency (2 decimal places)
};

export type KeezParter = {
  externalId?: string; // Optional: Keez identifier for the partner, required only if known
  isLegalPerson: boolean; // Required: Defines if the partner is a legal entity
  partnerName: string; // Required: Name of the partner
  identificationNumber?: string; // Optional: Partner's CNP (ID number for individuals)
  countryCode: string; // Required: Country code (ISO 3166-1 Alpha-2)
  countryName: string; // Required: Country name
  countyCode?: string; // Optional: County code (required if countyName is missing and country is Romania)
  countyName?: string; // Optional: County name (required if countyCode is missing and country is Romania)
  cityName: string; // Required: Name of the city
  addressDetails: string; // Required: Address details
};
