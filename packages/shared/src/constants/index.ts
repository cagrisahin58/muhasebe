/** KDV Oranları (2025-2026 güncel) */
export const KDV_RATES = [0, 1, 10, 20] as const;
export type KdvRate = (typeof KDV_RATES)[number];

export const DEFAULT_KDV_RATE: KdvRate = 20;

/** Tevkifat Oranları */
export const WITHHOLDING_RATES = {
  ISGUCU_TEMIN: { numerator: 9, denominator: 10, label: "İşgücü Temin Hizmetleri" },
  YAPIM_ISLERI: { numerator: 4, denominator: 10, label: "Yapım İşleri" },
  DANISMANLIK: { numerator: 9, denominator: 10, label: "Etüt, Plan-Proje, Danışmanlık" },
  BAKIM_ONARIM: { numerator: 7, denominator: 10, label: "Makine, Teçhizat Bakım-Onarım" },
  YEMEK_SERVISI: { numerator: 5, denominator: 10, label: "Yemek Servisi" },
  YAPI_DENETIM: { numerator: 9, denominator: 10, label: "Yapı Denetim Hizmetleri" },
  TEMIZLIK: { numerator: 9, denominator: 10, label: "Temizlik Hizmetleri" },
  SERVIS_TASIMACILIGI: { numerator: 5, denominator: 10, label: "Servis Taşımacılığı" },
  BASKI_BASIM: { numerator: 7, denominator: 10, label: "Baskı ve Basım Hizmetleri" },
  TICARI_REKLAM: { numerator: 3, denominator: 10, label: "Ticari Reklam Hizmetleri" },
} as const;

/** Para Birimleri */
export const CURRENCIES = {
  TRY: { code: "TRY", symbol: "₺", name: "Türk Lirası" },
  USD: { code: "USD", symbol: "$", name: "ABD Doları" },
  EUR: { code: "EUR", symbol: "€", name: "Euro" },
  GBP: { code: "GBP", symbol: "£", name: "İngiliz Sterlini" },
} as const;

export const DEFAULT_CURRENCY = "TRY";

/** Fiş Türleri */
export const JOURNAL_ENTRY_TYPES = {
  MAHSUP: "mahsup",
  TAHSIL: "tahsil",
  TEDIYE: "tediye",
  ACILIS: "acilis",
  KAPANIS: "kapanis",
} as const;

export type JournalEntryType = (typeof JOURNAL_ENTRY_TYPES)[keyof typeof JOURNAL_ENTRY_TYPES];

/** Fiş Durumları */
export const JOURNAL_ENTRY_STATUSES = {
  DRAFT: "draft",
  APPROVED: "approved",
  REJECTED: "rejected",
  REVERSED: "reversed",
} as const;

export type JournalEntryStatus = (typeof JOURNAL_ENTRY_STATUSES)[keyof typeof JOURNAL_ENTRY_STATUSES];

