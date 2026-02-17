import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, sql, asc } from "drizzle-orm";
import { createHash } from "crypto";
import { router, protectedProcedure, accountantProcedure } from "./trpc.js";
import { journalEntries, journalLines, accounts, tenants } from "@finbooks/db";
import {
  buildJournalLedgerXml,
  buildGeneralLedgerXml,
  buildBeratXml,
  type ELedgerEntry,
  type ELedgerHeader,
} from "../modules/xbrl-gl/index.js";
import { createAuditLog } from "../middleware/audit.js";

export const eLedgerRouter = router({
  /** Yevmiye Defteri XBRL-GL üret */
  generateJournal: accountantProcedure
    .input(
      z.object({
        year: z.number().int(),
        month: z.number().int().min(1).max(12),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenant = await ctx.db.query.tenants.findFirst({
        where: eq(tenants.id, ctx.user.tenantId),
      });
      if (!tenant) throw new TRPCError({ code: "NOT_FOUND", message: "Firma bulunamadı" });

      const periodStart = `${input.year}-${String(input.month).padStart(2, "0")}-01`;
      const lastDay = new Date(input.year, input.month, 0).getDate();
      const periodEnd = `${input.year}-${String(input.month).padStart(2, "0")}-${lastDay}`;
      const period = `${input.year}-${String(input.month).padStart(2, "0")}`;

      // Onaylanmış fişleri al
      const entries = await ctx.db
        .select()
        .from(journalEntries)
        .where(
          and(
            eq(journalEntries.tenantId, ctx.user.tenantId),
            eq(journalEntries.status, "approved"),
            sql`${journalEntries.entryDate} BETWEEN ${periodStart} AND ${periodEnd}`
          )
        )
        .orderBy(asc(journalEntries.entryNo));

      if (entries.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${period} döneminde onaylanmış yevmiye kaydı bulunamadı`,
        });
      }

      // Her fiş için satırlarını al
      const eLedgerEntries: ELedgerEntry[] = await Promise.all(
        entries.map(async (entry) => {
          const lines = await ctx.db
            .select({
              accountCode: accounts.code,
              accountName: accounts.name,
              debitAmount: journalLines.debitAmount,
              creditAmount: journalLines.creditAmount,
              description: journalLines.description,
            })
            .from(journalLines)
            .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
            .where(eq(journalLines.entryId, entry.id))
            .orderBy(asc(accounts.code));

          const entryDate = entry.entryDate instanceof Date
            ? entry.entryDate.toISOString().split("T")[0]!
            : String(entry.entryDate);

          return {
            entryNo: entry.entryNo,
            entryDate,
            description: entry.description,
            lines: lines.map((l) => ({
              accountCode: l.accountCode,
              accountName: l.accountName,
              debitAmount: parseFloat(l.debitAmount),
              creditAmount: parseFloat(l.creditAmount),
              description: l.description ?? undefined,
            })),
          };
        })
      );

      const header: ELedgerHeader = {
        companyName: tenant.name,
        companyVkn: tenant.taxId,
        taxOffice: tenant.taxOffice,
        period,
        periodStart,
        periodEnd,
        creationDate: new Date().toISOString().split("T")[0]!,
        entryCount: entries.length,
      };

      const xml = buildJournalLedgerXml(header, eLedgerEntries);
      const hash = createHash("sha256").update(xml).digest("hex");

      const berat = buildBeratXml({
        vkn: tenant.taxId,
        companyName: tenant.name,
        period,
        ledgerType: "Y",
        documentHash: hash,
        creationDate: header.creationDate,
      });

      await createAuditLog({
        db: ctx.db,
        user: ctx.user,
        action: "create",
        entityType: "e_ledger",
        newValues: { type: "yevmiye", period, entryCount: entries.length },
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });

      return {
        period,
        type: "yevmiye",
        entryCount: entries.length,
        xml,
        berat,
        hash,
        xmlSizeBytes: Buffer.byteLength(xml, "utf-8"),
      };
    }),

  /** Kebir Defteri XBRL-GL üret */
  generateLedger: accountantProcedure
    .input(
      z.object({
        year: z.number().int(),
        month: z.number().int().min(1).max(12),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const tenant = await ctx.db.query.tenants.findFirst({
        where: eq(tenants.id, ctx.user.tenantId),
      });
      if (!tenant) throw new TRPCError({ code: "NOT_FOUND", message: "Firma bulunamadı" });

      const periodStart = `${input.year}-${String(input.month).padStart(2, "0")}-01`;
      const lastDay = new Date(input.year, input.month, 0).getDate();
      const periodEnd = `${input.year}-${String(input.month).padStart(2, "0")}-${lastDay}`;
      const period = `${input.year}-${String(input.month).padStart(2, "0")}`;

      // Hesap bazlı hareketleri grupla (kebir formatı)
      const entries = await ctx.db
        .select()
        .from(journalEntries)
        .where(
          and(
            eq(journalEntries.tenantId, ctx.user.tenantId),
            eq(journalEntries.status, "approved"),
            sql`${journalEntries.entryDate} BETWEEN ${periodStart} AND ${periodEnd}`
          )
        )
        .orderBy(asc(journalEntries.entryNo));

      if (entries.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `${period} döneminde onaylanmış yevmiye kaydı bulunamadı`,
        });
      }

      // Kebir defteri için aynı verileri hesap sıralı olarak üret
      const eLedgerEntries: ELedgerEntry[] = await Promise.all(
        entries.map(async (entry) => {
          const lines = await ctx.db
            .select({
              accountCode: accounts.code,
              accountName: accounts.name,
              debitAmount: journalLines.debitAmount,
              creditAmount: journalLines.creditAmount,
              description: journalLines.description,
            })
            .from(journalLines)
            .innerJoin(accounts, eq(journalLines.accountId, accounts.id))
            .where(eq(journalLines.entryId, entry.id))
            .orderBy(asc(accounts.code));

          const entryDate = entry.entryDate instanceof Date
            ? entry.entryDate.toISOString().split("T")[0]!
            : String(entry.entryDate);

          return {
            entryNo: entry.entryNo,
            entryDate,
            description: entry.description,
            lines: lines.map((l) => ({
              accountCode: l.accountCode,
              accountName: l.accountName,
              debitAmount: parseFloat(l.debitAmount),
              creditAmount: parseFloat(l.creditAmount),
              description: l.description ?? undefined,
            })),
          };
        })
      );

      const header: ELedgerHeader = {
        companyName: tenant.name,
        companyVkn: tenant.taxId,
        taxOffice: tenant.taxOffice,
        period,
        periodStart,
        periodEnd,
        creationDate: new Date().toISOString().split("T")[0]!,
        entryCount: entries.length,
      };

      const xml = buildGeneralLedgerXml(header, eLedgerEntries);
      const hash = createHash("sha256").update(xml).digest("hex");

      const berat = buildBeratXml({
        vkn: tenant.taxId,
        companyName: tenant.name,
        period,
        ledgerType: "K",
        documentHash: hash,
        creationDate: header.creationDate,
      });

      return {
        period,
        type: "kebir",
        entryCount: entries.length,
        xml,
        berat,
        hash,
        xmlSizeBytes: Buffer.byteLength(xml, "utf-8"),
      };
    }),

  /** E-defter doğrulama (basit şema kontrolü) */
  validate: protectedProcedure
    .input(z.object({ xml: z.string() }))
    .query(({ input }) => {
      const errors: string[] = [];

      if (!input.xml.includes("gl-cor:accountingEntries")) {
        errors.push("Kök element 'gl-cor:accountingEntries' bulunamadı");
      }
      if (!input.xml.includes("gl-cor:documentInfo")) {
        errors.push("'documentInfo' bölümü eksik");
      }
      if (!input.xml.includes("gl-cor:entityInformation")) {
        errors.push("'entityInformation' bölümü eksik");
      }
      if (!input.xml.includes("gl-cor:entryHeader")) {
        errors.push("Hiçbir yevmiye kaydı bulunamadı");
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    }),
});
