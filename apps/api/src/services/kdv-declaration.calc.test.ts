import { describe, it, expect } from "vitest";
import {
  calculateKdv1Declaration,
  calculateMuhtasar,
  calculateGeciciVergi,
} from "./kdv-declaration.calc.js";

describe("calculateKdv1Declaration", () => {
  it("basit KDV beyannamesi hesaplar (ödenecek KDV)", () => {
    const result = calculateKdv1Declaration({
      calculatedKdv: [
        { rate: 20, taxableAmount: 100000, taxAmount: 20000 },
      ],
      deductibleKdv: [
        { rate: 20, taxableAmount: 50000, taxAmount: 10000 },
      ],
      previousPeriodCarryOver: 0,
      withholdingKdv: 0,
      exemptTransactions: 0,
      exportExemption: 0,
    });

    expect(result.totalCalculatedKdv).toBe(20000);
    expect(result.totalDeductibleKdv).toBe(10000);
    expect(result.difference).toBe(10000);
    expect(result.payableKdv).toBe(10000);
    expect(result.carryOverKdv).toBe(0);
  });

  it("devreden KDV hesaplar (indirilecek > hesaplanan)", () => {
    const result = calculateKdv1Declaration({
      calculatedKdv: [
        { rate: 20, taxableAmount: 30000, taxAmount: 6000 },
      ],
      deductibleKdv: [
        { rate: 20, taxableAmount: 50000, taxAmount: 10000 },
      ],
      previousPeriodCarryOver: 0,
      withholdingKdv: 0,
      exemptTransactions: 0,
      exportExemption: 0,
    });

    expect(result.totalCalculatedKdv).toBe(6000);
    expect(result.totalDeductibleKdv).toBe(10000);
    expect(result.payableKdv).toBe(0);
    expect(result.carryOverKdv).toBe(4000);
  });

  it("önceki dönem devreden KDV'yi dikkate alır", () => {
    const result = calculateKdv1Declaration({
      calculatedKdv: [
        { rate: 20, taxableAmount: 100000, taxAmount: 20000 },
      ],
      deductibleKdv: [
        { rate: 20, taxableAmount: 40000, taxAmount: 8000 },
      ],
      previousPeriodCarryOver: 5000, // Önceki dönemden 5000 TL devreden
      withholdingKdv: 0,
      exemptTransactions: 0,
      exportExemption: 0,
    });

    // Hesaplanan: 20000 - (İndirilecek: 8000 + Devreden: 5000) = 7000
    expect(result.totalDeductions).toBe(13000);
    expect(result.payableKdv).toBe(7000);
    expect(result.carryOverKdv).toBe(0);
  });

  it("birden fazla KDV oranıyla hesaplar", () => {
    const result = calculateKdv1Declaration({
      calculatedKdv: [
        { rate: 20, taxableAmount: 50000, taxAmount: 10000 },
        { rate: 10, taxableAmount: 20000, taxAmount: 2000 },
        { rate: 1, taxableAmount: 10000, taxAmount: 100 },
      ],
      deductibleKdv: [
        { rate: 20, taxableAmount: 30000, taxAmount: 6000 },
      ],
      previousPeriodCarryOver: 0,
      withholdingKdv: 0,
      exemptTransactions: 0,
      exportExemption: 0,
    });

    expect(result.totalCalculatedKdv).toBe(12100);
    expect(result.totalTaxableAmount).toBe(80000);
    expect(result.totalDeductibleKdv).toBe(6000);
    expect(result.payableKdv).toBe(6100);
  });

  it("tevkifatlı işlemleri hesaba katar", () => {
    const result = calculateKdv1Declaration({
      calculatedKdv: [
        { rate: 20, taxableAmount: 50000, taxAmount: 10000 },
      ],
      deductibleKdv: [
        { rate: 20, taxableAmount: 30000, taxAmount: 6000 },
      ],
      previousPeriodCarryOver: 0,
      withholdingKdv: 2000,
      exemptTransactions: 0,
      exportExemption: 0,
    });

    // (10000 + 2000) - 6000 = 6000
    expect(result.payableKdv).toBe(6000);
  });

  it("boş beyanname sıfır döndürür", () => {
    const result = calculateKdv1Declaration({
      calculatedKdv: [],
      deductibleKdv: [],
      previousPeriodCarryOver: 0,
      withholdingKdv: 0,
      exemptTransactions: 0,
      exportExemption: 0,
    });

    expect(result.totalCalculatedKdv).toBe(0);
    expect(result.payableKdv).toBe(0);
    expect(result.carryOverKdv).toBe(0);
  });
});

