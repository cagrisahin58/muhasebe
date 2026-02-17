import { roundCurrency } from "@finbooks/shared";

/**
 * KDV Beyannamesi (KDV-1) Hesaplama Motoru
 *
 * Formül:
 * Hesaplanan KDV (391) - İndirilecek KDV (191) = Ödenecek/Devreden KDV
 *   + Tevkifatlı İşlemler
 *   + İstisna Kapsamındaki İşlemler
 *   + İhracat İstisnası
 *   = KDV-1 Beyannamesi
 */

export interface KdvDeclarationInput {
  /** Hesaplanan KDV tutarları (391 hesabı, KDV oranlarına göre) */
  calculatedKdv: KdvByRate[];
  /** İndirilecek KDV tutarları (191 hesabı, KDV oranlarına göre) */
  deductibleKdv: KdvByRate[];
  /** Önceki dönemden devreden KDV */
  previousPeriodCarryOver: number;
  /** Tevkifatlı işlemlerden hesaplanan KDV */
  withholdingKdv: number;
  /** İstisna kapsamındaki teslim ve hizmetler (KDV'si 0 ama bildirilir) */
  exemptTransactions: number;
  /** İhracat istisnası tutarı */
  exportExemption: number;
}

export interface KdvByRate {
  rate: number; // 0, 1, 10, 20
  taxableAmount: number; // Matrah
  taxAmount: number; // KDV tutarı
}

export interface KdvDeclarationResult {
  /** KDV oranlarına göre hesaplanan KDV kırılımı */
  calculatedByRate: KdvByRate[];
  /** Toplam hesaplanan KDV */
  totalCalculatedKdv: number;
  /** Toplam matrah */
  totalTaxableAmount: number;
  /** KDV oranlarına göre indirilecek KDV kırılımı */
  deductibleByRate: KdvByRate[];
  /** Toplam indirilecek KDV */
  totalDeductibleKdv: number;
  /** Önceki dönemden devreden KDV */
  previousPeriodCarryOver: number;
  /** Toplam indirimler (indirilecek + devreden) */
  totalDeductions: number;
  /** Tevkifatlı işlemlerden KDV */
  withholdingKdv: number;
  /** İstisna işlemleri tutarı */
  exemptTransactions: number;
  /** İhracat istisnası */
  exportExemption: number;
  /** Fark (Hesaplanan - İndirimler) */
  difference: number;
  /** Ödenecek KDV (fark > 0 ise) */
  payableKdv: number;
  /** Sonraki döneme devreden KDV (fark < 0 ise) */
  carryOverKdv: number;
}

/** KDV-1 beyannamesi hesapla */
export function calculateKdv1Declaration(input: KdvDeclarationInput): KdvDeclarationResult {
  const totalCalculatedKdv = roundCurrency(
    input.calculatedKdv.reduce((s, k) => s + k.taxAmount, 0)
  );
  const totalTaxableAmount = roundCurrency(
    input.calculatedKdv.reduce((s, k) => s + k.taxableAmount, 0)
  );
  const totalDeductibleKdv = roundCurrency(
    input.deductibleKdv.reduce((s, k) => s + k.taxAmount, 0)
  );

  const totalDeductions = roundCurrency(
    totalDeductibleKdv + input.previousPeriodCarryOver
  );

  // Hesaplanan KDV (+ tevkifat) - İndirimler = Fark
  const difference = roundCurrency(
    totalCalculatedKdv + input.withholdingKdv - totalDeductions
  );

  const payableKdv = difference > 0 ? difference : 0;
  const carryOverKdv = difference < 0 ? Math.abs(difference) : 0;

  return {
    calculatedByRate: input.calculatedKdv,
    totalCalculatedKdv,
    totalTaxableAmount,
    deductibleByRate: input.deductibleKdv,
    totalDeductibleKdv,
    previousPeriodCarryOver: input.previousPeriodCarryOver,
    totalDeductions,
    withholdingKdv: input.withholdingKdv,
    exemptTransactions: input.exemptTransactions,
    exportExemption: input.exportExemption,
    difference,
    payableKdv,
    carryOverKdv,
  };
}

/**
 * Muhtasar Beyanname Hesaplama
 * Stopaj (gelir vergisi tevkifatı) hesaplama
 */
export interface MuhtasarInput {
  /** Brüt ücretler */
  grossWages: number;
  /** Serbest meslek ödemeleri */
  freelancePayments: number;
  /** Kira ödemeleri */
  rentPayments: number;
  /** Diğer stopaj tutarları */
  otherWithholdings: { description: string; grossAmount: number; rate: number }[];
}

export interface MuhtasarResult {
  wageWithholding: number; // Ücret stopajı (%15 ortalama)
  freelanceWithholding: number; // Serbest meslek stopajı (%20)
  rentWithholding: number; // Kira stopajı (%20)
  otherWithholdings: { description: string; grossAmount: number; rate: number; amount: number }[];
  totalWithholding: number;
}

export function calculateMuhtasar(input: MuhtasarInput): MuhtasarResult {
  const wageWithholding = roundCurrency(input.grossWages * 0.15);
  const freelanceWithholding = roundCurrency(input.freelancePayments * 0.20);
  const rentWithholding = roundCurrency(input.rentPayments * 0.20);

  const otherWithholdings = input.otherWithholdings.map((o) => ({
    ...o,
    amount: roundCurrency(o.grossAmount * (o.rate / 100)),
  }));

  const totalWithholding = roundCurrency(
    wageWithholding +
    freelanceWithholding +
    rentWithholding +
    otherWithholdings.reduce((s, o) => s + o.amount, 0)
  );

  return {
    wageWithholding,
    freelanceWithholding,
    rentWithholding,
    otherWithholdings,
    totalWithholding,
  };
}

/**
 * Geçici Vergi Hesaplama
 * Üç aylık dönemlerde (Q1-Q4) hesaplanır
 */
export interface GeciciVergiInput {
  /** Dönem geliri (6xx hesapları toplamı) */
  periodRevenue: number;
  /** Dönem gideri (7xx hesapları toplamı) */
  periodExpense: number;
  /** Önceki dönemlerde tahakkuk eden geçici vergi */
  previousPeriodTax: number;
  /** Vergi oranı (Kurumlar: %25, Gelir: dilimli) */
  taxRate: number;
}

export interface GeciciVergiResult {
  periodProfit: number;
  cumulativeTax: number;
  previousPeriodTax: number;
  payableTax: number;
}

export function calculateGeciciVergi(input: GeciciVergiInput): GeciciVergiResult {
  const periodProfit = roundCurrency(input.periodRevenue - input.periodExpense);
  const cumulativeTax = periodProfit > 0
    ? roundCurrency(periodProfit * (input.taxRate / 100))
    : 0;
  const payableTax = Math.max(0, roundCurrency(cumulativeTax - input.previousPeriodTax));

  return {
    periodProfit,
    cumulativeTax,
    previousPeriodTax: input.previousPeriodTax,
    payableTax,
  };
}
