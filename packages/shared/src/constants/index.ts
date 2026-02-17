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
