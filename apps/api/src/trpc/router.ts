import { router } from "./trpc.js";
import { authRouter } from "./auth.js";
import { accountsRouter } from "./accounts.js";
import { journalRouter } from "./journal.js";
import { contactsRouter } from "./contacts.js";
import { reportsRouter } from "./reports.js";
import { invoicesRouter } from "./invoices.js";
import { eInvoiceRouter } from "./e-invoice.js";
import { eLedgerRouter } from "./e-ledger.js";
import { taxDeclarationsRouter } from "./tax-declarations.js";
import { bankAccountsRouter } from "./bank-accounts.js";
import { checksRouter } from "./checks.js";
import { cashRegistersRouter } from "./cash-registers.js";

export const appRouter = router({
  auth: authRouter,
  accounts: accountsRouter,
  journal: journalRouter,
  contacts: contactsRouter,
  reports: reportsRouter,
  invoices: invoicesRouter,
  eInvoice: eInvoiceRouter,
  eLedger: eLedgerRouter,
  taxDeclarations: taxDeclarationsRouter,
  bankAccounts: bankAccountsRouter,
  checks: checksRouter,
  cashRegisters: cashRegistersRouter,
});

export type AppRouter = typeof appRouter;
