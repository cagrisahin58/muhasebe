import type { EInvoiceResponse, UblInvoiceData, UblEnvelopeData } from "../ubl-tr/types.js";

/**
 * E-Fatura Entegratör Arayüzü
 *
 * Tüm entegratörler (Foriba, İzibiz, QNB, vb.) bu arayüzü implemente eder.
 * Adapter pattern ile entegratör değişikliği kolay yapılır.
 */
export interface EInvoiceIntegrator {
  readonly name: string;

  /** E-Fatura mükellef mi sorgula */
  checkTaxpayer(vkn: string): Promise<{
    isEInvoice: boolean;
    isEArchive: boolean;
    alias?: string;
    title?: string;
  }>;

  /** E-Fatura gönder */
  sendInvoice(xml: string, envelope: UblEnvelopeData): Promise<EInvoiceResponse>;

  /** E-Arşiv fatura gönder */
  sendArchiveInvoice(xml: string): Promise<EInvoiceResponse>;

  /** Fatura durumu sorgula */
  getInvoiceStatus(uuid: string): Promise<EInvoiceResponse>;

  /** Gelen faturaları listele */
  getIncomingInvoices(params: {
    startDate: string;
    endDate: string;
    limit?: number;
  }): Promise<{
    invoices: IncomingInvoiceSummary[];
    total: number;
  }>;

  /** Gelen fatura XML'ini al */
  getInvoiceXml(uuid: string): Promise<string>;

  /** Gelen faturayı kabul et */
  acceptInvoice(uuid: string): Promise<EInvoiceResponse>;

  /** Gelen faturayı reddet */
  rejectInvoice(uuid: string, reason: string): Promise<EInvoiceResponse>;
}

export interface IncomingInvoiceSummary {
  uuid: string;
  invoiceNumber: string;
  issueDate: string;
  senderVkn: string;
  senderName: string;
  amount: number;
  currency: string;
  status: string;
}

/** Entegratör konfigürasyonu */
export interface IntegratorConfig {
  apiUrl: string;
  username: string;
  password: string;
  timeout?: number;
}
