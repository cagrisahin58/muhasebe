import { eq, and, desc, sql, asc } from "drizzle-orm";
import type { Database } from "@finbooks/db";
import {
  invoices,
  invoiceLines,
  contacts,
  journalEntries,
  journalLines,
  accounts,
  fiscalYears,
} from "@finbooks/db";
import { roundCurrency, toPeriodString } from "@finbooks/shared";
import type { CreateInvoiceInput, InvoiceLineInput } from "@finbooks/shared";

// Re-export pure calculation logic (testable without DB deps)
export { calculateInvoiceTotals } from "./invoice.calc.js";
export type { InvoiceLineCalc, InvoiceTotals } from "./invoice.calc.js";

/** Faturadan otomatik muhasebe fişi oluştur */
export async function createInvoiceJournalEntry(
  db: Database,
  invoiceId: string,
  tenantId: string,
  userId: string,
  invoiceData: {
    type: string;
    contactId: string;
    invoiceDate: Date;
    grandTotal: string;
    taxTotal: string;
    netTotal: string;
    withholdingTotal: string;
    description: string;
  }
): Promise<string> {
  // Aktif mali yıl
  const fiscalYear = await db.query.fiscalYears.findFirst({
    where: and(eq(fiscalYears.tenantId, tenantId), eq(fiscalYears.isCurrent, true)),
  });

  if (!fiscalYear) throw new Error("Aktif mali yıl bulunamadı");

  // Fiş numarası
  const lastEntry = await db
    .select({ entryNo: journalEntries.entryNo })
    .from(journalEntries)
    .where(and(eq(journalEntries.tenantId, tenantId), eq(journalEntries.fiscalYearId, fiscalYear.id)))
    .orderBy(desc(journalEntries.entryNo))
    .limit(1);

  const nextEntryNo = (lastEntry[0]?.entryNo ?? 0) + 1;

  // Hesapları bul (tenant bazlı)
  const findAccount = async (code: string) => {
    const acc = await db.query.accounts.findFirst({
      where: and(eq(accounts.tenantId, tenantId), eq(accounts.code, code)),
    });
    return acc?.id;
  };

  const isSale = invoiceData.type === "sale" || invoiceData.type === "sale_return";

  // Satış faturası: Borç 120 (Alıcılar), Alacak 600 (Satışlar) + 391 (Hesaplanan KDV)
  // Alış faturası: Borç 153 (Ticari Mallar) + 191 (İndirilecek KDV), Alacak 320 (Satıcılar)
  let entryLines: { accountId: string; debitAmount: string; creditAmount: string; description: string; contactId: string | null }[];

  if (isSale) {
    const alicilarId = await findAccount("120");
    const satislarId = await findAccount("600");
    const hesaplananKdvId = await findAccount("391");

    if (!alicilarId || !satislarId || !hesaplananKdvId) {
      throw new Error("Gerekli muhasebe hesapları bulunamadı (120, 600, 391)");
    }

    entryLines = [
      {
        accountId: alicilarId,
        debitAmount: invoiceData.grandTotal,
        creditAmount: "0",
        description: invoiceData.description,
        contactId: invoiceData.contactId,
      },
      {
        accountId: satislarId,
        debitAmount: "0",
        creditAmount: invoiceData.netTotal,
        description: invoiceData.description,
        contactId: null,
      },
    ];

    if (parseFloat(invoiceData.taxTotal) > 0) {
      entryLines.push({
        accountId: hesaplananKdvId,
        debitAmount: "0",
        creditAmount: invoiceData.taxTotal,
        description: "KDV",
        contactId: null,
      });
    }

    // Tevkifat varsa
    if (parseFloat(invoiceData.withholdingTotal) > 0) {
      // Tevkifat tutarı alıcılar borcundan düşer (grand total zaten düşülmüş)
      // 136 Diğer Çeşitli Alacaklar üzerinden takip
      const digerAlacakId = await findAccount("136");
      if (digerAlacakId) {
        entryLines.push({
          accountId: digerAlacakId,
          debitAmount: invoiceData.withholdingTotal,
          creditAmount: "0",
          description: "KDV Tevkifatı",
          contactId: null,
        });
      }
    }
  } else {
    // Alış faturası
    const saticilarId = await findAccount("320");
    const ticariMalId = await findAccount("153");
    const indirilecekKdvId = await findAccount("191");

    if (!saticilarId || !ticariMalId || !indirilecekKdvId) {
      throw new Error("Gerekli muhasebe hesapları bulunamadı (320, 153, 191)");
    }

    entryLines = [
      {
        accountId: ticariMalId,
        debitAmount: invoiceData.netTotal,
        creditAmount: "0",
        description: invoiceData.description,
        contactId: null,
      },
    ];

    if (parseFloat(invoiceData.taxTotal) > 0) {
      entryLines.push({
        accountId: indirilecekKdvId,
        debitAmount: invoiceData.taxTotal,
        creditAmount: "0",
        description: "KDV",
        contactId: null,
      });
    }

    entryLines.push({
      accountId: saticilarId,
      debitAmount: "0",
      creditAmount: invoiceData.grandTotal,
      description: invoiceData.description,
      contactId: invoiceData.contactId,
    });

    // Tevkifat varsa 360 hesabına alacak kaydı
    if (parseFloat(invoiceData.withholdingTotal) > 0) {
      const odenecekVergiId = await findAccount("360");
      if (odenecekVergiId) {
        entryLines.push({
          accountId: odenecekVergiId,
          debitAmount: "0",
          creditAmount: invoiceData.withholdingTotal,
          description: "KDV Tevkifatı",
          contactId: null,
        });
      }
    }
  }

  // Fişi oluştur
  const [entry] = await db
    .insert(journalEntries)
    .values({
      tenantId,
      fiscalYearId: fiscalYear.id,
      entryNo: nextEntryNo,
      entryDate: invoiceData.invoiceDate,
      entryType: "mahsup",
      description: `Fatura: ${invoiceData.description}`,
      status: "approved",
      createdBy: userId,
      approvedBy: userId,
    })
    .returning();

  // Satırları oluştur
  await db.insert(journalLines).values(
    entryLines.map((line) => ({
      entryId: entry!.id,
      accountId: line.accountId,
      debitAmount: line.debitAmount,
      creditAmount: line.creditAmount,
      description: line.description,
      contactId: line.contactId,
    }))
  );

  return entry!.id;
}
