import { describe, it, expect } from "vitest";
import {
  reconcileBankStatements,
  parseBankStatementCsv,
} from "./bank-reconciliation.js";
import type { BankStatementRow, JournalLineForMatch } from "./bank-reconciliation.js";

describe("reconcileBankStatements", () => {
  it("tutar ve tarih eşleşmesi yapar", () => {
    const bankRows: BankStatementRow[] = [
      { id: "b1", date: "2026-01-10", description: "Müşteri A ödeme", amount: 5000 },
      { id: "b2", date: "2026-01-15", description: "Kira ödemesi", amount: -3000 },
    ];

    const journalLines: JournalLineForMatch[] = [
      { id: "j1", entryDate: "2026-01-10", description: "Müşteri A tahsilat", accountCode: "102", amount: 5000 },
      { id: "j2", entryDate: "2026-01-15", description: "Kira gideri", accountCode: "102", amount: 3000 },
    ];

    const result = reconcileBankStatements(bankRows, journalLines);

    expect(result.matched).toHaveLength(2);
    expect(result.unmatchedBank).toHaveLength(0);
    expect(result.matchRate).toBe(100);
  });

  it("tutar eşleşmeyen satırları eşleştirmez", () => {
    const bankRows: BankStatementRow[] = [
      { id: "b1", date: "2026-01-10", description: "Ödeme", amount: 5000 },
    ];

    const journalLines: JournalLineForMatch[] = [
      { id: "j1", entryDate: "2026-01-10", description: "Ödeme", accountCode: "102", amount: 7000 },
    ];

    const result = reconcileBankStatements(bankRows, journalLines);

    expect(result.matched).toHaveLength(0);
    expect(result.unmatchedBank).toHaveLength(1);
    expect(result.unmatchedJournal).toHaveLength(1);
  });

  it("7 günden fazla tarih farkında eşleştirmez", () => {
    const bankRows: BankStatementRow[] = [
      { id: "b1", date: "2026-01-01", description: "Ödeme", amount: 5000 },
    ];

    const journalLines: JournalLineForMatch[] = [
      { id: "j1", entryDate: "2026-01-20", description: "Ödeme", accountCode: "102", amount: 5000 },
    ];

    const result = reconcileBankStatements(bankRows, journalLines);
    expect(result.matched).toHaveLength(0);
  });

  it("referans eşleşmesi güveni artırır", () => {
    const bankRows: BankStatementRow[] = [
      { id: "b1", date: "2026-01-10", description: "EFT 12345", reference: "12345", amount: 5000 },
    ];

    const journalLines: JournalLineForMatch[] = [
      { id: "j1", entryDate: "2026-01-11", description: "Tahsilat ref: 12345", accountCode: "102", amount: 5000 },
    ];

    const result = reconcileBankStatements(bankRows, journalLines);

    expect(result.matched).toHaveLength(1);
    expect(result.matched[0]!.confidence).toBeGreaterThanOrEqual(90);
    expect(result.matched[0]!.matchReason).toContain("referans");
  });

  it("boş girdide boş sonuç döndürür", () => {
    const result = reconcileBankStatements([], []);
    expect(result.matched).toHaveLength(0);
    expect(result.matchRate).toBe(0);
  });

  it("bir banka satırını birden fazla journal ile eşleştirmez", () => {
    const bankRows: BankStatementRow[] = [
      { id: "b1", date: "2026-01-10", description: "Ödeme", amount: 5000 },
    ];

    const journalLines: JournalLineForMatch[] = [
      { id: "j1", entryDate: "2026-01-10", description: "Ödeme A", accountCode: "102", amount: 5000 },
      { id: "j2", entryDate: "2026-01-10", description: "Ödeme B", accountCode: "102", amount: 5000 },
    ];

    const result = reconcileBankStatements(bankRows, journalLines);
    expect(result.matched).toHaveLength(1); // Sadece 1 eşleşme olmalı
  });
});

describe("parseBankStatementCsv", () => {
  it("Türk formatındaki CSV'yi parse eder", () => {
    const csv = `Tarih;Açıklama;Tutar
10.01.2026;Müşteri A ödeme;5.000,00
15.01.2026;Kira ödemesi;-3.000,50`;

    const rows = parseBankStatementCsv(csv, {
      dateColumn: 0,
      descriptionColumn: 1,
      amountColumn: 2,
      delimiter: ";",
      skipRows: 1,
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]!.date).toBe("2026-01-10");
    expect(rows[0]!.amount).toBe(5000);
    expect(rows[0]!.description).toBe("Müşteri A ödeme");
    expect(rows[1]!.amount).toBe(-3000.5);
  });

  it("ISO tarih formatını destekler", () => {
    const csv = `date;desc;amount
2026-01-10;Payment;1234.56`;

    const rows = parseBankStatementCsv(csv, {
      dateColumn: 0,
      descriptionColumn: 1,
      amountColumn: 2,
      delimiter: ";",
      skipRows: 1,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]!.date).toBe("2026-01-10");
    expect(rows[0]!.amount).toBe(1234.56);
  });

  it("referans sütununu destekler", () => {
    const csv = `Tarih;Açıklama;Tutar;Referans
10.01.2026;Ödeme;1000,00;REF123`;

    const rows = parseBankStatementCsv(csv, {
      dateColumn: 0,
      descriptionColumn: 1,
      amountColumn: 2,
      referenceColumn: 3,
      delimiter: ";",
      skipRows: 1,
    });

    expect(rows[0]!.reference).toBe("REF123");
  });

  it("geçersiz satırları atlar", () => {
    const csv = `Tarih;Açıklama;Tutar
10.01.2026;Ödeme;1000,00
;Eksik tarih;500
10.01.2026;;abc`;

    const rows = parseBankStatementCsv(csv, {
      dateColumn: 0,
      descriptionColumn: 1,
      amountColumn: 2,
      delimiter: ";",
      skipRows: 1,
    });

    expect(rows).toHaveLength(1); // Sadece ilk satır geçerli
  });

  it("boş CSV boş dizi döndürür", () => {
    const rows = parseBankStatementCsv("", {
      dateColumn: 0,
      descriptionColumn: 1,
      amountColumn: 2,
    });
    expect(rows).toHaveLength(0);
  });
});
