import type {
  UserRole,
  JournalEntryType,
  JournalEntryStatus,
  ContactType,
  AccountType,
  InvoiceType,
  InvoiceStatus,
} from "../constants/index.js";

/** Temel entity arayüzü */
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Tenant (Firma) */
export interface Tenant extends BaseEntity {
  name: string;
  taxId: string;
  taxOffice: string;
  address: string;
  city: string;
  district: string;
  phone: string | null;
  email: string | null;
  logo: string | null;
  settings: TenantSettings;
}

export interface TenantSettings {
  defaultCurrency: string;
  defaultKdvRate: number;
  fiscalYearStart: number; // month 1-12
  invoicePrefix: string;
}

/** Kullanıcı */
export interface User extends BaseEntity {
  tenantId: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  mfaEnabled: boolean;
  lastLoginAt: Date | null;
}

/** Mali Yıl */
export interface FiscalYear extends BaseEntity {
  tenantId: string;
  year: number;
  startDate: Date;
  endDate: Date;
  isClosed: boolean;
  isCurrent: boolean;
}

/** Hesap Planı */
export interface Account extends BaseEntity {
  tenantId: string;
  code: string;
  name: string;
  parentId: string | null;
  type: AccountType;
  level: number;
  isSystem: boolean;
  isActive: boolean;
}

/** Hesap Bakiyesi */
export interface AccountBalance {
  accountId: string;
  period: string; // YYYY-MM
  debitTotal: string;
  creditTotal: string;
  balance: string;
}

/** Yevmiye Kaydı (Fiş) */
export interface JournalEntry extends BaseEntity {
  tenantId: string;
  fiscalYearId: string;
  entryNo: number;
  entryDate: Date;
  entryType: JournalEntryType;
  description: string;
  status: JournalEntryStatus;
  createdBy: string;
  approvedBy: string | null;
  lines: JournalLine[];
}

/** Yevmiye Satırı */
export interface JournalLine {
  id: string;
  entryId: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debitAmount: string;
  creditAmount: string;
  description: string | null;
  contactId: string | null;
  currency: string;
  exchangeRate: string;
}

/** Cari Hesap */
export interface Contact extends BaseEntity {
  tenantId: string;
  type: ContactType;
  taxId: string;
  name: string;
  shortName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  taxOffice: string | null;
  creditLimit: string | null;
  balance: string;
  tags: string[];
}

/** Fatura */
export interface Invoice extends BaseEntity {
  tenantId: string;
  contactId: string;
  invoiceNo: string;
  invoiceDate: Date;
  dueDate: Date | null;
  type: InvoiceType;
  status: InvoiceStatus;
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  grandTotal: string;
  currency: string;
  exchangeRate: string;
  notes: string | null;
  journalEntryId: string | null;
  lines: InvoiceLine[];
}

/** Fatura Satırı */
export interface InvoiceLine {
  id: string;
  invoiceId: string;
  description: string;
  quantity: string;
  unitPrice: string;
  discountRate: string;
  taxRate: number;
  withholdingRate: string | null;
  lineTotal: string;
}

/** Audit Log */
export interface AuditLog {
  id: string;
  tenantId: string;
  userId: string;
  action: "create" | "update" | "delete" | "login" | "logout" | "approve" | "reject";
  entityType: string;
  entityId: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

/** API Response */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/** Paginated Response */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Mizan Satırı */
export interface TrialBalanceRow {
  accountCode: string;
  accountName: string;
  openingDebit: string;
  openingCredit: string;
  periodDebit: string;
  periodCredit: string;
  closingDebit: string;
  closingCredit: string;
}
