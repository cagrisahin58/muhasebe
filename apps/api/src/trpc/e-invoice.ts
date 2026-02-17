import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import { router, protectedProcedure, accountantProcedure } from "./trpc.js";
import { invoices, invoiceLines, contacts, tenants } from "@finbooks/db";
import { buildUblTrInvoiceXml } from "../modules/ubl-tr/index.js";
import { createIntegrator } from "../modules/integrators/index.js";
import type { UblInvoiceData, UblParty, UblInvoiceLine, UblInvoiceType, UblInvoiceProfile } from "../modules/ubl-tr/types.js";
import { createAuditLog } from "../middleware/audit.js";

const integrator = createIntegrator(
  process.env.EINVOICE_PROVIDER,
  process.env.EINVOICE_API_URL
    ? {
        apiUrl: process.env.EINVOICE_API_URL,
        username: process.env.EINVOICE_USERNAME ?? "",
        password: process.env.EINVOICE_PASSWORD ?? "",
      }
    : undefined
);

export const eInvoiceRouter = router({
  /** E-Fatura mükellef sorgula */
  checkTaxpayer: protectedProcedure
    .input(z.object({ vkn: z.string().min(10).max(11) }))
    .query(async ({ input }) => {
      return integrator.checkTaxpayer(input.vkn);
    }),

  /** E-Fatura / E-Arşiv gönder */
  send: accountantProcedure
    .input(z.object({ invoiceId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Faturayı al
      const invoice = await ctx.db.query.invoices.findFirst({
        where: and(eq(invoices.id, input.invoiceId), eq(invoices.tenantId, ctx.user.tenantId)),
      });
      if (!invoice) throw new TRPCError({ code: "NOT_FOUND", message: "Fatura bulunamadı" });
      if (invoice.status !== "approved") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Sadece onaylanmış faturalar gönderilebilir" });
      }
      if (invoice.eInvoiceStatus === "SENT" || invoice.eInvoiceStatus === "ACCEPTED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Bu fatura zaten gönderilmiş" });
      }

      // Fatura kalemlerini al
      const lines = await ctx.db.select().from(invoiceLines).where(eq(invoiceLines.invoiceId, input.invoiceId));

      // Cari hesabı al
      const contact = await ctx.db.query.contacts.findFirst({
        where: eq(contacts.id, invoice.contactId),
      });
      if (!contact) throw new TRPCError({ code: "NOT_FOUND", message: "Cari hesap bulunamadı" });

      // Firma bilgilerini al
      const tenant = await ctx.db.query.tenants.findFirst({
        where: eq(tenants.id, ctx.user.tenantId),
      });
      if (!tenant) throw new TRPCError({ code: "NOT_FOUND", message: "Firma bulunamadı" });

      // Alıcı e-fatura mükellefi mi?
      const taxpayerInfo = await integrator.checkTaxpayer(contact.taxId);

      // UBL-TR verisi oluştur
      const uuid = invoice.eInvoiceUuid ?? crypto.randomUUID();
      const issueDate = invoice.invoiceDate instanceof Date
        ? invoice.invoiceDate.toISOString().split("T")[0]!
        : String(invoice.invoiceDate);

      const supplier: UblParty = {
        vkn: tenant.taxId,
        name: tenant.name,
        taxOffice: tenant.taxOffice,
        streetName: tenant.address,
        cityName: tenant.city,
        citySubdivisionName: tenant.district,
        country: "Türkiye",
        phone: tenant.phone ?? undefined,
        email: tenant.email ?? undefined,
      };

      const customer: UblParty = {
        vkn: contact.taxId,
        name: contact.name,
        taxOffice: contact.taxOffice ?? "",
        streetName: contact.address ?? "",
        cityName: contact.city ?? "",
        citySubdivisionName: contact.district ?? "",
        country: "Türkiye",
        phone: contact.phone ?? undefined,
        email: contact.email ?? undefined,
      };

      // KDV kırılımlarını hesapla
      const taxGroups = new Map<number, { taxableAmount: number; taxAmount: number }>();
      const ublLines: UblInvoiceLine[] = lines.map((line, i) => {
        const qty = parseFloat(line.quantity);
        const price = parseFloat(line.unitPrice);
        const discountRate = parseFloat(line.discountRate);
        const subtotal = qty * price;
        const discountAmt = subtotal * (discountRate / 100);
        const netAmt = subtotal - discountAmt;
        const taxAmt = netAmt * (line.taxRate / 100);

        const existing = taxGroups.get(line.taxRate) ?? { taxableAmount: 0, taxAmount: 0 };
        taxGroups.set(line.taxRate, {
          taxableAmount: existing.taxableAmount + netAmt,
          taxAmount: existing.taxAmount + taxAmt,
        });

        return {
          lineId: String(i + 1),
          quantity: qty,
          unitCode: "C62",
          unitPrice: price,
          lineExtensionAmount: netAmt,
          discountRate: discountRate > 0 ? discountRate : undefined,
          discountAmount: discountAmt > 0 ? discountAmt : undefined,
          taxRate: line.taxRate,
          taxAmount: taxAmt,
          description: line.description,
        };
      });

      const taxSubtotals = Array.from(taxGroups.entries()).map(([rate, amounts]) => ({
        taxableAmount: amounts.taxableAmount,
        taxAmount: amounts.taxAmount,
        taxRate: rate,
        taxScheme: "0015",
      }));

      const lineExtAmt = parseFloat(invoice.subtotal) - parseFloat(invoice.discountTotal);
      const invoiceData: UblInvoiceData = {
        uuid,
        invoiceNumber: invoice.invoiceNo,
        issueDate,
        issueTime: "00:00:00",
        invoiceType: "SATIS" as UblInvoiceType,
        profileId: (taxpayerInfo.isEInvoice ? "TICARIFATURA" : "TEMELFATURA") as UblInvoiceProfile,
        currencyCode: invoice.currency,
        lineCountNumeric: lines.length,
        supplier,
        customer,
        lines: ublLines,
        lineExtensionAmount: lineExtAmt,
        taxExclusiveAmount: lineExtAmt,
        taxInclusiveAmount: parseFloat(invoice.grandTotal),
        allowanceTotalAmount: parseFloat(invoice.discountTotal),
        payableAmount: parseFloat(invoice.grandTotal),
        taxSubtotals,
      };

      // XML üret
      const xml = buildUblTrInvoiceXml(invoiceData);

      // Entegratöre gönder
      let result;
      if (taxpayerInfo.isEInvoice) {
        result = await integrator.sendInvoice(xml, {
          uuid,
          senderId: tenant.taxId,
          receiverId: contact.taxId,
          date: issueDate,
          time: "00:00:00",
        });
      } else {
        result = await integrator.sendArchiveInvoice(xml);
      }

      // Fatura durumunu güncelle
      await ctx.db
        .update(invoices)
        .set({
          eInvoiceStatus: result.status ?? "SENT",
          eInvoiceUuid: uuid,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, input.invoiceId));

      await createAuditLog({
        db: ctx.db,
        user: ctx.user,
        action: "update",
        entityType: "invoice",
        entityId: input.invoiceId,
        newValues: {
          eInvoiceStatus: result.status,
          eInvoiceType: taxpayerInfo.isEInvoice ? "E-FATURA" : "E-ARSIV",
        },
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });

      return {
        success: result.success,
        uuid,
        status: result.status,
        type: taxpayerInfo.isEInvoice ? "E-FATURA" : "E-ARSIV",
        message: result.message,
      };
    }),

  /** E-Fatura durumu sorgula */
  getStatus: protectedProcedure
    .input(z.object({ invoiceId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const invoice = await ctx.db.query.invoices.findFirst({
        where: and(eq(invoices.id, input.invoiceId), eq(invoices.tenantId, ctx.user.tenantId)),
      });
      if (!invoice) throw new TRPCError({ code: "NOT_FOUND", message: "Fatura bulunamadı" });
      if (!invoice.eInvoiceUuid) {
        return { status: null, message: "Fatura henüz gönderilmemiş" };
      }

      const result = await integrator.getInvoiceStatus(invoice.eInvoiceUuid);

      // Durumu güncelle
      if (result.status && result.status !== invoice.eInvoiceStatus) {
        await ctx.db
          .update(invoices)
          .set({ eInvoiceStatus: result.status, updatedAt: new Date() })
          .where(eq(invoices.id, input.invoiceId));
      }

      return result;
    }),

  /** Gelen e-faturaları listele */
  incoming: protectedProcedure
    .input(z.object({ startDate: z.string(), endDate: z.string() }))
    .query(async ({ input }) => {
      return integrator.getIncomingInvoices({
        startDate: input.startDate,
        endDate: input.endDate,
      });
    }),

  /** UBL-TR XML önizleme */
  previewXml: protectedProcedure
    .input(z.object({ invoiceId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const invoice = await ctx.db.query.invoices.findFirst({
        where: and(eq(invoices.id, input.invoiceId), eq(invoices.tenantId, ctx.user.tenantId)),
      });
      if (!invoice) throw new TRPCError({ code: "NOT_FOUND", message: "Fatura bulunamadı" });

      // Basitleştirilmiş XML önizleme (gerçek gönderimde tam XML oluşturulur)
      return {
        invoiceNo: invoice.invoiceNo,
        uuid: invoice.eInvoiceUuid ?? "önizleme",
        format: "UBL-TR 1.2.1",
      };
    }),
});
