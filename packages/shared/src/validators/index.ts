import { z } from "zod";
import {
  USER_ROLES,
  JOURNAL_ENTRY_TYPES,
  JOURNAL_ENTRY_STATUSES,
  CONTACT_TYPES,
  ACCOUNT_TYPES,
  INVOICE_TYPES,
  INVOICE_STATUSES,
  KDV_RATES,
} from "../constants/index.js";

// ========== Ortak Validatörler ==========

/** VKN (Vergi Kimlik Numarası) - 10 haneli */
export const vknSchema = z.string().regex(/^\d{10}$/, "VKN 10 haneli olmalıdır");

/** TCKN (T.C. Kimlik Numarası) - 11 haneli */
export const tcknSchema = z.string().regex(/^\d{11}$/, "TCKN 11 haneli olmalıdır");

/** VKN veya TCKN */
export const taxIdSchema = z.string().regex(/^\d{10,11}$/, "Geçerli bir VKN veya TCKN giriniz");

/** Para tutarı - max 2 ondalık */
export const amountSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Geçerli bir tutar giriniz")
  .refine((val) => parseFloat(val) >= 0, "Tutar negatif olamaz");

/** Pozitif tutar */
export const positiveAmountSchema = amountSchema.refine(
  (val) => parseFloat(val) > 0,
  "Tutar sıfırdan büyük olmalıdır"
);

/** Pagination */
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

/** Tarih aralığı */
export const dateRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).refine(
  (data) => data.startDate <= data.endDate,
  "Başlangıç tarihi bitiş tarihinden sonra olamaz"
);

// ========== Auth Validatörleri ==========

export const loginSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  password: z.string().min(1, "Şifre gereklidir"),
});

export const registerSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  password: z
    .string()
    .min(12, "Şifre en az 12 karakter olmalıdır")
    .regex(/[A-Z]/, "Şifre en az bir büyük harf içermelidir")
    .regex(/[a-z]/, "Şifre en az bir küçük harf içermelidir")
    .regex(/[0-9]/, "Şifre en az bir rakam içermelidir"),
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır").max(100),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z
      .string()
      .min(12, "Şifre en az 12 karakter olmalıdır")
      .regex(/[A-Z]/, "Şifre en az bir büyük harf içermelidir")
      .regex(/[a-z]/, "Şifre en az bir küçük harf içermelidir")
      .regex(/[0-9]/, "Şifre en az bir rakam içermelidir"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

// ========== Tenant Validatörleri ==========

export const createTenantSchema = z.object({
  name: z.string().min(2, "Firma adı en az 2 karakter olmalıdır").max(200),
  taxId: taxIdSchema,
  taxOffice: z.string().min(2, "Vergi dairesi gereklidir").max(100),
  address: z.string().min(5, "Adres gereklidir").max(500),
  city: z.string().min(2).max(50),
  district: z.string().min(2).max(50),
  phone: z.string().max(20).nullable().optional(),
  email: z.string().email().nullable().optional(),
});

export const updateTenantSchema = createTenantSchema.partial();

// ========== Hesap Planı Validatörleri ==========

export const createAccountSchema = z.object({
  code: z
    .string()
    .min(3, "Hesap kodu en az 3 karakter olmalıdır")
    .max(20)
    .regex(/^\d+(\.\d+)*$/, "Hesap kodu sadece rakam ve nokta içerebilir"),
  name: z.string().min(2, "Hesap adı en az 2 karakter olmalıdır").max(200),
  parentId: z.string().uuid().nullable().optional(),
  type: z.enum([
    ACCOUNT_TYPES.ASSET,
    ACCOUNT_TYPES.LIABILITY,
    ACCOUNT_TYPES.EQUITY,
    ACCOUNT_TYPES.REVENUE,
    ACCOUNT_TYPES.EXPENSE,
  ]),
});

export const updateAccountSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  isActive: z.boolean().optional(),
});

// ========== Yevmiye Validatörleri ==========

export const journalLineSchema = z.object({
  accountId: z.string().uuid(),
  debitAmount: amountSchema,
  creditAmount: amountSchema,
  description: z.string().max(500).nullable().optional(),
  contactId: z.string().uuid().nullable().optional(),
  currency: z.string().length(3).default("TRY"),
  exchangeRate: z.string().default("1"),
});

