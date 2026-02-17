import { describe, it, expect } from "vitest";
import { buildJournalLedgerXml, buildGeneralLedgerXml, buildBeratXml } from "./builder.js";
import type { ELedgerHeader, ELedgerEntry } from "./builder.js";

const sampleHeader: ELedgerHeader = {
  companyName: "Test Şirket A.Ş.",
  companyVkn: "1234567890",
  taxOffice: "Büyük Mükellefler",
  period: "2026-01",
  periodStart: "2026-01-01",
  periodEnd: "2026-01-31",
  creationDate: "2026-02-15",
  entryCount: 2,
};

const sampleEntries: ELedgerEntry[] = [
  {
    entryNo: 1,
    entryDate: "2026-01-05",
    description: "Açılış fişi",
    lines: [
      { accountCode: "100", accountName: "Kasa", debitAmount: 50000, creditAmount: 0 },
      { accountCode: "500", accountName: "Sermaye", debitAmount: 0, creditAmount: 50000 },
    ],
  },
  {
    entryNo: 2,
    entryDate: "2026-01-10",
    description: "Satış faturası",
    lines: [
      { accountCode: "120", accountName: "Alıcılar", debitAmount: 1200, creditAmount: 0, description: "Müşteri A" },
      { accountCode: "600", accountName: "Yurt İçi Satışlar", debitAmount: 0, creditAmount: 1000 },
      { accountCode: "391", accountName: "Hesaplanan KDV", debitAmount: 0, creditAmount: 200 },
    ],
  },
];

describe("buildJournalLedgerXml", () => {
  it("geçerli XBRL-GL yevmiye XML üretir", () => {
    const xml = buildJournalLedgerXml(sampleHeader, sampleEntries);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain("gl-cor:accountingEntries");
    expect(xml).toContain("xmlns:gl-cor");
    expect(xml).toContain("xmlns:gl-bus");
  });

  it("doküman bilgilerini içerir", () => {
    const xml = buildJournalLedgerXml(sampleHeader, sampleEntries);

    expect(xml).toContain("<gl-cor:uniqueID>1234567890-2026-01-Y</gl-cor:uniqueID>");
    expect(xml).toContain("<gl-cor:documentType>Yevmiye Defteri</gl-cor:documentType>");
    expect(xml).toContain("<gl-cor:language>tr</gl-cor:language>");
    expect(xml).toContain("<gl-cor:periodCoveredStart>2026-01-01</gl-cor:periodCoveredStart>");
    expect(xml).toContain("<gl-cor:periodCoveredEnd>2026-01-31</gl-cor:periodCoveredEnd>");
  });

  it("firma bilgilerini içerir", () => {
    const xml = buildJournalLedgerXml(sampleHeader, sampleEntries);

    expect(xml).toContain("1234567890");
    expect(xml).toContain("Test Şirket A.Ş.");
  });

  it("borç ve alacak toplamlarını hesaplar", () => {
    const xml = buildJournalLedgerXml(sampleHeader, sampleEntries);

    // Toplam borç: 50000 + 1200 = 51200
    // Toplam alacak: 50000 + 1000 + 200 = 51200
    expect(xml).toContain("<gl-bus:totalDebit>51200.00</gl-bus:totalDebit>");
    expect(xml).toContain("<gl-bus:totalCredit>51200.00</gl-bus:totalCredit>");
  });

  it("yevmiye kayıtlarını içerir", () => {
    const xml = buildJournalLedgerXml(sampleHeader, sampleEntries);

    expect(xml).toContain("<gl-cor:entryHeader>");
    expect(xml).toContain("<gl-cor:enteredDate>2026-01-05</gl-cor:enteredDate>");
    expect(xml).toContain("<gl-cor:entryNumberCounter>1</gl-cor:entryNumberCounter>");
    expect(xml).toContain("Açılış fişi");
  });

  it("hesap detaylarını içerir", () => {
    const xml = buildJournalLedgerXml(sampleHeader, sampleEntries);

    expect(xml).toContain("<gl-cor:entryDetail>");
    expect(xml).toContain("<gl-cor:accountMainID>100</gl-cor:accountMainID>");
    expect(xml).toContain("<gl-cor:accountMainDescription>Kasa</gl-cor:accountMainDescription>");
    expect(xml).toContain("<gl-cor:amountOriginalAmount>50000.00</gl-cor:amountOriginalAmount>");
  });

  it("borç/alacak kodlarını doğru yazar", () => {
    const xml = buildJournalLedgerXml(sampleHeader, sampleEntries);

    expect(xml).toContain("<gl-cor:debitCreditCode>D</gl-cor:debitCreditCode>");
    expect(xml).toContain("<gl-cor:debitCreditCode>C</gl-cor:debitCreditCode>");
  });

  it("satır açıklamalarını yazar", () => {
    const xml = buildJournalLedgerXml(sampleHeader, sampleEntries);

    expect(xml).toContain("Müşteri A");
  });

  it("FinBooks kaynak bilgisini içerir", () => {
    const xml = buildJournalLedgerXml(sampleHeader, sampleEntries);

    expect(xml).toContain("<gl-bus:sourceApplication>FinBooks v0.1.0</gl-bus:sourceApplication>");
  });
});

describe("buildGeneralLedgerXml", () => {
  it("kebir defteri XML üretir", () => {
    const xml = buildGeneralLedgerXml(sampleHeader, sampleEntries);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain("<gl-cor:documentType>Büyük Defter</gl-cor:documentType>");
  });

  it("uniqueID'de K harfi kullanır", () => {
    const xml = buildGeneralLedgerXml(sampleHeader, sampleEntries);
    expect(xml).toContain("<gl-cor:uniqueID>1234567890-2026-01-K</gl-cor:uniqueID>");
  });

  it("yevmiye ile aynı hesap detaylarını içerir", () => {
    const xml = buildGeneralLedgerXml(sampleHeader, sampleEntries);

    expect(xml).toContain("<gl-cor:accountMainID>100</gl-cor:accountMainID>");
    expect(xml).toContain("<gl-cor:accountMainID>500</gl-cor:accountMainID>");
    expect(xml).toContain("<gl-cor:accountMainID>120</gl-cor:accountMainID>");
  });
});

describe("buildBeratXml", () => {
  it("yevmiye beratı üretir", () => {
    const xml = buildBeratXml({
      vkn: "1234567890",
      companyName: "Test Şirket A.Ş.",
      period: "2026-01",
      ledgerType: "Y",
      documentHash: "abc123hash",
      creationDate: "2026-02-15",
    });

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain("edefter:Berat");
    expect(xml).toContain("<edefter:VknTckn>1234567890</edefter:VknTckn>");
    expect(xml).toContain("Test Şirket A.Ş.");
    expect(xml).toContain("<edefter:DefterTuru>Yevmiye Defteri</edefter:DefterTuru>");
    expect(xml).toContain("<edefter:Donem>2026-01</edefter:Donem>");
    expect(xml).toContain("<edefter:DefterHash>abc123hash</edefter:DefterHash>");
  });

  it("kebir beratı üretir", () => {
    const xml = buildBeratXml({
      vkn: "1234567890",
      companyName: "Test Şirket A.Ş.",
      period: "2026-01",
      ledgerType: "K",
      documentHash: "xyz789hash",
      creationDate: "2026-02-15",
    });

    expect(xml).toContain("<edefter:DefterTuru>Büyük Defter</edefter:DefterTuru>");
    expect(xml).toContain("<edefter:DefterHash>xyz789hash</edefter:DefterHash>");
  });
});
