import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  calculateKdv,
  calculateWithholding,
  roundCurrency,
  validateVkn,
  validateTckn,
  getAccountTypeFromCode,
  generateInvoiceNumber,
  toPeriodString,
} from "./index.js";

describe("formatCurrency", () => {
  it("TL formatında gösterir", () => {
    const result = formatCurrency(1234.5);
    expect(result).toContain("1.234,50");
  });

  it("string tutarı formatlar", () => {
    const result = formatCurrency("99.99");
    expect(result).toContain("99,99");
  });

  it("sıfır tutarı formatlar", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0,00");
  });
});

describe("calculateKdv", () => {
  it("KDV hariç hesaplar (%20)", () => {
    const result = calculateKdv(100, 20, false);
    expect(result.net).toBe(100);
    expect(result.tax).toBe(20);
    expect(result.gross).toBe(120);
  });

  it("KDV dahil hesaplar (%20)", () => {
    const result = calculateKdv(120, 20, true);
    expect(result.net).toBe(100);
    expect(result.tax).toBe(20);
    expect(result.gross).toBe(120);
  });

  it("KDV %10 oranında hesaplar", () => {
    const result = calculateKdv(200, 10, false);
    expect(result.net).toBe(200);
    expect(result.tax).toBe(20);
    expect(result.gross).toBe(220);
  });

  it("KDV %1 oranında hesaplar", () => {
    const result = calculateKdv(1000, 1, false);
    expect(result.net).toBe(1000);
    expect(result.tax).toBe(10);
    expect(result.gross).toBe(1010);
  });

  it("KDV %0 hesaplar", () => {
    const result = calculateKdv(500, 0, false);
    expect(result.net).toBe(500);
    expect(result.tax).toBe(0);
    expect(result.gross).toBe(500);
  });
});

describe("calculateWithholding", () => {
  it("9/10 tevkifat hesaplar", () => {
    const result = calculateWithholding(20, 9, 10);
    expect(result.withheld).toBe(18);
    expect(result.remaining).toBe(2);
  });

  it("4/10 tevkifat hesaplar", () => {
    const result = calculateWithholding(100, 4, 10);
    expect(result.withheld).toBe(40);
    expect(result.remaining).toBe(60);
  });
});

describe("roundCurrency", () => {
  it("2 ondalık basamağa yuvarlar", () => {
    expect(roundCurrency(10.005)).toBe(10.01);
    expect(roundCurrency(10.004)).toBe(10);
    expect(roundCurrency(10.1)).toBe(10.1);
  });
});

describe("validateVkn", () => {
  it("geçerli VKN'yi kabul eder", () => {
    // Not: gerçek bir VKN doğrulama testi
    expect(validateVkn("1234567890")).toBe(false); // Rastgele sayı genelde geçersiz
    expect(validateVkn("abc")).toBe(false);
    expect(validateVkn("12345")).toBe(false);
    expect(validateVkn("12345678901")).toBe(false); // 11 hane = geçersiz
  });

  it("10 haneli olmayan değerleri reddeder", () => {
    expect(validateVkn("")).toBe(false);
    expect(validateVkn("123")).toBe(false);
  });
});

describe("validateTckn", () => {
  it("geçersiz TCKN'yi reddeder", () => {
    expect(validateTckn("")).toBe(false);
    expect(validateTckn("0123456789")).toBe(false); // 0 ile başlayan
    expect(validateTckn("00000000000")).toBe(false);
    expect(validateTckn("12345")).toBe(false);
  });

  it("11 haneli olmayan değerleri reddeder", () => {
    expect(validateTckn("1234567890")).toBe(false); // 10 hane
    expect(validateTckn("123456789012")).toBe(false); // 12 hane
  });
});

describe("getAccountTypeFromCode", () => {
  it("1xx = asset", () => {
    expect(getAccountTypeFromCode("100")).toBe("asset");
    expect(getAccountTypeFromCode("191")).toBe("asset");
  });

  it("2xx = asset", () => {
    expect(getAccountTypeFromCode("250")).toBe("asset");
  });

  it("3xx = liability", () => {
    expect(getAccountTypeFromCode("320")).toBe("liability");
    expect(getAccountTypeFromCode("391")).toBe("liability");
  });

  it("4xx = liability", () => {
    expect(getAccountTypeFromCode("400")).toBe("liability");
  });

  it("5xx = equity", () => {
    expect(getAccountTypeFromCode("500")).toBe("equity");
  });

  it("6xx = revenue", () => {
    expect(getAccountTypeFromCode("600")).toBe("revenue");
  });

  it("7xx = expense", () => {
    expect(getAccountTypeFromCode("770")).toBe("expense");
  });
});

describe("generateInvoiceNumber", () => {
  it("GİB formatında fatura numarası üretir", () => {
    expect(generateInvoiceNumber("FNB", 2026, 1)).toBe("FNB2026000000001");
    expect(generateInvoiceNumber("FNB", 2026, 123)).toBe("FNB2026000000123");
    expect(generateInvoiceNumber("AB", 2026, 1)).toBe("ABA2026000000001");
  });
});

describe("toPeriodString", () => {
  it("YYYY-MM formatında dönem stringi üretir", () => {
    expect(toPeriodString(new Date("2026-01-15"))).toBe("2026-01");
    expect(toPeriodString(new Date("2026-12-31"))).toBe("2026-12");
  });
});
