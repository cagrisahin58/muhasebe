import { describe, it, expect } from "vitest";
import { calculateInvoiceTotals } from "./invoice.calc.js";

describe("calculateInvoiceTotals", () => {
  it("basit KDV %20 hesaplar", () => {
    const result = calculateInvoiceTotals([
      {
        description: "Yazılım Lisansı",
        quantity: "1",
        unitPrice: "1000",
        taxRate: 20,
        discountRate: "0",
      },
    ]);

    expect(result.subtotal).toBe(1000);
    expect(result.discountTotal).toBe(0);
    expect(result.netTotal).toBe(1000);
    expect(result.taxTotal).toBe(200);
    expect(result.withholdingTotal).toBe(0);
    expect(result.grandTotal).toBe(1200);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0]!.lineTotal).toBe(1200);
  });

  it("birden fazla kalem hesaplar", () => {
    const result = calculateInvoiceTotals([
      {
        description: "Ürün A",
        quantity: "5",
        unitPrice: "100",
        taxRate: 20,
        discountRate: "0",
      },
      {
        description: "Ürün B",
        quantity: "3",
        unitPrice: "200",
        taxRate: 10,
        discountRate: "0",
      },
    ]);

    // Ürün A: 5*100 = 500, KDV = 100, Toplam = 600
    // Ürün B: 3*200 = 600, KDV = 60, Toplam = 660
    expect(result.subtotal).toBe(1100);
    expect(result.netTotal).toBe(1100);
    expect(result.taxTotal).toBe(160);
    expect(result.grandTotal).toBe(1260);
  });

  it("iskonto hesaplar", () => {
    const result = calculateInvoiceTotals([
      {
        description: "Ürün",
        quantity: "10",
        unitPrice: "50",
        taxRate: 20,
        discountRate: "10", // %10 iskonto
      },
    ]);

    // Brüt: 10*50 = 500
    // İskonto: 500 * 0.10 = 50
    // Net: 450
    // KDV: 450 * 0.20 = 90
    // Toplam: 540
    expect(result.subtotal).toBe(500);
    expect(result.discountTotal).toBe(50);
    expect(result.netTotal).toBe(450);
    expect(result.taxTotal).toBe(90);
    expect(result.grandTotal).toBe(540);
  });

  it("tevkifatlı fatura hesaplar (9/10)", () => {
    const result = calculateInvoiceTotals([
      {
        description: "Yapım İşi",
        quantity: "1",
        unitPrice: "10000",
        taxRate: 20,
        discountRate: "0",
        withholdingRate: "0.9", // 9/10 tevkifat
      },
    ]);

    // Net: 10000
    // KDV: 2000
    // Tevkifat: 2000 * 0.9 = 1800
    // Toplam: 10000 + 2000 - 1800 = 10200
    expect(result.netTotal).toBe(10000);
    expect(result.taxTotal).toBe(2000);
    expect(result.withholdingTotal).toBe(1800);
    expect(result.grandTotal).toBe(10200);
  });

  it("KDV %0 ile hesaplar", () => {
    const result = calculateInvoiceTotals([
      {
        description: "İhracat Ürünü",
        quantity: "1",
        unitPrice: "5000",
        taxRate: 0,
        discountRate: "0",
      },
    ]);

    expect(result.netTotal).toBe(5000);
    expect(result.taxTotal).toBe(0);
    expect(result.grandTotal).toBe(5000);
  });

  it("iskonto + tevkifat birlikte hesaplar", () => {
    const result = calculateInvoiceTotals([
      {
        description: "Hizmet",
        quantity: "1",
        unitPrice: "2000",
        taxRate: 20,
        discountRate: "25", // %25 iskonto
        withholdingRate: "0.5", // 5/10 tevkifat
      },
    ]);

    // Brüt: 2000
    // İskonto: 500
    // Net: 1500
    // KDV: 300
    // Tevkifat: 300 * 0.5 = 150
    // Toplam: 1500 + 300 - 150 = 1650
    expect(result.subtotal).toBe(2000);
    expect(result.discountTotal).toBe(500);
    expect(result.netTotal).toBe(1500);
    expect(result.taxTotal).toBe(300);
    expect(result.withholdingTotal).toBe(150);
    expect(result.grandTotal).toBe(1650);
  });

  it("KDV %1 oranı ile hesaplar", () => {
    const result = calculateInvoiceTotals([
      {
        description: "Gıda Ürünü",
        quantity: "100",
        unitPrice: "10",
        taxRate: 1,
        discountRate: "0",
      },
    ]);

    expect(result.netTotal).toBe(1000);
    expect(result.taxTotal).toBe(10);
    expect(result.grandTotal).toBe(1010);
  });

  it("boş kalem listesi sıfır döndürür", () => {
    const result = calculateInvoiceTotals([]);
    expect(result.subtotal).toBe(0);
    expect(result.grandTotal).toBe(0);
    expect(result.lines).toHaveLength(0);
  });
});
