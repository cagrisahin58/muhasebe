import { roundCurrency } from "@finbooks/shared";

/**
 * Finansal Oran Hesaplamaları
 */

export interface FinancialRatioInput {
  currentAssets: number; // Dönen varlıklar (1xx)
  fixedAssets: number; // Duran varlıklar (2xx)
  currentLiabilities: number; // KV yabancı kaynaklar (3xx)
  longTermLiabilities: number; // UV yabancı kaynaklar (4xx)
  equity: number; // Özkaynaklar (5xx)
  revenue: number; // Gelirler (6xx)
  expenses: number; // Giderler (7xx)
}

export interface FinancialRatios {
  /** Cari Oran = Dönen Varlıklar / KV Yabancı Kaynaklar (İdeal > 1.5) */
  currentRatio: number;
  /** Asit-Test Oranı (yaklaşık) = (Dönen Varlıklar - Stoklar) / KV Yab. Kaynaklar */
  /** Borç / Özkaynak Oranı = Toplam Borç / Özkaynaklar (İdeal < 2.0) */
  debtToEquity: number;
  /** Özkaynak Oranı = Özkaynaklar / Toplam Aktif */
  equityRatio: number;
  /** Net Kâr Marjı = (Gelir - Gider) / Gelir */
  netProfitMargin: number;
  /** Toplam Aktif */
  totalAssets: number;
  /** Toplam Pasif */
  totalLiabilities: number;
  /** Net Kâr / Zarar */
  netProfit: number;
}

export function calculateFinancialRatios(input: FinancialRatioInput): FinancialRatios {
  const totalAssets = roundCurrency(input.currentAssets + input.fixedAssets);
  const totalLiabilities = roundCurrency(input.currentLiabilities + input.longTermLiabilities);
  const netProfit = roundCurrency(input.revenue - input.expenses);

  // Cari Oran
  const currentRatio = input.currentLiabilities > 0
    ? roundCurrency(input.currentAssets / input.currentLiabilities)
    : 0;

  // Borç / Özkaynak
  const debtToEquity = input.equity > 0
    ? roundCurrency(totalLiabilities / input.equity)
    : 0;

  // Özkaynak Oranı
  const equityRatio = totalAssets > 0
    ? roundCurrency(input.equity / totalAssets)
    : 0;

  // Net Kâr Marjı
  const netProfitMargin = input.revenue > 0
    ? roundCurrency((netProfit / input.revenue) * 100)
    : 0;

  return {
    currentRatio,
    debtToEquity,
    equityRatio,
    netProfitMargin,
    totalAssets,
    totalLiabilities,
    netProfit,
  };
}

/**
 * Nakit akış özeti hesapla
 */
export interface CashFlowSummary {
  totalInflow: number;
  totalOutflow: number;
  netCashFlow: number;
}

export function calculateCashFlowSummary(
  inflows: { month: string; total: string }[],
  outflows: { month: string; total: string }[]
): CashFlowSummary {
  const totalInflow = roundCurrency(
    inflows.reduce((sum, i) => sum + parseFloat(i.total), 0)
  );
  const totalOutflow = roundCurrency(
    outflows.reduce((sum, o) => sum + parseFloat(o.total), 0)
  );
  const netCashFlow = roundCurrency(totalInflow - totalOutflow);

  return { totalInflow, totalOutflow, netCashFlow };
}