/** Kullanıcı Rolleri */
export const USER_ROLES = {
  ADMIN: "admin",
  ACCOUNTANT: "accountant",
  VIEWER: "viewer",
  LIMITED: "limited",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/** Cari Hesap Türleri */
export const CONTACT_TYPES = {
  CUSTOMER: "customer",
  SUPPLIER: "supplier",
  BOTH: "both",
} as const;

export type ContactType = (typeof CONTACT_TYPES)[keyof typeof CONTACT_TYPES];

/** Fatura Türleri */
export const INVOICE_TYPES = {
  SALE: "sale",
  PURCHASE: "purchase",
  SALE_RETURN: "sale_return",
  PURCHASE_RETURN: "purchase_return",
} as const;

export type InvoiceType = (typeof INVOICE_TYPES)[keyof typeof INVOICE_TYPES];

/** Fatura Durumları */
export const INVOICE_STATUSES = {
  DRAFT: "draft",
  SENT: "sent",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
  PAID: "paid",
} as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[keyof typeof INVOICE_STATUSES];

/** Hesap Planı Ana Grupları */
export const ACCOUNT_GROUPS = {
  "1": "DÖNEN VARLIKLAR",
  "2": "DURAN VARLIKLAR",
  "3": "KISA VADELİ YABANCI KAYNAKLAR",
  "4": "UZUN VADELİ YABANCI KAYNAKLAR",
  "5": "ÖZKAYNAKLAR",
  "6": "GELİR TABLOSU HESAPLARI",
  "7": "MALİYET HESAPLARI",
} as const;

/** Hesap Tipleri */
export const ACCOUNT_TYPES = {
  ASSET: "asset",
  LIABILITY: "liability",
  EQUITY: "equity",
  REVENUE: "revenue",
  EXPENSE: "expense",
} as const;

export type AccountType = (typeof ACCOUNT_TYPES)[keyof typeof ACCOUNT_TYPES];

/** Banka Hesap Türleri */
export const BANK_ACCOUNT_TYPES = {
  CHECKING: "checking",
  SAVINGS: "savings",
  CREDIT: "credit",
} as const;

export type BankAccountType = (typeof BANK_ACCOUNT_TYPES)[keyof typeof BANK_ACCOUNT_TYPES];

/** Banka Hareket Türleri */
export const BANK_TRANSACTION_TYPES = {
  DEPOSIT: "deposit",
  WITHDRAWAL: "withdrawal",
  TRANSFER: "transfer",
  FEE: "fee",
  INTEREST: "interest",
} as const;

export type BankTransactionType = (typeof BANK_TRANSACTION_TYPES)[keyof typeof BANK_TRANSACTION_TYPES];

/** Çek/Senet Türleri */
export const CHECK_TYPES = {
  RECEIVED_CHECK: "received_check",
  GIVEN_CHECK: "given_check",
  RECEIVED_NOTE: "received_note",
  GIVEN_NOTE: "given_note",
} as const;

export type CheckType = (typeof CHECK_TYPES)[keyof typeof CHECK_TYPES];

/** Çek/Senet Durumları */
export const CHECK_STATUSES = {
  PORTFOLIO: "portfolio",
  IN_COLLECTION: "in_collection",
  COLLECTED: "collected",
  ENDORSED: "endorsed",
  BOUNCED: "bounced",
  PAID: "paid",
  CANCELLED: "cancelled",
} as const;

export type CheckStatus = (typeof CHECK_STATUSES)[keyof typeof CHECK_STATUSES];

/** Kasa Hareket Türleri */
export const CASH_TRANSACTION_TYPES = {
  INCOME: "income",
  EXPENSE: "expense",
  TRANSFER: "transfer",
} as const;

export type CashTransactionType = (typeof CASH_TRANSACTION_TYPES)[keyof typeof CASH_TRANSACTION_TYPES];

/** Beyanname Türleri */
export const DECLARATION_TYPES = {
  KDV1: "kdv1",
  KDV2: "kdv2",
  MUHTASAR: "muhtasar",
  GECICI_VERGI: "gecici_vergi",
  YILLIK_GELIR: "yillik_gelir",
  YILLIK_KURUMLAR: "yillik_kurumlar",
  DAMGA: "damga",
} as const;

export type DeclarationType = (typeof DECLARATION_TYPES)[keyof typeof DECLARATION_TYPES];

/** Beyanname Durumları */
export const DECLARATION_STATUSES = {
  DRAFT: "draft",
  CALCULATED: "calculated",
  VALIDATED: "validated",
  SUBMITTED: "submitted",
  ACCEPTED: "accepted",
  REVISION_NEEDED: "revision_needed",
} as const;

export type DeclarationStatus = (typeof DECLARATION_STATUSES)[keyof typeof DECLARATION_STATUSES];

/** Vergi Takvimi */
export const TAX_CALENDAR = {
  KDV1_DUE_DAY: 28,
  MUHTASAR_DUE_DAY: 26,
  GECICI_VERGI_DUE_DAY: 17,
} as const;

/** Türk Bankaları */
export const TURKISH_BANKS = [
  { code: "0010", name: "T.C. Ziraat Bankası" },
  { code: "0012", name: "Türkiye Halk Bankası" },
  { code: "0015", name: "Türkiye Vakıflar Bankası" },
  { code: "0032", name: "Türk Ekonomi Bankası" },
  { code: "0046", name: "Akbank" },
  { code: "0064", name: "Türkiye İş Bankası" },
  { code: "0067", name: "Yapı ve Kredi Bankası" },
  { code: "0099", name: "ING Bank" },
  { code: "0111", name: "QNB Finansbank" },
  { code: "0134", name: "DenizBank" },
  { code: "0146", name: "Türkiye Garanti Bankası" },
  { code: "0203", name: "Alternatifbank" },
  { code: "0205", name: "Kuveyt Türk" },
  { code: "0206", name: "Türkiye Finans" },
  { code: "0210", name: "Ziraat Katılım Bankası" },
  { code: "0211", name: "Vakıf Katılım Bankası" },
] as const;
