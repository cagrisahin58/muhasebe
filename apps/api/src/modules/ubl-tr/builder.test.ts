import { describe, it, expect } from "vitest";
import { buildUblTrInvoiceXml, escapeXml } from "./builder.js";
import type { UblInvoiceData } from "./types.js";

const sampleSupplier = {
  vkn: "1234567890",
  name: "Test Şirket A.Ş.",
  taxOffice: "Büyük Mükellefler",
  streetName: "Atatürk Cad. No: 1",
  cityName: "İstanbul",
  citySubdivisionName: "Şişli",
  country: "Türkiye",
  phone: "02121234567",
  email: "info@test.com",
};

const sampleCustomer = {
  vkn: "9876543210",
  name: "Alıcı Ltd. Şti.",
  taxOffice: "Kadıköy",
  streetName: "İnönü Cad. No: 5",
  cityName: "İstanbul",
  citySubdivisionName: "Kadıköy",
  country: "Türkiye",
};

function createSampleInvoice(overrides?: Partial<UblInvoiceData>): UblInvoiceData {
  return {
    uuid: "550e8400-e29b-41d4-a716-446655440000",
    invoiceNumber: "FNB2026000000001",
    issueDate: "2026-01-15",
    issueTime: "10:30:00",
    invoiceType: "SATIS",
    profileId: "TICARIFATURA",
    currencyCode: "TRY",
    lineCountNumeric: 1,
    supplier: sampleSupplier,
    customer: sampleCustomer,
    lines: [
      {
        lineId: "1",
        quantity: 10,
        unitCode: "C62",
        unitPrice: 100,
        lineExtensionAmount: 1000,
        taxRate: 20,
        taxAmount: 200,
        description: "Yazılım Lisansı",
      },
    ],
    lineExtensionAmount: 1000,
    taxExclusiveAmount: 1000,
    taxInclusiveAmount: 1200,
    allowanceTotalAmount: 0,
    payableAmount: 1200,
    taxSubtotals: [
      {
        taxableAmount: 1000,
        taxAmount: 200,
        taxRate: 20,
        taxScheme: "0015",
      },
    ],
    ...overrides,
  };
}

