import { describe, it, expect } from "vitest";
import {
  calculateFinancialRatios,
  calculateCashFlowSummary,
} from "./dashboard.calc.js";

describe("calculateFinancialRatios", () => {
  it("sağlıklı firma için doğru oranları hesaplar", () => {
    const result = calculateFinancialRatios({
      currentAssets: 500000,
      fixedAssets: 300000,
      currentLiabilities: 200000,
      longTermLiabilities: 100000,
      equity: 500000,
      revenue: 1000000,
      expenses: 800000,
    });

    // Cari Oran: 500000 / 200000 = 2.5
    expect(result.currentRatio).toBe(2.5);
    // Borç/Özkaynak: 300000 / 500000 = 0.6
    expect(result.debtToEquity).toBe(0.6);
    // Özkaynak Oranı: 500000 / 800000 = 0.625
    expect(result.equityRatio).toBe(0.63); // roundCurrency
    // Net Kâr Marjı: 200000 / 1000000 = 20%
    expect(result.netProfitMargin).toBe(20);
    expect(result.totalAssets).toBe(800000);
    expect(result.totalLiabilities).toBe(300000);
    expect(result.netProfit).toBe(200000);
  });

  it("KV yabancı kaynak sıfır ise cari oran 0 döndürür", () => {
    const result = calculateFinancialRatios({
      currentAssets: 100000,
      fixedAssets: 50000,
      currentLiabilities: 0,
      longTermLiabilities: 0,
      equity: 150000,
      revenue: 100000,
      expenses: 80000,
    });

    expect(result.currentRatio).toBe(0);
  });

  it("özkaynak sıfır ise borç/özkaynak 0 döndürür", () => {
    const result = calculateFinancialRatios({
      currentAssets: 100000,
      fixedAssets: 0,
      currentLiabilities: 100000,
      longTermLiabilities: 0,
      equity: 0,
      revenue: 50000,
      expenses: 50000,
    });

    expect(result.debtToEquity).toBe(0);
    expect(result.equityRatio).toBe(0);
  });

  it("zararlı dönemde negatif kâr marjı hesaplar", () => {
    const result = calculateFinancialRatios({
      currentAssets: 100000,
      fixedAssets: 50000,
      currentLiabilities: 80000,
      longTermLiabilities: 20000,
      equity: 50000,
      revenue: 200000,
      expenses: 250000,
    });

    expect(result.netProfit).toBe(-50000);
    expect(result.netProfitMargin).toBe(-25);
  });

  it("gelir sıfır ise kâr marjı 0 döndürür", () => {
    const result = calculateFinancialRatios({
      currentAssets: 100000,
      fixedAssets: 0,
      currentLiabilities: 50000,
      longTermLiabilities: 0,
      equity: 50000,
      revenue: 0,
      expenses: 0,
    });

    expect(result.netProfitMargin).toBe(0);
    expect(result.netProfit).toBe(0);
  });
});

describe("calculateCashFlowSummary", () => {
  it("nakit akış özetini hesaplar", () => {
    const result = calculateCashFlowSummary(
      [
        { month: "2026-01", total: "50000" },
        { month: "2026-02", total: "60000" },
      ],
      [
        { month: "2026-01", total: "30000" },
        { month: "2026-02", total: "40000" },
      ]
    );

    expect(result.totalInflow).toBe(110000);
    expect(result.totalOutflow).toBe(70000);
    expect(result.netCashFlow).toBe(40000);
  });

  it("boş veri sıfır döndürür", () => {
    const result = calculateCashFlowSummary([], []);
    expect(result.totalInflow).toBe(0);
    expect(result.totalOutflow).toBe(0);
    expect(result.netCashFlow).toBe(0);
  });

  it("negatif nakit akış hesaplar", () => {
    const result = calculateCashFlowSummary(
      [{ month: "2026-01", total: "20000" }],
      [{ month: "2026-01", total: "50000" }]
    );

    expect(result.netCashFlow).toBe(-30000);
  });
});
