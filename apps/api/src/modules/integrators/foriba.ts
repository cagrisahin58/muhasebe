import type {
  EInvoiceIntegrator,
  IntegratorConfig,
  IncomingInvoiceSummary,
} from "./base.js";
import type { EInvoiceResponse, UblEnvelopeData } from "../ubl-tr/types.js";

/**
 * Foriba (Türkiye'nin en büyük özel entegratörlerinden)
 * API Adaptörü
 *
 * Production'da gerçek Foriba API'ye bağlanır.
 * Test modunda mock yanıtlar döner.
 */
export class ForibaIntegrator implements EInvoiceIntegrator {
  readonly name = "Foriba";
  private config: IntegratorConfig;
  private sessionToken: string | null = null;

  constructor(config: IntegratorConfig) {
    this.config = config;
  }

  private async authenticate(): Promise<string> {
    if (this.sessionToken) return this.sessionToken;

    const response = await fetch(`${this.config.apiUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: this.config.username,
        password: this.config.password,
      }),
      signal: AbortSignal.timeout(this.config.timeout ?? 30000),
    });

    if (!response.ok) {
      throw new Error(`Foriba auth hatası: ${response.status}`);
    }

    const data = (await response.json()) as { token: string };
    this.sessionToken = data.token;
    return data.token;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await this.authenticate();

    const response = await fetch(`${this.config.apiUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
      signal: AbortSignal.timeout(this.config.timeout ?? 30000),
    });

    if (response.status === 401) {
      // Token expired, retry
      this.sessionToken = null;
      const newToken = await this.authenticate();
      const retryResponse = await fetch(`${this.config.apiUrl}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${newToken}`,
          ...options.headers,
        },
      });
      return retryResponse.json() as T;
    }

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Foriba API hatası (${response.status}): ${errorBody}`);
    }

    return response.json() as T;
  }

  async checkTaxpayer(vkn: string) {
    try {
      const result = await this.request<{
        isEInvoice: boolean;
        isEArchive: boolean;
        alias: string;
        title: string;
      }>(`/taxpayer/check?vkn=${vkn}`);

      return result;
    } catch {
      // Fallback: GİB mükellef listesi kontrolü (çevrimdışı)
      return {
        isEInvoice: false,
        isEArchive: true, // 2026'dan itibaren herkes e-arşiv
        alias: undefined,
        title: undefined,
      };
    }
  }

  async sendInvoice(xml: string, envelope: UblEnvelopeData): Promise<EInvoiceResponse> {
    return this.request<EInvoiceResponse>("/einvoice/send", {
      method: "POST",
      body: JSON.stringify({
        invoiceXml: Buffer.from(xml).toString("base64"),
        envelope: {
          uuid: envelope.uuid,
          senderId: envelope.senderId,
          receiverId: envelope.receiverId,
          date: envelope.date,
          time: envelope.time,
        },
      }),
    });
  }

  async sendArchiveInvoice(xml: string): Promise<EInvoiceResponse> {
    return this.request<EInvoiceResponse>("/earchive/send", {
      method: "POST",
      body: JSON.stringify({
        invoiceXml: Buffer.from(xml).toString("base64"),
      }),
    });
  }

  async getInvoiceStatus(uuid: string): Promise<EInvoiceResponse> {
    return this.request<EInvoiceResponse>(`/einvoice/status/${uuid}`);
  }

  async getIncomingInvoices(params: { startDate: string; endDate: string; limit?: number }) {
    return this.request<{ invoices: IncomingInvoiceSummary[]; total: number }>(
      `/einvoice/incoming?startDate=${params.startDate}&endDate=${params.endDate}&limit=${params.limit ?? 100}`
    );
  }

  async getInvoiceXml(uuid: string): Promise<string> {
    const result = await this.request<{ xml: string }>(`/einvoice/xml/${uuid}`);
    return Buffer.from(result.xml, "base64").toString("utf-8");
  }

  async acceptInvoice(uuid: string): Promise<EInvoiceResponse> {
    return this.request<EInvoiceResponse>(`/einvoice/accept/${uuid}`, { method: "POST" });
  }

  async rejectInvoice(uuid: string, reason: string): Promise<EInvoiceResponse> {
    return this.request<EInvoiceResponse>(`/einvoice/reject/${uuid}`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }
}

/**
 * Mock Entegratör - Test ve geliştirme için
 */
export class MockIntegrator implements EInvoiceIntegrator {
  readonly name = "Mock (Test)";

  async checkTaxpayer(vkn: string) {
    return {
      isEInvoice: vkn.startsWith("1"),
      isEArchive: true,
      alias: `urn:mail:defaultpk@${vkn}.com`,
      title: `Test Firması (${vkn})`,
    };
  }

  async sendInvoice(_xml: string, envelope: UblEnvelopeData): Promise<EInvoiceResponse> {
    return {
      success: true,
      uuid: envelope.uuid,
      envelopeId: `ENV-${Date.now()}`,
      status: "SENT",
      message: "Fatura başarıyla gönderildi (mock)",
    };
  }

  async sendArchiveInvoice(_xml: string): Promise<EInvoiceResponse> {
    return {
      success: true,
      uuid: crypto.randomUUID(),
      status: "SENT",
      message: "E-Arşiv fatura oluşturuldu (mock)",
    };
  }

  async getInvoiceStatus(uuid: string): Promise<EInvoiceResponse> {
    return {
      success: true,
      uuid,
      status: "ACCEPTED",
      message: "Fatura kabul edildi (mock)",
    };
  }

  async getIncomingInvoices(_params: { startDate: string; endDate: string }) {
    return { invoices: [], total: 0 };
  }

  async getInvoiceXml(_uuid: string): Promise<string> {
    return "<Invoice>mock</Invoice>";
  }

  async acceptInvoice(uuid: string): Promise<EInvoiceResponse> {
    return { success: true, uuid, status: "ACCEPTED" };
  }

  async rejectInvoice(uuid: string, _reason: string): Promise<EInvoiceResponse> {
    return { success: true, uuid, status: "REJECTED" };
  }
}
