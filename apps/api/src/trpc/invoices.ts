import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, sql, asc } from "drizzle-orm";
import { router, protectedProcedure, accountantProcedure } from "./trpc.js";
import { invoices, invoiceLines, contacts, journalEntries } from "@finbooks/db";
import { createInvoiceSchema, paginationSchema } from "@finbooks/shared";
import { generateInvoiceNumber } from "@finbooks/shared";
import { calculateInvoiceTotals, createInvoiceJournalEntry } from "../services/invoice.service.js";
import { createAuditLog } from "../middleware/audit.js";

export const invoicesRouter = router({
  /** Fatura listesi */
  list: protectedProcedure
    .input(
      z.object({
        type: z.string().optional(),
        status: z.string().optional(),
        contactId: z.string().uuid().optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
        ...paginationSchema.shape,
      })
    )
    .query(async ({ ctx, input }) => {
      const page = input.page ?? 1;
      const pageSize = input.pageSize ?? 20;
      const offset = (page - 1) * pageSize;

      const conditions = [eq(invoices.tenantId, ctx.user.tenantId)];
      if (input.type) conditions.push(eq(invoices.type, input.type));
      if (input.status) conditions.push(eq(invoices.status, input.status));
      if (input.contactId) conditions.push(eq(invoices.contactId, input.contactId));
      if (input.startDate && input.endDate) {
        conditions.push(
          sql`${invoices.invoiceDate} BETWEEN ${input.startDate.toISOString().split("T")[0]} AND ${input.endDate.toISOString().split("T")[0]}`
        );
      }

      const where = and(...conditions);

      const [items, countResult] = await Promise.all([
        ctx.db
          .select({
            id: invoices.id,
            invoiceNo: invoices.invoiceNo,
            invoiceDate: invoices.invoiceDate,
            dueDate: invoices.dueDate,
            type: invoices.type,
            status: invoices.status,
            grandTotal: invoices.grandTotal,
            currency: invoices.currency,
            eInvoiceStatus: invoices.eInvoiceStatus,
            contactId: invoices.contactId,
            contactName: contacts.name,
            contactTaxId: contacts.taxId,
          })
          .from(invoices)
          .innerJoin(contacts, eq(invoices.contactId, contacts.id))
          .where(where)
          .orderBy(desc(invoices.invoiceDate), desc(invoices.invoiceNo))
          .limit(pageSize)
          .offset(offset),
        ctx.db.select({ count: sql<number>`count(*)::int` }).from(invoices).where(where),
      ]);

      return {
        items,
        total: countResult[0]?.count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((countResult[0]?.count ?? 0) / pageSize),
      };
    }),

  /** Fatura detayı */
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const invoice = await ctx.db.query.invoices.findFirst({
        where: and(eq(invoices.id, input.id), eq(invoices.tenantId, ctx.user.tenantId)),
      });

      if (!invoice) throw new TRPCError({ code: "NOT_FOUND", message: "Fatura bulunamadı" });

      const lines = await ctx.db
        .select()
        .from(invoiceLines)
        .where(eq(invoiceLines.invoiceId, input.id))
        .orderBy(asc(invoiceLines.lineNo));

      const contact = await ctx.db.query.contacts.findFirst({
        where: eq(contacts.id, invoice.contactId),
      });

      return { ...invoice, lines, contact };
    }),

  /** Yeni fatura oluştur */
  create: accountantProcedure
    .input(createInvoiceSchema)
    .mutation(async ({ ctx, input }) => {
      // Cari hesabı kontrol et
      const contact = await ctx.db.query.contacts.findFirst({
        where: and(eq(contacts.id, input.contactId), eq(contacts.tenantId, ctx.user.tenantId)),
      });
      if (!contact) throw new TRPCError({ code: "NOT_FOUND", message: "Cari hesap bulunamadı" });

      // Tutarları hesapla
      const totals = calculateInvoiceTotals(input.lines);

      // Fatura numarası üret
      const year = input.invoiceDate.getFullYear();
      const lastInvoice = await ctx.db
        .select({ invoiceNo: invoices.invoiceNo })
        .from(invoices)
        .where(
          and(
            eq(invoices.tenantId, ctx.user.tenantId),
            sql`EXTRACT(YEAR FROM ${invoices.invoiceDate}) = ${year}`
          )
        )
        .orderBy(desc(invoices.invoiceNo))
        .limit(1);

      let sequence = 1;
      if (lastInvoice[0]) {
        const lastSeq = parseInt(lastInvoice[0].invoiceNo.slice(7), 10);
        sequence = (isNaN(lastSeq) ? 0 : lastSeq) + 1;
      }
      const invoiceNo = generateInvoiceNumber("FNB", year, sequence);

      // Faturayı kaydet
      const [invoice] = await ctx.db
        .insert(invoices)
        .values({
          tenantId: ctx.user.tenantId,
          contactId: input.contactId,
          invoiceNo,
          invoiceDate: input.invoiceDate,
          dueDate: input.dueDate ?? null,
          type: input.type,
          status: "draft",
          subtotal: totals.subtotal.toFixed(2),
          discountTotal: totals.discountTotal.toFixed(2),
          taxTotal: totals.taxTotal.toFixed(2),
          grandTotal: totals.grandTotal.toFixed(2),
          currency: input.currency ?? "TRY",
          exchangeRate: input.exchangeRate ?? "1",
          notes: input.notes ?? null,
        })
        .returning();

      // Fatura kalemlerini kaydet
      await ctx.db.insert(invoiceLines).values(
        totals.lines.map((line, i) => ({
          invoiceId: invoice!.id,
          lineNo: i + 1,
          description: line.description,
          quantity: line.quantity.toFixed(2),
          unitPrice: line.unitPrice.toFixed(2),
          discountRate: line.discountRate.toFixed(2),
          taxRate: line.taxRate,
          withholdingRate: line.withholdingRate > 0 ? line.withholdingRate.toFixed(2) : null,
          lineTotal: line.lineTotal.toFixed(2),
        }))
      );

      await createAuditLog({
        db: ctx.db,
        user: ctx.user,
        action: "create",
        entityType: "invoice",
        entityId: invoice!.id,
        newValues: { invoiceNo, type: input.type, grandTotal: totals.grandTotal.toFixed(2) },
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });

      return invoice;
    }),

  /** Faturayı onayla ve muhasebe kaydı oluştur */
  approve: accountantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.db.query.invoices.findFirst({
        where: and(eq(invoices.id, input.id), eq(invoices.tenantId, ctx.user.tenantId)),
      });

      if (!invoice) throw new TRPCError({ code: "NOT_FOUND", message: "Fatura bulunamadı" });
      if (invoice.status !== "draft") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Sadece taslak faturalar onaylanabilir" });
      }

      const contact = await ctx.db.query.contacts.findFirst({
        where: eq(contacts.id, invoice.contactId),
      });

      // Otomatik muhasebe kaydı oluştur
      const netTotal = (parseFloat(invoice.grandTotal) - parseFloat(invoice.taxTotal)).toFixed(2);
      const journalEntryId = await createInvoiceJournalEntry(ctx.db, invoice.id, ctx.user.tenantId, ctx.user.sub, {
        type: invoice.type,
        contactId: invoice.contactId,
        invoiceDate: invoice.invoiceDate,
        grandTotal: invoice.grandTotal,
        taxTotal: invoice.taxTotal,
        netTotal,
        withholdingTotal: "0",
        description: `${invoice.invoiceNo} - ${contact?.name ?? ""}`,
      });

      // Faturayı güncelle
      const [updated] = await ctx.db
        .update(invoices)
        .set({ status: "approved", journalEntryId, updatedAt: new Date() })
        .where(eq(invoices.id, input.id))
        .returning();

      await createAuditLog({
        db: ctx.db,
        user: ctx.user,
        action: "approve",
        entityType: "invoice",
        entityId: input.id,
        newValues: { status: "approved", journalEntryId },
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });

      return updated;
    }),

  /** Taslak faturayı sil */
  delete: accountantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const invoice = await ctx.db.query.invoices.findFirst({
        where: and(eq(invoices.id, input.id), eq(invoices.tenantId, ctx.user.tenantId)),
      });

      if (!invoice) throw new TRPCError({ code: "NOT_FOUND", message: "Fatura bulunamadı" });
      if (invoice.status !== "draft") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Sadece taslak faturalar silinebilir" });
      }

      await ctx.db.delete(invoiceLines).where(eq(invoiceLines.invoiceId, input.id));
      await ctx.db.delete(invoices).where(eq(invoices.id, input.id));

      await createAuditLog({
        db: ctx.db,
        user: ctx.user,
        action: "delete",
        entityType: "invoice",
        entityId: input.id,
        oldValues: { invoiceNo: invoice.invoiceNo },
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });

      return { success: true };
    }),

  /** Fatura tutarlarını hesapla (preview) */
  calculate: protectedProcedure
    .input(z.object({ lines: createInvoiceSchema.shape.lines }))
    .query(({ input }) => {
      return calculateInvoiceTotals(input.lines);
    }),
});
