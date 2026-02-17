import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  createJournalEntrySchema,
  createContactSchema,
  taxIdSchema,
  amountSchema,
} from "./index.js";

describe("taxIdSchema", () => {
  it("10 haneli VKN kabul eder", () => {
    expect(taxIdSchema.safeParse("1234567890").success).toBe(true);
  });

  it("11 haneli TCKN kabul eder", () => {
    expect(taxIdSchema.safeParse("12345678901").success).toBe(true);
  });

  it("kısa değerleri reddeder", () => {
    expect(taxIdSchema.safeParse("12345").success).toBe(false);
  });

  it("harf içereni reddeder", () => {
    expect(taxIdSchema.safeParse("123456789a").success).toBe(false);
  });
});

describe("amountSchema", () => {
  it("tam sayı kabul eder", () => {
    expect(amountSchema.safeParse("100").success).toBe(true);
  });

  it("ondalıklı kabul eder", () => {
    expect(amountSchema.safeParse("100.50").success).toBe(true);
  });

  it("negatif reddeder", () => {
    expect(amountSchema.safeParse("-10").success).toBe(false);
  });

  it("3 ondalıklı reddeder", () => {
    expect(amountSchema.safeParse("10.123").success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("geçerli giriş bilgisini kabul eder", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("geçersiz email'i reddeder", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("boş şifreyi reddeder", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("geçerli kayıt bilgisini kabul eder", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "SecurePass123",
      name: "Test User",
    });
    expect(result.success).toBe(true);
  });

  it("kısa şifreyi reddeder", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "short",
      name: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("büyük harf içermeyen şifreyi reddeder", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "alllowercase1",
      name: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("rakam içermeyen şifreyi reddeder", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "NoNumbersHere",
      name: "Test",
    });
    expect(result.success).toBe(false);
  });
});

describe("createJournalEntrySchema", () => {
  const validEntry = {
    entryDate: new Date("2026-03-15"),
    entryType: "mahsup" as const,
    description: "Test fişi",
    lines: [
      { accountId: "550e8400-e29b-41d4-a716-446655440001", debitAmount: "100.00", creditAmount: "0", currency: "TRY", exchangeRate: "1" },
      { accountId: "550e8400-e29b-41d4-a716-446655440002", debitAmount: "0", creditAmount: "100.00", currency: "TRY", exchangeRate: "1" },
    ],
  };

  it("dengeli fişi kabul eder", () => {
    const result = createJournalEntrySchema.safeParse(validEntry);
    expect(result.success).toBe(true);
  });

  it("dengesiz fişi reddeder", () => {
    const result = createJournalEntrySchema.safeParse({
      ...validEntry,
      lines: [
        { accountId: "550e8400-e29b-41d4-a716-446655440001", debitAmount: "100.00", creditAmount: "0", currency: "TRY", exchangeRate: "1" },
        { accountId: "550e8400-e29b-41d4-a716-446655440002", debitAmount: "0", creditAmount: "50.00", currency: "TRY", exchangeRate: "1" },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("tek satırlı fişi reddeder", () => {
    const result = createJournalEntrySchema.safeParse({
      ...validEntry,
      lines: [
        { accountId: "550e8400-e29b-41d4-a716-446655440001", debitAmount: "100.00", creditAmount: "0", currency: "TRY", exchangeRate: "1" },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("aynı satırda borç ve alacak olan fişi reddeder", () => {
    const result = createJournalEntrySchema.safeParse({
      ...validEntry,
      lines: [
        { accountId: "550e8400-e29b-41d4-a716-446655440001", debitAmount: "50.00", creditAmount: "50.00", currency: "TRY", exchangeRate: "1" },
        { accountId: "550e8400-e29b-41d4-a716-446655440002", debitAmount: "50.00", creditAmount: "50.00", currency: "TRY", exchangeRate: "1" },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("açıklama olmadan reddeder", () => {
    const result = createJournalEntrySchema.safeParse({
      ...validEntry,
      description: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("createContactSchema", () => {
  it("geçerli cari hesabı kabul eder", () => {
    const result = createContactSchema.safeParse({
      type: "customer",
      taxId: "1234567890",
      name: "Test Firması",
    });
    expect(result.success).toBe(true);
  });

  it("VKN olmadan reddeder", () => {
    const result = createContactSchema.safeParse({
      type: "customer",
      taxId: "123",
      name: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("isim olmadan reddeder", () => {
    const result = createContactSchema.safeParse({
      type: "customer",
      taxId: "1234567890",
      name: "",
    });
    expect(result.success).toBe(false);
  });
});
