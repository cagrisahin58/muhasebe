/**
 * Para tutarını formatla (Türk Lirası)
 */
export function formatCurrency(amount: string | number, currency = "TRY"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Tarihi Türkçe formatta göster
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("tr-TR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/**
 * Tarih ve saati Türkçe formatta göster
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("tr-TR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * KDV hesapla (hariç → dahil veya dahil → hariç)
 */
export function calculateKdv(
  amount: number,
  rate: number,
  inclusive: boolean = false
): { net: number; tax: number; gross: number } {
  if (inclusive) {
    const net = amount / (1 + rate / 100);
    const tax = amount - net;
    return {
      net: roundCurrency(net),
      tax: roundCurrency(tax),
      gross: roundCurrency(amount),
    };
  }
  const tax = amount * (rate / 100);
  return {
    net: roundCurrency(amount),
    tax: roundCurrency(tax),
    gross: roundCurrency(amount + tax),
  };
}

/**
 * Tevkifat hesapla
 */
export function calculateWithholding(
  kdvAmount: number,
  numerator: number,
  denominator: number
): { withheld: number; remaining: number } {
  const withheld = kdvAmount * (numerator / denominator);
  return {
    withheld: roundCurrency(withheld),
    remaining: roundCurrency(kdvAmount - withheld),
  };
}

/**
 * Para tutarını 2 ondalık basamağa yuvarla
 */
export function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Hesap kodundan ana grubu belirle (1-7)
 */
export function getAccountGroup(code: string): string {
  return code.charAt(0);
}

/**
 * Hesap kodundan hesap seviyesini hesapla
 */
export function getAccountLevel(code: string): number {
  if (code.length <= 1) return 1;
  if (code.length <= 2) return 2;
  return code.replace(/\./g, "").length <= 3 ? 3 : 4;
}

/**
 * Hesap kodundan hesap tipini belirle (Tekdüzen Hesap Planı kuralları)
 */
export function getAccountTypeFromCode(code: string): "asset" | "liability" | "equity" | "revenue" | "expense" {
  const group = code.charAt(0);
  switch (group) {
    case "1":
    case "2":
      return "asset";
    case "3":
    case "4":
      return "liability";
    case "5":
      return "equity";
    case "6":
      return "revenue";
    case "7":
      return "expense";
    default:
      return "asset";
  }
}

/**
 * VKN doğrulama algoritması (mod 10)
 */
export function validateVkn(vkn: string): boolean {
  if (!/^\d{10}$/.test(vkn)) return false;

  const digits = vkn.split("").map(Number);
  let sum = 0;

  for (let i = 0; i < 9; i++) {
    const tmp = ((digits[i]! + (9 - i)) % 10) as number;
    const val = (tmp * Math.pow(2, 9 - i)) % 9;
    sum += tmp === 0 ? 9 : val === 0 ? 9 : val;
  }

  return (10 - (sum % 10)) % 10 === digits[9];
}

/**
 * TCKN doğrulama algoritması
 */
export function validateTckn(tckn: string): boolean {
  if (!/^\d{11}$/.test(tckn)) return false;
  if (tckn.charAt(0) === "0") return false;

  const digits = tckn.split("").map(Number);

  const oddSum = (digits[0]! + digits[2]! + digits[4]! + digits[6]! + digits[8]!) as number;
  const evenSum = (digits[1]! + digits[3]! + digits[5]! + digits[7]!) as number;

  const check10 = ((oddSum * 7 - evenSum) % 10 + 10) % 10;
  if (check10 !== digits[9]) return false;

  const sumFirst10 = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  if (sumFirst10 % 10 !== digits[10]) return false;

  return true;
}

/**
 * Fatura numarası üret (GİB formatı: ABC2024000000001)
 */
export function generateInvoiceNumber(prefix: string, year: number, sequence: number): string {
  const paddedPrefix = prefix.toUpperCase().padEnd(3, "A").slice(0, 3);
  const paddedSequence = String(sequence).padStart(9, "0");
  return `${paddedPrefix}${year}${paddedSequence}`;
}

/**
 * Dönem stringi üret (YYYY-MM)
 */
export function toPeriodString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}