describe("buildUblTrInvoiceXml", () => {
  it("geçerli UBL-TR XML üretir", () => {
    const xml = buildUblTrInvoiceXml(createSampleInvoice());

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain("<Invoice");
    expect(xml).toContain("urn:oasis:names:specification:ubl:schema:xsd:Invoice-2");
    expect(xml).toContain("</Invoice>");
  });

  it("UBL versiyonunu içerir", () => {
    const xml = buildUblTrInvoiceXml(createSampleInvoice());
    expect(xml).toContain("<cbc:UBLVersionID>2.1</cbc:UBLVersionID>");
    expect(xml).toContain("<cbc:CustomizationID>TR1.2.1</cbc:CustomizationID>");
  });

  it("fatura tipini doğru yazar", () => {
    const xml = buildUblTrInvoiceXml(createSampleInvoice({ invoiceType: "SATIS" }));
    expect(xml).toContain("<cbc:InvoiceTypeCode>SATIS</cbc:InvoiceTypeCode>");
  });

  it("profil ID'yi doğru yazar", () => {
    const xml = buildUblTrInvoiceXml(createSampleInvoice({ profileId: "TICARIFATURA" }));
    expect(xml).toContain("<cbc:ProfileID>TICARIFATURA</cbc:ProfileID>");
  });

  it("satıcı bilgilerini içerir", () => {
    const xml = buildUblTrInvoiceXml(createSampleInvoice());
    expect(xml).toContain("AccountingSupplierParty");
    expect(xml).toContain("1234567890");
    expect(xml).toContain("Test Şirket A.Ş.");
    expect(xml).toContain("Büyük Mükellefler");
  });

  it("alıcı bilgilerini içerir", () => {
    const xml = buildUblTrInvoiceXml(createSampleInvoice());
    expect(xml).toContain("AccountingCustomerParty");
    expect(xml).toContain("9876543210");
    expect(xml).toContain("Alıcı Ltd. Şti.");
  });

  it("fatura numarasını doğru yazar", () => {
    const xml = buildUblTrInvoiceXml(createSampleInvoice());
    expect(xml).toContain("<cbc:ID>FNB2026000000001</cbc:ID>");
  });

  it("UUID yazar", () => {
    const xml = buildUblTrInvoiceXml(createSampleInvoice());
    expect(xml).toContain("<cbc:UUID>550e8400-e29b-41d4-a716-446655440000</cbc:UUID>");
  });

  it("KDV toplamını doğru yazar", () => {
    const xml = buildUblTrInvoiceXml(createSampleInvoice());
    expect(xml).toContain("<cbc:TaxAmount currencyID=\"TRY\">200.00</cbc:TaxAmount>");
    expect(xml).toContain("<cbc:TaxableAmount currencyID=\"TRY\">1000.00</cbc:TaxableAmount>");
    expect(xml).toContain("<cbc:Percent>20.00</cbc:Percent>");
  });

  it("parasal toplamları doğru yazar", () => {
    const xml = buildUblTrInvoiceXml(createSampleInvoice());
    expect(xml).toContain('LineExtensionAmount currencyID="TRY">1000.00</');
    expect(xml).toContain('PayableAmount currencyID="TRY">1200.00</');
  });

  it("fatura kalemlerini yazar", () => {
    const xml = buildUblTrInvoiceXml(createSampleInvoice());
    expect(xml).toContain("<cac:InvoiceLine>");
    expect(xml).toContain("Yazılım Lisansı");
    expect(xml).toContain('unitCode="C62"');
    expect(xml).toContain("<cbc:PriceAmount");
  });

  it("iskontolu kalem için AllowanceCharge ekler", () => {
    const xml = buildUblTrInvoiceXml(createSampleInvoice({
      lines: [
        {
          lineId: "1",
          quantity: 10,
          unitCode: "C62",
          unitPrice: 100,
          lineExtensionAmount: 900,
          discountRate: 10,
          discountAmount: 100,
          taxRate: 20,
          taxAmount: 180,
          description: "İskontolu Ürün",
        },
      ],
    }));
    expect(xml).toContain("<cac:AllowanceCharge>");
    expect(xml).toContain("<cbc:ChargeIndicator>false</cbc:ChargeIndicator>");
  });

  it("tevkifatlı faturada WithholdingTaxTotal ekler", () => {
    const xml = buildUblTrInvoiceXml(createSampleInvoice({
      withholdingTaxTotal: {
        taxAmount: 180,
        taxSubtotal: {
          taxableAmount: 1000,
          taxAmount: 180,
          percent: 90,
        },
      },
    }));
    expect(xml).toContain("<cac:WithholdingTaxTotal>");
    expect(xml).toContain("KDV TEVKIFAT");
    expect(xml).toContain("9015");
  });

  it("TCKN olan alıcıda Person bilgileri ekler", () => {
    const xml = buildUblTrInvoiceXml(createSampleInvoice({
      customer: {
        ...sampleCustomer,
        vkn: "12345678901", // 11 hane = TCKN
        name: "Ali Yılmaz",
      },
    }));
    expect(xml).toContain('schemeID="TCKN"');
    expect(xml).toContain("<cbc:FirstName>");
    expect(xml).toContain("<cbc:FamilyName>");
  });

  it("birden fazla notu destekler", () => {
    const xml = buildUblTrInvoiceXml(createSampleInvoice({
      notes: ["İlk not", "İkinci not"],
    }));
    expect(xml).toContain("<cbc:Note>İlk not</cbc:Note>");
    expect(xml).toContain("<cbc:Note>İkinci not</cbc:Note>");
  });

  it("dijital imza placeholder'ı içerir", () => {
    const xml = buildUblTrInvoiceXml(createSampleInvoice());
    expect(xml).toContain("UBLExtensions");
    expect(xml).toContain("DigitalSignatureAttachment");
  });
});

describe("escapeXml", () => {
  it("XML özel karakterlerini escape eder", () => {
    expect(escapeXml("A & B")).toBe("A &amp; B");
    expect(escapeXml("<tag>")).toBe("&lt;tag&gt;");
    expect(escapeXml('"tırnak"')).toBe("&quot;tırnak&quot;");
    expect(escapeXml("it's")).toBe("it&apos;s");
  });

  it("boş stringde değişiklik yapmaz", () => {
    expect(escapeXml("")).toBe("");
  });

  it("Türkçe karakterleri korur", () => {
    expect(escapeXml("Çağrı Şahin")).toBe("Çağrı Şahin");
    expect(escapeXml("İstanbul Üniversitesi")).toBe("İstanbul Üniversitesi");
  });
});