describe("calculateMuhtasar", () => {
  it("ücret stopajı hesaplar (%15)", () => {
    const result = calculateMuhtasar({
      grossWages: 100000,
      freelancePayments: 0,
      rentPayments: 0,
      otherWithholdings: [],
    });

    expect(result.wageWithholding).toBe(15000);
    expect(result.totalWithholding).toBe(15000);
  });

  it("serbest meslek stopajı hesaplar (%20)", () => {
    const result = calculateMuhtasar({
      grossWages: 0,
      freelancePayments: 50000,
      rentPayments: 0,
      otherWithholdings: [],
    });

    expect(result.freelanceWithholding).toBe(10000);
    expect(result.totalWithholding).toBe(10000);
  });

  it("kira stopajı hesaplar (%20)", () => {
    const result = calculateMuhtasar({
      grossWages: 0,
      freelancePayments: 0,
      rentPayments: 30000,
      otherWithholdings: [],
    });

    expect(result.rentWithholding).toBe(6000);
    expect(result.totalWithholding).toBe(6000);
  });

  it("tüm stopajları toplar", () => {
    const result = calculateMuhtasar({
      grossWages: 100000,
      freelancePayments: 50000,
      rentPayments: 30000,
      otherWithholdings: [
        { description: "Özel stopaj", grossAmount: 20000, rate: 10 },
      ],
    });

    // Ücret: 15000 + SM: 10000 + Kira: 6000 + Diğer: 2000 = 33000
    expect(result.wageWithholding).toBe(15000);
    expect(result.freelanceWithholding).toBe(10000);
    expect(result.rentWithholding).toBe(6000);
    expect(result.otherWithholdings[0]!.amount).toBe(2000);
    expect(result.totalWithholding).toBe(33000);
  });

  it("sıfır tutar sıfır stopaj döndürür", () => {
    const result = calculateMuhtasar({
      grossWages: 0,
      freelancePayments: 0,
      rentPayments: 0,
      otherWithholdings: [],
    });
    expect(result.totalWithholding).toBe(0);
  });
});

describe("calculateGeciciVergi", () => {
  it("kârlı dönemde vergi hesaplar", () => {
    const result = calculateGeciciVergi({
      periodRevenue: 500000,
      periodExpense: 300000,
      previousPeriodTax: 0,
      taxRate: 25,
    });

    expect(result.periodProfit).toBe(200000);
    expect(result.cumulativeTax).toBe(50000);
    expect(result.payableTax).toBe(50000);
  });

  it("önceki dönem vergisini mahsup eder", () => {
    const result = calculateGeciciVergi({
      periodRevenue: 500000,
      periodExpense: 300000,
      previousPeriodTax: 30000,
      taxRate: 25,
    });

    // Kâr: 200000, Vergi: 50000, Önceki: 30000
    expect(result.payableTax).toBe(20000);
  });

  it("zararlı dönemde vergi hesaplamaz", () => {
    const result = calculateGeciciVergi({
      periodRevenue: 200000,
      periodExpense: 300000,
      previousPeriodTax: 0,
      taxRate: 25,
    });

    expect(result.periodProfit).toBe(-100000);
    expect(result.cumulativeTax).toBe(0);
    expect(result.payableTax).toBe(0);
  });

  it("gelir vergisi oranıyla hesaplar", () => {
    const result = calculateGeciciVergi({
      periodRevenue: 100000,
      periodExpense: 60000,
      previousPeriodTax: 0,
      taxRate: 15, // Gelir vergisi %15
    });

    expect(result.periodProfit).toBe(40000);
    expect(result.cumulativeTax).toBe(6000);
    expect(result.payableTax).toBe(6000);
  });
});
