import { roundCurrency } from "@finbooks/shared";

export interface InvoiceLineInput {
  description: string;
  quantity: string;
  unitPrice: string;
  taxRate: number;
  discountRate?: string;
  withholdingRate?: string;
}

export interface InvoiceLineCalc {
  description: string;
  quantity: number;
  unitPrice: number;
  discountRate: number;
  taxRate: number;
  withholdingRate: number;
  lineSubtotal: number;
  discountAmount: number;
  netAmount: number;
  taxAmount: number;
  withholdingAmount: number;
  lineTotal: number;
}

export interface InvoiceTotals {
  subtotal: number;
  discountTotal: number;
  netTotal: number;
  taxTotal: number;
  withholdingTotal: number;
  grandTotal: number;
  lines: InvoiceLineCalc[];
}

/** Fatura kalemlerini hesapla (saf fonksiyon - DB bağımlılığı yok) */
export function calculateInvoiceTotals(lines: InvoiceLineInput[]): InvoiceTotals {
  const calculated: InvoiceLineCalc[] = lines.map((line) => {
    const quantity = parseFloat(line.quantity);
    const unitPrice = parseFloat(line.unitPrice);
    const discountRate = parseFloat(line.discountRate ?? "0");
    const withholdingRate = line.withholdingRate ? parseFloat(line.withholdingRate) : 0;

    const lineSubtotal = roundCurrency(quantity * unitPrice);
    const discountAmount = roundCurrency(lineSubtotal * (discountRate / 100));
    const netAmount = roundCurrency(lineSubtotal - discountAmount);
    const taxAmount = roundCurrency(netAmount * (line.taxRate / 100));
    const withholdingAmount = roundCurrency(taxAmount * withholdingRate);
    const lineTotal = roundCurrency(netAmount + taxAmount - withholdingAmount);

    return {
      description: line.description,
      quantity,
      unitPrice,
      discountRate,
      taxRate: line.taxRate,
      withholdingRate,
      lineSubtotal,
      discountAmount,
      netAmount,
      taxAmount,
      withholdingAmount,
      lineTotal,
    };
  });

  const subtotal = roundCurrency(calculated.reduce((s, l) => s + l.lineSubtotal, 0));
  const discountTotal = roundCurrency(calculated.reduce((s, l) => s + l.discountAmount, 0));
  const netTotal = roundCurrency(calculated.reduce((s, l) => s + l.netAmount, 0));
  const taxTotal = roundCurrency(calculated.reduce((s, l) => s + l.taxAmount, 0));
  const withholdingTotal = roundCurrency(calculated.reduce((s, l) => s + l.withholdingAmount, 0));
  const grandTotal = roundCurrency(netTotal + taxTotal - withholdingTotal);

  return { subtotal, discountTotal, netTotal, taxTotal, withholdingTotal, grandTotal, lines: calculated };
}
