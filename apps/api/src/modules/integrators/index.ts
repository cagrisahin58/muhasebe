import type { EInvoiceIntegrator, IntegratorConfig } from "./base.js";
import { ForibaIntegrator, MockIntegrator } from "./foriba.js";

export type { EInvoiceIntegrator, IntegratorConfig, IncomingInvoiceSummary } from "./base.js";
export { ForibaIntegrator, MockIntegrator } from "./foriba.js";

/**
 * Entegratör factory - konfigürasyona göre doğru entegratörü oluşturur
 */
export function createIntegrator(provider?: string, config?: IntegratorConfig): EInvoiceIntegrator {
  if (!provider || !config || provider === "mock") {
    return new MockIntegrator();
  }

  switch (provider.toLowerCase()) {
    case "foriba":
      return new ForibaIntegrator(config);
    // Gelecekte: case "izibiz": return new IzibizIntegrator(config);
    // Gelecekte: case "qnb": return new QnbIntegrator(config);
    default:
      console.warn(`Bilinmeyen entegratör: ${provider}, mock kullanılıyor`);
      return new MockIntegrator();
  }
}
