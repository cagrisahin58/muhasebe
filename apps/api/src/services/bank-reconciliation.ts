import { roundCurrency } from "@finbooks/shared";

/**
 * Banka Mutabakatı (Bank Reconciliation) Motoru
 *
 * Banka ekstresi satırlarını muhasebe kayıtlarıyla otomatik eşleştirir.
 */

export interface BankStatementRow {
  id: string;
  date: string;
  description: string;
  reference?: string;
  amount: number; // + = giriş, - = çıkış
}

export interface JournalLineForMatch {
  id: string;
  entryDate: string;
  description: string;
  accountCode: string;
  amount: number; // + borç, - alacak
  contactName?: string;
}

export interface ReconciliationMatch {
  bankTransactionId: string;
  journalLineId: string;
  confidence: number; // 0-100
  matchReason: string;
}

export interface ReconciliationResult {
  matched: ReconciliationMatch[];
  unmatchedBank: string[]; // bankTransactionId'ler
  unmatchedJournal: string[]; // journalLineId'ler
  matchRate: number; // yüzde
}

/**
 * Otomatik banka mutabakatı yap
 *
 * Eşleştirme kriterleri:
 * 1. Tutar tam eşleşme (en yüksek güven)
 * 2. Tutar + tarih yakınlığı (3 gün içinde)
 * 3. Tutar + açıklama benzerliği
 */
export function reconcileBankStatements(
  bankRows: BankStatementRow[],
  journalLines: JournalLineForMatch[]
): ReconciliationResult {
  const matched: ReconciliationMatch[] = [];
  const usedBankIds = new Set<string>();
  const usedJournalIds = new Set<string>();

  // 1. Geçiş: Tam tutar + yakın tarih eşleşmesi
  for (const bankRow of bankRows) {
    if (usedBankIds.has(bankRow.id)) continue;

    let bestMatch: ReconciliationMatch | null = null;

    for (const jLine of journalLines) {
      if (usedJournalIds.has(jLine.id)) continue;

      // Tutar kontrolü (küçük yuvarlama farkları tolere edilir)
      const amountDiff = Math.abs(Math.abs(bankRow.amount) - Math.abs(jLine.amount));
      if (amountDiff > 0.02) continue;

      let confidence = 50; // Tutar eşleşti -> başlangıç %50
      let reason = "Tutar eşleşmesi";

      // Tarih yakınlığı kontrolü
      const bankDate = new Date(bankRow.date);
      const journalDate = new Date(jLine.entryDate);
      const daysDiff = Math.abs(bankDate.getTime() - journalDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysDiff === 0) {
        confidence += 30;
        reason += " + aynı gün";
      } else if (daysDiff <= 1) {
        confidence += 25;
        reason += " + 1 gün fark";
      } else if (daysDiff <= 3) {
        confidence += 15;
        reason += ` + ${Math.round(daysDiff)} gün fark`;
      } else if (daysDiff > 7) {
        continue; // 7 günden fazla fark varsa eşleştirme yapma
      }

      // Açıklama benzerliği
      if (bankRow.reference && jLine.description.includes(bankRow.reference)) {
        confidence += 20;
        reason += " + referans eşleşmesi";
      } else if (descriptionSimilarity(bankRow.description, jLine.description) > 0.4) {
        confidence += 10;
        reason += " + açıklama benzerliği";
      }

      if (!bestMatch || confidence > bestMatch.confidence) {
        bestMatch = {
          bankTransactionId: bankRow.id,
          journalLineId: jLine.id,
          confidence: Math.min(confidence, 100),
          matchReason: reason,
        };
      }
    }

    if (bestMatch && bestMatch.confidence >= 50) {
      matched.push(bestMatch);
      usedBankIds.add(bestMatch.bankTransactionId);
      usedJournalIds.add(bestMatch.journalLineId);
    }
  }

  const unmatchedBank = bankRows
    .filter((r) => !usedBankIds.has(r.id))
    .map((r) => r.id);
  const unmatchedJournal = journalLines
    .filter((l) => !usedJournalIds.has(l.id))
    .map((l) => l.id);

  const total = bankRows.length;
  const matchRate = total > 0 ? roundCurrency((matched.length / total) * 100) : 0;

  return { matched, unmatchedBank, unmatchedJournal, matchRate };
}

/**
 * Basit açıklama benzerliği (Jaccard benzerliği)
 */
function descriptionSimilarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/));
  const setB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * CSV formatındaki banka ekstresini parse et
 */
export function parseBankStatementCsv(
  csv: string,
  mapping: {
    dateColumn: number;
    descriptionColumn: number;
    amountColumn: number;
    referenceColumn?: number;
    dateFormat?: string; // DD.MM.YYYY (Türk formatı) veya YYYY-MM-DD
    delimiter?: string;
    skipRows?: number;
  }
): BankStatementRow[] {
  const lines = csv.trim().split("\n");
  const delimiter = mapping.delimiter ?? ";";
  const skipRows = mapping.skipRows ?? 1;
  const rows: BankStatementRow[] = [];

  for (let i = skipRows; i < lines.length; i++) {
    const cols = lines[i]!.split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ""));

    const dateStr = cols[mapping.dateColumn] ?? "";
    const description = cols[mapping.descriptionColumn] ?? "";
    const amountStr = cols[mapping.amountColumn] ?? "0";
    const reference = mapping.referenceColumn !== undefined ? cols[mapping.referenceColumn] : undefined;

    // Tarih parse (DD.MM.YYYY -> YYYY-MM-DD)
    let parsedDate = dateStr;
    if (dateStr.includes(".")) {
      const parts = dateStr.split(".");
      if (parts.length === 3) {
        parsedDate = `${parts[2]}-${parts[1]!.padStart(2, "0")}-${parts[0]!.padStart(2, "0")}`;
      }
    }

    // Tutar parse: Türk formatı (1.234,56) veya uluslararası (1234.56)
    let amount: number;
    if (amountStr.includes(",")) {
      // Türk formatı: binlik ayırıcı nokta, ondalık virgül
      amount = parseFloat(amountStr.replace(/\./g, "").replace(",", "."));
    } else {
      amount = parseFloat(amountStr);
    }

    if (isNaN(amount) || !parsedDate || !description) continue;

    rows.push({
      id: `csv-${i}`,
      date: parsedDate,
      description,
      reference,
      amount,
    });
  }

  return rows;
}