export const createJournalEntrySchema = z
  .object({
    entryDate: z.coerce.date(),
    entryType: z.enum([
      JOURNAL_ENTRY_TYPES.MAHSUP,
      JOURNAL_ENTRY_TYPES.TAHSIL,
      JOURNAL_ENTRY_TYPES.TEDIYE,
      JOURNAL_ENTRY_TYPES.ACILIS,
      JOURNAL_ENTRY_TYPES.KAPANIS,
    ]),
    description: z.string().min(1, "Açıklama gereklidir").max(500),
    lines: z
      .array(journalLineSchema)
      .min(2, "En az 2 satır gereklidir"),
  })
  .refine(
    (data) => {
      const totalDebit = data.lines.reduce((sum, l) => sum + parseFloat(l.debitAmount), 0);
      const totalCredit = data.lines.reduce((sum, l) => sum + parseFloat(l.creditAmount), 0);
      return Math.abs(totalDebit - totalCredit) < 0.01;
    },
    { message: "Borç ve alacak toplamları eşit olmalıdır", path: ["lines"] }
  )
  .refine(
    (data) => {
      return data.lines.every(
        (l) =>
          (parseFloat(l.debitAmount) > 0 && parseFloat(l.creditAmount) === 0) ||
          (parseFloat(l.debitAmount) === 0 && parseFloat(l.creditAmount) > 0)
      );
    },
    { message: "Her satırda ya borç ya da alacak dolu olmalıdır, ikisi birden olamaz", path: ["lines"] }
  );

// ========== Cari Hesap Validatörleri ==========

export const createContactSchema = z.object({
  type: z.enum([CONTACT_TYPES.CUSTOMER, CONTACT_TYPES.SUPPLIER, CONTACT_TYPES.BOTH]),
  taxId: taxIdSchema,
  name: z.string().min(2, "Cari hesap adı gereklidir").max(300),
  shortName: z.string().max(50).nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  city: z.string().max(50).nullable().optional(),
  district: z.string().max(50).nullable().optional(),
  taxOffice: z.string().max(100).nullable().optional(),
  creditLimit: amountSchema.nullable().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export const updateContactSchema = createContactSchema.partial();

// ========== Fatura Validatörleri ==========

export const invoiceLineSchema = z.object({
  description: z.string().min(1, "Açıklama gereklidir").max(500),
  quantity: positiveAmountSchema,
  unitPrice: positiveAmountSchema,
  discountRate: z.string().regex(/^\d+(\.\d{1,2})?$/).default("0"),
  taxRate: z.number().refine((v) => (KDV_RATES as readonly number[]).includes(v), "Geçersiz KDV oranı"),
  withholdingRate: z.string().nullable().optional(),
});

export const createInvoiceSchema = z.object({
  contactId: z.string().uuid(),
  invoiceDate: z.coerce.date(),
  dueDate: z.coerce.date().nullable().optional(),
  type: z.enum([
    INVOICE_TYPES.SALE,
    INVOICE_TYPES.PURCHASE,
    INVOICE_TYPES.SALE_RETURN,
    INVOICE_TYPES.PURCHASE_RETURN,
  ]),
  currency: z.string().length(3).default("TRY"),
  exchangeRate: z.string().default("1"),
  notes: z.string().max(1000).nullable().optional(),
  lines: z.array(invoiceLineSchema).min(1, "En az 1 kalem gereklidir"),
});

// ========== Rapor Validatörleri ==========

export const trialBalanceQuerySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  level: z.number().int().min(1).max(5).default(3),
});

export const ledgerQuerySchema = z.object({
  accountId: z.string().uuid(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export const journalBookQuerySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  ...paginationSchema.shape,
});

// ========== Export Types ==========

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type CreateJournalEntryInput = z.infer<typeof createJournalEntrySchema>;
export type JournalLineInput = z.infer<typeof journalLineSchema>;
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type InvoiceLineInput = z.infer<typeof invoiceLineSchema>;
export type TrialBalanceQuery = z.infer<typeof trialBalanceQuerySchema>;
export type LedgerQuery = z.infer<typeof ledgerQuerySchema>;
